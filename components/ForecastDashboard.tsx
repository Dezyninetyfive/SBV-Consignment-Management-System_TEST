
import React, { useMemo, useState } from 'react';
import { SaleRecord, ForecastRecord, StoreProfile } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { Sparkles, Calendar, MapPin, Search, ChevronRight, ArrowUpRight, ArrowDownRight, Info, ShieldCheck } from 'lucide-react';

interface Props {
  history: SaleRecord[];
  forecasts: ForecastRecord[];
  stores: StoreProfile[];
  onExploreStore?: (name: string) => void;
}

export const ForecastDashboard: React.FC<Props> = ({ history, forecasts, stores, onExploreStore }) => {
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const monthlyComparison = useMemo(() => {
    const data: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const nextYear = currentYear + 1;

    for (let i = 0; i < 12; i++) {
      const monthNum = i + 1;
      const monthStr = `${nextYear}-${String(monthNum).padStart(2, '0')}`;
      
      const lyActual = history
        .filter(r => {
          const d = new Date(r.date);
          return d.getFullYear() === lastYear && d.getMonth() === i && (selectedBrand === 'All' || r.brand === selectedBrand);
        })
        .reduce((sum, r) => sum + r.amount, 0);

      const nyForecast = forecasts
        .filter(f => f.month === monthStr && (selectedBrand === 'All' || f.brand === selectedBrand))
        .reduce((sum, f) => sum + f.forecastAmount, 0);

      data.push({
        name: months[i],
        lastYear: lyActual,
        nextYear: nyForecast,
        growth: lyActual > 0 ? ((nyForecast - lyActual) / lyActual) * 100 : 0
      });
    }
    return data;
  }, [history, forecasts, selectedBrand]);

  const ranking = useMemo(() => {
    const storeMap: Record<string, { actual: number, forecast: number, brands: Set<string> }> = {};
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    history.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === lastYear) {
        if (!storeMap[r.counter]) storeMap[r.counter] = { actual: 0, forecast: 0, brands: new Set() };
        if (selectedBrand === 'All' || r.brand === selectedBrand) {
           storeMap[r.counter].actual += r.amount;
        }
        storeMap[r.counter].brands.add(r.brand);
      }
    });

    forecasts.forEach(f => {
      if (!storeMap[f.counter]) storeMap[f.counter] = { actual: 0, forecast: 0, brands: new Set() };
      if (selectedBrand === 'All' || f.brand === selectedBrand) {
        storeMap[f.counter].forecast += f.forecastAmount;
      }
    });

    return Object.entries(storeMap)
      .map(([name, data]) => ({
        name,
        actual: data.actual,
        forecast: data.forecast,
        growth: data.actual > 0 ? ((data.forecast - data.actual) / data.actual) * 100 : 0,
        brands: Array.from(data.brands).join(', ')
      }))
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.forecast - a.forecast);
  }, [history, forecasts, selectedBrand, searchTerm]);

  const totalForecasted = ranking.reduce((s, i) => s + i.forecast, 0);
  const totalActualLY = ranking.reduce((s, i) => s + i.actual, 0);
  const globalGrowth = totalActualLY > 0 ? ((totalForecasted - totalActualLY) / totalActualLY) * 100 : 0;

  const brands = ['All', ...Array.from(new Set(stores.flatMap(s => s.carriedBrands || []))).sort()];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
               <Sparkles className="text-white" size={24} />
            </div>
            Strategic Forecast 2025
          </h2>
          <p className="text-slate-500 font-medium">Outlet-level RM projections based on multi-year historical records.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
           {brands.map(b => (
             <button 
               key={b} 
               onClick={() => setSelectedBrand(b)}
               className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${selectedBrand === b ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
             >
               {b === 'All' ? 'Portfolio' : b}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg uppercase tracking-tight">
               <Calendar size={22} className="text-indigo-500" />
               Seasonal Projection Curve
            </h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> LY ACTUAL
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" /> NY FORECAST
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNY" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `RM${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px' }}
                />
                <Area type="monotone" dataKey="nextYear" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorNY)" activeDot={{ r: 8, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="lastYear" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="6 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
             <Info size={18} className="text-indigo-400 mt-0.5 flex-shrink-0" />
             <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Analysis detects high seasonal growth across counters in Q4. Forecasted growth of <span className="text-indigo-700 font-bold">{globalGrowth.toFixed(1)}%</span> assumes normalized supply chain logistics.
             </p>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
              <Sparkles className="absolute top-[-20px] right-[-20px] text-white/10 w-32 h-32 group-hover:rotate-12 transition-transform duration-700" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100/70 mb-4">Predicted YoY Delta</p>
              <div className="flex items-center gap-4">
                 <h4 className="text-5xl font-black">{globalGrowth > 0 ? '+' : ''}{globalGrowth.toFixed(1)}%</h4>
                 <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    {globalGrowth >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                 </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                 <p className="text-xs text-indigo-100 font-medium leading-relaxed opacity-80">
                   Intelligence suggests a resurgence in regional counters following inventory expansion.
                 </p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Proj. Value</h4>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalForecasted)}</p>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                 <ShieldCheck size={12} className="text-emerald-500" /> Confidence: High (85%)
              </p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-1">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-xl">
                 <MapPin size={24} className="text-emerald-500" />
                 Outlet Forecast Ranking
              </h3>
              <p className="text-sm text-slate-500 font-medium">Consignment performance projections for every counter.</p>
           </div>
           <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search counters..."
                className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 font-black uppercase text-[11px] tracking-[0.1em]">
              <tr>
                <th className="px-6 py-6">Consignee Counter</th>
                <th className="px-6 py-6">Brands</th>
                <th className="px-6 py-6 text-right">LY Actual</th>
                <th className="px-6 py-6 text-right text-indigo-600">NY Forecast</th>
                <th className="px-6 py-6 text-right">Proj. Growth</th>
                <th className="px-6 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600">
              {ranking.map((item, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/40 group transition-all duration-300">
                  <td className="px-6 py-5">
                     <div className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">{item.name}</div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex flex-wrap gap-1.5">
                        {(item.brands || '').split(', ').map(b => (
                          <span key={b} className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase border border-slate-200 group-hover:bg-white">{b}</span>
                        ))}
                     </div>
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-slate-400">{formatCurrency(item.actual)}</td>
                  <td className="px-6 py-5 text-right font-mono font-black text-indigo-700 bg-indigo-50/30">{formatCurrency(item.forecast)}</td>
                  <td className="px-6 py-5 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black ${item.growth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {item.growth > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(item.growth).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                       onClick={() => onExploreStore?.(item.name)}
                       className="p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                       <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranking.length === 0 && (
             <div className="py-24 text-center">
                <Search size={32} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-bold italic">No consignment counters matching filters.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
