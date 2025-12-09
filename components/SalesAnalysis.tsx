
import React, { useState, useMemo } from 'react';
import { SaleRecord, PlanningConfig, StoreProfile } from '../types';
import { formatCurrency, getMonthlyHistory } from '../utils/dataUtils';
import { SAMPLE_BRANDS } from '../constants';
import { ChevronDown, ChevronRight, TrendingUp, Target, AlertCircle, Search, Filter, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';

interface Props {
  history: SaleRecord[];
  planningData: PlanningConfig;
  stores: StoreProfile[];
}

export const SalesAnalysis: React.FC<Props> = ({ history, planningData, stores }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedStore, setSelectedStore] = useState('All');
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  // --- Data Processing ---

  const monthData = useMemo(() => {
    const data = [];
    
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${selectedYear}-${String(m).padStart(2, '0')}`;
      const monthName = new Date(selectedYear, m-1, 1).toLocaleString('default', { month: 'short' });

      // Aggregate Actuals
      const actuals = history
        .filter(r => {
           const d = new Date(r.date);
           return d.getFullYear() === selectedYear && d.getMonth() + 1 === m &&
                  (selectedBrand === 'All' || r.brand === selectedBrand) &&
                  (selectedStore === 'All' || r.counter === selectedStore);
        })
        .reduce((sum, r) => sum + r.amount, 0);

      // Aggregate Targets
      let target = 0;
      if (selectedStore !== 'All' && selectedBrand !== 'All') {
         // Specific Target
         target = planningData.targets[`${monthStr}|${selectedBrand}|${selectedStore}`] || 0;
      } else {
         // Sum Targets based on filters
         // Iterate through all possible targets keys
         Object.entries(planningData.targets).forEach(([key, val]) => {
            const [tDate, tBrand, tCounter] = key.split('|');
            if (tDate === monthStr &&
                (selectedBrand === 'All' || tBrand === selectedBrand) &&
                (selectedStore === 'All' || tCounter === selectedStore)) {
               target += val;
            }
         });
      }

      // Last Year Actuals
      const lyActuals = history
        .filter(r => {
           const d = new Date(r.date);
           return d.getFullYear() === selectedYear - 1 && d.getMonth() + 1 === m &&
                  (selectedBrand === 'All' || r.brand === selectedBrand) &&
                  (selectedStore === 'All' || r.counter === selectedStore);
        })
        .reduce((sum, r) => sum + r.amount, 0);

      data.push({
        monthIndex: m,
        monthName,
        actual: actuals,
        target: target,
        variance: actuals - target,
        achievement: target > 0 ? (actuals / target) * 100 : 0,
        ly: lyActuals,
        growth: lyActuals > 0 ? ((actuals - lyActuals) / lyActuals) * 100 : 0
      });
    }
    return data;
  }, [selectedYear, selectedBrand, selectedStore, history, planningData]);

  const ytdMetrics = useMemo(() => {
     return monthData.reduce((acc, curr) => ({
        actual: acc.actual + curr.actual,
        target: acc.target + curr.target,
        ly: acc.ly + curr.ly
     }), { actual: 0, target: 0, ly: 0 });
  }, [monthData]);

  const ytdAchievement = ytdMetrics.target > 0 ? (ytdMetrics.actual / ytdMetrics.target) * 100 : 0;
  const ytdGrowth = ytdMetrics.ly > 0 ? ((ytdMetrics.actual - ytdMetrics.ly) / ytdMetrics.ly) * 100 : 0;

  // --- Drill Down Data (Store Breakdown for Expanded Month) ---
  const drillDownData = useMemo(() => {
    if (expandedMonth === null) return [];
    
    // Get list of relevant stores
    let relevantStores = stores;
    if (selectedStore !== 'All') {
       relevantStores = stores.filter(s => s.name === selectedStore);
    }
    if (selectedBrand !== 'All') {
       relevantStores = relevantStores.filter(s => s.carriedBrands.includes(selectedBrand));
    }

    const monthStr = `${selectedYear}-${String(expandedMonth).padStart(2, '0')}`;

    return relevantStores.map(store => {
       // Calculate Actuals for this store/month
       const storeActual = history
         .filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === selectedYear && d.getMonth() + 1 === expandedMonth &&
                   r.counter === store.name &&
                   (selectedBrand === 'All' || r.brand === selectedBrand);
         })
         .reduce((sum, r) => sum + r.amount, 0);
       
       // Calculate Target
       let storeTarget = 0;
       if (selectedBrand !== 'All') {
          storeTarget = planningData.targets[`${monthStr}|${selectedBrand}|${store.name}`] || 0;
       } else {
          // Sum targets for all brands this store carries
          store.carriedBrands.forEach(b => {
             storeTarget += planningData.targets[`${monthStr}|${b}|${store.name}`] || 0;
          });
       }

       return {
         id: store.id,
         name: store.name,
         group: store.group,
         actual: storeActual,
         target: storeTarget,
         variance: storeActual - storeTarget,
         achievement: storeTarget > 0 ? (storeActual / storeTarget) * 100 : 0
       };
    }).sort((a, b) => b.actual - a.actual); // Top sellers first

  }, [expandedMonth, stores, selectedYear, selectedBrand, selectedStore, history, planningData]);


  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" />
              Sales Analysis
            </h2>
            <p className="text-sm text-slate-500">Year-to-Date Performance & Budget Variance</p>
         </div>

         <div className="flex flex-wrap gap-3">
            <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <select 
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                 className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
               >
                 <option value={2023}>2023</option>
                 <option value={2024}>2024</option>
                 <option value={2025}>2025</option>
                 <option value={2026}>2026</option>
               </select>
            </div>
            
            <div className="relative">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <select 
                 value={selectedBrand}
                 onChange={(e) => setSelectedBrand(e.target.value)}
                 className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
               >
                 <option value="All">All Brands</option>
                 {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
            </div>

            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <select 
                 value={selectedStore}
                 onChange={(e) => setSelectedStore(e.target.value)}
                 className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none max-w-[200px]"
               >
                 <option value="All">All Stores</option>
                 {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
               </select>
            </div>
         </div>
      </div>

      {/* YTD Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">YTD Actual Sales</p>
            <p className="text-2xl font-bold text-indigo-900">{formatCurrency(ytdMetrics.actual)}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">YTD Target (Budget)</p>
            <p className="text-2xl font-bold text-slate-700">{formatCurrency(ytdMetrics.target)}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Achievement %</p>
            <div className="flex items-end gap-2">
               <p className={`text-2xl font-bold ${ytdAchievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                 {ytdAchievement.toFixed(1)}%
               </p>
               <span className="text-xs text-slate-400 mb-1">of budget</span>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">YTD Growth (vs LY)</p>
            <div className="flex items-end gap-2">
               <p className={`text-2xl font-bold ${ytdGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                 {ytdGrowth > 0 ? '+' : ''}{ytdGrowth.toFixed(1)}%
               </p>
               <span className="text-xs text-slate-400 mb-1">vs last year</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Monthly Chart */}
         <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Monthly Performance Trend</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                     <XAxis dataKey="monthName" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} />
                     <Tooltip 
                        formatter={(val: number) => formatCurrency(val)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     />
                     <Legend />
                     <Bar dataKey="actual" name="Actual Sales" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                     <Line type="monotone" dataKey="target" name="Target (Budget)" stroke="#F59E0B" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Detailed Monthly Table */}
         <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Monthly Details</h3>
               <span className="text-xs text-slate-500 italic">Click on a month to see store breakdown</span>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase">
                     <tr>
                        <th className="px-6 py-3">Month</th>
                        <th className="px-6 py-3 text-right">Actual Sales</th>
                        <th className="px-6 py-3 text-right">Target (Budget)</th>
                        <th className="px-6 py-3 text-right">Variance $</th>
                        <th className="px-6 py-3 text-right">Achv %</th>
                        <th className="px-6 py-3 text-right text-slate-400">Last Year</th>
                        <th className="px-6 py-3 text-right">Growth</th>
                        <th className="px-6 py-3"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {monthData.map((row) => {
                        const isExpanded = expandedMonth === row.monthIndex;
                        return (
                           <React.Fragment key={row.monthIndex}>
                              <tr 
                                 className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                                 onClick={() => setExpandedMonth(isExpanded ? null : row.monthIndex)}
                              >
                                 <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                                    {isExpanded ? <ChevronDown size={16} className="text-indigo-600" /> : <ChevronRight size={16} className="text-slate-400" />}
                                    {row.monthName}
                                 </td>
                                 <td className="px-6 py-4 text-right font-bold text-indigo-900">{formatCurrency(row.actual)}</td>
                                 <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(row.target)}</td>
                                 <td className={`px-6 py-4 text-right font-medium ${row.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {row.variance >= 0 ? '+' : ''}{formatCurrency(row.variance)}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                       row.achievement >= 100 ? 'bg-emerald-100 text-emerald-700' : 
                                       row.achievement >= 80 ? 'bg-amber-100 text-amber-700' : 
                                       'bg-red-100 text-red-700'
                                    }`}>
                                       {row.achievement.toFixed(1)}%
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right text-slate-400">{formatCurrency(row.ly)}</td>
                                 <td className={`px-6 py-4 text-right font-medium ${row.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {row.growth > 0 ? '+' : ''}{row.growth.toFixed(1)}%
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button className="text-xs text-indigo-600 hover:underline">View Breakdown</button>
                                 </td>
                              </tr>
                              
                              {/* Drill Down Row */}
                              {isExpanded && (
                                 <tr className="bg-slate-50/50">
                                    <td colSpan={8} className="p-4">
                                       <div className="bg-white rounded-lg border border-slate-200 shadow-inner overflow-hidden animate-in slide-in-from-top-2">
                                          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                             <h4 className="font-bold text-slate-700 text-sm">Store Breakdown: {row.monthName} {selectedYear}</h4>
                                             <span className="text-xs text-slate-500">Sorted by Actual Sales</span>
                                          </div>
                                          <div className="max-h-[300px] overflow-y-auto">
                                             <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                                   <tr>
                                                      <th className="px-4 py-2">Store Name</th>
                                                      <th className="px-4 py-2">Group</th>
                                                      <th className="px-4 py-2 text-right">Actual</th>
                                                      <th className="px-4 py-2 text-right">Target</th>
                                                      <th className="px-4 py-2 text-right">Variance</th>
                                                      <th className="px-4 py-2 text-right">Achv %</th>
                                                   </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                   {drillDownData.map(store => (
                                                      <tr key={store.id} className="hover:bg-slate-50">
                                                         <td className="px-4 py-2 font-medium text-slate-700">{store.name}</td>
                                                         <td className="px-4 py-2 text-slate-500">{store.group}</td>
                                                         <td className="px-4 py-2 text-right font-bold text-indigo-900">{formatCurrency(store.actual)}</td>
                                                         <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(store.target)}</td>
                                                         <td className={`px-4 py-2 text-right font-medium ${store.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {formatCurrency(store.variance)}
                                                         </td>
                                                         <td className="px-4 py-2 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                               <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                  <div 
                                                                     className={`h-full rounded-full ${store.achievement >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                                     style={{ width: `${Math.min(store.achievement, 100)}%` }}
                                                                  />
                                                               </div>
                                                               <span>{store.achievement.toFixed(0)}%</span>
                                                            </div>
                                                         </td>
                                                      </tr>
                                                   ))}
                                                   {drillDownData.length === 0 && (
                                                      <tr><td colSpan={6} className="p-4 text-center text-slate-400">No data found for this period.</td></tr>
                                                   )}
                                                </tbody>
                                             </table>
                                          </div>
                                       </div>
                                    </td>
                                 </tr>
                              )}
                           </React.Fragment>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>

      </div>
    </div>
  );
};
