export default function LookbookPage({ onNav }) {
  const looks = [
    { num:'01', title:'VOID COLLECTION', sub:'Structured darkness', tags:['Outerwear','Minimal'] },
    { num:'02', title:'NEON CIRCUIT',    sub:'Light meets form',   tags:['Streetwear','Tech'] },
    { num:'03', title:'BINARY DRAPE',    sub:'Data as fabric',     tags:['Avant-garde','Silk'] },
    { num:'04', title:'GRID MANIFEST',   sub:'Urban architecture', tags:['Denim','Structure'] },
    { num:'05', title:'PULSE LAYER',     sub:'Motion captured',    tags:['Layering','Sport'] },
    { num:'06', title:'DARK SIGNAL',     sub:'Invisible lines',    tags:['Accessories','Leather'] },
  ]

  return (
    <>
      <style>{`
        .lb-page { padding-top:80px; min-height:100vh; }
        .lb-hero {
          padding:48px 0; border-bottom:1px solid var(--border);
          background:radial-gradient(ellipse at 100% 0%, rgba(191,0,255,0.05) 0%, transparent 60%);
        }
        .lb-ey { font-family:var(--mono); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(191,0,255,0.6); margin-bottom:8px; }
        .lb-title { font-family:var(--mono); font-size:clamp(28px,5vw,52px); font-weight:bold; color:var(--text); letter-spacing:0.08em; }
        .looks-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--border); }
        .look-card {
          background:var(--surface); aspect-ratio:2/3;
          display:flex; flex-direction:column; justify-content:flex-end;
          padding:20px; position:relative; overflow:hidden; cursor:pointer;
          transition:all 0.2s;
        }
        .look-card:hover { background:var(--surface2); }
        .look-card::before {
          content:''; position:absolute; inset:0;
          background:
            radial-gradient(ellipse at 50% 30%, rgba(191,0,255,0.08) 0%, transparent 60%),
            linear-gradient(180deg, transparent 40%, rgba(3,5,10,0.8) 100%);
        }
        .look-bg {
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          font-family:var(--mono); font-size:80px; opacity:0.05; color:var(--accent2);
        }
        .look-content { position:relative; z-index:1; }
        .look-num { font-family:var(--mono); font-size:10px; letter-spacing:0.2em; color:rgba(191,0,255,0.6); margin-bottom:4px; }
        .look-name { font-family:var(--mono); font-size:16px; font-weight:bold; color:var(--text); margin-bottom:4px; }
        .look-sub { font-size:12px; color:var(--muted); margin-bottom:10px; }
        .look-tags { display:flex; gap:6px; flex-wrap:wrap; }
        .look-tag { font-family:var(--mono); font-size:8px; letter-spacing:0.1em; text-transform:uppercase; color:rgba(191,0,255,0.7); border:1px solid rgba(191,0,255,0.2); padding:2px 7px; }
        .lb-cta { padding:48px 0; text-align:center; border-top:1px solid var(--border); }
        .lb-cta-title { font-family:var(--mono); font-size:clamp(20px,3vw,32px); font-weight:bold; color:var(--text); margin-bottom:16px; }
        .lb-cta-title span { color:var(--accent); }
        .neon-btn { font-family:var(--mono); font-size:11px; letter-spacing:0.15em; text-transform:uppercase; padding:14px 28px; background:var(--accent); color:var(--bg); border:none; font-weight:bold; box-shadow:0 0 24px rgba(0,255,200,0.3); transition:all 0.15s; }
        .neon-btn:hover { box-shadow:0 0 40px rgba(0,255,200,0.6); }
        @media (max-width:768px) { .looks-grid { grid-template-columns:1fr 1fr; } }
        @media (max-width:480px) { .looks-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="lb-page">
        <div className="lb-hero">
          <div className="container">
            <div className="lb-ey">// SS2025</div>
            <div className="lb-title">LOOKBOOK</div>
          </div>
        </div>

        <div className="looks-grid">
          {looks.map(l => (
            <div className="look-card" key={l.num}>
              <div className="look-bg">{l.num}</div>
              <div className="look-content">
                <div className="look-num">LOOK {l.num}</div>
                <div className="look-name">{l.title}</div>
                <div className="look-sub">{l.sub}</div>
                <div className="look-tags">
                  {l.tags.map(t => <span className="look-tag" key={t}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lb-cta">
          <div className="container">
            <div className="lb-cta-title">
              Ready to wear <span>the future?</span>
            </div>
            <button className="neon-btn" onClick={() => onNav('shop')}>Shop the collection →</button>
          </div>
        </div>
      </div>
    </>
  )
}
