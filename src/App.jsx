import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import LookbookPage from './pages/LookbookPage'
import ArcadePage from './pages/ArcadePage'
import AboutPage from './pages/AboutPage'
import MusicPage from './pages/MusicPage'
import { useProducts } from './hooks/useProducts'
import { useCart } from './hooks/useCart'

export default function App() {
  const [page,     setPage]     = useState('home')
  const [cartOpen, setCartOpen] = useState(false)

  const { products, loading } = useProducts(12)
  const {
    lines, totalItems, totalPrice, currency,
    loading: cartLoading, addToCart, goToCheckout,
  } = useCart()

  useEffect(() => { window.scrollTo({ top: 0 }) }, [page])

  function navigate(p) { setPage(p); setCartOpen(false) }

  function renderPage() {
    switch (page) {
      case 'home':     return <HomePage     products={products} loading={loading} onAddToCart={addToCart} cartLoading={cartLoading} onNav={navigate}/>
      case 'shop':     return <ShopPage     products={products} loading={loading} onAddToCart={addToCart} cartLoading={cartLoading}/>
      case 'lookbook': return <LookbookPage onNav={navigate}/>
      case 'arcade':   return <ArcadePage/>
      case 'music':    return <MusicPage/>
      case 'about':    return <AboutPage    onNav={navigate}/>
      default:         return <HomePage     products={products} loading={loading} onAddToCart={addToCart} cartLoading={cartLoading} onNav={navigate}/>
    }
  }

  return (
    <div>
      <Navbar page={page} onNav={navigate} totalItems={totalItems} onCartOpen={() => setCartOpen(true)}/>
      <main>{renderPage()}</main>
      <Footer onNav={navigate}/>
      {cartOpen && (
        <CartDrawer
          lines={lines}
          totalPrice={totalPrice}
          currency={currency}
          onClose={() => setCartOpen(false)}
          onCheckout={goToCheckout}
          cartLoading={cartLoading}
        />
      )}
    </div>
  )
}
