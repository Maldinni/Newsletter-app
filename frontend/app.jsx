/* ============================================================
   app.jsx — shell, routing, theme
   ============================================================ */
const NAV = [
  { key: "about", label: "Sobre", page: "PageAbout" },
  { key: "pipeline", label: "Executar Pipeline", page: "PagePipeline" },
  { key: "results", label: "Resultados", page: "PageResults" },
  { key: "viz", label: "Visualizações", page: "PageViz" },
  { key: "images", label: "Seleção de Imagens", page: "PageImages" },
];

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("nl-theme");
    if (saved) return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("theme-switching");
    html.setAttribute("data-theme", theme);
    localStorage.setItem("nl-theme", theme);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("theme-switching")));
    return () => cancelAnimationFrame(id);
  }, [theme]);
  return [theme, setTheme];
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="toggle" role="group" aria-label="Tema">
      <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")} aria-label="Claro">{Icons.sun}</button>
      <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")} aria-label="Escuro">{Icons.moon}</button>
    </div>
  );
}

function Sidebar({ route, goto, theme, setTheme }) {
  return (
    <aside className="sidebar">
      <div onClick={() => goto("about")} style={{ cursor: "pointer" }}>
        <Logo />
      </div>

      <nav className="nav-wrap" style={{ marginTop: 46, flex: 1 }}>
        <div className="overline" style={{ marginBottom: 16 }}>NAVEGAÇÃO</div>
        <div style={{ borderTop: "1px solid var(--ink)" }}>
          {NAV.map((n, i) => (
            <div key={n.key} className={"nav-item" + (route === n.key ? " active" : "")} onClick={() => goto(n.key)}>
              <span className="nav-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="nav-label">{n.label}</span>
              <span className="nav-tick" />
            </div>
          ))}
        </div>
      </nav>

      <div className="side-foot" style={{ marginTop: 34 }}>
        <div className="rule" style={{ marginBottom: 22 }} />
        <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--ink-soft)", margin: "0 0 22px" }}>
          Plataforma de inteligência de narrativas. Análise semântica e identificação de tendências em tempo real.
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="overline" style={{ fontSize: 9, marginBottom: 5 }}>EDITOR-CHEFE</div>
            <div className="serif italic" style={{ fontSize: 16 }}>Enzo Maldinni</div>
          </div>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>
    </aside>
  );
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
}

function App() {
  const [route, setRoute] = useState(() => (location.hash || "#about").slice(1));
  const [theme, setTheme] = useTheme();
  const [pipeState, setPipeState] = useState({ status: "idle", current: -1, progress: 0, log: [] });
  const mainRef = useRef(null);

  const goto = useCallback((key) => {
    setRoute(key);
    location.hash = key;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onHash = () => setRoute((location.hash || "#about").slice(1));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // delegate [data-goto] buttons
  useEffect(() => {
    const h = (e) => { const el = e.target.closest("[data-goto]"); if (el) goto(el.getAttribute("data-goto")); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [goto]);

  const current = NAV.find(n => n.key === route) || NAV[0];

  let content;
  if (route === "about") content = <PageAbout />;
  else if (route === "pipeline") content = <PagePipeline pipeState={pipeState} setPipeState={setPipeState} goto={goto} />;
  else if (route === "results") content = <PageResults />;
  else if (route === "viz") content = <PageViz />;
  else if (route === "images") content = <PageImages />;
  else content = <PageAbout />;

  return (
    <div className="shell">
      <Sidebar route={route} goto={goto} theme={theme} setTheme={setTheme} />
      <div className="main">
        <header className="masthead">
          <div className="mono masthead-date" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-faint)" }}>
            <span style={{ color: "var(--accent)" }}>●</span> {current.label.toUpperCase()}
          </div>
          <div className="mono masthead-meta" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: "var(--ink-faint)" }}>
            VOL. 01 · {todayLabel()}
          </div>
        </header>
        <main ref={mainRef} className="canvas">
          {content}
        </main>
      </div>
    </div>
  );
}

/* gridlines positioning */
function layoutGridlines() {
  const host = document.getElementById("gridlines");
  if (!host) return;
  const w = window.innerWidth;
  if (w <= 720) { host.innerHTML = ""; return; }
  const sidebar = 312;
  const area = w - sidebar;
  const cols = [0.25, 0.5, 0.75];
  host.innerHTML = "";
  cols.forEach(c => {
    const i = document.createElement("i");
    i.style.left = (sidebar + area * c) + "px";
    host.appendChild(i);
  });
  const edge = document.createElement("i");
  edge.style.left = sidebar + "px";
  edge.style.background = "var(--line)";
  host.appendChild(edge);
}
window.addEventListener("resize", layoutGridlines);
layoutGridlines();

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
