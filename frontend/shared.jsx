/* ============================================================
   shared.jsx — primitives, icons, logo, data
   ============================================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------------- Thin line icons (stroke 1.25) ---------------- */
const Ic = ({ d, size = 20, fill, vb = "0 0 24 24", stroke }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill || "none"}
       stroke={stroke || "currentColor"} strokeWidth="1.25"
       strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const Icons = {
  trend:   <Ic d={<><path d="M3 17l5-5 4 3 8-9" /><path d="M16 6h4v4" /></>} />,
  narrative:<Ic d={<><path d="M4 5h16M4 10h10M4 15h16M4 20h7" /></>} />,
  emotion: <Ic d={<><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M8.5 14c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" /><path d="M9 9.5h.01M15 9.5h.01" /></>} />,
  scale:   <Ic d={<><path d="M12 3v18M5 21h14M6 7l-3 6h6l-3-6zM18 7l-3 6h6l-3-6zM5 7h14" /></>} />,
  actors:  <Ic d={<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.2" /><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M15 20c.2-2 1.2-3.4 3-3.4" /></>} />,
  search:  <Ic d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} />,
  play:    <Ic d={<><path d="M7 4.5v15l13-7.5-13-7.5z" /></>} fill="currentColor" stroke="none" />,
  stop:    <Ic d={<><rect x="6" y="6" width="12" height="12" /></>} />,
  sun:     <Ic d={<><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" /></>} />,
  moon:    <Ic d={<><path d="M20 14.5A8.2 8.2 0 119.5 4a6.4 6.4 0 0010.5 10.5z" /></>} />,
  check:   <Ic d={<><path d="M4 12.5l5 5 11-12" /></>} />,
  plus:    <Ic d={<><path d="M12 5v14M5 12h14" /></>} />,
  minus:   <Ic d={<><path d="M5 12h14" /></>} />,
  collect: <Ic d={<><path d="M4 7c0-1.5 3.6-3 8-3s8 1.5 8 3-3.6 3-8 3-8-1.5-8-3z" /><path d="M4 7v10c0 1.5 3.6 3 8 3s8-1.5 8-3V7" /><path d="M4 12c0 1.5 3.6 3 8 3s8-1.5 8-3" /></>} />,
  science: <Ic d={<><path d="M9 3h6M10 3v6l-5 8.5A2 2 0 006.7 21h10.6a2 2 0 001.7-3.5L14 9V3" /><path d="M8 15h8" /></>} />,
  ai:      <Ic d={<><rect x="5" y="5" width="14" height="14" rx="0" /><path d="M9 9h6v6H9z" /><path d="M5 9H2M5 15H2M22 9h-3M22 15h-3M9 5V2M15 5V2M9 22v-3M15 22v-3" /></>} />,
  insight: <Ic d={<><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" /><path d="M9.5 21h5M10 19h4" /></>} />,
  image:   <Ic d={<><rect x="3" y="4" width="18" height="16" /><path d="M3 16l5-5 4 4 3-3 6 6" /><circle cx="9" cy="9" r="1.5" /></>} />,
  chart:   <Ic d={<><path d="M4 20V4M4 20h16M8 20v-6M12 20V9M16 20v-9M20 20v-3" /></>} />,
  link:    <Ic d={<><path d="M10 13a4 4 0 005.7 0l3-3a4 4 0 10-5.7-5.7L11 6" /><path d="M14 11a4 4 0 00-5.7 0l-3 3A4 4 0 109 19.7L10.3 18" /></>} />,
  doc:     <Ic d={<><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h6M9 9h2" /></>} />,
  spark:   <Ic d={<><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" /></>} />,
  arrow:   <Ic d={<><path d="M5 12h14M13 6l6 6-6 6" /></>} />,
  share:   <Ic d={<><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="M8.1 11l7.8-4M8.1 13l7.8 4" /></>} />,
  star:    <Ic d={<><path d="M12 3.5l2.5 5.4 5.9.6-4.4 4 1.2 5.8L12 16.9 6.8 19.3 8 13.5l-4.4-4 5.9-.6L12 3.5z" /></>} />,
  help:    <Ic d={<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.5 2.5 0 014.8.9c0 1.7-2.3 2.2-2.3 3.9M12 17h.01" /></>} />,
  gear:    <Ic d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7L5 5" /></>} />,
  refresh: <Ic d={<><path d="M3 12a9 9 0 0115.5-6.3L21 8M21 4v4h-4" /><path d="M21 12a9 9 0 01-15.5 6.3L3 16M3 20v-4h4" /></>} />,
};

/* ---------------- Logo wordmark ---------------- */
function Logo({ compact }) {
  return (
    <div style={{ lineHeight: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 9, height: 9, background: "var(--accent)", display: "inline-block" }} />
        <span className="overline" style={{ fontSize: 9.5, letterSpacing: "0.34em" }}>EST. MMXXVI</span>
      </div>
      <div className="display" style={{ fontSize: compact ? 30 : 38, marginTop: 10, letterSpacing: "-0.02em", fontWeight: 600 }}>
        Newsletter
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <span className="rule" style={{ flex: 1, height: 1 }} />
        <span className="overline" style={{ fontSize: 8.5, letterSpacing: "0.3em" }}>INTEL. DE NARRATIVAS</span>
        <span className="rule" style={{ flex: 1, height: 1 }} />
      </div>
    </div>
  );
}

/* ---------------- Small building blocks ---------------- */
function Kicker({ children, accent }) {
  return (
    <span className="kicker-bar">
      <span className="deco-line" style={accent ? { background: "var(--accent)" } : null} />
      <span className="overline">{children}</span>
    </span>
  );
}

function Btn({ variant = "secondary", size, icon, iconRight, children, ...rest }) {
  const cls = `btn btn--${variant}${size ? " btn--" + size : ""}`;
  return (
    <button className={cls} {...rest}>
      <span>{icon}{children}{iconRight}</span>
    </button>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: "26px 28px" }}>
      <div className="overline" style={{ marginBottom: 18 }}>{label}</div>
      <div className="display" style={{ fontSize: 52, fontWeight: 500 }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 10 }}>{sub}</div>}
    </div>
  );
}

/* ---------------- Chart palette (muted editorial) ---------------- */
const CHART_COLORS = ["#3B5268","#9A6A3C","#5E7355","#7A6E86","#46707A","#A85751","#6E7A88","#8C7A4E","#4F6E5B","#8A5E6E","#5A6E8C","#9A8456"];
const CHART_COLORS_DARK = ["#8FAAC4","#C9A26E","#9DB48F","#B5A6C2","#7FB0BD","#D58E88","#A6B2C0","#C9B582","#A6CBB2","#C99FB0","#9DB0CE","#CBBE8A"];

function chartInk() {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink: cs.getPropertyValue("--ink").trim(),
    soft: cs.getPropertyValue("--ink-soft").trim(),
    faint: cs.getPropertyValue("--ink-faint").trim(),
    line: cs.getPropertyValue("--line").trim(),
    accent: cs.getPropertyValue("--accent").trim(),
    paper: cs.getPropertyValue("--paper-card").trim(),
    palette: document.documentElement.getAttribute("data-theme") === "dark" ? CHART_COLORS_DARK : CHART_COLORS,
  };
}

