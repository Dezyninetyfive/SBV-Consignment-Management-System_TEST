
import React, { useState, useMemo } from 'react';
import { SaleRecord, ForecastRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '../utils/dataUtils';
import { Search, Download, Filter, TrendingUp, Edit2, Check, X } from 'lucide-react';

interface Props {
  history: SaleRecord[];
  forecast: ForecastRecord[];
  adjustments: Record<string, number>;
  onUpdateAdjustment: (month: string, brand: string, counter: string, amount: number) => void;
}

export const ForecastExplorer: React.FC<Props> = ({ history, forecast, adjustments, onUpdateAdjustment }) => {
  const [selectedCounter, setSelectedCounter] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit state
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Extract unique lists
  const counters = useMemo(() => {
    const set = new Set([...history.map(r => r.counter), ...forecast.map(r => r.counter)]);
    return Array.from(set).sort();
  }, [history, forecast]);

  const brands = useMemo(() => {
    const set = new Set([...history.map(r => r.brand), ...forecast.map(r => r.brand)]);
    return Array.from(set).sort();
  }, [history, forecast]);

  // Filter Data
  const filteredHistory = useMemo(() => {
    return history.filter(r => {
      const matchCounter = selectedCounter === 'All' || r.counter === selectedCounter;
      const matchBrand = selectedBrand === 'All' || r.brand === selectedBrand;
      return matchCounter && matchBrand;
    });
  }, [history, selectedCounter, selectedBrand]);

  const filteredForecast = useMemo(() => {
    return forecast.filter(r => {
      const matchCounter = selectedCounter === 'All' || r.counter === selectedCounter;
      const matchBrand = selectedBrand === 'All' || r.brand === selectedBrand;
      return matchCounter && matchBrand;
    });
  }, [forecast, selectedCounter, selectedBrand]);

  // Prepare Chart Data (Time Series)
  const chartData = useMemo(() => {
    const dataMap: Record<string, { name: string, history: number | null, forecast: number | null }> = {};

    // 1. Process History
    filteredHistory.forEach(r => {
      const key = r.date.substring(0, 7); // YYYY-MM
      if (!dataMap[key]) dataMap[key] = { name: key, history: 0, forecast: null };
      dataMap[key].history = (dataMap[key].history || 0) + r.amount;
    });

    // 2. Process Forecast
    filteredForecast.forEach(r => {
      const key = r.month;
      if (!dataMap[key]) dataMap[key] = { name: key, history: null, forecast: 0 };
      // If history exists for this month (overlap), usually we don't overwrite, but for visualization we separate lines
      // We start forecast line from null to avoid connecting back to 0
      dataMap[key].forecast = (dataMap[key].forecast || 0) + r.forecastAmount;
    });

    return Object.values(dataMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredHistory, filteredForecast]);

  // Export Specific View
  const handleExport = () => {
    const header = "Type,Month,Brand,Counter,Amount\n";
    const historyRows = filteredHistory.map(r => `History,${r.date},${r.brand},"${r.counter}",${r.amount}`).join('\n');
    const forecastRows = filteredForecast.map(r => `Forecast,${r.month},${r.brand},"${r.counter}",${r.forecastAmount}`).join('\n');
    
    const blob = new Blob([header + historyRows + '\n' + forecastRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_export_${selectedCounter}_${selectedBrand}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalForecastValue = filteredForecast.reduce((acc, curr) => acc + curr.forecastAmount, 0);

  const startEditing = (month: string, currentVal: number) => {
    setEditingMonth(month);
    setEditValue(currentVal.toString());
  };

  const saveEdit = (month: string) => {
    if (selectedBrand !== 'All' && selectedCounter !== 'All') {
      const val = parseFloat(editValue);
      if (!isNaN(val)) {
        onUpdateAdjustment(month, selectedBrand, selectedCounter, val);
      }
    }
    setEditingMonth(null);
  };

  const isSpecificView = selectedBrand !== 'All' && selectedCounter !== 'All';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} />
            Explore Specific Forecasts
          </h3>
          <p className="text-sm text-slate-500">Drill down into individual outlets and brands.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Search Store</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter stores..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Select Store</label>
          <select 
            value={selectedCounter}
            onChange={(e) => setSelectedCounter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm"
          >
            <option value="All">All Stores</option>
            {counters
              .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(c => <option key={c} value={c}>{c}</option>)
            }
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Select Brand</label>
          <select 
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm"
          >
            <option value="All">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 h-[400px] border border-slate-100 rounded-xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#64748B' }} 
                axisLine={false} 
                tickLine={false}
                minTickGap={30}
              />
              <YAxis 
                tickFormatter={(value) => `RM${(value/1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Line 
                name="Historical"
                type="monotone" 
                dataKey="history" 
                stroke="#64748B" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line 
                name="Forecast"
                type="monotone" 
                dataKey="forecast" 
                stroke="#4F46E5" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        <div className="lg:col-span-1 border border-slate-100 rounded-xl p-4 flex flex-col">
          <h4 className="font-semibold text-slate-800 mb-4">Forecast Summary</h4>
          
          <div className="bg-indigo-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-indigo-700 mb-1">Total Projected Sales</p>
            <p className="text-2xl font-bold text-indigo-900">{formatCurrency(totalForecastValue)}</p>
            <p className="text-xs text-indigo-600 mt-2">
              For {selectedCounter === 'All' ? 'All Stores' : selectedCounter} 
              {selectedBrand !== 'All' ? ` (${selectedBrand})` : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-right">Forecast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData
                  .filter(d => d.forecast !== null && d.forecast > 0)
                  .map(row => (
                    <tr key={row.name} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-700">{row.name}</td>
                      <td className="px-3 py-2 text-right font-mono text-indigo-600 font-medium">
                        {editingMonth === row.name && isSpecificView ? (
                          <div className="flex items-center justify-end gap-1">
                             <input 
                               type="number" 
                               value={editValue} 
                               onChange={(e) => setEditValue(e.target.value)}
                               className="w-20 px-1 py-0.5 border rounded text-right text-xs"
                               autoFocus
                             />
                             <button onClick={() => saveEdit(row.name)} className="text-emerald-600"><Check size={14}/></button>
                             <button onClick={() => setEditingMonth(null)} className="text-slate-400"><X size={14}/></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 group">
                             {formatCurrency(row.forecast || 0)}
                             {isSpecificView && (
                               <button 
                                 onClick={() => startEditing(row.name, row.forecast || 0)} 
                                 className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                 <Edit2 size={12} />
                               </button>
                             )}
                          </div>
                        )}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
