import { useState } from 'react'
import ProductCard from '../components/ProductCard'

export default function ShopPage({ products, loading, onAddToCart, cartLoading }) {
  const [filter, setFilter] = useState('All')

  const tags = ['All', ...new Set(products.flatMap(p => p.tags || []).filter(Boolean))]
  const filtered = filter === 'All' ? products : products.filter(p => p.tags?.includes(filter))

  return (
    <>
      <style>{`
        .shop-page { padding-top:80px; min-height:100vh; }
        .shop-hero {
          padding:48px 0 32px; border-bottom:1px solid var(--border);
          position:relative; overflow:hidden;
        }
        .shop-hero::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse at 0% 100%, rgba(0,255,200,0.05) 0%, transparent 60%);
        }
        .shop-eyebrow {
          font-family:var(--mono); font-size:9px; letter-spacing:0.22em;
          text-transform:uppercase; color:rgba(0,255,200,0.5); margin-bottom:8px;
        }
        .shop-title {
          font-family:var(--mono); font-size:clamp(28px,5vw,52px);
          font-weight:bold; color:var(--text); letter-spacing:0.08em;
          margin-bottom:4px; position:relative; z-index:1;
        }
        .shop-count { font-family:var(--mono); font-size:10px; color:var(--muted); }

        .filter-row {
          display:flex; gap:0; overflow-x:auto; padding:0;
          border-bottom:1px solid var(--border);
        }
        .filter-btn {
          font-family:var(--mono); font-size:10px; letter-spacing:0.1em;
          text-transform:uppercase; padding:14px 20px;
          background:none; border:none; border-right:1px solid var(--border);
          color:var(--muted); white-space:nowrap; transition:all 0.15s;
        }
        .filter-btn:hover { color:var(--accent); background:rgba(0,255,200,0.03); }
        .filter-btn.active { color:var(--accent); background:rgba(0,255,200,0.06); }

        .products-grid {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:1px; background:var(--border);
        }
        .products-grid > * { background:var(--bg); }
        .loading-state {
          padding:80px 0; text-align:center;
          font-family:var(--mono); font-size:11px;
          letter-spacing:0.18em; color:var(--muted);
        }
        .empty-state {
          padding:80px 0; text-align:center;
          font-family:var(--mono); font-size:11px;
          letter-spacing:0.12em; color:var(--muted);
        }

        @media (max-width:900px) { .products-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:480px) { .products-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="shop-page">
        <div className="shop-hero">
          <div className="container">
            <div className="shop-eyebrow">// Product catalog</div>
            <div className="shop-title">THE COLLECTION</div>
            <div className="shop-count">{filtered.length} items</div>
          </div>
        </div>

        {tags.length > 1 && (
          <div className="filter-row">
            {tags.slice(0, 10).map(t => (
              <button key={t} className={`filter-btn ${filter===t?'active':''}`} onClick={() => setFilter(t)}>
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="container" style={{padding:'1px 40px'}}>
          {loading ? (
            <div className="loading-state">LOADING COLLECTION...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">NO PRODUCTS IN THIS CATEGORY</div>
          ) : (
            <div className="products-grid">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} cartLoading={cartLoading}/>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
