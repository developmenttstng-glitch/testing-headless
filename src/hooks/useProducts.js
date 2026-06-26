import { useState, useEffect } from 'react'
import { shopifyClient } from '../lib/shopify'
import { GET_PRODUCTS } from '../lib/queries'

export function useProducts(count = 8) {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    shopifyClient
      .request(GET_PRODUCTS, { variables: { first: count } })
      .then(({ data, errors }) => {
        if (errors) throw new Error(errors.message)
        setProducts(data.products.edges.map(e => e.node))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [count])

  return { products, loading, error }
}
