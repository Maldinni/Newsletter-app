/* ============================================================
   page_about.jsx — Sobre / Home
   ============================================================ */
function PageAbout() {
  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section style={{ position: "relative" }}>
        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 0 }}>
          <Kicker accent>NEWSLETTER · EDIÇÃO DIGITAL</Kicker>
          <h1 className="display" style={{ fontSize: "clamp(44px, 7vw, 104px)", margin: "30px 0 0", maxWidth: "16ch" }}>
            Da <span className="accent-word">Tendência</span><br />
            ao Post,<br />
            Automaticamente
          </h1>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "clamp(24px,4vw,72px)", marginTop: 54, alignItems: "start" }} className="hero-grid">
            <p className="serif dropcap" style={{ fontSize: 21, lineHeight: 1.62, color: "var(--ink)", margin: 0 }}>
              A <strong style={{ fontWeight: 600 }}>Newsletter</strong> monitora fontes curadas, detecta as narrativas
              em alta e gera automaticamente o post — texto, imagem e card — pronto para revisão e publicação.
            </p>
            <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: "clamp(20px,3vw,40px)" }}>
              <div className="overline" style={{ marginBottom: 18 }}>NESTA EDIÇÃO</div>
              {[["01","Cinco dimensões de análise"],["02","Pipeline completo de coleta a post"],["03","Seleção de imagem e card final"]].map(([n,t]) => (
                <div key={n} style={{ display: "flex", gap: 16, padding: "11px 0", borderTop: "1px solid var(--line-soft)" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>{n}</span>
                  <span style={{ fontSize: 14.5, color: "var(--ink-soft)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="rule" style={{ margin: "clamp(56px,7vw,96px) 0" }} />

      {/* ---------- DIMENSÕES ---------- */}
      <section>
        <div className="section-head">
          <div>
            <Kicker accent>SEÇÃO I</Kicker>
            <h2 className="display" style={{ fontSize: "clamp(32px,4.5vw,56px)", margin: "18px 0 0" }}>Dimensões de Análise</h2>
          </div>
          <p className="serif italic" style={{ fontSize: 17, color: "var(--ink-soft)", maxWidth: "32ch", margin: 0 }}>
            O que a plataforma monitora e classifica em tempo real.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 48, borderTop: "1px solid var(--ink)" }}>
          {DIMENSIONS.map((d, i) => (
            <article key={d.title} className="dim-card"
              style={{ padding: "32px 28px 40px", borderRight: i < DIMENSIONS.length - 1 ? "1px solid var(--line)" : "none", borderBottom: "1px solid var(--line)", position: "relative", transition: "background 600ms" }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ marginTop: 26, color: "var(--accent)" }}>{Icons[d.icon]}</div>
              <h3 className="display" style={{ fontSize: 25, margin: "22px 0 12px", fontWeight: 600 }}>{d.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-soft)", margin: 0 }}>{d.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="rule" style={{ margin: "clamp(56px,7vw,96px) 0" }} />

      {/* ---------- COMO FUNCIONA ---------- */}
      <section>
        <div className="section-head">
          <div>
            <Kicker accent>SEÇÃO II</Kicker>
            <h2 className="display" style={{ fontSize: "clamp(32px,4.5vw,56px)", margin: "18px 0 0" }}>Como Funciona</h2>
          </div>
          <p className="serif italic" style={{ fontSize: 17, color: "var(--ink-soft)", maxWidth: "30ch", margin: 0 }}>
            Pipeline completo — da coleta ao post publicável.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(248px, 1fr))", gap: 1, marginTop: 48, background: "var(--line)", border: "1px solid var(--line)" }}>
          {STEPS.map((s) => (
            <article key={s.n} className="card" style={{ padding: "34px 30px 42px", borderTop: "3px solid var(--accent)", boxShadow: "none", border: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="overline" style={{ color: "var(--accent)" }}>ETAPA {s.n}</span>
                <span style={{ color: "var(--ink-faint)" }}>{Icons[s.icon]}</span>
              </div>
              <h3 className="display" style={{ fontSize: 26, margin: "28px 0 14px", fontWeight: 600 }}>{s.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.62, color: "var(--ink-soft)", margin: 0 }}>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- CTA strip ---------- */}
      <section style={{ marginTop: "clamp(56px,7vw,96px)", background: "var(--ink)", color: "var(--paper)", padding: "clamp(40px,5vw,72px)", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 40, flexWrap: "wrap" }}>
          <div>
            <span className="overline" style={{ color: "var(--accent)" }}>PRONTO PARA COMEÇAR</span>
            <h2 className="display" style={{ fontSize: "clamp(30px,4vw,52px)", margin: "20px 0 0", color: "var(--paper)", maxWidth: "18ch" }}>
              Execute o pipeline e gere o seu <span className="italic" style={{ color: "var(--accent)" }}>próximo post</span>.
            </h2>
          </div>
          <button className="btn" data-goto="pipeline"
            style={{ borderColor: "var(--paper)", color: "var(--paper)", background: "transparent" }}>
            <span>Iniciar Pipeline {Icons.arrow}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
window.PageAbout = PageAbout;