/* ---------------- API ---------------- */
/* Busca dados do backend; em falha/vazio, o componente cai no mock. */
function useApiData(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => { if (alive) setData(d); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [url]);
  return { data, error };
}

/* ---------------- DATA ---------------- */
const DIMENSIONS = [
  { icon: "trend", title: "Tendências", text: "Temas que ganham ou perdem relevância no debate público, em tempo real." },
  { icon: "narrative", title: "Narrativas", text: "Como os assuntos são construídos, enquadrados e disseminados pelo público." },
  { icon: "emotion", title: "Tom Emocional", text: "Sentimento predominante e reações que atravessam as discussões digitais." },
  { icon: "scale", title: "Viés Político", text: "Posicionamentos ideológicos e o grau de polarização de cada narrativa." },
  { icon: "actors", title: "Atores", text: "Perfis e organizações que lideram, financiam e impulsionam o debate." },
];

const STEPS = [
  { n: "01", icon: "collect", title: "Coleta", text: "Scraping contínuo das fontes curadas em sources.toml — notícias e artigos de opinião." },
  { n: "02", icon: "science", title: "Clusterização", text: "Embeddings semânticos e detecção de comunidades agrupam as matérias por narrativa." },
  { n: "03", icon: "ai", title: "Análise & Tendência", text: "LLM local rotula, compara e mede o que está em alta; o ranking elege o cluster destaque." },
  { n: "04", icon: "insight", title: "Geração de Post", text: "Texto, imagem e card prontos para revisão — da coleta ao post publicável." },
];

