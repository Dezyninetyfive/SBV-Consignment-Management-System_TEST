
import React, { useState, useMemo } from 'react';
import { ForecastRecord, PlanningConfig, SaleRecord, StoreProfile } from '../types';
import { formatCurrency, getMonthlyHistory } from '../utils/dataUtils';
import { SAMPLE_BRANDS } from '../constants';
import { Target, DollarSign, Wallet, Search, ArrowRight, AlertTriangle, History, Wand2, Calculator } from 'lucide-react';

interface Props {
  stores: StoreProfile[];
  forecasts: ForecastRecord[];
  history: SaleRecord[];
  planningData: PlanningConfig;
  onUpdateTarget: (year: number, month: number, brand: string, counter: string, amount: number) => void;
  onUpdateMargin: (brand: string, margin: number) => void;
  onUpdateStockCover: (brand: string, counter: string, months: number) => void;
}

export const PlanningView: React.FC<Props> = ({ stores, forecasts, history, planningData, onUpdateTarget, onUpdateMargin, onUpdateStockCover }) => {
  const [selectedBrand, setSelectedBrand] = useState<string>(SAMPLE_BRANDS[0]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 1);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filter Logic
  const filteredStores = useMemo(() => {
    return stores.filter(s => 
      s.carriedBrands.includes(selectedBrand) &&
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, selectedBrand, searchTerm]);

  // 2. Data Preparation for Table
  const tableData = useMemo(() => {
    if (!selectedStore) return [];

    const rows = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${selectedYear}-${String(m).padStart(2, '0')}`;
      
      // Get AI Forecast
      const forecastItem = forecasts.find(f => 
        f.month === monthStr && 
        f.brand === selectedBrand && 
        f.counter === selectedStore
      );
      const forecastVal = forecastItem ? forecastItem.forecastAmount : 0;

      // Get Target
      const targetKey = `${monthStr}|${selectedBrand}|${selectedStore}`;
      const targetVal = planningData.targets[targetKey] || 0;

      // Get History (LY and LLY)
      const lyAmount = getMonthlyHistory(history, selectedBrand, selectedStore, selectedYear - 1, m);
      const llyAmount = getMonthlyHistory(history, selectedBrand, selectedStore, selectedYear - 2, m);

      // Calculate Budget
      const margin = planningData.margins[selectedBrand] || 40; 
      const costRatio = 1 - (margin / 100);
      const budgetVal = targetVal * costRatio;

      rows.push({
        monthIndex: m,
        monthName: new Date(selectedYear, m-1, 1).toLocaleString('default', { month: 'short' }),
        monthKey: monthStr,
        forecast: forecastVal,
        target: targetVal,
        budget: budgetVal,
        ly: lyAmount,
        lly: llyAmount,
        variance: targetVal - forecastVal
      });
    }
    return rows;
  }, [selectedBrand, selectedStore, selectedYear, forecasts, planningData, history]);

  // Totals
  const totals = useMemo(() => {
    return tableData.reduce((acc, row) => ({
      target: acc.target + row.target,
      forecast: acc.forecast + row.forecast,
      budget: acc.budget + row.budget,
      ly: acc.lly + row.ly,
      lly: acc.lly + row.lly
    }), { target: 0, forecast: 0, budget: 0, ly: 0, lly: 0 });
  }, [tableData]);

  // Stock Cover Logic
  const stockCoverKey = `${selectedBrand}|${selectedStore}`;
  const stockCoverMonths = planningData.targetStockCover?.[stockCoverKey] || 1.5; // Default 1.5 months
  
  // Estimate needed inventory value based on Avg Monthly Sales Target * Cost Ratio * Stock Cover
  const avgMonthlyTarget = totals.target / 12;
  const costRatio = 1 - ((planningData.margins[selectedBrand] || 40) / 100);
  const requiredStockValue = avgMonthlyTarget * costRatio * stockCoverMonths;

  // Quick Actions Handler
  const applyQuickTarget = (type: 'ly' | 'ly_plus_10' | 'ly_plus_20' | 'ai') => {
    if (!selectedStore) return;
    
    tableData.forEach(row => {
      let amount = 0;
      switch(type) {
        case 'ly': amount = row.ly; break;
        case 'ly_plus_10': amount = Math.floor(row.ly * 1.10); break;
        case 'ly_plus_20': amount = Math.floor(row.ly * 1.20); break;
        case 'ai': amount = row.forecast; break;
      }
      onUpdateTarget(selectedYear, row.monthIndex, selectedBrand, selectedStore, amount);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Global Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-indigo-600" />
            Budget & Targets Planning
          </h2>
          <p className="text-slate-500">
            Set sales targets based on historical performance and calculate procurement budgets.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <Wallet size={14} /> Brand Margins (%)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_BRANDS.map(brand => (
              <div key={brand} className="space-y-1">
                <label className="text-xs text-slate-500 block">{brand}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={planningData.margins[brand] || ''}
                    onChange={(e) => onUpdateMargin(brand, parseFloat(e.target.value))}
                    placeholder="40"
                    className="w-full pl-2 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-right font-medium"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-full">
            <h3 className="font-semibold text-slate-800 mb-4">Planning Context</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Target Year</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Brand</label>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_BRANDS.map(b => (
                    <button
                      key={b}
                      onClick={() => { setSelectedBrand(b); setSelectedStore(''); }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                        selectedBrand === b 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-500 uppercase">Select Store</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-2 focus:outline-none"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                  {filteredStores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStore(store.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${
                        selectedStore === store.name
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="truncate">{store.name}</span>
                      {selectedStore === store.name && <ArrowRight size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Table */}
        <div className="lg:col-span-3">
          {selectedStore ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">{selectedStore}</h3>
                  <p className="text-xs text-slate-500">
                    Planning: <span className="font-semibold text-indigo-600">{selectedBrand}</span> | Year: {selectedYear}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-slate-500 mr-2 flex items-center gap-1">
                    <Wand2 size={12} /> Quick Set:
                  </div>
                  <button onClick={() => applyQuickTarget('ly')} className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-xs rounded shadow-sm text-slate-600">
                    Same as LY
                  </button>
                  <button onClick={() => applyQuickTarget('ly_plus_10')} className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-xs rounded shadow-sm text-slate-600">
                    LY + 10%
                  </button>
                   <button onClick={() => applyQuickTarget('ai')} className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-xs rounded shadow-sm text-slate-600">
                    Use Forecast
                  </button>
                </div>
              </div>

              {/* Stock Budgeting Calculator */}
              <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calculator size={16} className="text-indigo-600" />
                  <span className="text-sm font-bold text-indigo-800">Inventory Planning</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600">Target Stock Cover (Months):</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={stockCoverMonths}
                    onChange={(e) => onUpdateStockCover(selectedBrand, selectedStore, parseFloat(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-indigo-200 rounded text-center focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                   <span className="text-xs text-slate-600">Required Stock Value:</span>
                   <span className="text-sm font-bold text-indigo-700">{formatCurrency(requiredStockValue)}</span>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Month</th>
                      <th className="px-4 py-3 text-right bg-slate-50/50 text-slate-400 font-normal">{selectedYear - 2} Act.</th>
                      <th className="px-4 py-3 text-right bg-slate-100 text-slate-600 border-r border-slate-200">{selectedYear - 1} Act.</th>
                      <th className="px-4 py-3 text-right text-indigo-600">AI Fcst</th>
                      <th className="px-4 py-3 text-right w-36 bg-yellow-50/30">Your Target</th>
                      <th className="px-4 py-3 text-right text-emerald-700 bg-emerald-50/30">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData.map((row) => (
                      <tr key={row.monthKey} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {row.monthName}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-400 bg-slate-50/30">
                          {row.lly > 0 ? formatCurrency(row.lly) : '-'}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-600 bg-slate-50 font-medium border-r border-slate-200">
                          {row.ly > 0 ? formatCurrency(row.ly) : '-'}
                        </td>
                        <td className="px-4 py-2 text-right text-indigo-600/80">
                          {row.forecast > 0 ? formatCurrency(row.forecast) : '-'}
                        </td>
                        <td className="px-4 py-2 text-right bg-yellow-50/30">
                           <div className="flex items-center justify-end">
                            <input
                              type="number"
                              value={row.target === 0 ? '' : row.target}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                onUpdateTarget(selectedYear, row.monthIndex, selectedBrand, selectedStore, val);
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-24 px-2 py-1 text-right border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-800 bg-white"
                              placeholder="0"
                            />
                           </div>
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-emerald-700 bg-emerald-50/30 font-medium">
                           {formatCurrency(row.budget)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                    <tr>
                      <td className="px-4 py-3 sticky left-0 bg-slate-50">Total</td>
                      <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(totals.lly)}</td>
                      <td className="px-4 py-3 text-right text-slate-600 border-r border-slate-200">{formatCurrency(totals.ly)}</td>
                      <td className="px-4 py-3 text-right text-indigo-600">{formatCurrency(totals.forecast)}</td>
                      <td className="px-4 py-3 text-right bg-yellow-50/30">{formatCurrency(totals.target)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 bg-emerald-50/30">{formatCurrency(totals.budget)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <History size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Select a Store to Plan</h3>
              <p className="text-slate-500 max-w-sm">
                View past years' records and set future targets for each counter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
