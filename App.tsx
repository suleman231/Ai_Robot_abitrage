import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CoinData, ArbitrageOpportunity, TradeRecord, AIAnalysis, UserProfile, SpotSignal, ExchangeKeys } from './types';
import { COINS, EXCHANGES, EXCHANGE_BRANDS, FEE_PERCENTAGE, FIXED_NETWORK_FEE } from './constants.tsx';
import MarketGrid from './components/MarketGrid';
import TradeLogs from './components/TradeLogs';
import IntraExchangeView from './components/IntraExchangeView';
import { analyzeMarketWithGemini } from './services/geminiService';

const generate10DigitId = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '34, 197, 94';
};

const THEME_PRESETS = [
  { name: 'Emerald', color: '#22c55e' },
  { name: 'Cyber', color: '#ec4899' },
  { name: 'Volt', color: '#eab308' },
  { name: 'Ocean', color: '#06b6d4' },
  { name: 'Plasma', color: '#8b5cf6' },
  { name: 'Crimson', color: '#ef4444' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'ARBITRAGE' | 'INTRA'>('ARBITRAGE');
  const [selectedExchange, setSelectedExchange] = useState<string>(EXCHANGES[0]);
  const [markets, setMarkets] = useState<CoinData[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [balance, setBalance] = useState(10000);
  const [initialBalance] = useState(10000);
  const [autoTrade, setAutoTrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [hasSelectedKey, setHasSelectedKey] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [uptime, setUptime] = useState('00:00:00');
  const [latency, setLatency] = useState(5);
  const [expandedExchangeKey, setExpandedExchangeKey] = useState<string | null>(null);
  
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const lastTradeTimeRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const marketsRef = useRef<CoinData[]>([]);
  const opportunitiesRef = useRef<ArbitrageOpportunity[]>([]);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => ({
    username: 'QUANT_NODE',
    idNumber: generate10DigitId(),
    themeColor: '#22c55e',
    keys: EXCHANGES.map(ex => ({ 
      exchange: ex, 
      apiKey: '', 
      apiSecret: '', 
      isLinked: false, 
      status: 'DISCONNECTED' 
    })),
    settings: {
      minSpread: 0.15,
      maxSlippage: 0.05,
      maxConcurrentTrades: 25,
      dailyStopLoss: 5000,
      enableAiGuidance: true,
      tradingMode: 'HYBRID'
    }
  }));

  const [tradeAmount, setTradeAmount] = useState(10);

  const breakEvenSpread = useMemo(() => {
    const totalFees = (tradeAmount * FEE_PERCENTAGE * 2) + FIXED_NETWORK_FEE;
    return (totalFees / tradeAmount) * 100;
  }, [tradeAmount]);

  useEffect(() => { marketsRef.current = markets; }, [markets]);
  useEffect(() => { opportunitiesRef.current = opportunities; }, [opportunities]);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Date.now() - sessionStartRef.current;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${hours}:${mins}:${secs}`);
      setLatency(Math.floor(Math.random() * 8) + 3);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', userProfile.themeColor);
    const rgb = hexToRgb(userProfile.themeColor);
    document.documentElement.style.setProperty('--primary-rgb', rgb);
  }, [userProfile.themeColor]);

  useEffect(() => {
    const init = COINS.map(c => ({
      ...c,
      prices: EXCHANGES.map(ex => ({ 
        exchange: ex, 
        price: c.basePrice + (Math.random() - 0.5) * (c.basePrice * 0.04), 
        lastUpdate: Date.now() 
      }))
    }));
    setMarkets(init);
    marketsRef.current = init;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets(prev => prev.map(coin => ({
        ...coin,
        prices: coin.prices.map(p => ({ 
          ...p, 
          price: p.price * (1 + (Math.random() - 0.5) * 0.008), 
          lastUpdate: Date.now() 
        }))
      })));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const runAiAnalysis = useCallback(async () => {
    if (isAnalyzing || !userProfile.settings.enableAiGuidance) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeMarketWithGemini(opportunitiesRef.current, marketsRef.current.slice(0, 5));
      setAiAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, userProfile.settings.enableAiGuidance]);

  useEffect(() => {
    const interval = setInterval(runAiAnalysis, 45000);
    runAiAnalysis();
    return () => clearInterval(interval);
  }, [userProfile.settings.enableAiGuidance, runAiAnalysis]);

  const executeTrade = useCallback((opp: ArbitrageOpportunity | SpotSignal, type: 'ARB' | 'SPOT', customBuyEx?: string, customSellEx?: string) => {
    if (balance < tradeAmount) return;
    const now = Date.now();
    if (now - lastTradeTimeRef.current < 200) return;

    const tradingCosts = (tradeAmount * FEE_PERCENTAGE * 2) + FIXED_NETWORK_FEE;
    let profit = 0;
    let coin = '';
    let buyEx = '';
    let sellEx = '';

    if (type === 'ARB') {
      const arb = opp as ArbitrageOpportunity;
      profit = (tradeAmount * (arb.spreadPercentage / 100)) - tradingCosts;
      coin = arb.coin;
      buyEx = arb.buyFrom;
      sellEx = arb.sellTo;
    } else {
      const spot = opp as SpotSignal;
      const move = (Math.random() * 0.03) * (Math.random() > 0.3 ? 1 : -1);
      profit = (tradeAmount * move) - tradingCosts;
      coin = spot.coin;
      buyEx = customBuyEx || 'MARKET';
      sellEx = customSellEx || 'HFT-NODE';
    }

    if (profit <= 0) return;

    lastTradeTimeRef.current = now;
    setPulse(true);
    setTimeout(() => setPulse(false), 200);

    setTrades(prev => [...prev.slice(-49), {
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      coin,
      type,
      buyExchange: buyEx,
      sellExchange: sellEx,
      amount: tradeAmount,
      profit,
      status: 'COMPLETED'
    }]);

    setBalance(prev => prev + profit);
  }, [balance, tradeAmount]);

  useEffect(() => {
    const newOpps: ArbitrageOpportunity[] = [];
    markets.forEach(coin => {
      const sorted = [...coin.prices].sort((a, b) => a.price - b.price);
      const low = sorted[0];
      const high = sorted[sorted.length - 1];
      const spreadPct = ((high.price - low.price) / low.price) * 100;
      const net = (tradeAmount * (spreadPct / 100)) - ((tradeAmount * FEE_PERCENTAGE * 2) + FIXED_NETWORK_FEE);

      if (spreadPct >= userProfile.settings.minSpread && net > 0) {
        newOpps.push({
          id: `${coin.symbol}-${Date.now()}`,
          coin: coin.symbol,
          buyFrom: low.exchange,
          sellTo: high.exchange,
          buyPrice: low.price,
          sellPrice: high.price,
          spread: high.price - low.price,
          spreadPercentage: spreadPct,
          timestamp: Date.now(),
          estimatedProfit: net
        });
      }
    });
    const sortedOpps = newOpps.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
    setOpportunities(sortedOpps);
    opportunitiesRef.current = sortedOpps;
  }, [markets, tradeAmount, userProfile.settings.minSpread]);

  useEffect(() => {
    if (!autoTrade) return;
    if (currentView === 'ARBITRAGE' && opportunities.length > 0) {
      executeTrade(opportunities[0], 'ARB');
    }
  }, [autoTrade, opportunities, currentView, executeTrade]);

  const pnlHistory = useMemo(() => {
    let cumulative = 0;
    const mapped = trades.map((t, i) => {
      cumulative += t.profit;
      return { time: i, pnl: cumulative };
    });
    if (mapped.length === 0) return [{time: 0, pnl: 0}, {time: 1, pnl: 0}];
    return mapped.slice(-20);
  }, [trades]);

  const updateExchangeKey = (exchange: string, field: 'apiKey' | 'apiSecret', value: string) => {
    setUserProfile(prev => ({
      ...prev,
      keys: prev.keys.map(k => k.exchange === exchange ? { ...k, [field]: value, isLinked: true, status: 'CONNECTED' as const } : k)
    }));
  };

  return (
    <div className="min-h-screen p-3 md:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto bg-slate-950 text-slate-100 font-sans">
      
      {/* SIDE SETTINGS DRAWER */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-start overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowSettings(false)}></div>
          <div className="relative z-10 bg-slate-900 border-r border-slate-800 w-full max-w-md shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <i className="fa-solid fa-user-gear"></i>
                 </div>
                 <h2 className="text-xl font-black italic tracking-tighter uppercase">Node_Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-full hover:bg-slate-800 flex items-center justify-center transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* THEME SELECTOR - VERY SMALL GRAPHICS */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-palette text-primary"></i> UI_Node_Theme
                </h4>
                <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50 flex flex-wrap gap-2.5">
                  {THEME_PRESETS.map((t) => (
                    <button 
                      key={t.name}
                      onClick={() => setUserProfile({ ...userProfile, themeColor: t.color })}
                      title={t.name}
                      className={`group w-6 h-6 rounded-lg border-2 transition-all relative flex items-center justify-center ${userProfile.themeColor === t.color ? 'border-primary scale-110 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]' : 'border-transparent hover:border-slate-600'}`}
                    >
                      <div className="w-full h-full rounded-[4px] shadow-inner" style={{ backgroundColor: t.color }}></div>
                      {userProfile.themeColor === t.color && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full flex items-center justify-center border border-slate-900">
                           <i className="fa-solid fa-check text-slate-900 text-[6px]"></i>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* API KEYS MANAGEMENT */}
              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-key text-primary"></i> API_Credentials
                </h4>
                <div className="space-y-2">
                  {userProfile.keys.map((k) => (
                    <div key={k.exchange} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${expandedExchangeKey === k.exchange ? 'bg-slate-950/60 border-primary/40 shadow-lg' : 'bg-slate-950/20 border-slate-800/60'}`}>
                      <button 
                        onClick={() => setExpandedExchangeKey(expandedExchangeKey === k.exchange ? null : k.exchange)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <i className={`${EXCHANGE_BRANDS[k.exchange]?.icon} ${EXCHANGE_BRANDS[k.exchange]?.color} text-sm`}></i>
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-200">{k.exchange}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {k.isLinked && <span className="text-[7px] font-black text-green-500 uppercase border border-green-500/20 px-1.5 py-0.5 rounded bg-green-500/5">Linked</span>}
                          <i className={`fa-solid fa-chevron-down text-[8px] transition-transform duration-300 ${expandedExchangeKey === k.exchange ? 'rotate-180 text-primary' : 'text-slate-600'}`}></i>
                        </div>
                      </button>
                      
                      {expandedExchangeKey === k.exchange && (
                        <div className="p-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-slate-600 uppercase tracking-widest pl-1">API_KEY</label>
                            <input 
                              type="password"
                              value={k.apiKey}
                              onChange={(e) => updateExchangeKey(k.exchange, 'apiKey', e.target.value)}
                              placeholder="••••••••••••••••"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] mono text-slate-200 outline-none focus:border-primary/50"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-slate-600 uppercase tracking-widest pl-1">API_SECRET</label>
                            <input 
                              type="password"
                              value={k.apiSecret}
                              onChange={(e) => updateExchangeKey(k.exchange, 'apiSecret', e.target.value)}
                              placeholder="••••••••••••••••"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] mono text-slate-200 outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950/50">
               <button 
                 onClick={() => setShowSettings(false)}
                 className="w-full py-4 bg-primary text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
               >
                 Save & Initialize
               </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER HUD */}
      <header className={`relative z-10 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-900/40 backdrop-blur-3xl border ${pulse ? 'border-primary' : 'border-slate-800'} p-4 md:p-6 rounded-[2rem] transition-all duration-300`}>
        <div className="flex items-center justify-between lg:justify-start gap-4">
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-4 p-2 pr-6 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/60 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border-2 border-primary/20 group-hover:border-primary/50 transition-all">
              <i className="fa-solid fa-microchip text-primary text-lg"></i>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-100 uppercase">{userProfile.username}</p>
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Profile & Node</span>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView(currentView === 'ARBITRAGE' ? 'INTRA' : 'ARBITRAGE')} className={`w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border-2 transition-all duration-500 ${currentView === 'INTRA' ? 'border-primary' : 'border-slate-700'}`}>
              <i className={`fa-solid fa-atom text-xl ${currentView === 'INTRA' ? 'text-primary' : 'text-slate-600'}`}></i>
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white leading-none">Quant<span className="text-primary">Robot</span></h1>
              <span className="text-[7px] font-black mono text-slate-400 mt-1">{uptime} | LATENCY: {latency}ms</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex flex-1 lg:w-64 items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-3xl border border-slate-800/50">
             <div>
                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Balance</p>
                <p className="text-xl font-black mono text-primary">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
             </div>
             <button onClick={() => setAutoTrade(!autoTrade)} className={`w-10 h-10 rounded-full transition-all flex items-center justify-center border-2 ${autoTrade ? 'bg-red-600 border-red-400 text-white shadow-lg' : 'bg-primary border-green-300 text-white shadow-lg'}`}>
               <i className={`fa-solid ${autoTrade ? 'fa-stop' : 'fa-play ml-1'}`}></i>
             </button>
           </div>
        </div>
      </header>

      {/* DASHBOARD VIEWS */}
      {currentView === 'ARBITRAGE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
               <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4 italic">Telemetry</h3>
               <div className="space-y-6">
                  <div>
                     <p className="text-[9px] text-slate-500 font-black uppercase mb-0.5">Yield Surplus</p>
                     <p className="text-3xl font-black mono text-green-400 tracking-tighter leading-none">${(balance - initialBalance).toFixed(4)}</p>
                  </div>
                  <div className="w-full relative">
                    {isMounted && (
                      <ResponsiveContainer width="99%" aspect={1.5}>
                        <AreaChart data={pnlHistory}>
                          <Area type="monotone" dataKey="pnl" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
               </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                   <i className={`fa-solid fa-atom ${isAnalyzing ? 'animate-spin-slow text-primary' : 'text-slate-400'}`}></i> Neural_Core
                 </h3>
               </div>
               {aiAnalysis && (
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 text-center">
                        <p className={`text-[9px] font-black ${aiAnalysis.sentiment === 'BULLISH' ? 'text-green-400' : 'text-red-400'}`}>{aiAnalysis.sentiment}</p>
                      </div>
                      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 text-center">
                        <p className="text-[9px] font-black text-yellow-400">{aiAnalysis.riskLevel}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium mono h-24 overflow-y-auto custom-scrollbar">{aiAnalysis.reasoning}</p>
                 </div>
               )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
             <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {opportunities.slice(0, 3).map(opp => (
                    <div key={opp.id} className="p-6 bg-slate-950/80 border border-slate-800 rounded-[2rem] hover:border-primary/40 transition-all group">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-xl font-black italic tracking-tighter text-slate-100">{opp.coin}</span>
                          <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded">+{opp.spreadPercentage.toFixed(2)}%</span>
                       </div>
                       <div className="flex items-center justify-between gap-2 mb-4">
                          <i className={`${EXCHANGE_BRANDS[opp.buyFrom]?.icon} ${EXCHANGE_BRANDS[opp.buyFrom]?.color} text-sm`}></i>
                          <div className="h-[1px] flex-1 bg-slate-800"></div>
                          <i className={`${EXCHANGE_BRANDS[opp.sellTo]?.icon} ${EXCHANGE_BRANDS[opp.sellTo]?.color} text-sm`}></i>
                       </div>
                       <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-700 uppercase">Yield</span>
                        <span className="text-lg font-black mono text-green-400">+${opp.estimatedProfit.toFixed(3)}</span>
                     </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
             <TradeLogs trades={trades} />
             <MarketGrid markets={markets.slice(0, 6)} />
           </div>
        </div>
      </div>
      ) : (
        <IntraExchangeView 
          selectedExchange={selectedExchange} 
          onExchangeChange={setSelectedExchange} 
          markets={markets}
          trades={trades}
          onManualExecute={(sig) => executeTrade(sig, 'SPOT', selectedExchange, selectedExchange)}
          tradeAmount={tradeAmount}
          onTradeAmountChange={setTradeAmount}
        />
      )}
    </div>
  );
};

export default App;