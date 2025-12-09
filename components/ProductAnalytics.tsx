
import React, { useMemo } from 'react';
import { StockMovement, Product } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { CHART_COLORS } from '../constants';

interface Props {
  movements: StockMovement[];
  products: Product[];
}

export const ProductAnalytics: React.FC<Props> = ({ movements, products }) => {
  
  const analyticsData = useMemo(() => {
     const sales = movements.filter(m => m.type === 'Sale');
     const productStats: Record<string, { sku: string, name: string, qtySold: number, brand: string }> = {};

     sales.forEach(s => {
        if(!productStats[s.productId]) {
           productStats[s.productId] = { 
              sku: s.sku, 
              name: s.productName, 
              qtySold: 0, 
              brand: products.find(p => p.id === s.productId)?.brand || 'Unknown' 
           };
        }
        productStats[s.productId].qtySold += Math.abs(s.quantity);
     });

     const sorted = Object.values(productStats).sort((a, b) => b.qtySold - a.qtySold);
     
     const topMovers = sorted.slice(0, 10);
     const slowMovers = sorted.slice(-10).reverse();

     // Brand Variant Analysis (e.g. Sales by Variant across all products)
     const variantStats: Record<string, number> = {};
     sales.forEach(s => {
        // Assume variant string like "Red-S" or "Red"
        // Try to extract just the color or primary variant if possible, or use full string
        const v = s.variant || 'Standard';
        variantStats[v] = (variantStats[v] || 0) + Math.abs(s.quantity);
     });
     
     const variantData = Object.entries(variantStats)
        .map(([name, val]) => ({ name, value: val }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 10); // Top 10 Variants

     return { topMovers, slowMovers, variantData };
  }, [movements, products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Fast Movers Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" /> Top 10 Fast Moving Products
             </h3>
             <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={analyticsData.topMovers} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" hide />
                      <YAxis 
                         dataKey="name" 
                         type="category" 
                         tick={{fontSize: 10, fill: '#64748B'}} 
                         width={120} 
                         axisLine={false} 
                         tickLine={false}
                      />
                      <Tooltip 
                         cursor={{fill: '#F8FAFC'}}
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="qtySold" name="Units Sold" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Variant Trends */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Package className="text-indigo-600" /> Best Selling Variants (Size/Color)
             </h3>
             <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={analyticsData.variantData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip 
                         cursor={{fill: '#F8FAFC'}}
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" name="Units Sold" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>

       {/* Slow Movers Table */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
             <AlertTriangle className="text-amber-500" size={18} />
             <h3 className="font-bold text-slate-800">Slow Moving Products (Last 30 Days)</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                   <tr>
                      <th className="px-6 py-3">Product Name</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Brand</th>
                      <th className="px-6 py-3 text-right">Units Sold</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {analyticsData.slowMovers.map(p => (
                      <tr key={p.sku} className="hover:bg-slate-50">
                         <td className="px-6 py-3 font-medium text-slate-700">{p.name}</td>
                         <td className="px-6 py-3 font-mono text-xs">{p.sku}</td>
                         <td className="px-6 py-3">{p.brand}</td>
                         <td className="px-6 py-3 text-right font-bold text-amber-600">{p.qtySold}</td>
                      </tr>
                   ))}
                   {analyticsData.slowMovers.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-slate-400">No data available.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};
