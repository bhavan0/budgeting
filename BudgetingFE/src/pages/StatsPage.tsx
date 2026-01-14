import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi, TransactionType } from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';

type Period = 'daily' | 'weekly' | 'monthly';

export function StatsPage() {
  const [period, setPeriod] = useState<Period>('daily');
  const [chartType, setChartType] = useState<TransactionType>(TransactionType.Expense);

  // Get date range based on period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case 'weekly':
        start.setDate(start.getDate() - 84); // 12 weeks
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 12);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  const { data: summary } = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: () => statsApi.getSummary(),
  });

  const { data: categoryStats, isLoading: categoryLoading } = useQuery({
    queryKey: ['stats', 'by-category', chartType],
    queryFn: () => statsApi.getByCategory(chartType),
  });

  const { data: timeStats, isLoading: timeLoading } = useQuery({
    queryKey: ['stats', 'over-time', period, startDate, endDate],
    queryFn: () => statsApi.getOverTime(period, startDate, endDate),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (period) {
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'weekly':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const pieData = categoryStats?.map((cat) => ({
    name: cat.categoryName,
    value: cat.total,
    color: cat.categoryColor || '#6366f1',
  })) || [];

  const barData = timeStats?.map((stat) => ({
    date: formatDate(stat.date),
    Income: stat.income,
    Expense: stat.expense,
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Statistics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 text-center">
          <div className="text-slate-400 text-xs font-medium mb-1">Income</div>
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(summary?.totalIncome || 0)}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 text-center">
          <div className="text-slate-400 text-xs font-medium mb-1">Expenses</div>
          <div className="text-lg font-bold text-red-400">
            {formatCurrency(summary?.totalExpenses || 0)}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 text-center">
          <div className="text-slate-400 text-xs font-medium mb-1">Balance</div>
          <div className={`text-lg font-bold ${(summary?.balance || 0) >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>
            {formatCurrency(summary?.balance || 0)}
          </div>
        </div>
      </div>

      {/* Pie Chart - By Category */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">By Category</h2>
          <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg">
            <button
              onClick={() => setChartType(TransactionType.Expense)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                chartType === TransactionType.Expense
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setChartType(TransactionType.Income)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                chartType === TransactionType.Income
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {categoryLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pieData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No data available
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        {pieData.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-400 text-xs">{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bar/Line Chart - Over Time */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Over Time</h2>
          <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${
                  period === p
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {timeLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : barData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No data available
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={0}>
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar dataKey="Income" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trend Line Chart */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Net Balance Trend</h2>

        {timeLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeStats?.map((stat) => ({
                date: formatDate(stat.date),
                Net: stat.income - stat.expense,
              })) || []}>
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Net"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={{ fill: '#818cf8', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
