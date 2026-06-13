import json
from pathlib import Path

from src.utils.parsing import parse_args, load_config
from src.utils.io import ensure_dirs
from src.utils.cards import compose_card, build_image_credit


def _select_candidate(candidates):
    """Respeita a escolha humana (campo 'selected'); senão usa a 1ª."""
    if not candidates:
        return None
    for cand in candidates:
        if cand.get("selected"):
            return cand
    return candidates[0]


def main():
    args = parse_args()
    cfg = load_config(args)

    paths = cfg["paths"]
    ensure_dirs(paths["raw"], paths["processed"], paths["checkpoints"], paths["output"])

    card_cfg = cfg["card"]
    logo_path = card_cfg.get("logo_path") or None

    queue_dir = Path(cfg["paths"]["output"]) / "posts_queue"
    if not queue_dir.exists():
        print("Fila vazia — gere os posts (Etapa 13) primeiro.")
        return

    post_files = sorted(queue_dir.glob("cluster_*.json"))

    for post_file in post_files:
        with open(post_file, "r", encoding="utf-8") as f:
            record = json.load(f)

        cluster_id = record.get("cluster_id")
        img_dir = queue_dir / f"cluster_{cluster_id}_images"
        candidates_file = img_dir / "candidates.json"

        if not candidates_file.exists():
            print(f"Cluster {cluster_id}: sem imagens (rode a Etapa 14). Pulando.")
            continue

        with open(candidates_file, "r", encoding="utf-8") as f:
            candidates = json.load(f)

        chosen = _select_candidate(candidates)
        if not chosen or not chosen.get("file"):
            print(f"Cluster {cluster_id}: nenhuma candidata válida. Pulando.")
            continue

        image_path = img_dir / chosen["file"]
        headline = record.get("title") or record.get("hook") or ""
        image_credit = build_image_credit(chosen)
        ai_label = record.get("ai_disclosure", "")

        card = compose_card(
            image_path, headline, image_credit, ai_label,
            card_cfg, logo_path=logo_path
        )

        card_file = queue_dir / f"cluster_{cluster_id}_card.jpg"
        card.save(card_file, quality=90)

        # Liga o card de volta ao registro do post
        record["card_file"] = card_file.name
        record["selected_image"] = chosen.get("file")
        with open(post_file, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)

        auto = "" if chosen.get("selected") else " (1ª candidata — sem seleção manual)"
        print(f"Cluster {cluster_id}: card salvo em {card_file}{auto}")

    print("Composição de cards concluída.")


if __name__ == "__main__":
    main()
