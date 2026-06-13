import re
import html

import requests


WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
PEXELS_API = "https://api.pexels.com/v1/search"


def _strip_html(text):
    """Limpa HTML/entidades dos campos de metadado da Wikimedia."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _emeta(extmetadata, key):
    """Lê um campo de extmetadata da Wikimedia com segurança."""
    field = (extmetadata or {}).get(key) or {}
    return field.get("value", "") if isinstance(field, dict) else ""


def build_query(row, max_keywords=3):
    """Monta a query de busca a partir do cluster (Título; senão keywords)."""
    title = str(row.get("Title") or "").strip()
    if title and title.lower() != "nan":
        return title

    keywords = str(row.get("Keywords") or "")
    parts = [k.strip() for k in keywords.split(";") if k.strip()][:max_keywords]
    return " ".join(parts)


def search_wikimedia(query, limit=6, user_agent="NewsBot/1.0", timeout=20):
    """
    Busca imagens no Wikimedia Commons (namespace File). Sem chave de API.
    Retorna candidatas já com licença e crédito de atribuição.
    """
    if not query:
        return []

    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime",
        "iiurlwidth": "1024",
    }

    try:
        r = requests.get(
            WIKIMEDIA_API, params=params,
            headers={"User-Agent": user_agent}, timeout=timeout
        )
        r.raise_for_status()
        pages = (r.json().get("query") or {}).get("pages") or {}
    except Exception:
        return []

    out = []
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]

        mime = info.get("mime", "")
        if mime not in ("image/jpeg", "image/png"):
            continue

        ext = info.get("extmetadata") or {}
        out.append({
            "source": "Wikimedia Commons",
            "title": page.get("title"),
            "image_url": info.get("thumburl") or info.get("url"),
            "full_url": info.get("url"),
            "license": _emeta(ext, "LicenseShortName"),
            "license_url": _emeta(ext, "LicenseUrl"),
            "artist": _strip_html(_emeta(ext, "Artist")),
            "credit": _strip_html(_emeta(ext, "Credit")),
            "attribution_required": _emeta(ext, "AttributionRequired"),
            "source_url": info.get("descriptionurl"),
        })
    return out


def search_pexels(query, limit=6, api_key="", timeout=20):
    """
    Busca fotos no Pexels. Requer chave (PEXELS_API_KEY). Sem chave,
    retorna lista vazia — a busca degrada para só Wikimedia.
    """
    if not query or not api_key:
        return []

    try:
        r = requests.get(
            PEXELS_API,
            params={"query": query, "per_page": str(limit)},
            headers={"Authorization": api_key}, timeout=timeout
        )
        r.raise_for_status()
        photos = r.json().get("photos", [])
    except Exception:
        return []

    out = []
    for p in photos:
        src = p.get("src") or {}
        out.append({
            "source": "Pexels",
            "title": p.get("alt"),
            "image_url": src.get("large"),
            "full_url": src.get("original"),
            "license": "Pexels License (uso livre, comercial ok)",
            "license_url": "https://www.pexels.com/license/",
            "artist": p.get("photographer"),
            "credit": f"Foto: {p.get('photographer')} (Pexels)",
            "attribution_required": "false",
            "source_url": p.get("url"),
        })
    return out


def download_image(url, dest, user_agent="NewsBot/1.0", timeout=30):
    """Baixa uma imagem para `dest`. Retorna True em sucesso."""
    if not url:
        return False
    try:
        r = requests.get(
            url, headers={"User-Agent": user_agent},
            timeout=timeout, stream=True
        )
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        return True
    except Exception:
        return False
