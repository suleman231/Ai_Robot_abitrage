import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CoinData, ArbitrageOpportunity, TradeRecord, AIAnalysis, UserProfile, SpotSignal } from './types';
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
  const [quotaError, setQuotaError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [uptime, setUptime] = useState('00:00:00');
  const [latency, setLatency] = useState(5);
  const [expandedExchange, setExpandedExchange] = useState<string | null>(null);
  
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCooldown, setAiCooldown] = useState(false);

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
    // Ensuring a clean mount to allow parents to settle for Recharts
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
    if (isAnalyzing || aiCooldown || !userProfile.settings.enableAiGuidance) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeMarketWithGemini(opportunitiesRef.current, marketsRef.current.slice(0, 5));
      setAiAnalysis(result);
      if (result.reasoning.includes("saturated")) {
        setQuotaError(true);
        setAiCooldown(true);
        setTimeout(() => setAiCooldown(false), 60000);
      } else {
        setQuotaError(false);
      }
    } catch (e: any) {
      if (e?.message?.includes('429')) {
        setQuotaError(true);
        setAiCooldown(true);
        setTimeout(() => setAiCooldown(false), 60000);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, aiCooldown, userProfile.settings.enableAiGuidance]);

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

    if (profit <= 0.0001) return;

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
    if (currentView === 'ARBITRAGE' && userProfile.settings.tradingMode !== 'SPOT' && opportunities.length > 0) {
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

  return (
    <div className="min-h-screen p-3 md:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto bg-slate-950 text-slate-100 font-sans">
      
      {/* LEFT SIDE CONFIG DRAWER */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-start overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setShowSettings(false)}></div>
          <div className="relative z-10 bg-slate-900 border-r border-slate-800 w-full max-w-md shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col h-full animate-in slide-in-from-left duration-300 ease-out">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
                    <i className="fa-solid fa-microchip text-lg md:text-xl"></i>
                 </div>
                 <div>
                    <h2 className="text-lg md:text-xl font-black italic tracking-tighter uppercase">Identity_Node</h2>
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest">Configuration Drawer</p>
                 </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* SYSTEM PRE-FLIGHT STATUS */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl mb-2">
                 <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Pre-flight Diagnostics</h4>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                       <span className="text-[9px] font-bold text-slate-400">NODE_OK</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                       <span className="text-[9px] font-bold text-slate-400">TELEMETRY_LINKED</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                       <span className="text-[9px] font-bold text-slate-400">SECURE_SSL</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                       <span className="text-[9px] font-bold text-primary">HFT_SIM_ACTIVE</span>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-6">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operational Protocol</h4>
                <div className="space-y-6">
                   <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Trade Unit</span>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[8px] font-black text-slate-600">$</span>
                           <input 
                             type="number"
                             value={tradeAmount}
                             onChange={(e) => setTradeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                             className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[9px] font-black mono text-primary outline-none focus:border-primary/50 text-right"
                           />
                        </div>
                      </div>
                      <input type="range" min="1" max="500" step="1" value={tradeAmount} onChange={(e) => setTradeAmount(parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-800 rounded-full appearance-none cursor-pointer" />
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/40"></div>
                          <span className="text-[7px] font-black text-slate-500 uppercase">Break-even Spread:</span>
                        </div>
                        <span className="text-[8px] font-black text-primary mono">{breakEvenSpread.toFixed(3)}%</span>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Min Profit Trigger</span>
                        <span className="text-[8px] font-black text-primary">{userProfile.settings.minSpread}%</span>
                      </div>
                      <input type="range" min="0.05" max="1.0" step="0.05" value={userProfile.settings.minSpread} onChange={(e) => setUserProfile({...userProfile, settings: {...userProfile.settings, minSpread: parseFloat(e.target.value)}})} className="w-full accent-primary h-1 bg-slate-800 rounded-full appearance-none cursor-pointer" />
                   </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-950/40 border-t border-slate-800 flex justify-between items-center shrink-0">
               <button onClick={() => window.location.reload()} className="px-5 py-3 bg-red-950/20 text-red-500 border border-red-900/20 font-black text-[8px] tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all uppercase">Flush</button>
               <button onClick={() => setShowSettings(false)} className="px-8 py-3 bg-primary text-slate-950 font-black text-[10px] tracking-widest rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase">Deploy</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER HUD */}
      <header className={`relative z-10 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-900/40 backdrop-blur-3xl border ${pulse ? 'border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]' : 'border-slate-800'} p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] transition-all duration-300`}>
        <div className="flex items-center justify-between lg:justify-start gap-3 md:gap-6">
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 md:gap-4 p-2 pr-4 md:pr-6 rounded-[1.2rem] bg-primary/5 border border-primary/20 hover:border-primary/60 hover:bg-primary/10 transition-all group active:scale-95 shadow-lg">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-slate-900 flex items-center justify-center border-2 border-primary/20 group-hover:border-primary/50 transition-all relative">
              <i className="fa-solid fa-microchip text-primary text-lg"></i>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 bg-green-500 animate-pulse`}></div>
            </div>
            <div className="text-left hidden xs:block">
              <p className="text-[9px] md:text-[10px] font-black text-slate-100 uppercase mb-0.5">{userProfile.username}</p>
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Live_Feed</span>
            </div>
          </button>

          <div className="flex items-center gap-3 md:gap-5">
            <button onClick={() => setCurrentView(currentView === 'ARBITRAGE' ? 'INTRA' : 'ARBITRAGE')} className={`relative w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-900 flex items-center justify-center border-2 transition-all duration-500 group/logo overflow-hidden active:scale-90 ${currentView === 'INTRA' ? 'border-primary shadow-[0_0_30px_rgba(var(--primary-color),0.3)]' : 'border-slate-700 hover:border-slate-400'}`}>
              <i className={`fa-solid fa-atom text-lg md:text-xl relative z-10 transition-all duration-500 ${currentView === 'INTRA' ? 'text-primary rotate-180' : 'text-slate-600'}`}></i>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-2xl font-black italic tracking-tighter uppercase text-white leading-none">Quant<span className="text-primary">Robot</span></h1>
              <span className="text-[7px] font-black mono text-slate-400 uppercase mt-1">{uptime} | NODE_HEALTH: 100%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
           <div className="flex flex-1 items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-[1.5rem] border border-slate-800/50 pr-6">
             <div className="text-left md:text-right">
                <p className="text-[8px] text-slate-500 uppercase font-black tracking-[0.2em]">Balance</p>
                <p className="text-xl md:text-2xl font-black mono text-primary tracking-tighter">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
             </div>
             <button onClick={() => setAutoTrade(!autoTrade)} className={`w-9 h-9 rounded-full transition-all active:scale-90 flex items-center justify-center border-2 ${autoTrade ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-primary border-green-300 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]'}`}>
               <i className={`fa-solid ${autoTrade ? 'fa-stop text-[10px]' : 'fa-play text-[10px] ml-0.5'}`}></i>
             </button>
           </div>
        </div>
      </header>

      {/* DASHBOARD VIEWS */}
      {currentView === 'ARBITRAGE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
               <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4 italic">Telemetry</h3>
               <div className="space-y-6">
                  <div>
                     <p className="text-[9px] text-slate-500 font-black uppercase mb-0.5">Yield Surplus</p>
                     <p className="text-3xl font-black mono text-green-400 tracking-tighter leading-none">${(balance - initialBalance).toFixed(4)}</p>
                  </div>
                  <div className="w-full relative">
                    {isMounted && (
                      <ResponsiveContainer width="100%" aspect={1.5} minHeight={100}>
                        <AreaChart data={pnlHistory}>
                          <Area type="monotone" dataKey="pnl" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
               </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col min-h-[280px]">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                   <i className={`fa-solid fa-atom ${isAnalyzing ? 'animate-spin-slow text-primary' : 'text-slate-400'}`}></i> Neural_Core
                 </h3>
                 <button onClick={runAiAnalysis} className="text-[8px] font-black text-primary uppercase hover:opacity-70">Refresh AI</button>
               </div>
               
               {aiAnalysis ? (
                 <div className="space-y-4 flex-1 flex flex-col justify-end">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 text-center">
                        <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Sentiment</p>
                        <p className={`text-[9px] font-black ${aiAnalysis.sentiment === 'BULLISH' ? 'text-green-400' : 'text-red-400'}`}>{aiAnalysis.sentiment}</p>
                      </div>
                      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 text-center">
                        <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Risk Node</p>
                        <p className="text-[9px] font-black text-yellow-400">{aiAnalysis.riskLevel}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/50">
                      <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium mono h-24 overflow-y-auto custom-scrollbar">{aiAnalysis.reasoning}</p>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                   <i className="fa-solid fa-brain text-slate-700 text-2xl mb-2 animate-pulse"></i>
                   <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Neural Link Syncing...</p>
                 </div>
               )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4 md:space-y-6">
             <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {opportunities.slice(0, 3).map(opp => (
                    <div key={opp.id} className="p-5 bg-slate-950/80 border border-slate-800 rounded-[1.8rem] hover:border-primary/40 transition-all group">
                       <div className="flex justify-between items-center mb-3">
                          <span className="text-xl font-black italic tracking-tighter text-slate-100">{opp.coin}</span>
                          <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded">+{opp.spreadPercentage.toFixed(2)}%</span>
                       </div>
                       <div className="flex items-center justify-between gap-2 mb-4 text-[10px]">
                          <i className={`${EXCHANGE_BRANDS[opp.buyFrom]?.icon} ${EXCHANGE_BRANDS[opp.buyFrom]?.color}`}></i>
                          <div className="h-[1px] flex-1 bg-slate-800 mx-2"></div>
                          <i className={`${EXCHANGE_BRANDS[opp.sellTo]?.icon} ${EXCHANGE_BRANDS[opp.sellTo]?.color}`}></i>
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
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
           <IntraExchangeView 
             selectedExchange={selectedExchange} 
             onExchangeChange={setSelectedExchange} 
             markets={markets}
             trades={trades}
             onManualExecute={(sig) => executeTrade(sig, 'SPOT', selectedExchange, selectedExchange)}
             tradeAmount={tradeAmount}
             onTradeAmountChange={setTradeAmount}
           />
        </div>
      )}
    </div>
  );
};

export default App;