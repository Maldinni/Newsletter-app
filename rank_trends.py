import pandas as pd
from pathlib import Path

from src.utils.parsing import parse_args, load_config
from src.utils.io import ensure_dirs
from src.utils.ranking import rank_clusters


def main():
    args = parse_args()
    cfg = load_config(args)

    paths = cfg["paths"]
    ensure_dirs(paths["raw"], paths["processed"], paths["checkpoints"], paths["output"])

    ranking_cfg = cfg["trend_ranking"]

    processed_path = Path(cfg["paths"]["processed"])

    clusters_file = processed_path / "clusters_defined_distinguished_trends_assessed.csv"
    articles_file = processed_path / "articles_merged_cleaned_clustered.csv"

    clusters_df = pd.read_csv(clusters_file)
    articles_df = pd.read_csv(articles_file)

    weights = {
        "acceleration": ranking_cfg["weight_acceleration"],
        "recent_volume": ranking_cfg["weight_recent_volume"],
        "recency": ranking_cfg["weight_recency"],
        "size": ranking_cfg["weight_size"],
    }

    ranked = rank_clusters(
        clusters_df,
        articles_df,
        weights=weights,
        recent_days=ranking_cfg["recent_days"],
        baseline_days=ranking_cfg["baseline_days"],
        min_cluster_size=ranking_cfg["min_cluster_size"],
    )

    output_file = processed_path / "clusters_ranked.csv"
    ranked.to_csv(output_file, index=False)

    top_k = ranking_cfg["top_k"]
    print(f"Ranking salvo em {output_file}")
    print(f"\nTop {top_k} clusters em alta:")

    cols = [
        c for c in [
            "rank", "Cluster ID", "Title", "trend_score",
            "acceleration", "recent_volume", "recency", "Size"
        ] if c in ranked.columns
    ]
    print(ranked.head(top_k)[cols].to_string(index=False))


if __name__ == "__main__":
    main()
