/* ============================================================
   page_viz.jsx — Visualizações (Chart.js)
   ============================================================ */
const VIZ_TABS = [
  { key: "dist", label: "Distribuição", icon: "chart" },
  { key: "trend", label: "Tendências", icon: "trend" },
  { key: "source", label: "Fontes", icon: "doc" },
  { key: "keyword", label: "Palavras-chave", icon: "spark" },
];

const SOURCES = [
  ["Jornal da Cidade Online", 142], ["Gazeta do Povo", 118], ["Jovem Pan", 96],
  ["Terra Brasil Notícias", 88], ["Brasil Paralelo", 74], ["Conexão Política", 67],
  ["Instituto Mises Brasil", 41],
];
const KEYWORD_FREQ = [
  ["Segurança", 88], ["Política", 81], ["Economia", 64], ["Justiça", 57], ["Eleições", 49],
  ["Polícia", 44], ["Mercado", 38], ["Saúde", 33], ["Cultura", 29], ["Ambiente", 22],
];
const WEEKS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"];
const TREND_SERIES = [
  { label: "Crimes e segurança pública", data: [22, 28, 31, 27, 38, 44] },
  { label: "Economia e mercado financeiro", data: [12, 15, 19, 30, 24, 21] },
  { label: "Política nacional", data: [18, 16, 14, 20, 26, 19] },
  { label: "Cultura e entretenimento", data: [9, 11, 13, 12, 15, 17] },
];

function ChartBox({ title, kind, build, height, deps, themeV }) {
  const ref = useRef(null);
  const inst = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    const t = chartInk();
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = t.soft;
    Chart.defaults.animation = false;
    const cfg = build(t);
    const chart = new Chart(ref.current.getContext("2d"), cfg);
    inst.current = chart;
    // The preview iframe throttles rAF, so Chart.js can skip its first paint.
    // Force a synchronous resize + draw a few times until the layout settles.
    const paint = () => { if (inst.current === chart) { try { chart.resize(); chart.draw(); } catch (e) {} } };
    const r1 = requestAnimationFrame(paint);
    const ts = [80, 240, 600].map(d => setTimeout(paint, d));
    return () => { cancelAnimationFrame(r1); ts.forEach(clearTimeout); chart.destroy(); };
  }, [...(deps || []), height, themeV]);
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", borderBottom: "1px solid var(--line)" }}>
        <span style={{ width: 4, height: 18, background: "var(--accent)" }} />
        <span className="overline">{title}</span>
      </div>
      <div style={{ padding: 22, height: height + 44 }}>
        <canvas ref={ref}></canvas>
      </div>
    </div>
  );
}

