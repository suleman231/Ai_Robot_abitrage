
import React from 'react';
import { CoinData } from '../types';
import { EXCHANGE_BRANDS } from '../constants.tsx';

interface MarketGridProps {
  markets: CoinData[];
}

const MarketGrid: React.FC<MarketGridProps> = ({ markets }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl">
      <div className="flex justify-between items-center mb-5 md:mb-8">
        <div>
          <h3 className="text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest italic">Node Cluster Status</h3>
          <p className="text-[7px] md:text-[8px] text-slate-600 font-bold uppercase mt-1">Cross-Exchange Feeds</p>
        </div>
        <div className="flex gap-1.5 md:gap-2 items-center">
           <span className="text-[7px] font-black text-green-500 uppercase tracking-tighter">Live</span>
           <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>
      
      <div className="space-y-4 md:space-y-6 overflow-y-auto max-h-[400px] md:max-h-[500px] pr-2 custom-scrollbar">
        {markets.map((coin) => (
          <div key={coin.symbol} className="p-4 md:p-5 bg-slate-950/40 border border-slate-800/50 rounded-2xl md:rounded-3xl group hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                <span className="text-lg md:text-xl font-black italic text-slate-100 tracking-tighter">{coin.symbol}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">HFT Pulse</span>
                <span className="text-[9px] font-mono text-primary">{(Math.random() * 20 + 5).toFixed(0)}ms</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {coin.prices.slice(0, 4).map((p) => (
                <div key={p.exchange} className="p-2 md:p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl md:rounded-2xl flex flex-col gap-2 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-slate-950 flex items-center justify-center border border-slate-800">
                        <i className={`${EXCHANGE_BRANDS[p.exchange]?.icon || 'fa-solid fa-building'} ${EXCHANGE_BRANDS[p.exchange]?.color || 'text-slate-600'} text-[10px] md:text-xs`}></i>
                      </div>
                      <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-tight truncate max-w-[50px]">{p.exchange}</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="mono text-[10px] md:text-xs font-bold text-slate-100">${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                  </div>
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
