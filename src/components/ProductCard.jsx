import { formatPrice } from '../lib/currency'
import { useState } from 'react'

export default function ProductCard({ product, onAddToCart, cartLoading, onViewDetail, isWishlisted, onToggleWishlist }) {
  const [selected, setSelected] = useState(product.variants.edges[0]?.node || null)
  const [added,    setAdded]    = useState(false)

  const price    = parseFloat(selected?.price?.amount || product.priceRange.minVariantPrice.amount).toFixed(2)
  const currency = selected?.price?.currencyCode || product.priceRange.minVariantPrice.currencyCode
  const image    = product.featuredImage?.url
  const variants = product.variants.edges.map(e => e.node)
  const wishlisted = isWishlisted?.(product.id) || false

  async function handleAdd(e) {
    e.stopPropagation()
    if (!selected?.availableForSale) return
    await onAddToCart(selected.id)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleWishlist(e) {
    e.stopPropagation()
    onToggleWishlist?.(product)
  }

  return (
    <>
      <style>{`
        .product-card {
          background: var(--surface);
          border: 1px solid var(--border);
          position: relative; overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .product-card:hover {
          border-color: rgba(0,255,200,0.4);
          box-shadow: 0 0 24px rgba(0,255,200,0.08);
        }
        .product-card::before {
          content: ''; position: absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .product-card:hover::before { opacity: 1; }
        .product-img {
          width:100%; aspect-ratio:3/4; background:var(--surface2);
          display:flex; align-items:center; justify-content:center;
          overflow:hidden; position:relative;
        }
        .product-img img { width:100%; height:100%; object-fit:cover; transition: transform 0.4s ease; }
        .product-card:hover .product-img img { transform: scale(1.04); }
        .product-img-placeholder { font-size:48px; opacity:0.1; font-family:var(--mono); }
        .product-tag {
          position:absolute; top:10px; left:10px;
          font-family:var(--mono); font-size:9px; letter-spacing:0.15em;
          text-transform:uppercase; color:var(--accent);
          background:rgba(0,255,200,0.08); border:1px solid rgba(0,255,200,0.2);
          padding:3px 8px;
        }
        .wishlist-btn {
          position:absolute; top:10px; right:10px;
          width:32px; height:32px; border-radius:50%;
          background:rgba(3,5,10,0.7); border:1px solid rgba(0,255,200,0.2);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:15px; transition:all 0.15s;
          color: var(--muted);
        }
        .wishlist-btn:hover { border-color:rgba(255,0,60,0.6); background:rgba(255,0,60,0.1); color:#ff003c; }
        .wishlist-btn.active { color:#ff003c; border-color:rgba(255,0,60,0.5); background:rgba(255,0,60,0.1); }
        .product-body { padding:14px; }
        .product-name { font-size:13px; color:var(--text); margin-bottom:4px; line-height:1.3; }
        .product-price { font-family:var(--mono); font-size:14px; color:var(--accent); font-weight:bold; margin-bottom:10px; }
        .variants { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px; }
        .variant-btn {
          font-family:var(--mono); font-size:9px; letter-spacing:0.1em;
          text-transform:uppercase; padding:3px 8px;
          border:1px solid rgba(0,255,200,0.2);
          background:transparent; color:var(--muted); transition:all 0.15s; cursor:pointer;
        }
        .variant-btn:hover { border-color:var(--accent); color:var(--accent); }
        .variant-btn.selected { border-color:var(--accent); color:var(--accent); background:rgba(0,255,200,0.08); }
        .add-btn {
          width:100%; padding:9px;
          background:transparent; border:1px solid var(--accent);
          color:var(--accent); font-family:var(--mono);
          font-size:10px; letter-spacing:0.15em; text-transform:uppercase;
          transition:all 0.15s; cursor:pointer;
        }
        .add-btn:hover { background:rgba(0,255,200,0.1); }
        .add-btn.added { background:rgba(0,255,200,0.15); }
        .add-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .view-link {
          display:block; text-align:center; padding:6px;
          font-family:var(--mono); font-size:9px; letter-spacing:0.12em;
          text-transform:uppercase; color:var(--muted); border:none;
          background:none; cursor:pointer; transition:color 0.15s; width:100%;
          margin-top:6px;
        }
        .view-link:hover { color:var(--accent); }
      `}</style>

      <div className="product-card" onClick={() => onViewDetail?.(product)}>
        <div className="product-img">
          {image
            ? <img src={image} alt={product.featuredImage?.altText || product.title}/>
            : <div className="product-img-placeholder">◈</div>
          }
          <div className="product-tag">{product.tags?.[0] || 'NEW'}</div>
          <button
            className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
            onClick={handleWishlist}
            title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}>
            {wishlisted ? '♥' : '♡'}
          </button>
        </div>

        <div className="product-body" onClick={e => e.stopPropagation()}>
          <div className="product-name">{product.title}</div>
          <div className="product-price">{formatPrice(price, currency)}</div>

          {variants.length > 1 && (
            <div className="variants">
              {variants.map(v => (
                <button key={v.id}
                  className={`variant-btn ${selected?.id === v.id ? 'selected' : ''}`}
                  onClick={() => setSelected(v)}
                  disabled={!v.availableForSale}>
                  {v.title}
                </button>
              ))}
            </div>
          )}

          <button
            className={`add-btn ${added ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={cartLoading || !selected?.availableForSale}>
            {added ? '✓ Added' : cartLoading ? 'Adding...' : !selected?.availableForSale ? 'Sold out' : 'Add to cart'}
          </button>
          <button className="view-link" onClick={() => onViewDetail?.(product)}>View details →</button>
        </div>
      </div>
    </>
  )
}