/* Cluster table data (deterministic, 120 rows) */
const FOCI = ["Crimes e segurança pública","Cultura e entretenimento","Economia e mercado financeiro","Política local","Política nacional","Acidentes e desastres","Meio ambiente","Esportes","Saúde","Educação"];
const TITLES = [
  "Crimes e segurança pública em pauta","Acidentes e crimes: vítimas e investigações","Crimes e segurança pública | Política nacional",
  "Liquidação do Banco Master e fraudes financeiras","Operações policiais e crime organizado","Eleições 2026 e disputas políticas",
  "Mercado financeiro e taxa de juros","Festivais culturais e agenda da cidade","Desastres naturais e resposta de emergência",
  "Meio ambiente e licenciamento de obras","Campeonato regional e bastidores do esporte","Rede pública de saúde e filas de atendimento",
];
const KEYWORDS = [
  "Homicídio; Crimes; Polícia; Suspeitos; Presos","Acidentes; Segurança pública; Crimes; Desastres; Saúde",
  "STF; Alexandre de Moraes; Prisão; Política; Justiça","Banco Master; Compliance; Fraudes; Liquidação; BC",
  "Feminicídio; Detenções; Operações policiais; Organizações","Eleições; Prefeito; Câmara; Voto; Campanha",
  "Selic; Inflação; Dólar; Bolsa; Investimento","Festival; Música; Teatro; Agenda; Público",
  "Chuvas; Enchente; Defesa Civil; Resgate; Abrigo","Licença; Desmatamento; IBAMA; Obra; Impacto",
  "Campeonato; Clube; Técnico; Torcida; Rodada","SUS; Hospital; Fila; Médicos; Atendimento",
];
const DESCS = [
  "Relatos de diferentes ocorrências criminais com foco em investigação policial.",
  "Os textos relacionam acidentes e crimes a vítimas e a desdobramentos judiciais.",
  "Os textos abordam decisões de tribunais superiores no campo político.",
  "O texto aborda a liquidação de instituição financeira e apurações de fraude.",
  "Os textos detalham operações policiais e organizações criminosas regionais.",
  "Cobertura de disputas eleitorais e articulações entre partidos locais.",
];
const TRENDS = ["alta","alta","estável","alta","queda","estável","alta","queda","alta","estável"];

function buildClusters() {
  const rows = [];
  for (let i = 0; i < 120; i++) {
    const f = FOCI[i % FOCI.length];
    rows.push({
      id: i,
      cluster: i,
      title: TITLES[i % TITLES.length] + (i >= TITLES.length ? ` · vol. ${Math.floor(i / TITLES.length) + 1}` : ""),
      size: 200 - i - ((i * 7) % 23),
      keywords: KEYWORDS[i % KEYWORDS.length],
      description: DESCS[i % DESCS.length],
      focus: f,
      similar: (i * 3 + 7) % 120,
      similarity: (0.62 + ((i * 13) % 37) / 100).toFixed(2),
      distinguishing: KEYWORDS[(i + 3) % KEYWORDS.length].split(";")[0].trim(),
      trend: TRENDS[i % TRENDS.length],
    });
  }
  return rows;
}
const CLUSTERS = buildClusters();

