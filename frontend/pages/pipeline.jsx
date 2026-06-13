/* ============================================================
   page_pipeline.jsx — Executar Pipeline (animated)
   ============================================================ */
const PIPE_STEPS = [
  { key: "collect", label: "Coleta", desc: "Scraping das fontes curadas", lines: ["Lendo as fontes de sources.toml…", "Descobrindo URLs de artigos por fonte", "Artigos extraídos e salvos em shards"] },
  { key: "clean", label: "Limpeza", desc: "Normalização e deduplicação", lines: ["Mesclando shards e removendo duplicatas…", "Filtrando por contagem de palavras e data", "Texto normalizado"] },
  { key: "embed", label: "Embeddings", desc: "Vetorização semântica multilíngue", lines: ["Gerando embeddings (mpnet multilíngue)…", "Vetores de 768 dimensões", "Convertendo para HDF5"] },
  { key: "cluster", label: "Clusterização", desc: "Grafo k-NN + comunidades de Leiden", lines: ["Construindo grafo k-NN de similaridade…", "Detecção de comunidades (Leiden)…", "Clusters semânticos definidos"] },
  { key: "analyze", label: "Análise (LLM)", desc: "Rótulos, distinção, tendências e dimensões", lines: ["Rotulando clusters com LLM local…", "Comparando textos antigos × recentes…", "Dimensões discursivas avaliadas"] },
  { key: "rank", label: "Tendência", desc: "Ranking dos clusters em alta", lines: ["Pontuando por aceleração + recência…", "Selecionando os clusters mais em alta", "Ranking concluído"] },
  { key: "post", label: "Geração de Post", desc: "Rascunho, imagens e card", lines: ["Compondo post do cluster destaque…", "Buscando imagens candidatas (Wikimedia/Pexels)…", "Card e rascunho na fila de aprovação"] },
];

