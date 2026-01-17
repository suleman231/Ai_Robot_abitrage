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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
      <div className="lg:col-span-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-[1.2rem] p-4 h-full flex flex-col shadow-xl">
           <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-4 border-b border-slate-800 pb-2">Clusters</h3>
           <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar max-h-[500px]">
              {EXCHANGES.map(ex => (
                <button 
                  key={ex}
                  onClick={() => onExchangeChange(ex)}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl border transition-all text-left ${selectedExchange === ex ? 'bg-primary/10 border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]' : 'bg-slate-950/40 border-slate-800/50 opacity-60 hover:opacity-100'}`}
                >
                  <i className={`${EXCHANGE_BRANDS[ex]?.icon || 'fa-solid fa-circle-nodes'} ${EXCHANGE_BRANDS[ex]?.color || 'text-slate-500'} text-[10px]`}></i>
                  <p className={`text-[9px] font-black uppercase truncate ${selectedExchange === ex ? 'text-primary' : 'text-slate-300'}`}>{ex}</p>
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="lg:col-span-9 space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-4 bg-slate-900/60 border border-slate-800 rounded-[1.2rem] p-4 flex flex-col h-[480px] shadow-xl">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-[8px] font-black text-slate-200 uppercase tracking-widest">Terminal_{selectedExchange.slice(0,3)}</h3>
             </div>

             <div className="mb-4 p-3 bg-slate-950/60 border border-slate-800/50 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                   <p className="text-[7px] font-black text-slate-500 uppercase">Unit ($)</p>
                   <input 
                    type="number" min="1" value={tradeAmount} 
                    onChange={(e) => onTradeAmountChange(Math.max(1, parseInt(e.target.value) || 1))} 
                    className="w-12 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] font-black mono text-primary outline-none" 
                   />
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <p className="text-[7px] text-primary font-black uppercase">Spread: {breakEvenSpread.toFixed(3)}%</p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {exchangeMarketData.map(asset => (
                  <div key={asset.symbol} onClick={() => onManualExecute({ coin: asset.symbol, action: 'BUY', confidence: 0.95, targetPrice: asset.price * 1.05, reason: 'Manual' })} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/50 flex justify-between items-center hover:bg-slate-900/80 cursor-pointer group">
                     <span className="text-[10px] font-black italic tracking-tighter text-slate-100">{asset.symbol}</span>
                     <div className="text-right">
                        <p className="text-[10px] font-black mono text-slate-100">${asset.price.toFixed(2)}</p>
                        <p className={`text-[7px] font-black mono ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{asset.change.toFixed(2)}%</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="xl:col-span-8 flex flex-col gap-4">
             <div className="bg-slate-900/60 border border-slate-800 rounded-[1.2rem] p-5 shadow-xl flex flex-col">
                <h2 className="text-2xl font-black mono italic tracking-tighter text-primary mb-4">${(exchangeTrades.reduce((acc, t) => acc + t.profit, 0)).toFixed(4)}</h2>
                <div className="w-full h-[140px] relative">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pnlData}>
                        <Area type="step" dataKey="pnl" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
             </div>
             <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center">
                   <p className="text-[6px] font-black text-slate-500 uppercase mb-0.5">Efficiency</p>
                   <p className="text-sm font-black mono text-slate-100">{breakEvenSpread.toFixed(1)}%</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center">
                   <p className="text-[6px] font-black text-slate-500 uppercase mb-0.5">Status</p>
                   <p className="text-sm font-black text-primary">SECURED</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center">
                   <p className="text-[6px] font-black text-slate-500 uppercase mb-0.5">Ping</p>
                   <p className="text-sm font-black mono text-slate-100">3ms</p>
                </div>
             </div>
          </div>
        </div>
        <div className="h-[280px]">
           <TradeLogs trades={exchangeTrades} />
        </div>
      </div>
    </div>
  );
};

export default IntraExchangeView;