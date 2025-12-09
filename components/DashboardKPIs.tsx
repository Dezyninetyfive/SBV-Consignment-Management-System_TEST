
import React, { useMemo } from 'react';
import { SaleRecord, PlanningConfig, InventoryItem, StockMovement, Product } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { SAMPLE_BRANDS } from '../constants';
import { Target, TrendingUp, Package, AlertTriangle, ArrowRight, Clock } from 'lucide-react';

interface Props {
  history: SaleRecord[];
  planningData: PlanningConfig;
  inventory: InventoryItem[];
  movements: StockMovement[];
  products: Product[];
  onStoreClick?: (storeName: string) => void;
}

export const DashboardKPIs: React.FC<Props> = ({ history, planningData, inventory, movements, products, onStoreClick }) => {
  const kpiData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // --- 1. Sales vs Target (YTD) ---
    const ytdSales: Record<string, number> = {};
    const ytdTargets: Record<string, number> = {};
    let totalActual = 0;
    let totalTarget = 0;

    // Actuals
    history.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === currentYear) {
        ytdSales[r.brand] = (ytdSales[r.brand] || 0) + r.amount;
        totalActual += r.amount;
      }
    });

    // Targets
    Object.entries(planningData.targets).forEach(([key, amount]) => {
      const [dateStr, brand] = key.split('|');
      if (dateStr.startsWith(`${currentYear}-`)) {
        ytdTargets[brand] = (ytdTargets[brand] || 0) + (amount as number);
        totalTarget += (amount as number);
      }
    });

    // --- 2. Sell-Through (Last 30 Days) ---
    // Formula: Units Sold / (Units Sold + Units On Hand)
    const salesQty30d: Record<string, number> = {};
    const stockQty: Record<string, number> = {};
    
    // Calculate Sales Qty (Absolute value from movements)
    movements.forEach(m => {
      if (m.type === 'Sale' && new Date(m.date) >= thirtyDaysAgo) {
        // Try to find brand
        const prod = products.find(p => p.id === m.productId);
        const brand = prod?.brand || 'Unknown';
        salesQty30d[brand] = (salesQty30d[brand] || 0) + Math.abs(m.quantity);
      }
    });

    // Calculate Stock Qty
    inventory.forEach(i => {
      stockQty[i.brand] = (stockQty[i.brand] || 0) + i.quantity;
    });

    // --- 3. Stock Days Cover ---
    // Formula: Current Stock Units / (Sales Units 30d / 30)
    const brandMetrics = SAMPLE_BRANDS.map(brand => {
      const actual = ytdSales[brand] || 0;
      const target = ytdTargets[brand] || 0;
      const achievement = target > 0 ? (actual / target) * 100 : 0;

      const sold30 = salesQty30d[brand] || 0;
      const onHand = stockQty[brand] || 0;
      const sellThrough = (sold30 + onHand) > 0 ? (sold30 / (sold30 + onHand)) * 100 : 0;

      const dailySales = sold30 / 30;
      const daysCover = dailySales > 0 ? onHand / dailySales : onHand > 0 ? 999 : 0;

      return { brand, actual, target, achievement, sellThrough, daysCover, onHand };
    });

    // Store Level Risks (Top 3 Highest Days Cover & Top 3 Lowest)
    const storeStats: Record<string, {name: string, stock: number, sales30: number}> = {};
    
    inventory.forEach(i => {
        if (!storeStats[i.storeId]) storeStats[i.storeId] = { name: i.storeName, stock: 0, sales30: 0 };
        storeStats[i.storeId].stock += i.quantity;
    });

    movements.forEach(m => {
        if (m.type === 'Sale' && new Date(m.date) >= thirtyDaysAgo) {
            if (storeStats[m.storeId]) {
                storeStats[m.storeId].sales30 += Math.abs(m.quantity);
            }
        }
    });

    const storeRisks = Object.values(storeStats)
        .map(s => {
            const daily = s.sales30 / 30;
            const cover = daily > 0 ? s.stock / daily : (s.stock > 0 ? 999 : 0);
            return { ...s, cover };
        })
        .filter(s => s.stock > 0)
        .sort((a, b) => b.cover - a.cover);

    const overstocked = storeRisks.filter(s => s.cover > 120).slice(0, 3); // > 4 months
    const understocked = storeRisks.filter(s => s.cover < 15).reverse().slice(0, 3); // < 2 weeks (sorted asc)

    return { 
      totalActual, 
      totalTarget, 
      totalAchievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
      brandMetrics,
      overstocked,
      understocked
    };
  }, [history, planningData, inventory, movements, products]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in slide-in-from-bottom-2">
      
      {/* KPI 1: Sales vs Target */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-indigo-600" size={18} />
            Sales Achievement (YTD)
          </h3>
          <span className={`text-xs font-bold px-2 py-1 rounded ${kpiData.totalAchievement >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {kpiData.totalAchievement.toFixed(1)}%
          </span>
        </div>
        
        <div className="space-y-4 flex-1">
          {kpiData.brandMetrics.map(m => (
            <div key={m.brand} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">{m.brand}</span>
                <span className="text-slate-500">{formatCurrency(m.actual)} / {formatCurrency(m.target)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${m.achievement >= 100 ? 'bg-emerald-500' : m.achievement >= 80 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(m.achievement, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI 2: Sell-Through & Velocity */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={18} />
            Sell-Through (30 Days)
          </h3>
        </div>
        
        <div className="space-y-4 flex-1">
           <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 font-semibold uppercase border-b border-slate-100 pb-2">
              <div className="text-left">Brand</div>
              <div>ST %</div>
              <div className="text-right">Days Cover</div>
           </div>
           {kpiData.brandMetrics.map(m => (
             <div key={m.brand} className="grid grid-cols-3 gap-2 items-center text-sm">
                <div className="font-medium text-slate-700">{m.brand}</div>
                <div className="text-center font-mono text-indigo-700 font-bold">{m.sellThrough.toFixed(1)}%</div>
                <div className="text-right font-mono text-slate-600">{m.daysCover > 365 ? '>1yr' : m.daysCover.toFixed(0)} days</div>
             </div>
           ))}
           <div className="mt-4 pt-3 border-t border-slate-50 text-xs text-slate-400">
              * Higher ST% indicates faster moving stock.
           </div>
        </div>
      </div>

      {/* KPI 3: Stock Risks */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            Inventory Risks
          </h3>
        </div>
        
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[200px] pr-1">
           {kpiData.understocked.length > 0 && (
             <div>
                <p className="text-xs font-bold text-red-600 uppercase mb-2">Potential Stock Outs (&lt;15 Days)</p>
                <div className="space-y-2">
                   {kpiData.understocked.map(s => (
                      <div 
                        key={s.name} 
                        className={`flex justify-between text-xs bg-red-50 p-2 rounded border border-red-100 ${onStoreClick ? 'cursor-pointer hover:bg-red-100' : ''}`}
                        onClick={() => onStoreClick && onStoreClick(s.name)}
                      >
                         <span className="truncate max-w-[140px] text-red-800 font-medium" title={s.name}>{s.name}</span>
                         <span className="font-bold text-red-700">{s.cover.toFixed(0)} days</span>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {kpiData.overstocked.length > 0 && (
             <div>
                <p className="text-xs font-bold text-amber-600 uppercase mb-2">Overstocked Stores (&gt;120 Days)</p>
                <div className="space-y-2">
                   {kpiData.overstocked.map(s => (
                      <div 
                        key={s.name} 
                        className={`flex justify-between text-xs bg-amber-50 p-2 rounded border border-amber-100 ${onStoreClick ? 'cursor-pointer hover:bg-amber-100' : ''}`}
                        onClick={() => onStoreClick && onStoreClick(s.name)}
                      >
                         <span className="truncate max-w-[140px] text-amber-800 font-medium" title={s.name}>{s.name}</span>
                         <span className="font-bold text-amber-700">{s.cover > 365 ? '1yr+' : s.cover.toFixed(0) + ' days'}</span>
                      </div>
                   ))}
                </div>
             </div>
           )}
           
           {kpiData.understocked.length === 0 && kpiData.overstocked.length === 0 && (
              <div className="text-center text-slate-400 py-8 text-sm">
                 Healthy inventory levels across all stores.
              </div>
           )}
        </div>
      </div>

    </div>
  );
};