function PagePipeline({ pipeState, setPipeState, goto }) {
  const { status, current, progress, log } = pipeState;
  const logRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const run = useCallback(() => {
    if (status === "running") return;
    clearInterval(timer.current);
    setPipeState({ status: "running", current: 0, progress: 0, log: [{ t: time(), m: "▶ Pipeline iniciado", k: "head" }] });
    let p = 0;
    timer.current = setInterval(() => {
      p += 1;
      const stepIdx = Math.min(PIPE_STEPS.length - 1, Math.floor(p / (100 / PIPE_STEPS.length)));
      setPipeState(prev => {
        const next = { ...prev, progress: Math.min(100, p), current: stepIdx };
        const step = PIPE_STEPS[stepIdx];
        const within = p % Math.round(100 / PIPE_STEPS.length);
        const lineIdx = Math.floor((within / Math.round(100 / PIPE_STEPS.length)) * step.lines.length);
        const candidate = step.lines[Math.min(lineIdx, step.lines.length - 1)];
        const tag = step.label.toUpperCase();
        const last = prev.log[prev.log.length - 1];
        let log = prev.log;
        if (!last || last.m !== `[${tag}] ${candidate}`) {
          log = [...prev.log, { t: time(), m: `[${tag}] ${candidate}`, k: "line" }];
        }
        next.log = log;
        if (p >= 100) {
          clearInterval(timer.current);
          next.status = "done";
          next.log = [...log, { t: time(), m: "✓ Concluído — clusters rankeados · post na fila de aprovação", k: "ok" }];
        }
        return next;
      });
    }, 65);
  }, [status, setPipeState]);

  const stop = () => { clearInterval(timer.current); setPipeState(prev => ({ ...prev, status: "idle" })); };
  const reset = () => { clearInterval(timer.current); setPipeState({ status: "idle", current: -1, progress: 0, log: [] }); };

  useEffect(() => () => clearInterval(timer.current), []);

  return (
    <div className="fade-up">
      <PageTitle kicker="OPERAÇÃO" title="Executar Pipeline"
        sub="Inicie o pipeline completo de análise para gerar clusters, tendências e o rascunho de post atualizados." />

      {/* control row */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
        {status !== "running" ? (
          <Btn variant="primary" icon={Icons.play} onClick={run}>
            {status === "done" ? "Executar novamente" : "Iniciar Pipeline"}
          </Btn>
        ) : (
          <Btn variant="secondary" icon={Icons.stop} onClick={stop}>Interromper</Btn>
        )}
        {(status === "done" || status === "running") &&
          <Btn variant="ghost" icon={Icons.refresh} onClick={reset}>Limpar</Btn>}
        <div style={{ flex: 1 }} />
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", letterSpacing: "0.1em" }}>
          {status === "running" ? "EM EXECUÇÃO" : status === "done" ? "FINALIZADO" : "OCIOSO"} · {progress}%
        </div>
      </div>

      {/* progress bar */}
      <div style={{ height: 3, background: "var(--line)", position: "relative", overflow: "hidden", marginBottom: 56 }}>
        <div style={{ position: "absolute", inset: 0, width: `${progress}%`, background: "var(--accent)", transition: "width 200ms linear" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)", gap: "clamp(28px,4vw,64px)" }} className="pipe-grid">
        {/* steps */}
        <div>
          <div className="overline" style={{ marginBottom: 26 }}>ETAPAS</div>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {PIPE_STEPS.map((s, i) => {
              const state = status === "idle" && current < 0 ? "wait"
                : i < current || status === "done" ? "done"
                : i === current && status === "running" ? "active" : "wait";
              return (
                <div key={s.key} style={{ display: "flex", gap: 20, padding: "20px 4px", borderBottom: "1px solid var(--line)", alignItems: "center", opacity: state === "wait" ? 0.5 : 1, transition: "opacity 500ms" }}>
                  <span style={{ width: 26, height: 26, flexShrink: 0, border: "1px solid", borderColor: state === "wait" ? "var(--line-strong)" : "var(--accent)", background: state === "done" ? "var(--accent)" : "transparent", color: state === "done" ? "var(--accent-ink)" : "var(--accent)", display: "grid", placeItems: "center", transition: "all 400ms" }}>
                    {state === "done" ? <span style={{ display: "flex" }}>{React.cloneElement(Icons.check, { size: 15 })}</span>
                      : state === "active" ? <span className="pulse-dot" /> : <span className="mono" style={{ fontSize: 10, color: "var(--ink-faint)" }}>{i + 1}</span>}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <span style={{ fontSize: 15.5, fontWeight: state === "active" ? 600 : 500 }}>{s.label}</span>
                      <span className="mono" style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>STEP {i + 1}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 3 }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* log */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
            <span className="overline">LOG DE EXECUÇÃO</span>
            {status === "running" && <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>● LIVE</span>}
          </div>
          <div ref={logRef} className="card" style={{ height: 420, overflowY: "auto", padding: "22px 24px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, lineHeight: 1.9 }}>
            {log.length === 0 && <div style={{ color: "var(--ink-faint)", fontStyle: "italic", fontFamily: "'Newsreader',serif" }}>Aguardando execução. O log aparecerá aqui linha a linha.</div>}
            {log.map((l, i) => (
              <div key={i} className="grow-in" style={{ display: "flex", gap: 14, color: l.k === "ok" ? "var(--good)" : l.k === "head" ? "var(--accent)" : "var(--ink-soft)" }}>
                <span style={{ color: "var(--ink-faint)", flexShrink: 0 }}>{l.t}</span>
                <span style={{ fontWeight: l.k === "ok" || l.k === "head" ? 500 : 400 }}>{l.m}</span>
              </div>
            ))}
          </div>

          {status === "done" && (
            <div className="grow-in" style={{ marginTop: 24, padding: "22px 24px", border: "1px solid var(--accent)", background: "var(--accent-soft)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Pipeline concluído com sucesso</div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>Veja os resultados ou escolha a imagem do post.</div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Btn variant="secondary" size="sm" onClick={() => goto("results")}>Ver resultados</Btn>
                <Btn variant="primary" size="sm" iconRight={Icons.arrow} onClick={() => goto("images")}>Escolher imagem</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageTitle({ kicker, title, sub }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <Kicker accent>{kicker}</Kicker>
      <h1 className="display" style={{ fontSize: "clamp(36px,5vw,68px)", margin: "20px 0 0" }}>{title}</h1>
      {sub && <p className="serif" style={{ fontSize: 18, color: "var(--ink-soft)", maxWidth: "62ch", margin: "22px 0 0", lineHeight: 1.55 }}>{sub}</p>}
      <div className="rule" style={{ marginTop: 34 }} />
    </div>
  );
}

function time() {
  const d = new Date();
  return d.toLocaleTimeString("pt-BR", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0").slice(0, 2);
}

Object.assign(window, { PagePipeline, PageTitle });
