"""
Backend da aplicação (Stage 1).

Serve o front-end React e expõe os dados reais do pipeline:
- GET  /api/results        -> linhas do ranking/clusters (CSV -> JSON)
- GET  /api/images         -> candidatas de imagem por cluster (fila)
- POST /api/images/select  -> grava a seleção (selected/cover) no candidates.json

Rodar:  py -m uvicorn server:app --reload
"""
import json
import mimetypes
import tomllib
from pathlib import Path
from typing import Optional

# Serve .jsx como JavaScript (StaticFiles não conhece a extensão por padrão).
mimetypes.add_type("application/javascript", ".jsx")

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent

with open(ROOT / "config" / "directories.toml", "rb") as _f:
    _PATHS = tomllib.load(_f)["paths"]

PROCESSED = ROOT / _PATHS["processed"]
OUTPUT = ROOT / _PATHS["output"]
QUEUE = OUTPUT / "posts_queue"
FRONTEND = ROOT / "frontend"

# Mapeia colunas reais do CSV -> chaves esperadas pelo front.
COLUMN_MAP = {
    "Cluster ID": "cluster",
    "Title": "title",
    "Size": "size",
    "Keywords": "keywords",
    "Description": "description",
    "Focus": "focus",
    "Most Similar Cluster": "similar",
    "Similarity": "similarity",
    "Distinguishing Features": "distinguishing",
}

app = FastAPI(title="Newsletter Backend")


def _trend_label(row):
    """Deriva alta/queda/estável a partir da aceleração (se houver)."""
    acc = row.get("acceleration")
    if acc is None or pd.isna(acc):
        return "estável"
    if acc >= 1.15:
        return "alta"
    if acc <= 0.85:
        return "queda"
    return "estável"


@app.get("/api/results")
def get_results():
    for name in ("clusters_ranked.csv",
                 "clusters_defined_distinguished_trends_assessed.csv"):
        fp = PROCESSED / name
        if not fp.exists():
            continue

        df = pd.read_csv(fp).where(lambda d: pd.notna(d), None)
        rows = []
        for raw in df.to_dict("records"):
            row = {COLUMN_MAP.get(k, k): v for k, v in raw.items()}
            row["id"] = row.get("cluster")
            row["trend"] = _trend_label(raw)
            rows.append(row)

        return {"source": name, "count": len(rows), "rows": rows}

    return {"source": None, "count": 0, "rows": []}


@app.get("/api/images")
def get_images():
    clusters = []
    if QUEUE.exists():
        for cdir in sorted(QUEUE.glob("cluster_*_images")):
            cfile = cdir / "candidates.json"
            if not cfile.exists():
                continue

            cid = cdir.name[len("cluster_"):-len("_images")]
            with open(cfile, "r", encoding="utf-8") as f:
                candidates = json.load(f)

            for c in candidates:
                if c.get("file"):
                    c["url"] = f"/queue/{cdir.name}/{c['file']}"

            clusters.append({
                "cluster_id": int(cid) if cid.isdigit() else cid,
                "candidates": candidates,
            })
    return {"clusters": clusters}


class Selection(BaseModel):
    cluster_id: int
    selected: list[str] = []
    cover: Optional[str] = None


@app.post("/api/images/select")
def select_images(sel: Selection):
    cfile = QUEUE / f"cluster_{sel.cluster_id}_images" / "candidates.json"
    if not cfile.exists():
        raise HTTPException(404, "candidates.json não encontrado para esse cluster")

    with open(cfile, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    for c in candidates:
        c["selected"] = c.get("file") in sel.selected
        c["cover"] = (c.get("file") == sel.cover)

    with open(cfile, "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)

    return {"ok": True, "cluster_id": sel.cluster_id,
            "selected": sel.selected, "cover": sel.cover}


# --- Estáticos: imagens da fila + front-end ---
# Ordem importa: /api e /queue são registrados antes do mount "/" (catch-all).
QUEUE.mkdir(parents=True, exist_ok=True)
app.mount("/queue", StaticFiles(directory=str(QUEUE)), name="queue")

# index.html servido em "/" via html=True; pages/*.jsx resolvem relativamente.
app.mount("/", StaticFiles(directory=str(FRONTEND), html=True), name="frontend")
