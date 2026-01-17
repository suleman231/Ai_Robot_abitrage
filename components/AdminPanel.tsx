import React, { useState, useEffect, useRef } from 'react';
import { EXCHANGES, EXCHANGE_BRANDS } from '../constants.tsx';
import { UserProfile, AdminStats } from '../types';

interface AdminPanelProps {
  userProfile: UserProfile;
  tradesCount: number;
  totalProfit: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ userProfile, tradesCount, totalProfit }) => {
  const [stats, setStats] = useState<AdminStats>({
    threadUtilization: 42,
    neuralThroughput: 890,
    bufferLoad: 12,
    uptimeSeconds: 0
  });

  const [botSpeed, setBotSpeed] = useState(1.0); // Hz
  const [isEmergencyStop, setIsEmergencyStop] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        threadUtilization: Math.floor(35 + Math.random() * 20),
        neuralThroughput: Math.floor(800 + Math.random() * 200),
        bufferLoad: Math.floor(5 + Math.random() * 15),
        uptimeSeconds: prev.uptimeSeconds + 1
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSliderValue(val);
    if (val >= 95) {
      setIsEmergencyStop(true);
      setSliderValue(0);
    }
  };

  const handleSliderRelease = () => {
    if (sliderValue < 95) setSliderValue(0);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {isEmergencyStop && (
        <div className="bg-red-500/10 border border-red-500 p-3 rounded-xl flex items-center gap-3">
           <i className="fa-solid fa-triangle-exclamation text-red-500 text-lg"></i>
           <div className="flex-1">
              <p className="text-[9px] font-black text-red-500 uppercase">Emergency Stop Active</p>
           </div>
           <button onClick={() => setIsEmergencyStop(false)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase">Resume</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-[1.2rem] p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-6">System_Telemetry</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <div className="flex justify-between items-end">
                     <p className="text-[8px] font-black text-slate-400 uppercase">Threads</p>
                     <p className="text-base font-black mono text-slate-100">{stats.threadUtilization}%</p>
                  </div>
                  <div className="h-1 bg-slate-950 rounded-full border border-slate-800">
                     <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${stats.threadUtilization}%` }}></div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between items-end">
                     <p className="text-[8px] font-black text-slate-400 uppercase">Throughput</p>
                     <p className="text-base font-black mono text-slate-100">{stats.neuralThroughput}</p>
                  </div>
                  <div className="h-1 bg-slate-950 rounded-full border border-slate-800">
                     <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${(stats.neuralThroughput/1200)*100}%` }}></div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between items-end">
                     <p className="text-[8px] font-black text-slate-400 uppercase">Buffer</p>
                     <p className="text-base font-black mono text-slate-100">{stats.bufferLoad}%</p>
                  </div>
                  <div className="h-1 bg-slate-950 rounded-full border border-slate-800">
                     <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${stats.bufferLoad}%` }}></div>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-[1.2rem] p-6 shadow-xl">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-4">Registry</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
              {userProfile.keys.map(k => (
                <div key={k.exchange} className="p-2 bg-slate-950/40 rounded-xl border border-slate-800/50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <i className={`${EXCHANGE_BRANDS[k.exchange]?.icon} ${EXCHANGE_BRANDS[k.exchange]?.color} text-xs`}></i>
                      <p className="text-[8px] font-black text-slate-100 uppercase truncate max-w-[40px]">{k.exchange}</p>
                   </div>
                   <div className={`w-1.5 h-1.5 rounded-full ${k.isLinked ? 'bg-green-500' : 'bg-slate-800'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-[1.2rem] p-6 shadow-xl flex flex-col h-full">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-6 border-b border-slate-800 pb-2">Directives</h3>
            <div className="space-y-6 flex-1">
               <div className="space-y-3">
                  <div className="flex justify-between">
                     <label className="text-[8px] font-black text-slate-400 uppercase">Polling Rate</label>
                     <span className="text-[8px] font-black text-primary mono">{botSpeed} Hz</span>
                  </div>
                  <input type="range" min="0.5" max="10.0" step="0.5" value={botSpeed} onChange={(e) => setBotSpeed(parseFloat(e.target.value))} className="w-full accent-primary bg-slate-950 h-1 appearance-none cursor-pointer" />
               </div>
            </div>
            <div className="mt-8">
               {!isEmergencyStop ? (
                 <div className="relative p-1 bg-slate-950 border border-red-500/30 rounded-xl h-10 overflow-hidden">
                    <input type="range" min="0" max="100" value={sliderValue} onChange={handleSliderChange} onMouseUp={handleSliderRelease} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="h-full bg-red-600 rounded-lg flex items-center justify-end px-2" style={{ width: `${Math.max(20, sliderValue)}%` }}>
                       <i className="fa-solid fa-skull text-[10px] text-white"></i>
                    </div>
                 </div>
               ) : (
                 <button onClick={() => setIsEmergencyStop(false)} className="w-full py-3 bg-green-500 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">Restore Nodes</button>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;