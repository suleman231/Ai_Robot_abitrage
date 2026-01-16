
import React, { useState, useMemo } from 'react';
import { TradeRecord } from '../types';
import { COINS, EXCHANGE_BRANDS } from '../constants.tsx';

interface TradeLogsProps {
  trades: TradeRecord[];
}

const TradeLogs: React.FC<TradeLogsProps> = ({ trades }) => {
  const [assetFilter, setAssetFilter] = useState<string>('All');

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      return assetFilter === 'All' || trade.coin === assetFilter;
    });
  }, [trades, assetFilter]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
      <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
            <i className="fa-solid fa-list-ul text-primary text-[10px]"></i>
          </div>
          <div>
            <h3 className="text-[10px] md:text-xs font-black text-slate-100 uppercase tracking-widest">Neural Logs</h3>
            <p className="text-[8px] md:text-[9px] text-slate-600 font-bold uppercase">{trades.length} Records</p>
          </div>
        </div>
        <select 
          value={assetFilter} 
          onChange={(e) => setAssetFilter(e.target.value)} 
          className="w-full sm:w-auto bg-slate-800 border border-slate-700 text-slate-400 text-[8px] md:text-[9px] font-black py-1.5 px-3 rounded-lg md:rounded-xl outline-none"
        >
          <option value="All">FILTER ASSET</option>
          {COINS.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[500px] overflow-y-auto max-h-[400px] md:max-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 text-slate-600 uppercase text-[7px] md:text-[8px] font-black tracking-widest sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-3 md:p-4">Route</th>
                <th className="p-3 md:p-4">Asset</th>
                <th className="p-3 md:p-4">Operation</th>
                <th className="p-3 md:p-4 text-right">Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTrades.length === 0 ? (
                <tr><td colSpan={4} className="p-10 md:p-20 text-center text-slate-700 text-[9px] md:text-[10px] font-black uppercase italic tracking-widest">Buffer Empty</td></tr>
              ) : (
                filteredTrades.slice().reverse().map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-800/30 transition-all group">
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                           <i className={`${EXCHANGE_BRANDS[trade.buyExchange]?.icon || 'fa-solid fa-microchip'} ${EXCHANGE_BRANDS[trade.buyExchange]?.color || 'text-slate-500'} text-[10px]`}></i>
                           <span className="text-[6px] font-black text-slate-500 uppercase truncate max-w-[30px]">{trade.buyExchange}</span>
                        </div>
                        <i className="fa-solid fa-arrow-right-long text-[8px] text-slate-700"></i>
                        <div className="flex flex-col items-center">
                           <i className={`${EXCHANGE_BRANDS[trade.sellExchange]?.icon || 'fa-solid fa-bolt'} ${EXCHANGE_BRANDS[trade.sellExchange]?.color || 'text-slate-500'} text-[10px]`}></i>
                           <span className="text-[6px] font-black text-slate-500 uppercase truncate max-w-[30px]">{trade.sellExchange}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-1.5 md:gap-2">
                         <span className="font-black text-slate-200 text-[10px] md:text-xs">{trade.coin}</span>
                         <span className="text-[8px] text-slate-600 font-bold">${trade.amount}</span>
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <span className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded border ${trade.type === 'ARB' ? 'text-cyan-400 bg-cyan-400/5 border-cyan-400/10' : 'text-purple-400 bg-purple-400/5 border-purple-400/10'}`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-right">
                      <span className="mono text-[9px] md:text-[10px] text-green-400 font-black">
                        +${trade.profit.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradeLogs;
