/* ============================================================
   page_results.jsx — Resultados dos Clusters (functional table)
   ============================================================ */
function PageResults() {
  const [query, setQuery] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "cluster", dir: 1 });
  const [hidden, setHidden] = useState({});

  const { data: api } = useApiData("/api/results");
  const baseRows = (api && api.rows && api.rows.length) ? api.rows : CLUSTERS;

  const visibleCols = COLUMNS.filter(c => !hidden[c.key]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = baseRows;
    if (q) rows = rows.filter(r => COLUMNS.some(c => String(r[c.key]).toLowerCase().includes(q)));
    rows = [...rows].sort((a, b) => {
      const col = COLUMNS.find(c => c.key === sort.key);
      let av = a[sort.key], bv = b[sort.key];
      if (col && col.num) { av = +av; bv = +bv; } else { av = String(av); bv = String(bv); }
      return av < bv ? -sort.dir : av > bv ? sort.dir : 0;
    });
    return rows;
  }, [query, sort, baseRows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const uniqueClusters = new Set(baseRows.map(c => c.focus)).size;

  const toggleSort = (k) => setSort(s => s.key === k ? { key: k, dir: -s.dir } : { key: k, dir: 1 });
  const toggleCol = (k) => setHidden(h => ({ ...h, [k]: !h[k] }));

  useEffect(() => { setPage(1); }, [query, perPage]);

  return (
    <div className="fade-up">
      <PageTitle kicker="ARQUIVO" title="Resultados dos Clusters"
        sub="Navegue, pesquise e inspecione os dados de clusters gerados pelo pipeline." />

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", marginBottom: 56 }}>
        {[["Total de Registros", baseRows.length, "clusters agrupados"],
          ["Focos Únicos", uniqueClusters, "categorias temáticas"],
          ["Colunas", COLUMNS.length, "campos por registro"]].map(([l, v, s]) => (
          <div key={l} className="card" style={{ boxShadow: "none", border: "none", padding: "26px 28px" }}>
            <div className="overline" style={{ marginBottom: 16 }}>{l}</div>
            <div className="display" style={{ fontSize: 46, fontWeight: 500 }}>{v}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="card" style={{ padding: "28px 30px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <span style={{ color: "var(--accent)" }}>{Icons.gear}</span>
          <span className="overline">FILTROS E COLUNAS</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 32, alignItems: "end" }} className="filter-grid">
          <div>
            <label className="overline" style={{ display: "block", marginBottom: 10 }}>BUSCAR</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--line-strong)" }}>
              <span style={{ color: "var(--ink-faint)" }}>{React.cloneElement(Icons.search, { size: 17 })}</span>
              <input className="field" style={{ borderBottom: "none" }} placeholder="Buscar em todas as colunas…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="overline" style={{ display: "block", marginBottom: 10 }}>LINHAS / PÁGINA</label>
            <select className="field" value={perPage} onChange={e => setPerPage(+e.target.value)}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <label className="overline" style={{ display: "block", marginBottom: 14 }}>COLUNAS VISÍVEIS</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {COLUMNS.map(c => (
              <button key={c.key} onClick={() => toggleCol(c.key)}
                className="chip" style={{ cursor: "pointer", opacity: hidden[c.key] ? 0.4 : 1, borderColor: hidden[c.key] ? "var(--line)" : "var(--accent)", color: hidden[c.key] ? "var(--ink-faint)" : "var(--ink)" }}>
                {c.label}
                <span style={{ color: hidden[c.key] ? "var(--ink-faint)" : "var(--accent)" }}>{hidden[c.key] ? "+" : "×"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* results meta + pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", letterSpacing: "0.08em" }}>
          {filtered.length} RESULTADOS · PÁGINA {safePage} DE {totalPages}
        </div>
        <Pager page={safePage} total={totalPages} setPage={setPage} />
      </div>

      {/* table */}
      <div className="card" style={{ overflowX: "auto", padding: 0 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 880 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--ink)" }}>
              <th style={thStyle(56)}><span className="mono" style={{ fontSize: 10, color: "var(--ink-faint)" }}>#</span></th>
              {visibleCols.map(c => (
                <th key={c.key} style={thStyle(c.w)} onClick={() => toggleSort(c.key)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: sort.key === c.key ? "var(--accent)" : "var(--ink-soft)" }}>
                    {c.label}
                    <span className="mono" style={{ fontSize: 9, opacity: sort.key === c.key ? 1 : 0.3 }}>{sort.key === c.key ? (sort.dir > 0 ? "▲" : "▼") : "↕"}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r.id} className="trow" style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={tdStyle()}><span className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>{(safePage - 1) * perPage + i}</span></td>
                {visibleCols.map(c => (
                  <td key={c.key} style={tdStyle(c.num)}>{renderCell(r, c)}</td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={visibleCols.length + 1} style={{ padding: "60px", textAlign: "center", color: "var(--ink-faint)", fontStyle: "italic", fontFamily: "'Newsreader',serif" }}>Nenhum resultado para “{query}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <Pager page={safePage} total={totalPages} setPage={setPage} />
      </div>
    </div>
  );
}

function renderCell(r, c) {
  const v = r[c.key];
  if (c.key === "cluster") return <span className="mono" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{String(v).padStart(3, "0")}</span>;
  if (c.key === "title") return <span style={{ fontWeight: 500, fontSize: 14 }}>{v}</span>;
  if (c.key === "size") return <span className="mono" style={{ fontSize: 13 }}>{v}</span>;
  if (c.key === "keywords") return <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{v}</span>;
  if (c.key === "trend") {
    const map = { alta: ["▲", "var(--good)"], queda: ["▼", "var(--warn)"], "estável": ["—", "var(--ink-faint)"] };
    const [g, col] = map[v] || ["—", "var(--ink-faint)"];
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: col }}><span>{g}</span>{v}</span>;
  }
  if (c.key === "focus") return <span style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 7, height: 7, background: "var(--accent)", flexShrink: 0 }} />{v}</span>;
  if (c.key === "similarity") return <span className="mono" style={{ fontSize: 12.5 }}>{v}</span>;
  if (c.key === "description") return <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{v}</span>;
  return <span style={{ fontSize: 13 }}>{v}</span>;
}

function Pager({ page, total, setPage }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--line)" }}>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="pager-btn">{React.cloneElement(Icons.minus, { size: 16 })}</button>
      <span className="mono" style={{ fontSize: 12.5, padding: "0 18px", minWidth: 70, textAlign: "center", borderLeft: "1px solid var(--line)", borderRight: "1px solid var(--line)", height: 38, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{page} / {total}</span>
      <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page >= total} className="pager-btn">{React.cloneElement(Icons.plus, { size: 16 })}</button>
    </div>
  );
}

const thStyle = (w) => ({ width: w, textAlign: "left", padding: "16px 18px", fontFamily: "Inter, sans-serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap", verticalAlign: "bottom" });
const tdStyle = (num) => ({ padding: "16px 18px", verticalAlign: "top", textAlign: num ? "right" : "left", maxWidth: 360 });

Object.assign(window, { PageResults });
