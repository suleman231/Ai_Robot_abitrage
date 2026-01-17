import React from 'react';
import { CoinData } from '../types';
import { EXCHANGE_BRANDS } from '../constants.tsx';

interface MarketGridProps {
  markets: CoinData[];
}

const MarketGrid: React.FC<MarketGridProps> = ({ markets }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-[1.2rem] md:rounded-[1.5rem] p-4 md:p-6 shadow-xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Node Clusters</h3>
        </div>
        <div className="flex gap-1 items-center">
           <span className="text-[7px] font-black text-green-500 uppercase tracking-tighter">Live</span>
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {markets.map((coin) => (
          <div key={coin.symbol} className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3 bg-primary rounded-full"></div>
                <span className="text-sm font-black italic text-slate-100 tracking-tighter">{coin.symbol}</span>
              </div>
              <span className="text-[7px] font-mono text-primary">{(Math.random() * 15 + 2).toFixed(0)}ms</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              {coin.prices.slice(0, 4).map((p) => (
                <div key={p.exchange} className="p-1.5 bg-slate-900/40 border border-slate-800/80 rounded-lg flex flex-col">
                  <div className="flex items-center gap-1 mb-1">
                    <i className={`${EXCHANGE_BRANDS[p.exchange]?.icon || 'fa-solid fa-building'} ${EXCHANGE_BRANDS[p.exchange]?.color || 'text-slate-600'} text-[8px]`}></i>
                    <span className="text-[6px] font-black text-slate-500 uppercase truncate tracking-tight">{p.exchange}</span>
                  </div>
                  <span className="mono text-[9px] font-bold text-slate-100">${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketGrid;