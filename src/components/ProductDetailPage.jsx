import { formatPrice } from '../lib/currency'
import { useState } from 'react'

export default function ProductDetailPage({ product, onAddToCart, cartLoading, onClose, isWishlisted, onToggleWishlist }) {
  const variants  = product.variants.edges.map(e => e.node)
  const images    = product.images.edges.map(e => e.node)
  const [selected,  setSelected]  = useState(variants[0] || null)
  const [imgIdx,    setImgIdx]    = useState(0)
  const [added,     setAdded]     = useState(false)
  const [qty,       setQty]       = useState(1)

  const price    = parseFloat(selected?.price?.amount || product.priceRange.minVariantPrice.amount).toFixed(2)
  const currency = selected?.price?.currencyCode || product.priceRange.minVariantPrice.currencyCode
  const wishlisted = isWishlisted?.(product.id)
  const mainImage  = images[imgIdx]?.url || product.featuredImage?.url

  async function handleAdd() {
    if (!selected?.availableForSale) return
    for (let i = 0; i < qty; i++) await onAddToCart(selected.id)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <>
      <style>{`
        .pdp-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85);
          z-index: 400; display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: pdpFadeIn 0.2s ease;
        }
        @keyframes pdpFadeIn { from{opacity:0} to{opacity:1} }
        .pdp-modal {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          width: 100%; max-width: 860px;
          max-height: 90vh; overflow-y: auto;
          display: grid; grid-template-columns: 1fr 1fr;
          animation: pdpSlideUp 0.25s ease;
          position: relative;
        }
        @keyframes pdpSlideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .pdp-close {
          position: absolute; top: 14px; right: 14px; z-index: 2;
          background: rgba(3,5,10,0.8); border: 1px solid var(--border);
          color: var(--muted); font-size: 20px; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; border-radius: 2px;
        }
        .pdp-close:hover { color: var(--text); border-color: var(--accent); }
        .pdp-images { border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .pdp-main-img {
          width: 100%; aspect-ratio: 1/1; background: var(--surface);
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pdp-main-img img { width: 100%; height: 100%; object-fit: cover; }
        .pdp-main-placeholder { font-size: 64px; opacity: 0.1; font-family: var(--mono); }
        .pdp-thumbs { display: flex; gap: 6px; padding: 10px; flex-wrap: wrap; }
        .pdp-thumb {
          width: 56px; height: 56px; background: var(--surface); overflow: hidden;
          border: 1px solid var(--border); cursor: pointer; flex-shrink: 0;
          transition: border-color 0.15s;
        }
        .pdp-thumb.active { border-color: var(--accent); }
        .pdp-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .pdp-info { padding: 28px 24px; display: flex; flex-direction: column; gap: 16px; }
        .pdp-eyebrow {
          font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(0,255,200,0.5);
        }
        .pdp-title { font-size: 22px; color: var(--text); font-weight: 600; line-height: 1.2; }
        .pdp-price { font-family: var(--mono); font-size: 24px; color: var(--accent); font-weight: bold; }
        .pdp-desc { font-size: 13px; color: var(--muted); line-height: 1.7; }
        .pdp-label {
          font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(0,255,200,0.4); margin-bottom: 8px;
        }
        .pdp-variants { display: flex; flex-wrap: wrap; gap: 6px; }
        .pdp-variant {
          font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
          text-transform: uppercase; padding: 6px 12px;
          border: 1px solid rgba(0,255,200,0.2); background: transparent;
          color: var(--muted); cursor: pointer; transition: all 0.15s;
        }
        .pdp-variant:hover { border-color: var(--accent); color: var(--accent); }
        .pdp-variant.selected { border-color: var(--accent); color: var(--accent); background: rgba(0,255,200,0.08); }
        .pdp-variant:disabled { opacity: 0.3; cursor: not-allowed; }
        .pdp-qty-row { display: flex; align-items: center; gap: 12px; }
        .pdp-qty-btn {
          width: 32px; height: 32px; background: var(--surface);
          border: 1px solid var(--border); color: var(--text);
          font-size: 16px; cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .pdp-qty-btn:hover { border-color: var(--accent); color: var(--accent); }
        .pdp-qty-num { font-family: var(--mono); font-size: 16px; color: var(--text); min-width: 24px; text-align: center; }
        .pdp-actions { display: flex; gap: 8px; flex-direction: column; }
        .pdp-add {
          width: 100%; padding: 14px; background: var(--accent); color: var(--bg);
          border: none; font-family: var(--mono); font-size: 11px;
          letter-spacing: 0.18em; text-transform: uppercase; font-weight: bold;
          cursor: pointer; transition: all 0.15s;
          box-shadow: 0 0 20px rgba(0,255,200,0.25);
        }
        .pdp-add:hover { box-shadow: 0 0 32px rgba(0,255,200,0.5); }
        .pdp-add:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
        .pdp-add.added { background: rgba(0,255,200,0.7); }
        .pdp-wish {
          width: 100%; padding: 12px; background: transparent;
          border: 1px solid rgba(255,0,60,0.3); color: rgba(255,0,60,0.7);
          font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em;
          text-transform: uppercase; cursor: pointer; transition: all 0.15s;
        }
        .pdp-wish:hover, .pdp-wish.active {
          background: rgba(255,0,60,0.08); border-color: #ff003c; color: #ff003c;
        }
        .pdp-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .pdp-tag {
          font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(0,255,200,0.5);
          border: 1px solid rgba(0,255,200,0.15); padding: 3px 8px;
        }
        @media (max-width: 720px) {
          .pdp-modal { grid-template-columns: 1fr; }
          .pdp-images { border-right: none; border-bottom: 1px solid var(--border); }
        }
      `}</style>

      <div className="pdp-overlay" onClick={onClose}>
        <div className="pdp-modal" onClick={e => e.stopPropagation()}>
          <button className="pdp-close" onClick={onClose}>×</button>

          {/* Images */}
          <div className="pdp-images">
            <div className="pdp-main-img">
              {mainImage
                ? <img src={mainImage} alt={product.title}/>
                : <div className="pdp-main-placeholder">◈</div>
              }
            </div>
            {images.length > 1 && (
              <div className="pdp-thumbs">
                {images.map((img, i) => (
                  <div key={i}
                    className={`pdp-thumb ${i === imgIdx ? 'active' : ''}`}
                    onClick={() => setImgIdx(i)}>
                    <img src={img.url} alt={img.altText || `View ${i+1}`}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pdp-info">
            <div>
              <div className="pdp-eyebrow">{product.tags?.[0] || 'NEON COLLECTION'}</div>
              <div className="pdp-title">{product.title}</div>
            </div>

            <div className="pdp-price">{formatPrice(price, currency)}</div>

            {product.description && (
              <div className="pdp-desc">{product.description}</div>
            )}

            {/* Variants */}
            {variants.length > 1 && (
              <div>
                <div className="pdp-label">// Select variant</div>
                <div className="pdp-variants">
                  {variants.map(v => (
                    <button key={v.id}
                      className={`pdp-variant ${selected?.id === v.id ? 'selected' : ''}`}
                      onClick={() => setSelected(v)}
                      disabled={!v.availableForSale}>
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <div className="pdp-label">// Quantity</div>
              <div className="pdp-qty-row">
                <button className="pdp-qty-btn" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                <span className="pdp-qty-num">{qty}</span>
                <button className="pdp-qty-btn" onClick={() => setQty(q => Math.min(10, q+1))}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="pdp-actions">
              <button
                className={`pdp-add ${added ? 'added' : ''}`}
                onClick={handleAdd}
                disabled={cartLoading || !selected?.availableForSale}>
                {added ? `✓ Added ${qty > 1 ? `×${qty}` : ''} to cart` : cartLoading ? 'Adding...' : !selected?.availableForSale ? 'Sold out' : 'Add to cart'}
              </button>
              <button
                className={`pdp-wish ${wishlisted ? 'active' : ''}`}
                onClick={() => onToggleWishlist?.(product)}>
                {wishlisted ? '♥ Saved to wishlist' : '♡ Save to wishlist'}
              </button>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div>
                <div className="pdp-label">// Tags</div>
                <div className="pdp-tags">
                  {product.tags.map(t => (
                    <span className="pdp-tag" key={t}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
