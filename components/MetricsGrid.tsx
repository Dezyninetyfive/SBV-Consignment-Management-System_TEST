import React from 'react';
import { SaleRecord, ForecastRecord } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { TrendingUp, DollarSign, Calendar, PieChart } from 'lucide-react';

interface Props {
  history: SaleRecord[];
  forecast: ForecastRecord[];
}

export const MetricsGrid: React.FC<Props> = ({ history, forecast }) => {
  const totalHistory = history.reduce((sum, r) => sum + r.amount, 0);
  const totalForecast = forecast.reduce((sum, r) => sum + r.forecastAmount, 0);
  
  // Calculate average monthly sales
  const historicalMonths = new Set(history.map(r => r.date.substring(0, 7))).size || 1;
  const avgMonthlyHistory = totalHistory / historicalMonths;
  
  const forecastMonths = new Set(forecast.map(r => r.month)).size || 1;
  const avgMonthlyForecast = totalForecast / forecastMonths;

  const growth = avgMonthlyHistory ? ((avgMonthlyForecast - avgMonthlyHistory) / avgMonthlyHistory) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
          <DollarSign size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Historical Total</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalHistory)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Projected Annual</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalForecast)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${growth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          <PieChart size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Expected Growth</p>
          <h3 className={`text-2xl font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
          <Calendar size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Data Points</p>
          <h3 className="text-2xl font-bold text-slate-800">
            {history.length + forecast.length}
          </h3>
        </div>
      </div>
    </div>
  );
};
