
import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { SaleRecord, ForecastRecord } from '../types';
import { aggregateByTime, formatCurrency } from '../utils/dataUtils';
import { CHART_COLORS } from '../constants';

interface Props {
  history: SaleRecord[];
  forecast: ForecastRecord[];
}

export const ChartsSection: React.FC<Props> = ({ history, forecast }) => {
  const [segmentBy, setSegmentBy] = useState<'brand' | 'counter'>('brand');

  const combinedData = useMemo(() => {
    // If 'counter' is selected, we might have 170+ stores.
    // For the chart, we can't show 170 lines. We should filter to Top 5 + Others.
    
    // 1. Get raw aggregation
    const rawData = aggregateByTime(history, segmentBy);
    const rawForecast = aggregateByTime(forecast, segmentBy);
    const allData = [...rawData, ...rawForecast];

    if (segmentBy === 'brand') return allData;

    // 2. Logic for Counters: Find Top 5 counters by total volume
    const totals: Record<string, number> = {};
    history.forEach(r => {
      totals[r.counter] = (totals[r.counter] || 0) + r.amount;
    });
    
    const topCounters = Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([k]) => k);
    
    const topSet = new Set(topCounters);

    // Re-map data to collapse non-top counters into "Others"
    return allData.map(row => {
      const newRow: any = { name: row.name };
      let otherTotal = 0;
      
      Object.entries(row).forEach(([key, val]) => {
        if (key === 'name') return;
        if (topSet.has(key)) {
          newRow[key] = val;
        } else {
          otherTotal += (val as number);
        }
      });
      
      if (otherTotal > 0) newRow['Others'] = otherTotal;
      return newRow;
    });

  }, [history, forecast, segmentBy]);

  const keys = useMemo(() => {
    if (combinedData.length === 0) return [];
    return Object.keys(combinedData[0]).filter(k => k !== 'name');
  }, [combinedData]);

  // For the breakdown bar chart
  const forecastAgg = useMemo(() => {
    const raw = aggregateByTime(forecast, segmentBy);
    if (segmentBy === 'brand') return raw;

    // Same filtering for forecast chart
    const totals: Record<string, number> = {};
    forecast.forEach(r => {
      totals[r.counter] = (totals[r.counter] || 0) + r.forecastAmount;
    });
     const topCounters = Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([k]) => k);
    const topSet = new Set(topCounters);

    return raw.map(row => {
      const newRow: any = { name: row.name };
      let otherTotal = 0;
      Object.entries(row).forEach(([key, val]) => {
        if (key === 'name') return;
        if (topSet.has(key)) {
          newRow[key] = val;
        } else {
          otherTotal += (val as number);
        }
      });
      if (otherTotal > 0) newRow['Others'] = otherTotal;
      return newRow;
    });

  }, [forecast, segmentBy]);

  return (
    <div className="space-y-8">
      {/* Main Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Sales Trend & Forecast</h3>
            {segmentBy === 'counter' && (
              <p className="text-xs text-slate-500 mt-1">Showing Top 5 Stores vs Others due to high volume</p>
            )}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSegmentBy('brand')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                segmentBy === 'brand' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              By Brand
            </button>
            <button
              onClick={() => setSegmentBy('counter')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                segmentBy === 'counter' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              By Store
            </button>
          </div>
        </div>
        
        <div className="h-[400px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748B' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `RM${(value / 1000).toFixed(0)}k`} 
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              {keys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false} // Removed dots for cleaner look with many points
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-slate-400 text-center">
          Dotted lines or future dates indicate forecasted values based on Gemini AI analysis.
        </div>
      </div>

      {/* Breakdown Bar Chart (Forecast Only) */}
      {forecast.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Next Year Monthly Distribution ({segmentBy === 'brand' ? 'Brand' : 'Store'})</h3>
           <div className="h-[350px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastAgg} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#64748B' }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                   tickFormatter={(value) => `RM${(value / 1000).toFixed(0)}k`}
                   tick={{ fontSize: 12, fill: '#64748B' }}
                   axisLine={false}
                   tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{fill: '#F1F5F9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                {keys.map((key, index) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    stackId="a" 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    radius={[0, 0, 0, 0]} // Removed radius for stacked cleaner look
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      )}
    </div>
  );
};
