import ProductCard from '../components/ProductCard'

export default function WishlistPage({ items, onAddToCart, cartLoading, onViewDetail, onToggleWishlist, isWishlisted, onNav }) {
  return (
    <>
      <style>{`
        .wl-page { padding-top: 80px; min-height: 100vh; }
        .wl-hero {
          padding: 48px 0 32px; border-bottom: 1px solid var(--border);
          background: radial-gradient(ellipse at 0% 100%, rgba(255,0,60,0.04) 0%, transparent 60%);
        }
        .wl-ey { font-family:var(--mono); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(255,0,60,0.5); margin-bottom:8px; }
        .wl-title { font-family:var(--mono); font-size:clamp(28px,5vw,52px); font-weight:bold; color:var(--text); letter-spacing:0.08em; }
        .wl-count { font-family:var(--mono); font-size:10px; color:var(--muted); margin-top:4px; }
        .wl-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); }
        .wl-grid > * { background:var(--bg); }
        .wl-empty {
          padding: 80px 0; text-align: center;
        }
        .wl-empty-icon { font-size:48px; opacity:0.15; margin-bottom:16px; }
        .wl-empty-title { font-family:var(--mono); font-size:14px; letter-spacing:0.12em; color:var(--muted); margin-bottom:20px; }
        .wl-empty-btn {
          font-family:var(--mono); font-size:11px; letter-spacing:0.15em;
          text-transform:uppercase; padding:12px 24px;
          background:var(--accent); color:var(--bg); border:none;
          cursor:pointer; font-weight:bold;
          box-shadow:0 0 20px rgba(0,255,200,0.2);
        }
        @media (max-width:900px) { .wl-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:480px) { .wl-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="wl-page">
        <div className="wl-hero">
          <div className="container">
            <div className="wl-ey">// Saved items</div>
            <div className="wl-title">Wishlist</div>
            <div className="wl-count">{items.length} item{items.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="container" style={{padding:'1px 40px'}}>
          {items.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon">♡</div>
              <div className="wl-empty-title">Your wishlist is empty</div>
              <button className="wl-empty-btn" onClick={() => onNav('shop')}>
                Browse the collection →
              </button>
            </div>
          ) : (
            <div className="wl-grid">
              {items.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  cartLoading={cartLoading}
                  onViewDetail={onViewDetail}
                  isWishlisted={isWishlisted}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
