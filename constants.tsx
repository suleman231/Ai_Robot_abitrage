
export const EXCHANGES = [
  'Binance', 
  'crypto.com', 
  'Trust Wallet', 
  'Bybit', 
  'Gemini', 
  'Bitget', 
  'CEX.io', 
  'Gate.io', 
  'Coinbase', 
  'Bitmama', 
  'OKX', 
  'Kraken', 
  'Coinmama', 
  'Kucoin',
  '0x.io'
];

export const EXCHANGE_BRANDS: Record<string, { icon: string, color: string }> = {
  'Binance': { icon: 'fa-brands fa-bitcoin', color: 'text-yellow-500' },
  'crypto.com': { icon: 'fa-solid fa-rocket', color: 'text-blue-600' },
  'Trust Wallet': { icon: 'fa-solid fa-shield-halved', color: 'text-blue-400' },
  'Bybit': { icon: 'fa-solid fa-bolt', color: 'text-yellow-400' },
  'Gemini': { icon: 'fa-solid fa-circle-half-stroke', color: 'text-cyan-500' },
  'Bitget': { icon: 'fa-solid fa-arrow-up-right-dots', color: 'text-teal-500' },
  'CEX.io': { icon: 'fa-solid fa-shield-check', color: 'text-orange-500' },
  'Gate.io': { icon: 'fa-solid fa-torii-gate', color: 'text-red-500' },
  'Coinbase': { icon: 'fa-solid fa-building-columns', color: 'text-blue-500' },
  'Bitmama': { icon: 'fa-solid fa-seedling', color: 'text-emerald-500' },
  'OKX': { icon: 'fa-solid fa-dice-d6', color: 'text-slate-400' },
  'Kraken': { icon: 'fa-solid fa-water', color: 'text-purple-500' },
  'Coinmama': { icon: 'fa-solid fa-cart-shopping', color: 'text-pink-500' },
  'Kucoin': { icon: 'fa-solid fa-k', color: 'text-green-500' },
  '0x.io': { icon: 'fa-solid fa-zero', color: 'text-white' },
};

export const COINS = [
  { symbol: 'BTC', name: 'Bitcoin', basePrice: 65000 },
  { symbol: 'ETH', name: 'Ethereum', basePrice: 3500 },
  { symbol: 'BNB', name: 'Binance Coin', basePrice: 600 },
  { symbol: 'SOL', name: 'Solana', basePrice: 145 },
  { symbol: 'XRP', name: 'Ripple', basePrice: 0.62 },
  { symbol: 'BCH', name: 'Bitcoin Cash', basePrice: 480 },
  { symbol: 'LTC', name: 'Litecoin', basePrice: 85 },
  { symbol: 'LINK', name: 'Chainlink', basePrice: 18 },
  { symbol: 'ADA', name: 'Cardano', basePrice: 0.58 },
  { symbol: 'DOT', name: 'Polkadot', basePrice: 8.20 },
  { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.16 },
  { symbol: 'TRX', name: 'TRON', basePrice: 0.12 },
  { symbol: 'SAND', name: 'The Sandbox', basePrice: 0.45 },
  { symbol: 'USDT', name: 'Tether', basePrice: 1.00 },
  { symbol: 'USDC', name: 'USD Coin', basePrice: 1.00 },
];

export const FEE_PERCENTAGE = 0.001; 
export const FIXED_NETWORK_FEE = 0.001;