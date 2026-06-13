import json
import re
from pathlib import Path

import pandas as pd


def select_recent_cluster_articles(articles_df, cluster_id, n):
    """
    Seleciona as N matérias mais recentes de um cluster — são elas que
    sustentam a narrativa "em alta" e servem de matéria-prima factual
    (e de atribuição de fonte) para o LLM.
    """
    df = articles_df[articles_df["Cluster ID"] == cluster_id].copy()
    if df.empty:
        return []

    df["_pd"] = pd.to_datetime(df["publish_date"], errors="coerce", utc=True)
    df = df.sort_values("_pd", ascending=False, na_position="last").head(n)

    out = []
    for _, r in df.iterrows():
        out.append({
            "text": r.get("text"),
            "source": r.get("source"),
            "url": r.get("canonical_url"),
            "title": r.get("title"),
            "publish_date": None if pd.isna(r["_pd"]) else r["_pd"].isoformat(),
        })
    return out


def build_sources(articles):
    """Lista de fontes única (source, url), preservando ordem."""
    seen = set()
    sources = []
    for a in articles:
        key = (a.get("source"), a.get("url"))
        if key in seen:
            continue
        seen.add(key)
        sources.append({"source": a.get("source"), "url": a.get("url")})
    return sources


def _section(text, label, followers):
    """Extrai o conteúdo de uma seção rotulada até a próxima seção conhecida."""
    pattern = rf"{label}:\s*(.*?)(?=\n\s*(?:{followers})\s*:|\Z)" if followers \
        else rf"{label}:\s*(.*)\Z"
    m = re.search(pattern, text, re.S | re.IGNORECASE)
    return m.group(1).strip() if m else ""


def parse_post_output(text):
    """Faz parsing tolerante da saída estruturada do LLM."""
    hook = _section(text, "GANCHO", "TÍTULO|SLIDES|LEGENDA|HASHTAGS")
    title = _section(text, "TÍTULO", "SLIDES|LEGENDA|HASHTAGS")
    slides_block = _section(text, "SLIDES", "LEGENDA|HASHTAGS")
    caption = _section(text, "LEGENDA", "HASHTAGS")
    hashtags_block = _section(text, "HASHTAGS", "")

    slides = [s.strip(" -•\t") for s in slides_block.splitlines()
              if s.strip(" -•\t")]
    hashtags = re.findall(r"#\w+", hashtags_block)

    return {
        "hook": hook,
        "title": title,
        "slides": slides,
        "caption": caption,
        "hashtags": hashtags,
    }


def _slug(text, maxlen=40):
    s = re.sub(r"[^\w\s-]", "", (text or "").lower())
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s[:maxlen] or "post"


def render_post_txt(record):
    """Versão legível para revisão humana rápida."""
    lines = [
        f"[REVISÃO PENDENTE] Cluster {record['cluster_id']} · "
        f"rank {record.get('rank')} · score {float(record.get('trend_score', 0)):.3f}",
        "",
        f"GANCHO: {record.get('hook', '')}",
        f"TÍTULO: {record.get('title', '')}",
        "",
        "SLIDES:",
    ]
    for i, s in enumerate(record.get("slides", []), 1):
        lines.append(f"  {i}. {s}")
    lines += [
        "",
        f"LEGENDA:\n{record.get('caption', '')}",
        "",
        "HASHTAGS: " + " ".join(record.get("hashtags", [])),
        "",
        "FONTES:",
    ]
    for s in record.get("sources", []):
        lines.append(f"  - {s.get('source')}: {s.get('url')}")
    lines += ["", f"[!] {record.get('ai_disclosure', '')}"]
    return "\n".join(lines)


def save_post(record, queue_dir):
    """Salva o post na fila de aprovação (JSON estruturado + TXT legível)."""
    queue_dir = Path(queue_dir)
    queue_dir.mkdir(parents=True, exist_ok=True)
    base = f"cluster_{record['cluster_id']}_{_slug(record.get('title'))}"

    json_path = queue_dir / f"{base}.json"
    txt_path = queue_dir / f"{base}.txt"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(render_post_txt(record))

    return json_path
