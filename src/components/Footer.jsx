export default function Footer({ onNav }) {
  return (
    <>
      <style>{`
        .footer { border-top:1px solid var(--border); background:var(--surface); }
        .footer-top {
          display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px;
          padding:48px 0; border-bottom:1px solid var(--border);
        }
        .footer-brand { }
        .footer-logo {
          font-family:var(--mono); font-size:24px; font-weight:bold;
          letter-spacing:0.3em; color:var(--accent);
          text-shadow:0 0 16px rgba(0,255,200,0.3);
          margin-bottom:12px; cursor:pointer; display:block;
        }
        .footer-tagline { font-size:13px; color:var(--muted); line-height:1.6; margin-bottom:16px; }
        .footer-col-title {
          font-family:var(--mono); font-size:9px; letter-spacing:0.2em;
          text-transform:uppercase; color:rgba(0,255,200,0.4); margin-bottom:14px;
        }
        .footer-links { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .footer-links button {
          font-size:13px; color:var(--muted); background:none; border:none;
          text-align:left; padding:0; cursor:pointer; transition:color 0.15s;
        }
        .footer-links button:hover { color:var(--accent); }
        .footer-bottom {
          display:flex; align-items:center; justify-content:space-between;
          padding:20px 0; flex-wrap:wrap; gap:12px;
        }
        .footer-copy { font-family:var(--mono); font-size:9px; letter-spacing:0.1em; color:var(--muted); }
        .footer-legal { display:flex; gap:20px; }
        .footer-legal a { font-family:var(--mono); font-size:9px; letter-spacing:0.1em; color:var(--muted); transition:color 0.15s; }
        .footer-legal a:hover { color:var(--accent); }
        @media (max-width:768px) {
          .footer-top { grid-template-columns:1fr 1fr; gap:28px; }
          .footer-brand { grid-column:1/-1; }
        }
      `}</style>

      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="footer-logo" onClick={() => onNav('home')}>NEON</span>
              <p className="footer-tagline">
                Future fashion for the next era.<br/>
                Experimental. Limited. Built to last.
              </p>
            </div>
            <div>
              <div className="footer-col-title">// Shop</div>
              <ul className="footer-links">
                <li><button onClick={() => onNav('shop')}>All products</button></li>
                <li><button onClick={() => onNav('lookbook')}>Lookbook</button></li>
                <li><button onClick={() => onNav('about')}>About</button></li>
                <li><button onClick={() => onNav('music')}>♫ Music</button></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">// Play</div>
              <ul className="footer-links">
                <li><button onClick={() => onNav('arcade')}>Arcade</button></li>
                <li><button onClick={() => onNav('arcade')}>Leaderboard</button></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">// Connect</div>
              <ul className="footer-links">
                <li><button>Instagram</button></li>
                <li><button>Twitter / X</button></li>
                <li><button>Newsletter</button></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2025 NEON FASHION — ALL RIGHTS RESERVED</div>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
