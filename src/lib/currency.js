// Currency formatter — converts currencyCode to correct symbol
// Works automatically for any market Shopify returns

const SYMBOLS = {
  PHP: '₱',
  USD: '$',
  GBP: '£',
  EUR: '€',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  JPY: '¥',
  KRW: '₩',
  INR: '₹',
  MXN: 'MX$',
  BRL: 'R$',
  HKD: 'HK$',
  NZD: 'NZ$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  ZAR: 'R',
  AED: 'AED',
}

// Returns the symbol for a given currency code
export function currencySymbol(code) {
  return SYMBOLS[code] || code || '$'
}

// Formats a price with the correct symbol
// e.g. formatPrice('1500.00', 'PHP') => '₱1,500.00'
export function formatPrice(amount, currencyCode) {
  const symbol = currencySymbol(currencyCode)
  const num    = parseFloat(amount || 0)
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted}`
}
