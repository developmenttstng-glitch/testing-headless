import { useState, useMemo } from 'react'
import ProductCard from '../components/ProductCard'
import ProductDetailPage from '../components/ProductDetailPage'

export default function ShopPage({ products, loading, onAddToCart, cartLoading,
  isWishlisted, onToggleWishlist, recentlyViewed, onViewDetail }) {
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('All')
  const [sort,      setSort]      = useState('default')
  const [detailProd,setDetailProd] = useState(null)

  const tags = useMemo(() =>
    ['All', ...new Set(products.flatMap(p => p.tags || []).filter(Boolean))],
    [products]
  )

  const filtered = useMemo(() => {
    let list = products
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    if (filter !== 'All') list = list.filter(p => p.tags?.includes(filter))
    if (sort === 'price-asc')  list = [...list].sort((a,b) => parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount))
    if (sort === 'price-desc') list = [...list].sort((a,b) => parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount))
    if (sort === 'name')       list = [...list].sort((a,b) => a.title.localeCompare(b.title))
    return list
  }, [products, search, filter, sort])

  function handleViewDetail(product) {
    onViewDetail?.(product)
    setDetailProd(product)
  }

  return (
    <>
      <style>{`
        .shop-page { padding-top: 80px; min-height: 100vh; }
        .shop-hero {
          padding: 40px 0 28px; border-bottom: 1px solid var(--border);
          background: radial-gradient(ellipse at 0% 100%, rgba(0,255,200,0.04) 0%, transparent 60%);
        }
        .shop-ey { font-family:var(--mono); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(0,255,200,0.5); margin-bottom:8px; }
        .shop-title { font-family:var(--mono); font-size:clamp(28px,5vw,52px); font-weight:bold; color:var(--text); letter-spacing:0.08em; }
        .shop-count { font-family:var(--mono); font-size:10px; color:var(--muted); margin-top:4px; }

        .shop-toolbar {
          display: flex; align-items: center; gap: 10px; padding: 14px 40px;
          border-bottom: 1px solid var(--border); flex-wrap: wrap;
          background: var(--surface);
        }
        .search-wrap { position:relative; flex:1; min-width:180px; }
        .search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:14px; pointer-events:none; }
        .search-input {
          width:100%; background:var(--surface2); border:1px solid var(--border);
          color:var(--text); font-family:var(--mono); font-size:11px;
          padding:8px 10px 8px 30px; outline:none; transition:border-color 0.15s;
        }
        .search-input:focus { border-color:var(--accent); }
        .search-input::placeholder { color:var(--muted); }
        .sort-select {
          background:var(--surface2); border:1px solid var(--border); color:var(--text);
          font-family:var(--mono); font-size:10px; padding:8px 10px;
          outline:none; cursor:pointer; letter-spacing:0.05em;
        }

        .shop-layout { display:grid; grid-template-columns:200px 1fr; }
        .filter-sidebar {
          border-right: 1px solid var(--border);
          padding: 20px 16px;
          min-height: 60vh;
        }
        .filter-lbl {
          font-family:var(--mono); font-size:8px; letter-spacing:0.2em;
          text-transform:uppercase; color:rgba(0,255,200,0.35); margin-bottom:10px;
        }
        .filter-list { display:flex; flex-direction:column; gap:2px; }
        .filter-item {
          font-family:var(--mono); font-size:11px; padding:6px 10px;
          background:none; border:none; color:var(--muted); cursor:pointer;
          text-align:left; transition:all 0.12s; border-radius:2px;
          letter-spacing:0.06em;
        }
        .filter-item:hover { color:var(--accent); background:rgba(0,255,200,0.04); }
        .filter-item.active { color:var(--accent); background:rgba(0,255,200,0.08); }

        .products-area { }
        .products-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--border); }
        .products-grid > * { background:var(--bg); }

        .no-results {
          padding:60px 40px; text-align:center;
          font-family:var(--mono); font-size:11px; color:var(--muted); letter-spacing:0.12em;
        }
        .loading-state { padding:60px 40px; text-align:center; font-family:var(--mono); font-size:11px; color:var(--muted); letter-spacing:0.15em; }

        .recently-viewed { padding:40px 0; border-top:1px solid var(--border); }
        .rv-title {
          font-family:var(--mono); font-size:9px; letter-spacing:0.2em;
          text-transform:uppercase; color:rgba(0,255,200,0.35); margin-bottom:16px; padding:0 40px;
        }
        .rv-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); }
        .rv-grid > * { background:var(--bg); }

        @media (max-width:900px) {
          .shop-layout { grid-template-columns:1fr; }
          .filter-sidebar { display:none; }
          .products-grid { grid-template-columns:repeat(2,1fr); }
          .rv-grid { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      <div className="shop-page">
        <div className="shop-hero">
          <div className="container">
            <div className="shop-ey">// Product catalog</div>
            <div className="shop-title">THE COLLECTION</div>
            <div className="shop-count">{filtered.length} items</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="shop-toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>

        <div className="shop-layout">
          {/* Filter sidebar */}
          <div className="filter-sidebar">
            <div className="filter-lbl">// Category</div>
            <div className="filter-list">
              {tags.map(t => (
                <button
                  key={t}
                  className={`filter-item ${filter === t ? 'active' : ''}`}
                  onClick={() => setFilter(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="products-area">
            {loading ? (
              <div className="loading-state">LOADING COLLECTION...</div>
            ) : filtered.length === 0 ? (
              <div className="no-results">
                {search ? `No results for "${search}"` : 'NO PRODUCTS IN THIS CATEGORY'}
              </div>
            ) : (
              <div className="products-grid">
                {filtered.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={onAddToCart}
                    cartLoading={cartLoading}
                    onViewDetail={handleViewDetail}
                    isWishlisted={isWishlisted}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recently viewed */}
        {recentlyViewed?.length > 0 && (
          <div className="recently-viewed">
            <div className="rv-title">// Recently viewed</div>
            <div className="rv-grid">
              {recentlyViewed.slice(0,4).map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  cartLoading={cartLoading}
                  onViewDetail={handleViewDetail}
                  isWishlisted={isWishlisted}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {detailProd && (
        <ProductDetailPage
          product={detailProd}
          onAddToCart={onAddToCart}
          cartLoading={cartLoading}
          onClose={() => setDetailProd(null)}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      )}
    </>
  )
}
