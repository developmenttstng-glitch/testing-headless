import { useState, useEffect } from 'react'

const links = [
  { label: 'Home',     page: 'home' },
  { label: 'Shop',     page: 'shop' },
  { label: 'Lookbook', page: 'lookbook' },
  { label: 'Arcade',   page: 'arcade' },
  { label: 'Music',    page: 'music' },
  { label: 'About',    page: 'about' },
]

export default function Navbar({ page, onNav, totalItems, onCartOpen }) {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  function go(p) { onNav(p); setMenuOpen(false); window.scrollTo({ top: 0 }) }

  return (
    <>
      <style>{`
        .nav {
          position: fixed; top:0; left:0; right:0; z-index:200;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem;
          background: ${scrolled ? 'rgba(3,5,10,0.96)' : 'transparent'};
          border-bottom: ${scrolled ? '1px solid rgba(0,255,200,0.1)' : 'none'};
          transition: background 0.3s, border 0.3s;
        }
        .nav-logo {
          font-family: var(--mono);
          font-size: 20px; font-weight: bold;
          letter-spacing: 0.3em; color: var(--accent);
          cursor: pointer;
          text-shadow: 0 0 20px rgba(0,255,200,0.5);
        }
        .nav-links { display:flex; gap:0; list-style:none; }
        .nav-btn {
          font-size:12px; letter-spacing:0.12em; text-transform:uppercase;
          background:none; border:none; color:var(--muted); padding:6px 12px;
          transition:color 0.15s; position:relative; cursor:pointer;
        }
        .nav-btn:hover, .nav-btn.active { color:var(--accent); }
        .nav-btn.active::after {
          content:''; position:absolute; bottom:-2px; left:12px; right:12px;
          height:1px; background:var(--accent);
          box-shadow:0 0 6px var(--accent);
        }
        .nav-btn.music-btn { color: #bf00ff; }
        .nav-btn.music-btn:hover, .nav-btn.music-btn.active { color: #bf00ff; }
        .nav-btn.music-btn.active::after { background: #bf00ff; box-shadow: 0 0 6px #bf00ff; }
        .nav-right { display:flex; align-items:center; gap:12px; }
        .cart-btn {
          font-family:var(--mono); font-size:11px; letter-spacing:0.12em;
          text-transform:uppercase; background:none;
          border:1px solid rgba(0,255,200,0.3); color:var(--accent);
          padding:7px 16px; transition:all 0.15s; cursor:pointer;
        }
        .cart-btn:hover { background:rgba(0,255,200,0.08); border-color:var(--accent); }
        .cart-badge {
          display:inline-flex; align-items:center; justify-content:center;
          width:18px; height:18px; background:var(--accent); color:var(--bg);
          font-size:10px; font-weight:700; border-radius:50%; margin-left:6px;
        }
        .hamburger {
          display:none; flex-direction:column; gap:5px;
          background:none; border:none; padding:4px; cursor:pointer;
        }
        .hamburger span {
          display:block; width:22px; height:1.5px;
          background:var(--accent); transition:all 0.2s;
        }
        .hamburger.open span:nth-child(1) { transform:rotate(45deg) translate(4.5px,4.5px); }
        .hamburger.open span:nth-child(2) { opacity:0; }
        .hamburger.open span:nth-child(3) { transform:rotate(-45deg) translate(4.5px,-4.5px); }
        .mobile-menu {
          display:none; position:fixed;
          top:60px; left:0; right:0; bottom:0;
          background:rgba(3,5,10,0.98);
          border-top:1px solid rgba(0,255,200,0.1);
          flex-direction:column; padding:2rem;
          z-index:199;
        }
        .mobile-menu.open { display:flex; }
        .mobile-link {
          font-family:var(--mono); font-size:28px; font-weight:bold;
          letter-spacing:0.15em; text-transform:uppercase;
          background:none; border:none; color:var(--text);
          padding:14px 0; border-bottom:1px solid rgba(0,255,200,0.08);
          text-align:left; transition:color 0.15s; cursor:pointer;
        }
        .mobile-link:hover, .mobile-link.active { color:var(--accent); }
        .mobile-link.music { color:#bf00ff; }
        .mobile-cart {
          margin-top:24px;
          font-family:var(--mono); font-size:13px; letter-spacing:0.15em;
          text-transform:uppercase; background:var(--accent); color:var(--bg);
          border:none; padding:14px; font-weight:bold; cursor:pointer;
        }
        @media (max-width:960px) {
          .nav-links { display:none; }
          .hamburger { display:flex; }
        }
      `}</style>

      <nav className="nav">
        <div className="nav-logo" onClick={() => go('home')}>NEON</div>
        <ul className="nav-links">
          {links.map(l => (
            <li key={l.page}>
              <button
                className={`nav-btn ${l.page==='music'?'music-btn':''} ${page===l.page?'active':''}`}
                onClick={() => go(l.page)}>
                {l.page === 'music' ? '♫ ' : ''}{l.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <button className="cart-btn" onClick={onCartOpen}>
            Cart{totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu">
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {links.map(l => (
          <button
            key={l.page}
            className={`mobile-link ${l.page==='music'?'music':''} ${page===l.page?'active':''}`}
            onClick={() => go(l.page)}>
            {l.page === 'music' ? '♫ ' : ''}{l.label}
          </button>
        ))}
        <button className="mobile-cart" onClick={() => { onCartOpen(); setMenuOpen(false) }}>
          Cart {totalItems > 0 ? `(${totalItems})` : ''}
        </button>
      </div>
    </>
  )
}
