
import React, { useMemo, useState } from 'react';
import { SaleRecord, StoreProfile } from '../types';
import { aggregateSalesByDimension, formatCurrency } from '../utils/dataUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Map as MapIcon, Building2, TrendingUp, Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { CHART_COLORS } from '../constants';

interface Props {
  history: SaleRecord[];
  stores: StoreProfile[];
  onStoreClick?: (storeName: string) => void;
}

export const SalesIntelligence: React.FC<Props> = ({ history, stores, onStoreClick }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const salesByRegion = useMemo(() => aggregateSalesByDimension(history, stores, 'region'), [history, stores]);
  const salesByGroup = useMemo(() => aggregateSalesByDimension(history, stores, 'group'), [history, stores]);

  // Store Rankings
  const storeRankings = useMemo(() => {
    const storeSales: Record<string, number> = {};
    const storeMeta = new Map<string, StoreProfile>(stores.map(s => [s.name, s] as [string, StoreProfile]));

    history.forEach(r => {
      storeSales[r.counter] = (storeSales[r.counter] || 0) + r.amount;
    });

    const ranking = Object.entries(storeSales).map(([name, amount]) => {
      const meta = storeMeta.get(name);
      return {
        name,
        amount,
        group: meta?.group || 'Unknown',
        region: meta?.region || 'Unknown',
        brands: meta?.carriedBrands.join(', ') || ''
      };
    });

    // Default Sort: Amount Descending
    if (!sortConfig) {
      return ranking.sort((a, b) => b.amount - a.amount).slice(0, 50); // Top 50 default
    }

    return ranking.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }).slice(0, 50);

  }, [history, stores, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <div className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800">Sales Intelligence & Rankings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* By Region Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
            <MapIcon size={16} /> Sales by Region
          </h3>
          <div className="h-[250px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByRegion} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12, fill: '#64748B' }} 
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                   formatter={(value: number) => formatCurrency(value)}
                   cursor={{fill: '#F8FAFC'}}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {salesByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Group Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
            <Building2 size={16} /> Sales by Retail Group
          </h3>
          <div className="h-[250px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByGroup} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                   formatter={(value: number) => formatCurrency(value)}
                   cursor={{fill: '#F8FAFC'}}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#8B5CF6">
                  {salesByGroup.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Stores Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            Top Performing Stores
          </h3>
          <span className="text-xs text-slate-400">Showing Top 50</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">Store Name <SortIcon column="name"/></div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('group')}
                >
                  <div className="flex items-center gap-1">Group <SortIcon column="group"/></div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('region')}
                >
                  <div className="flex items-center gap-1">Region <SortIcon column="region"/></div>
                </th>
                <th className="px-6 py-4">Brands</th>
                <th 
                  className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">Total Sales <SortIcon column="amount"/></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {storeRankings.map((store, idx) => (
                <tr 
                  key={store.name} 
                  className={`transition-colors ${onStoreClick ? 'cursor-pointer hover:bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                  onClick={() => onStoreClick && onStoreClick(store.name)}
                >
                  <td className="px-6 py-3 font-medium text-slate-900 flex items-center gap-2">
                    <span className={`
                      flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                      ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {idx + 1}
                    </span>
                    <span className={onStoreClick ? 'text-indigo-600 hover:underline' : ''}>
                      {store.name}
                    </span>
                  </td>
                  <td className="px-6 py-3">{store.group}</td>
                  <td className="px-6 py-3">{store.region}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">{store.brands}</td>
                  <td className="px-6 py-3 text-right font-mono font-medium text-indigo-900">
                    {formatCurrency(store.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
