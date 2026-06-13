import os
import json
from pathlib import Path

import pandas as pd

from src.utils.parsing import parse_args, load_config
from src.utils.io import ensure_dirs
from src.utils.images import (
    build_query,
    search_wikimedia,
    search_pexels,
    download_image,
)

try:
    from dotenv import load_dotenv
    load_dotenv("keys.env")
except Exception:
    pass


def main():
    args = parse_args()
    cfg = load_config(args)

    paths = cfg["paths"]
    ensure_dirs(paths["raw"], paths["processed"], paths["checkpoints"], paths["output"])

    img_cfg = cfg["image_search"]
    user_agent = img_cfg["user_agent"]
    pexels_key = os.getenv("PEXELS_API_KEY", "")

    processed_path = Path(cfg["paths"]["processed"])
    ranked_df = pd.read_csv(processed_path / "clusters_ranked.csv")

    queue_dir = Path(cfg["paths"]["output"]) / "posts_queue"

    top = ranked_df.sort_values("trend_score", ascending=False).head(img_cfg["top_k"])

    if not pexels_key:
        print("(PEXELS_API_KEY ausente — buscando só na Wikimedia Commons.)")

    for _, row in top.iterrows():
        cluster_id = int(row["Cluster ID"])
        query = build_query(row, img_cfg["max_keywords"])

        if not query:
            print(f"Cluster {cluster_id} sem query; pulando.")
            continue

        candidates = []
        candidates += search_wikimedia(
            query, img_cfg["per_source"], user_agent=user_agent
        )
        candidates += search_pexels(query, img_cfg["per_source"], pexels_key)

        img_dir = queue_dir / f"cluster_{cluster_id}_images"
        img_dir.mkdir(parents=True, exist_ok=True)

        manifest = []
        for i, cand in enumerate(candidates, 1):
            prefix = cand["source"].split()[0].lower()
            fname = f"{prefix}_{i:02d}.jpg"

            if not download_image(cand["image_url"], img_dir / fname, user_agent):
                continue

            cand["file"] = fname
            cand["query"] = query
            manifest.append(cand)

        with open(img_dir / "candidates.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

        print(
            f"Cluster {cluster_id}: {len(manifest)} imagens candidatas "
            f"em {img_dir} (query: '{query}')"
        )

    print("Busca de imagens concluída. Escolha a melhor candidata na fila.")


if __name__ == "__main__":
    main()