const COLUMNS = [
  { key: "cluster", label: "Cluster ID", w: 92, num: true },
  { key: "title", label: "Título", w: 320 },
  { key: "size", label: "Size", w: 72, num: true },
  { key: "keywords", label: "Keywords", w: 300 },
  { key: "description", label: "Descrição", w: 320 },
  { key: "focus", label: "Focus", w: 200 },
  { key: "similar", label: "Cluster + Similar", w: 130, num: true },
  { key: "similarity", label: "Similarity", w: 110, num: true },
  { key: "distinguishing", label: "Distinguishing", w: 180 },
  { key: "trend", label: "Trend", w: 110 },
];

/* Focus distribution for charts */
function focusDistribution() {
  const m = {};
  CLUSTERS.forEach(c => { m[c.focus] = (m[c.focus] || 0) + 1; });
  return Object.entries(m).map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value);
}

/* Candidate images for selection page */
const CANDIDATE_IMAGES = [
  { id: 1, label: "Plenário · sessão", ratio: "16/9", src: "capa-debate.jpg", w: 1600, h: 900, hint: "rgba(59,82,104,.16)" },
  { id: 2, label: "Manifestação urbana", ratio: "4/5", src: "rua-protesto.jpg", w: 1200, h: 1500, hint: "rgba(154,106,60,.16)" },
  { id: 3, label: "Mercado financeiro", ratio: "16/9", src: "bolsa-valores.jpg", w: 1600, h: 900, hint: "rgba(94,115,85,.16)" },
  { id: 4, label: "Tribunal · fachada", ratio: "1/1", src: "stf-fachada.jpg", w: 1200, h: 1200, hint: "rgba(122,110,134,.16)" },
  { id: 5, label: "Redação · jornal", ratio: "16/9", src: "redacao.jpg", w: 1600, h: 900, hint: "rgba(70,112,122,.16)" },
  { id: 6, label: "Multidão · evento", ratio: "4/5", src: "evento-cultural.jpg", w: 1200, h: 1500, hint: "rgba(168,87,81,.16)" },
  { id: 7, label: "Cidade · panorâmica", ratio: "16/9", src: "cidade.jpg", w: 1600, h: 900, hint: "rgba(110,122,136,.16)" },
  { id: 8, label: "Documentos · dados", ratio: "1/1", src: "dados-relatorio.jpg", w: 1200, h: 1200, hint: "rgba(140,122,78,.16)" },
  { id: 9, label: "Coletiva de imprensa", ratio: "16/9", src: "coletiva.jpg", w: 1600, h: 900, hint: "rgba(59,82,104,.16)" },
  { id: 10, label: "Estádio · arquibancada", ratio: "4/5", src: "estadio.jpg", w: 1200, h: 1500, hint: "rgba(79,110,91,.16)" },
  { id: 11, label: "Hospital · corredor", ratio: "16/9", src: "saude.jpg", w: 1600, h: 900, hint: "rgba(70,112,122,.16)" },
  { id: 12, label: "Natureza · floresta", ratio: "1/1", src: "meio-ambiente.jpg", w: 1200, h: 1200, hint: "rgba(94,115,85,.16)" },
];

Object.assign(window, {
  React, useState, useEffect, useRef, useMemo, useCallback,
  Ic, Icons, Logo, Kicker, Btn, Stat, useApiData,
  CHART_COLORS, CHART_COLORS_DARK, chartInk,
  DIMENSIONS, STEPS, CLUSTERS, COLUMNS, FOCI, focusDistribution, CANDIDATE_IMAGES,
});
