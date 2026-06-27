// v-final — simple Shopify account links, no OAuth
import { useState, useEffect } from 'react'
import Navbar            from './components/Navbar'
import Footer            from './components/Footer'
import CartDrawer        from './components/CartDrawer'
import MiniPlayer        from './components/MiniPlayer'
import ProductDetailPage from './components/ProductDetailPage'
import HomePage          from './pages/HomePage'
import ShopPage          from './pages/ShopPage'
import LookbookPage      from './pages/LookbookPage'
import ArcadePage        from './pages/ArcadePage'
import AboutPage         from './pages/AboutPage'
import MusicPage         from './pages/MusicPage'
import WishlistPage      from './pages/WishlistPage'
import AlarmPage         from './pages/AlarmPage'
import { useProducts }   from './hooks/useProducts'
import { useCart }       from './hooks/useCart'
import { useWishlist }   from './hooks/useWishlist'
import { useRecentlyViewed } from './hooks/useRecentlyViewed'
import { useCustomer }   from './hooks/useCustomer'

export default function App() {
  const [page,       setPage]       = useState('home')
  const [cartOpen,   setCartOpen]   = useState(false)
  const [detailProd, setDetailProd] = useState(null)
  const [musicOn,    setMusicOn]    = useState(false)

  const { products, loading } = useProducts(12)
  const { lines, totalItems, totalPrice, currency,
          loading: cartLoading, addToCart, goToCheckout } = useCart()
  const { items: wishlist, toggle: toggleWishlist,
          isWishlisted, count: wishCount } = useWishlist()
  const { items: recentlyViewed, add: addRecentlyViewed } = useRecentlyViewed()
  const { login, goToAccount } = useCustomer()

  useEffect(() => { window.scrollTo({ top: 0 }) }, [page])

  function navigate(p) { setPage(p); setCartOpen(false) }

  function handleNav(p) {
    if (p === 'music') setMusicOn(true)
    navigate(p)
  }

  function handleViewDetail(product) {
    addRecentlyViewed(product)
    setDetailProd(product)
  }

  const sharedProps = {
    onAddToCart:      addToCart,
    cartLoading,
    isWishlisted,
    onToggleWishlist: toggleWishlist,
    onViewDetail:     handleViewDetail,
    recentlyViewed,
  }

  function renderPage() {
    switch (page) {
      case 'home':     return <HomePage     products={products} loading={loading} onNav={handleNav} {...sharedProps}/>
      case 'shop':     return <ShopPage     products={products} loading={loading} {...sharedProps}/>
      case 'lookbook': return <LookbookPage onNav={handleNav}/>
      case 'arcade':   return <ArcadePage/>
      case 'music':    return <MusicPage/>
      case 'about':    return <AboutPage    onNav={handleNav}/>
      case 'wishlist': return <WishlistPage items={wishlist} onNav={handleNav} {...sharedProps}/>
      case 'alarm':    return <AlarmPage/>
      default:         return <HomePage     products={products} loading={loading} onNav={handleNav} {...sharedProps}/>
    }
  }

  return (
    <div style={{ paddingBottom: musicOn && page !== 'music' ? '56px' : 0 }}>
      <Navbar
        page={page}
        onNav={handleNav}
        totalItems={totalItems}
        wishCount={wishCount}
        onCartOpen={() => setCartOpen(true)}
        onLogin={login}
        onAccount={goToAccount}
      />
      <main>{renderPage()}</main>
      <Footer onNav={handleNav}/>

      {cartOpen && (
        <CartDrawer
          lines={lines}
          totalPrice={totalPrice}
          currency={currency}
          onClose={() => setCartOpen(false)}
          onCheckout={goToCheckout}
          cartLoading={cartLoading}
          onLogin={login}
        />
      )}

      {detailProd && (
        <ProductDetailPage
          product={detailProd}
          onAddToCart={addToCart}
          cartLoading={cartLoading}
          onClose={() => setDetailProd(null)}
          isWishlisted={isWishlisted}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {musicOn && page !== 'music' && <MiniPlayer onNav={handleNav}/>}
    </div>
  )
}
