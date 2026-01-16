
export interface PriceData {
  exchange: string;
  price: number;
  lastUpdate: number;
}

export interface CoinData {
  symbol: string;
  name: string;
  prices: PriceData[];
}

export interface ArbitrageOpportunity {
  id: string;
  coin: string;
  buyFrom: string;
  sellTo: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  timestamp: number;
  estimatedProfit: number;
}

export interface SpotSignal {
  coin: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  reason: string;
}

export interface TradeRecord {
  id: string;
  timestamp: number;
  coin: string;
  type: 'ARB' | 'SPOT';
  buyExchange: string;
  sellExchange: string;
  amount: number;
  profit: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface AIAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedStrategy: string;
  spotSignals?: SpotSignal[];
}

export interface ExchangeKeys {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  isLinked: boolean;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'INVALID_CREDENTIALS' | 'RATE_LIMITED' | 'ERROR';
}

export interface BotSettings {
  minSpread: number;
  maxSlippage: number;
  maxConcurrentTrades: number;
  dailyStopLoss: number;
  enableAiGuidance: boolean;
  tradingMode: 'ARB' | 'SPOT' | 'HYBRID';
}

export interface UserProfile {
  username: string;
  idNumber: string;
  profileImage?: string;
  themeColor: string;
  keys: ExchangeKeys[];
  settings: BotSettings;
}
