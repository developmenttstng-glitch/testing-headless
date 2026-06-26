import { useEffect, useRef, useState } from 'react'
import ProductCard from '../components/ProductCard'

export default function HomePage({ products, loading, onAddToCart, cartLoading, onNav }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 80)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`
        /* HERO */
        .hero {
          min-height:100vh; display:flex; flex-direction:column;
          justify-content:flex-end; padding:0 0 60px;
          position:relative; overflow:hidden;
        }
        .hero-bg {
          position:absolute; inset:0;
          background:
            radial-gradient(ellipse at 20% 60%, rgba(0,255,200,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(191,0,255,0.06) 0%, transparent 50%);
        }
        .hero-grid {
          position:absolute; inset:0;
          background-image:
            linear-gradient(rgba(0,255,200,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,200,0.04) 1px, transparent 1px);
          background-size:40px 40px;
        }
        .hero-scan {
          position:absolute; left:0; right:0; height:2px;
          background:linear-gradient(90deg,transparent,rgba(0,255,200,0.3),transparent);
          animation:scan 4s linear infinite;
        }
        .hero-content { position:relative; z-index:2; }
        .hero-eyebrow {
          font-family:var(--mono); font-size:10px; letter-spacing:0.25em;
          text-transform:uppercase; color:rgba(0,255,200,0.6);
          margin-bottom:16px; display:flex; align-items:center; gap:10px;
        }
        .hero-eyebrow::before {
          content:''; width:32px; height:1px; background:var(--accent);
          box-shadow:0 0 6px var(--accent); display:block;
        }
        .hero-h1 {
          font-family:var(--mono); font-size:clamp(48px,10vw,120px);
          font-weight:bold; line-height:0.9; letter-spacing:0.05em;
          color:var(--text); margin-bottom:20px;
        }
        .hero-h1 .accent { color:var(--accent); text-shadow:0 0 40px rgba(0,255,200,0.4); }
        .hero-h1 .accent2 { color:var(--accent2); text-shadow:0 0 40px rgba(191,0,255,0.4); }
        .hero-sub {
          font-size:15px; color:var(--muted); max-width:460px;
          line-height:1.7; margin-bottom:32px;
        }
        .hero-actions { display:flex; gap:12px; flex-wrap:wrap; }
        .btn-primary {
          font-family:var(--mono); font-size:11px; letter-spacing:0.15em;
          text-transform:uppercase; padding:14px 28px;
          background:var(--accent); color:var(--bg);
          border:none; font-weight:bold;
          box-shadow:0 0 24px rgba(0,255,200,0.3); transition:all 0.15s;
        }
        .btn-primary:hover { box-shadow:0 0 40px rgba(0,255,200,0.6); }
        .btn-ghost {
          font-family:var(--mono); font-size:11px; letter-spacing:0.15em;
          text-transform:uppercase; padding:14px 28px;
          background:transparent; color:var(--accent);
          border:1px solid rgba(0,255,200,0.4); transition:all 0.15s;
        }
        .btn-ghost:hover { background:rgba(0,255,200,0.06); border-color:var(--accent); }

        /* STATS */
        .stats-strip {
          border-top:1px solid var(--border); border-bottom:1px solid var(--border);
          display:grid; grid-template-columns:repeat(4,1fr);
        }
        .stat-cell {
          padding:28px 0; text-align:center;
          border-right:1px solid var(--border);
        }
        .stat-cell:last-child { border-right:none; }
        .stat-num {
          font-family:var(--mono); font-size:32px; font-weight:bold;
          color:var(--accent); text-shadow:0 0 16px rgba(0,255,200,0.3);
          display:block; margin-bottom:4px;
        }
        .stat-lbl {
          font-family:var(--mono); font-size:9px; letter-spacing:0.18em;
          text-transform:uppercase; color:var(--muted);
        }

        /* PRODUCTS */
        .products-section { padding:60px 0; border-bottom:1px solid var(--border); }
        .section-header {
          display:flex; align-items:flex-end; justify-content:space-between;
          margin-bottom:32px; flex-wrap:wrap; gap:16px;
        }
        .section-title {
          font-family:var(--mono); font-size:clamp(20px,3vw,28px);
          font-weight:bold; letter-spacing:0.08em; color:var(--text);
        }
        .section-title .dim { color:var(--muted); }
        .products-grid {
          display:grid; grid-template-columns:repeat(4,1fr); gap:1px;
          background:var(--border);
        }
        .products-grid > * { background:var(--bg); }

        /* ARCADE PROMO */
        .arcade-promo {
          padding:60px 0; border-bottom:1px solid var(--border);
          background:linear-gradient(180deg,transparent,rgba(0,255,200,0.02));
        }
        .arcade-promo-inner {
          display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center;
        }
        .promo-title {
          font-family:var(--mono); font-size:clamp(28px,4vw,48px);
          font-weight:bold; letter-spacing:0.1em; color:var(--text);
          margin-bottom:16px; line-height:1;
        }
        .promo-title span { color:var(--accent2); text-shadow:0 0 20px rgba(191,0,255,0.4); }
        .promo-desc { font-size:14px; color:var(--muted); line-height:1.7; margin-bottom:24px; }
        .promo-games { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
        .promo-game-tag {
          font-family:var(--mono); font-size:9px; letter-spacing:0.12em;
          text-transform:uppercase; color:var(--accent2);
          border:1px solid rgba(191,0,255,0.25); padding:4px 10px;
        }
        .promo-visual {
          background:var(--surface);
          border:1px solid var(--border);
          height:260px;
          display:flex; align-items:center; justify-content:center;
          position:relative; overflow:hidden;
        }
        .promo-visual-grid {
          position:absolute; inset:0;
          background-image:
            linear-gradient(rgba(191,0,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(191,0,255,0.05) 1px, transparent 1px);
          background-size:24px 24px;
        }
        .promo-icon {
          font-family:var(--mono); font-size:72px;
          color:var(--accent2); opacity:0.3;
          text-shadow:0 0 40px rgba(191,0,255,0.5);
          position:relative; z-index:1;
          animation:float 3s ease-in-out infinite;
        }

        /* TICKER */
        .ticker {
          overflow:hidden; border-bottom:1px solid var(--border);
          padding:12px 0; background:var(--surface);
        }
        .ticker-inner { display:flex; animation:ticker 20s linear infinite; width:max-content; }
        .ticker-item {
          font-family:var(--mono); font-size:10px; letter-spacing:0.18em;
          text-transform:uppercase; color:var(--muted); padding:0 24px;
          white-space:nowrap;
        }
        .ticker-sep { color:var(--accent); margin:0 4px; }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        @media (max-width:900px) {
          .products-grid { grid-template-columns:repeat(2,1fr); }
          .arcade-promo-inner { grid-template-columns:1fr; }
          .stats-strip { grid-template-columns:repeat(2,1fr); }
          .stat-cell:nth-child(2) { border-right:none; }
          .stat-cell:nth-child(3) { border-top:1px solid var(--border); }
        }
        @media (max-width:600px) {
          .products-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"/>
        <div className="hero-grid"/>
        <div className="hero-scan"/>
        <div className="container hero-content">
          <div className="hero-eyebrow">
            SS2025 — Future Fashion Collection
          </div>
          <h1 className="hero-h1">
            <span className="accent">WEAR</span><br/>
            <span className="accent2">THE</span><br/>
            FUTURE
          </h1>
          <p className="hero-sub">
            Fashion engineered for the next era. Precision construction,
            experimental materials, and designs that live between dimensions.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onNav('shop')}>Shop collection →</button>
            <button className="btn-ghost" onClick={() => onNav('arcade')}>Play arcade</button>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          {['Future Fashion','SS2025 Collection','Free shipping over $150',
            'New arrivals weekly','Play arcade games','Future Fashion',
            'SS2025 Collection','Free shipping over $150','New arrivals weekly','Play arcade games'
          ].map((t,i) => (
            <span className="ticker-item" key={i}>
              {t}<span className="ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-strip">
        {[
          { num:'247+', lbl:'Products' },
          { num:'12K',  lbl:'Customers' },
          { num:'5',    lbl:'Arcade games' },
          { num:'∞',    lbl:'Possibilities' },
        ].map((s,i) => (
          <div className="stat-cell" key={i}>
            <span className="stat-num">{s.num}</span>
            <span className="stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* PRODUCTS */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title">
              <span className="dim">// </span>Featured collection
            </div>
            <button className="btn-ghost" style={{padding:'8px 18px',fontSize:'10px'}} onClick={() => onNav('shop')}>
              View all →
            </button>
          </div>
          {loading ? (
            <div style={{fontFamily:'var(--mono)',fontSize:'11px',color:'var(--muted)',
              letterSpacing:'0.15em',padding:'40px 0',textAlign:'center'}}>
              LOADING COLLECTION...
            </div>
          ) : (
            <div className="products-grid">
              {products.slice(0,4).map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} cartLoading={cartLoading}/>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ARCADE PROMO */}
      <section className="arcade-promo">
        <div className="container">
          <div className="arcade-promo-inner">
            <div>
              <div className="promo-title">
                PLAY<br/><span>ARCADE</span><br/>WHILE YOU SHOP
              </div>
              <p className="promo-desc">
                Five fully playable games built into your shopping experience.
                Take a break between browsing, compete for the top spot on the leaderboard,
                and come back whenever you want.
              </p>
              <div className="promo-games">
                {['TETRIS','SNAKE','INVADERS','FLAPPY NEON','BREAKOUT'].map(g => (
                  <span className="promo-game-tag" key={g}>{g}</span>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => onNav('arcade')}>
                Open arcade →
              </button>
            </div>
            <div className="promo-visual">
              <div className="promo-visual-grid"/>
              <div className="promo-icon">▦</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
