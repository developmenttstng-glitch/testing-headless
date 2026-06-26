export default function AboutPage({ onNav }) {
  return (
    <>
      <style>{`
        .about-page { padding-top:80px; min-height:100vh; }
        .about-hero {
          padding:60px 0; border-bottom:1px solid var(--border);
          background:radial-gradient(ellipse at 80% 50%, rgba(255,0,60,0.04) 0%, transparent 60%);
        }
        .about-ey { font-family:var(--mono); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(255,0,60,0.5); margin-bottom:12px; }
        .about-title { font-family:var(--mono); font-size:clamp(36px,7vw,80px); font-weight:bold; letter-spacing:0.05em; color:var(--text); line-height:0.95; margin-bottom:28px; }
        .about-title span { color:var(--accent3); text-shadow:0 0 30px rgba(255,0,60,0.3); }
        .about-lead { font-size:18px; color:var(--muted); line-height:1.7; max-width:560px; }

        .about-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border-bottom:1px solid var(--border); }
        .about-col { padding:48px 40px; border-right:1px solid var(--border); }
        .about-col:last-child { border-right:none; }
        .about-col-title { font-family:var(--mono); font-size:12px; letter-spacing:0.15em; text-transform:uppercase; color:var(--accent); margin-bottom:16px; }
        .about-col-body { font-size:14px; color:var(--muted); line-height:1.8; }

        .values-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-bottom:1px solid var(--border); }
        .value-item { padding:32px; border-right:1px solid var(--border); }
        .value-item:last-child { border-right:none; }
        .value-num { font-family:var(--mono); font-size:28px; font-weight:bold; color:rgba(0,255,200,0.15); margin-bottom:8px; }
        .value-title { font-family:var(--mono); font-size:12px; letter-spacing:0.1em; text-transform:uppercase; color:var(--accent); margin-bottom:8px; }
        .value-desc { font-size:13px; color:var(--muted); line-height:1.7; }

        .about-cta { padding:60px 0; text-align:center; }
        .about-cta-title { font-family:var(--mono); font-size:clamp(24px,4vw,40px); font-weight:bold; color:var(--text); margin-bottom:24px; }
        .about-cta-title span { color:var(--accent); }
        .btn-row { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
        .neon-btn { font-family:var(--mono); font-size:11px; letter-spacing:0.15em; text-transform:uppercase; padding:14px 28px; background:var(--accent); color:var(--bg); border:none; font-weight:bold; transition:all 0.15s; box-shadow:0 0 20px rgba(0,255,200,0.2); }
        .neon-btn:hover { box-shadow:0 0 36px rgba(0,255,200,0.5); }
        .ghost-btn { font-family:var(--mono); font-size:11px; letter-spacing:0.15em; text-transform:uppercase; padding:14px 28px; background:transparent; color:var(--accent); border:1px solid rgba(0,255,200,0.4); transition:all 0.15s; }
        .ghost-btn:hover { background:rgba(0,255,200,0.06); }

        @media (max-width:768px) {
          .about-grid { grid-template-columns:1fr; }
          .about-col { border-right:none; border-bottom:1px solid var(--border); }
          .values-grid { grid-template-columns:1fr; }
          .value-item { border-right:none; border-bottom:1px solid var(--border); }
        }
      `}</style>

      <div className="about-page">
        <div className="about-hero">
          <div className="container">
            <div className="about-ey">// Origin protocol</div>
            <div className="about-title">
              WE ARE<br/><span>NEON.</span>
            </div>
            <p className="about-lead">
              A fashion label built for the space between now and what comes next.
              Experimental materials. Precision engineering. Designs that exist
              at the edge of wearable.
            </p>
          </div>
        </div>

        <div className="about-grid">
          <div className="about-col">
            <div className="about-col-title">// The origin</div>
            <p className="about-col-body">
              NEON launched in 2022 from a single question: what does fashion
              look like when it stops following the past?
              <br/><br/>
              We started in a workshop in Tokyo, experimenting with recycled
              technical fabrics and construction methods borrowed from aerospace
              manufacturing. The first collection sold out in 72 hours.
              <br/><br/>
              Today we ship to 40 countries. The workshop got bigger. The
              question stayed the same.
            </p>
          </div>
          <div className="about-col">
            <div className="about-col-title">// The process</div>
            <p className="about-col-body">
              Every garment starts as a geometric problem. We work in
              Rhino and Grasshopper before we touch fabric — parametric
              modelling lets us test how a silhouette moves before we
              cut a single seam.
              <br/><br/>
              Materials are sourced from three partners: a recycled
              synthetics mill in Portugal, a natural dye lab in Kyoto,
              and a technical fabric developer in South Korea.
              <br/><br/>
              Production is limited. Every item is numbered.
            </p>
          </div>
        </div>

        <div className="values-grid">
          {[
            { num:'01', title:'Limited production', desc:'Every collection is capped. When it sells, it sells. No reprints, no restocks.' },
            { num:'02', title:'Material integrity', desc:'90% recycled or sustainably sourced materials across all collections, with full supply chain transparency.' },
            { num:'03', title:'Designed to last', desc:'Not trend-driven. Not seasonal panic. Pieces built to remain relevant because they were never chasing a moment.' },
          ].map(v => (
            <div className="value-item" key={v.num}>
              <div className="value-num">{v.num}</div>
              <div className="value-title">{v.title}</div>
              <p className="value-desc">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="about-cta">
          <div className="container">
            <div className="about-cta-title">
              Wear <span>the future.</span>
            </div>
            <div className="btn-row">
              <button className="neon-btn" onClick={() => onNav('shop')}>Shop collection →</button>
              <button className="ghost-btn" onClick={() => onNav('lookbook')}>View lookbook</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
