import numpy as np
import pandas as pd


def _minmax(series: pd.Series) -> pd.Series:
    """Normaliza uma série para [0, 1]. Retorna zeros se não houver variação."""
    series = series.astype(float)
    lo, hi = series.min(), series.max()
    if not np.isfinite(lo) or not np.isfinite(hi) or hi - lo == 0:
        return pd.Series(0.0, index=series.index)
    return (series - lo) / (hi - lo)


def compute_trend_signals(articles_df, anchor=None, recent_days=7,
                          baseline_days=28):
    """
    Calcula os sinais temporais de tendência por cluster, a partir do
    nível de artigo (datas de publicação).

    Parameters
    ----------
    articles_df : DataFrame com colunas 'Cluster ID' e 'publish_date'.
    anchor : pd.Timestamp ou None. Data de referência ("agora"). Se None,
             usa a data mais recente presente nos dados (evita depender do
             relógio real quando o dataset está defasado).
    recent_days : int. Tamanho da janela recente, em dias.
    baseline_days : int. Tamanho da janela-base imediatamente anterior.

    Returns
    -------
    DataFrame com coluna 'Cluster ID' e as parcelas:
    recent_volume, acceleration, recency.
    """
    df = articles_df.copy()
    df["publish_date"] = pd.to_datetime(
        df["publish_date"], errors="coerce", utc=True
    ).dt.tz_localize(None)

    clusters = sorted(int(c) for c in df["Cluster ID"].dropna().unique())
    out = pd.DataFrame({"Cluster ID": clusters})
    out["recent_volume"] = 0.0
    out["acceleration"] = 0.0
    out["recency"] = 0.0
    out = out.set_index("Cluster ID")

    dated = df.dropna(subset=["publish_date"])
    if dated.empty:
        return out.reset_index()

    if anchor is None:
        anchor = dated["publish_date"].max()

    recent_start = anchor - pd.Timedelta(days=recent_days)
    baseline_start = recent_start - pd.Timedelta(days=baseline_days)

    recent_weeks = max(recent_days / 7.0, 1e-9)
    baseline_weeks = max(baseline_days / 7.0, 1e-9)

    for cid, group in dated.groupby("Cluster ID"):
        cid = int(cid)
        dates = group["publish_date"]

        recent_count = int(((dates >= recent_start) & (dates <= anchor)).sum())
        baseline_count = int(((dates >= baseline_start) &
                              (dates < recent_start)).sum())

        recent_weekly = recent_count / recent_weeks
        baseline_weekly = baseline_count / baseline_weeks

        # Aceleração: ritmo semanal recente sobre o ritmo semanal de base.
        # Sem base (cluster novo), usa o próprio volume recente como sinal.
        if baseline_weekly > 0:
            acceleration = recent_weekly / baseline_weekly
        else:
            acceleration = float(recent_count)

        days_since_last = max((anchor - dates.max()).days, 0)
        recency = 1.0 / (1.0 + days_since_last)

        out.loc[cid, "recent_volume"] = float(recent_count)
        out.loc[cid, "acceleration"] = float(acceleration)
        out.loc[cid, "recency"] = float(recency)

    return out.reset_index()


def rank_clusters(clusters_df, articles_df, weights, recent_days=7,
                  baseline_days=28, min_cluster_size=1):
    """
    Pontua e ordena os clusters por "quão em alta" estão.

    Combina aceleração, volume recente, recência e tamanho — cada um
    normalizado em [0, 1] entre os clusters — numa soma ponderada.

    Returns
    -------
    DataFrame: clusters_df acrescido das parcelas, de 'trend_score' e de
    'rank', ordenado por trend_score decrescente.
    """
    df = clusters_df.copy()
    df["Cluster ID"] = df["Cluster ID"].astype(int)

    if min_cluster_size > 1 and "Size" in df.columns:
        df = df[df["Size"] >= min_cluster_size].copy()

    signals = compute_trend_signals(
        articles_df, recent_days=recent_days, baseline_days=baseline_days
    )

    df = df.merge(signals, on="Cluster ID", how="left")
    for col in ["recent_volume", "acceleration", "recency"]:
        df[col] = df[col].fillna(0.0)

    size = df["Size"] if "Size" in df.columns else pd.Series(0.0, index=df.index)

    df["trend_score"] = (
        weights["acceleration"] * _minmax(df["acceleration"])
        + weights["recent_volume"] * _minmax(df["recent_volume"])
        + weights["recency"] * _minmax(df["recency"])
        + weights["size"] * _minmax(size)
    )

    df = df.sort_values("trend_score", ascending=False).reset_index(drop=True)
    df["rank"] = df.index + 1

    return df
