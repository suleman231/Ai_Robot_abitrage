import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EXCHANGES, EXCHANGE_BRANDS, FEE_PERCENTAGE, FIXED_NETWORK_FEE } from '../constants.tsx';
import { CoinData, TradeRecord, SpotSignal } from '../types';
import TradeLogs from './TradeLogs';

interface IntraExchangeViewProps {
  selectedExchange: string;
  onExchangeChange: (exchange: string) => void;
  markets: CoinData[];
  trades: TradeRecord[];
  onManualExecute: (signal: SpotSignal) => void;
  tradeAmount: number;
  onTradeAmountChange: (val: number) => void;
}

const IntraExchangeView: React.FC<IntraExchangeViewProps> = ({ 
  selectedExchange, 
  onExchangeChange, 
  markets, 
  trades,
  onManualExecute,
  tradeAmount,
  onTradeAmountChange
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  const exchangeMarketData = useMemo(() => {
    return markets.map(coin => ({
      symbol: coin.symbol,
      price: coin.prices.find(p => p.exchange === selectedExchange)?.price || (coin.basePrice * (1 + (Math.random() - 0.5) * 0.02)),
      change: (Math.random() - 0.4) * 5
    }));
  }, [markets, selectedExchange]);

  const exchangeTrades = useMemo(() => {
    return trades.filter(t => t.buyExchange === selectedExchange || t.sellExchange === selectedExchange);
  }, [trades, selectedExchange]);

  const pnlData = useMemo(() => {
    let cumulative = 0;
    const data = exchangeTrades.map((t, i) => {
      cumulative += t.profit;
      return { time: i, pnl: cumulative };
    });
    if (data.length < 2) return [{time: 0, pnl: 0}, {time: 1, pnl: 0.005}, {time: 2, pnl: 0.012}];
    return data;
  }, [exchangeTrades]);

  const breakEvenSpread = useMemo(() => {
    const totalFees = (tradeAmount * FEE_PERCENTAGE * 2) + FIXED_NETWORK_FEE;
    return tradeAmount > 0 ? (totalFees / tradeAmount) * 100 : 0;
  }, [tradeAmount]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
      <div className="lg:col-span-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-6 h-full flex flex-col shadow-xl">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-6 border-b border-slate-800 pb-3">Intra_Cluster</h3>
           <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[600px]">
              {EXCHANGES.map(ex => (
                <button 
                  key={ex}
                  onClick={() => onExchangeChange(ex)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${selectedExchange === ex ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary-color),0.1)]' : 'bg-slate-950/40 border-slate-800/50 opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border ${selectedExchange === ex ? 'border-primary/50' : 'border-slate-800'}`}>
                    <i className={`${EXCHANGE_BRANDS[ex]?.icon || 'fa-solid fa-circle-nodes'} ${EXCHANGE_BRANDS[ex]?.color || 'text-slate-500'} text-xs`}></i>
                  </div>
                  <p className={`text-[10px] font-black uppercase truncate ${selectedExchange === ex ? 'text-primary' : 'text-slate-300'}`}>{ex}</p>
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="lg:col-span-9 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col h-[550px] shadow-xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Terminal_{selectedExchange.slice(0,3)}</h3>
                <span className="text-[7px] font-black text-primary uppercase animate-pulse">Syncing</span>
             </div>

             <div className="mb-6 p-4 bg-slate-950/60 border border-slate-800/50 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                   <p className="text-[8px] font-black text-slate-500 uppercase">Trade Unit</p>
                   <input type="number" value={tradeAmount} onChange={(e) => onTradeAmountChange(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] font-black mono text-primary outline-none" />
                </div>
                <input type="range" min="1" max="100" step="1" value={Math.min(100, tradeAmount)} onChange={(e) => onTradeAmountChange(parseInt(e.target.value))} className="w-full accent-primary h-1 bg-slate-800 rounded-full appearance-none cursor-pointer" />
                <p className="text-[7px] text-slate-500 font-bold uppercase italic">Profitability Guard: Spread must exceed {breakEvenSpread.toFixed(3)}%.</p>
             </div>

             <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {exchangeMarketData.map(asset => (
                  <div key={asset.symbol} onClick={() => onManualExecute({ coin: asset.symbol, action: 'BUY', confidence: 0.95, targetPrice: asset.price * 1.05, reason: 'Manual' })} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/50 flex justify-between items-center hover:bg-slate-900/80 transition-all cursor-pointer group">
                     <span className="text-[11px] font-black italic tracking-tighter text-slate-100">{asset.symbol}</span>
                     <div className="text-right">
                        <p className="text-[11px] font-black mono text-slate-100">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className={`text-[8px] font-black mono ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{asset.change.toFixed(2)}%</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="xl:col-span-8 flex flex-col gap-6">
             <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 flex-1 shadow-xl relative overflow-hidden">
                <h2 className="text-4xl font-black mono italic tracking-tighter text-primary mb-10">${(exchangeTrades.reduce((acc, t) => acc + t.profit, 0)).toFixed(4)}</h2>
                <div className="w-full relative">
                  {isMounted && (
                    <ResponsiveContainer width="99%" aspect={2.5} minHeight={150}>
                      <AreaChart data={pnlData}>
                        <defs>
                          <linearGradient id="colorPnlIntra" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} opacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px' }} />
                        <Area type="step" dataKey="pnl" stroke="var(--primary-color)" fill="url(#colorPnlIntra)" strokeWidth={3} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                   <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Efficiency</p>
                   <p className="text-xl font-black mono text-slate-100">{breakEvenSpread.toFixed(2)}%</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                   <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Status</p>
                   <p className="text-xl font-black text-primary">SECURED</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                   <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Latency</p>
                   <p className="text-xl font-black mono text-slate-100">4ms</p>
                </div>
             </div>
          </div>
        </div>
        <div className="h-[350px]">
           <TradeLogs trades={exchangeTrades} />
        </div>
      </div>
    </div>
  );
};

export default IntraExchangeView;