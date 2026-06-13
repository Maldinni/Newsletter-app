import os
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

from src.utils.parsing import parse_args, load_config
from src.utils.io import ensure_dirs
from src.utils.posts import (
    select_recent_cluster_articles,
    build_sources,
    parse_post_output,
    save_post,
)


POST_PROMPT = PromptTemplate(
    input_variables=[
        "audience", "tone", "title", "focus",
        "keywords", "trends", "num_slides", "articles"
    ],
    template="""
Você é editor de uma página de notícias voltada para o {audience}.
Escreva um post de carrossel para Instagram sobre o tema em alta abaixo.

Tema: {title}
Foco: {focus}
Palavras-chave: {keywords}

Sinais de tendência (o que está em alta neste tema):
{trends}

REGRAS OBRIGATÓRIAS:
- Use SOMENTE fatos presentes nos textos fornecidos. Não invente nomes,
  números, datas, declarações ou eventos.
- Não faça acusações que não estejam explícitas nos textos.
- Tom: {tone}.
- Linguagem clara, frases curtas, adequada para redes sociais.

Produza EXATAMENTE neste formato:

GANCHO: (uma frase de impacto para o primeiro card)
TÍTULO: (título curto do post)
SLIDES:
- (card de conteúdo)
- (card de conteúdo)
- (no total {num_slides} cards)
LEGENDA: (texto da legenda, 2 a 4 frases)
HASHTAGS: (5 a 8 hashtags relevantes, cada uma começando com #)

Textos das matérias:
{articles}
"""
)


def main():
    args = parse_args()
    cfg = load_config(args)

    paths = cfg["paths"]
    ensure_dirs(paths["raw"], paths["processed"], paths["checkpoints"], paths["output"])

    post_cfg = cfg["post_generation"]

    processed_path = Path(cfg["paths"]["processed"])
    ranked_file = processed_path / "clusters_ranked.csv"
    articles_file = processed_path / "articles_merged_cleaned_clustered.csv"

    ranked_df = pd.read_csv(ranked_file)
    articles_df = pd.read_csv(articles_file)

    queue_dir = Path(cfg["paths"]["output"]) / "posts_queue"
    os.makedirs(queue_dir, exist_ok=True)

    llm = ChatOllama(
        model=cfg["llm"]["model_name"],
        temperature=cfg["llm"]["temperature"]
    )
    chain = POST_PROMPT | llm

    top_k = post_cfg["top_k"]
    top = ranked_df.sort_values("trend_score", ascending=False).head(top_k)

    print(f"Gerando {len(top)} post(s) para os clusters em alta...")

    for _, row in top.iterrows():
        cluster_id = int(row["Cluster ID"])

        articles = select_recent_cluster_articles(
            articles_df, cluster_id, post_cfg["max_source_articles"]
        )
        if not articles:
            print(f"Cluster {cluster_id} sem artigos; pulando.")
            continue

        articles_text = "\n\n".join(a["text"] for a in articles if a.get("text"))
        sources = build_sources(articles)

        chain_input = {
            "audience": post_cfg["audience"],
            "tone": post_cfg["tone"],
            "title": row.get("Title", f"Cluster {cluster_id}"),
            "focus": row.get("Focus", ""),
            "keywords": row.get("Keywords", ""),
            "trends": row.get("Trends", ""),
            "num_slides": post_cfg["num_slides"],
            "articles": articles_text,
        }

        raw_output = chain.invoke(chain_input).content
        post = parse_post_output(raw_output)

        record = {
            "cluster_id": cluster_id,
            "rank": int(row.get("rank", 0)),
            "trend_score": float(row.get("trend_score", 0.0)),
            **post,
            "sources": sources,
            "ai_disclosure": post_cfg["ai_disclosure"],
            "status": "pending_review",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "raw_output": raw_output,
        }

        path = save_post(record, queue_dir)
        print(f"Post do cluster {cluster_id} salvo: {path} (status: pending_review)")

    print("Geração concluída. Revise a fila antes de publicar.")


if __name__ == "__main__":
    main()