function PageViz() {
  const [tab, setTab] = useState("dist");
  const [topN, setTopN] = useState(8);
  const [height, setHeight] = useState(360);
  const [focus, setFocus] = useState("all");
  const [themeV, setThemeV] = useState(0);

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeV(v => v + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const dist = useMemo(() => {
    let d = focusDistribution();
    if (focus !== "all") d = d.filter(x => x.label === focus);
    return d.slice(0, topN);
  }, [topN, focus]);

  const gridCfg = (t) => ({ color: t.line, drawTicks: false });
  const noGrid = { display: false };

  return (
    <div className="fade-up">
      <PageTitle kicker="GRÁFICOS" title="Visualizações"
        sub="Explore a distribuição de clusters, tendências temporais e a análise de palavras-chave do período." />

      {/* controls */}
      <div className="card" style={{ padding: "26px 30px", marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30 }}>
          <span style={{ color: "var(--accent)" }}>{Icons.gear}</span>
          <span className="overline">CONTROLES GLOBAIS</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 40 }} className="filter-grid">
          <Slider label="Top N (temas · fontes · keywords)" value={topN} min={3} max={12} onChange={setTopN} />
          <Slider label="Altura dos gráficos (px)" value={height} min={260} max={520} step={20} onChange={setHeight} />
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="overline">Filtrar por tema (Focus)</span>
            </div>
            <select className="field" value={focus} onChange={e => setFocus(e.target.value)}>
              <option value="all">Todos os temas — selecione para filtrar</option>
              {FOCI.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)", marginBottom: 40, flexWrap: "wrap" }}>
        {VIZ_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 24px", background: "transparent", border: "none", borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: -1, cursor: "pointer", color: tab === t.key ? "var(--ink)" : "var(--ink-faint)", fontSize: 13, letterSpacing: "0.04em", fontWeight: tab === t.key ? 600 : 400, transition: "color 400ms" }}>
            {React.cloneElement(Icons[t.icon], { size: 16 })}{t.label}
          </button>
        ))}
      </div>

      {/* charts */}
      {tab === "dist" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px,1fr))", gap: 28 }}>
          <ChartBox title="DISTRIBUIÇÃO DE TEMAS" height={height} themeV={themeV} deps={[topN, focus]} build={(t) => ({
            type: "doughnut",
            data: { labels: dist.map(d => d.label), datasets: [{ data: dist.map(d => d.value), backgroundColor: t.palette, borderColor: t.paper, borderWidth: 2, hoverOffset: 8 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "right", labels: { boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 } } } } },
          })} />
          <ChartBox title="FREQUÊNCIA DE TEMAS" height={height} themeV={themeV} deps={[topN, focus]} build={(t) => ({
            type: "bar",
            data: { labels: dist.map(d => d.label), datasets: [{ data: dist.map(d => d.value), backgroundColor: t.accent, borderWidth: 0, barThickness: "flex", maxBarThickness: 26 }] },
            options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: gridCfg(t), border: { color: t.line }, ticks: { font: { size: 11 } } }, y: { grid: noGrid, border: { color: t.line }, ticks: { font: { size: 11 } } } } },
          })} />
        </div>
      )}

      {tab === "trend" && (
        <ChartBox title="EVOLUÇÃO SEMANAL DOS PRINCIPAIS TEMAS" height={Math.max(height, 380)} themeV={themeV} deps={[]} build={(t) => ({
          type: "line",
          data: { labels: WEEKS, datasets: TREND_SERIES.map((s, i) => ({ label: s.label, data: s.data, borderColor: t.palette[i], backgroundColor: t.palette[i], tension: 0.35, borderWidth: 2, pointRadius: 3, pointHoverRadius: 6, fill: false })) },
          options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 16, font: { size: 11 } } } }, scales: { x: { grid: noGrid, border: { color: t.line } }, y: { grid: gridCfg(t), border: { color: t.line }, beginAtZero: true } } },
        })} />
      )}

      {tab === "source" && (
        <ChartBox title="VOLUME POR FONTE" height={Math.max(height, 400)} themeV={themeV} deps={[topN]} build={(t) => {
          const s = SOURCES.slice(0, topN);
          return { type: "bar",
            data: { labels: s.map(x => x[0]), datasets: [{ data: s.map(x => x[1]), backgroundColor: t.palette, borderWidth: 0, maxBarThickness: 40 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: noGrid, border: { color: t.line }, ticks: { font: { size: 11 } } }, y: { grid: gridCfg(t), border: { color: t.line }, beginAtZero: true } } } };
        }} />
      )}

      {tab === "keyword" && (
        <ChartBox title="PALAVRAS-CHAVE MAIS FREQUENTES" height={Math.max(height, 400)} themeV={themeV} deps={[topN]} build={(t) => {
          const k = KEYWORD_FREQ.slice(0, topN);
          return { type: "bar",
            data: { labels: k.map(x => x[0]), datasets: [{ data: k.map(x => x[1]), backgroundColor: t.accent, borderWidth: 0, maxBarThickness: 26 }] },
            options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: gridCfg(t), border: { color: t.line } }, y: { grid: noGrid, border: { color: t.line }, ticks: { font: { size: 12 } } } } } };
        }} />
      )}
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <span className="overline">{label}</span>
        <span className="mono" style={{ fontSize: 13, color: "var(--accent)" }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="range" />
    </div>
  );
}

Object.assign(window, { PageViz });
