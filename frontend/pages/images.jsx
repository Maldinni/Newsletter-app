/* ============================================================
   page_images.jsx — Seleção de Imagens para o post
   ============================================================ */
function PageImages() {
  const [selected, setSelected] = useState([]);
  const [primary, setPrimary] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const { data: api } = useApiData("/api/images");
  const cluster = api && api.clusters && api.clusters[0];
  const clusterId = cluster ? cluster.cluster_id : null;

  // Normaliza candidatas reais (ou cai no mock se o backend não tiver dados).
  const images = useMemo(() => {
    if (cluster && cluster.candidates && cluster.candidates.length) {
      return cluster.candidates.map((c, i) => ({
        id: i,
        label: c.source || c.title || `Imagem ${i + 1}`,
        src: c.file,
        url: c.url,
        ratio: "4/5",
        meta: [c.artist || c.credit, c.license].filter(Boolean).join(" · "),
        hint: "rgba(59,82,104,.10)",
      }));
    }
    return CANDIDATE_IMAGES.map(x => ({ ...x, url: null, meta: `${x.w}×${x.h}` }));
  }, [cluster]);

  const toggle = (id) => {
    setConfirmed(false);
    setSelected(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        if (primary === id) setPrimary(next[0] ?? null);
        return next;
      }
      if (prev.length === 0) setPrimary(id);
      return [...prev, id];
    });
  };
  const makePrimary = (e, id) => { e.stopPropagation(); if (!selected.includes(id)) toggle(id); setPrimary(id); setConfirmed(false); };

  const confirm = async () => {
    if (clusterId == null) { setConfirmed(true); return; }  // modo mock
    const selFiles = selected.map(id => images.find(im => im.id === id)?.src).filter(Boolean);
    const coverFile = images.find(im => im.id === primary)?.src || null;
    try {
      await fetch("/api/images/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cluster_id: clusterId, selected: selFiles, cover: coverFile }),
      });
    } catch (_) { /* mantém UX mesmo offline */ }
    setConfirmed(true);
  };

  const count = selected.length;
  const primaryImg = images.find(i => i.id === primary);

  return (
    <div className="fade-up" style={{ paddingBottom: 40 }}>
      <PageTitle kicker="POST GERADO · SELEÇÃO" title="Seleção de Imagens"
        sub="O pipeline extraiu imagens candidatas das fontes. Selecione uma ou mais e defina a imagem de capa do post." />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: "clamp(28px,3.5vw,56px)", alignItems: "start" }} className="img-grid">
        {/* candidate grid */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22 }}>
            <span className="overline">IMAGENS EXTRAÍDAS · {images.length}</span>
            <span className="mono" style={{ fontSize: 12, color: count ? "var(--accent)" : "var(--ink-faint)" }}>{count} SELECIONADA{count === 1 ? "" : "S"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: 18 }}>
            {images.map((img) => {
              const isSel = selected.includes(img.id);
              const isPrim = primary === img.id;
              return (
                <figure key={img.id} onClick={() => toggle(img.id)}
                  className="img-card" style={{ margin: 0, cursor: "pointer", border: "1px solid", borderColor: isSel ? "var(--accent)" : "var(--line)", background: "var(--paper-card)", boxShadow: isSel ? "var(--shadow-lift)" : "var(--shadow-card)", transition: "border-color 400ms, box-shadow 500ms, transform 500ms", position: "relative" }}>
                  <div className="ph" style={{ aspectRatio: img.ratio.replace("/", " / "), background: "var(--paper-raise)" }}>
                    {img.url ? (
                      <img src={img.url} alt={img.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <>
                        <div style={{ position: "absolute", inset: 0, background: img.hint }} />
                        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--ink-faint)" }}>{React.cloneElement(Icons.image, { size: 30 })}</div>
                      </>
                    )}
                    <span className="ph-tag">{img.label}</span>
                    <span style={{ position: "absolute", top: 12, right: 12, width: 26, height: 26, border: "1px solid", borderColor: isSel ? "var(--accent)" : "var(--line-strong)", background: isSel ? "var(--accent)" : "color-mix(in srgb, var(--paper) 70%, transparent)", color: "var(--accent-ink)", display: "grid", placeItems: "center", transition: "all 300ms" }}>
                      {isSel && React.cloneElement(Icons.check, { size: 15 })}
                    </span>
                    {isPrim && <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", background: "var(--ink)", color: "var(--paper)", padding: "5px 9px", fontFamily: "'IBM Plex Mono',monospace" }}>★ Capa</span>}
                  </div>
                  <figcaption style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{img.label}</div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{img.meta}</div>
                    </div>
                    <button onClick={(e) => makePrimary(e, img.id)} title="Definir como capa"
                      style={{ flexShrink: 0, background: "none", border: "1px solid var(--line)", width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer", color: isPrim ? "var(--accent)" : "var(--ink-faint)", transition: "color 300ms" }}>
                      {React.cloneElement(Icons.star, { size: 15 })}
                    </button>
                  </figcaption>
                </figure>
              );
            })}
            {images.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "60px", textAlign: "center", color: "var(--ink-faint)", fontStyle: "italic", fontFamily: "'Newsreader',serif" }}>
                Nenhuma imagem candidata. Rode a Etapa 14 (busca de imagens) primeiro.
              </div>
            )}
          </div>
        </div>

        {/* preview sidebar */}
        <aside style={{ position: "sticky", top: 96 }}>
          <div className="overline" style={{ marginBottom: 22 }}>PRÉVIA DO POST</div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="ph" style={{ aspectRatio: "1 / 1", background: "var(--paper-raise)" }}>
              {primaryImg && primaryImg.url ? (
                <img src={primaryImg.url} alt={primaryImg.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : primaryImg ? (
                <>
                  <div style={{ position: "absolute", inset: 0, background: primaryImg.hint }} />
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--ink-faint)", flexDirection: "column", gap: 10 }}>
                    {React.cloneElement(Icons.image, { size: 34 })}
                    <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em" }}>{primaryImg.label}</span>
                  </div>
                </>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--ink-faint)", textAlign: "center", padding: 24 }}>
                  <span className="serif italic" style={{ fontSize: 15 }}>Selecione uma imagem de capa</span>
                </div>
              )}
            </div>
            <div style={{ padding: "20px 22px" }}>
              <span className="overline" style={{ color: "var(--accent)" }}>NEWSLETTER · DESTAQUE</span>
              <h3 className="display" style={{ fontSize: 21, margin: "12px 0 10px", lineHeight: 1.15 }}>Imagem de capa do post em destaque</h3>
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>
                A capa entra no card final; as demais selecionadas compõem o carrossel.
              </p>
              <div style={{ display: "flex", gap: 16, marginTop: 18, color: "var(--ink-faint)" }}>
                {[Icons.spark, Icons.share, Icons.link].map((ic, i) => <span key={i}>{React.cloneElement(ic, { size: 16 })}</span>)}
              </div>
            </div>
          </div>
          <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 16, lineHeight: 1.7 }}>
            A imagem marcada como ★ Capa será usada no post. Demais selecionadas ficam no carrossel.
          </p>
        </aside>
      </div>

      {/* sticky confirm bar */}
      <div style={{ position: "sticky", bottom: 0, marginTop: 40, marginLeft: "calc(-1 * clamp(24px,4vw,64px))", marginRight: "calc(-1 * clamp(24px,4vw,64px))", padding: "20px clamp(24px,4vw,64px)", background: "color-mix(in srgb, var(--paper) 90%, transparent)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", zIndex: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span className="display" style={{ fontSize: 38, fontWeight: 500, color: count ? "var(--ink)" : "var(--ink-faint)" }}>{String(count).padStart(2, "0")}</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>{count === 0 ? "Nenhuma imagem selecionada" : `${count} ${count > 1 ? "imagens" : "imagem"} no post`}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>{primaryImg ? `Capa: ${primaryImg.label}` : "Defina a imagem de capa (★)"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {confirmed && <span className="grow-in" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--good)", fontSize: 13, fontWeight: 500 }}>{React.cloneElement(Icons.check, { size: 16 })} Seleção confirmada</span>}
          {count > 0 && <Btn variant="ghost" size="sm" onClick={() => { setSelected([]); setPrimary(null); setConfirmed(false); }}>Limpar</Btn>}
          <Btn variant="primary" icon={Icons.check} disabled={count === 0 || !primary} onClick={confirm}>
            Confirmar seleção
          </Btn>
        </div>
      </div>
    </div>
  );
}
window.PageImages = PageImages;
