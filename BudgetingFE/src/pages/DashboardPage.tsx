import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { statsApi, transactionsApi, TransactionType } from '../lib/api';
import { TransactionModal } from '../components/TransactionModal';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // All-time stats for Balance
  const { data: summaryAllTime, isLoading: summaryAllTimeLoading } = useQuery({
    queryKey: ['stats', 'summary', 'all-time'],
    queryFn: () => statsApi.getSummary(),
  });

  // Monthly stats for Income/Expense and Trends
  const [dateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  });

  const { data: summaryMonthly, isLoading: summaryMonthlyLoading } = useQuery({
    queryKey: ['stats', 'summary', 'monthly', dateRange],
    queryFn: () => statsApi.getSummary(dateRange.start, dateRange.end),
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => transactionsApi.getAll({ pageSize: 5 }),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (val?: number) => {
    if (val === undefined || val === null) return null;
    const absVal = Math.abs(val);
    // Cap at 999% to avoid UI breakage
    const displayVal = absVal > 999 ? '>999' : absVal.toFixed(0);
    return `${val >= 0 ? '+' : '-'}${displayVal}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-slate-400 font-medium text-lg mb-1">{getGreeting()},</h2>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {user?.email?.split('@')[0] || 'User'}
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400/20 to-purple-400/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-2">
            <span className="text-xl leading-none">+</span>
            Add Transaction
          </span>
        </button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Income Card (Monthly) */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">📈</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Income (This Month)</p>
            <h3 className="text-2xl md:text-3xl font-bold text-emerald-400">
              {summaryMonthlyLoading ? (
                <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
              ) : (
                formatCurrency(summaryMonthly?.totalIncome || 0)
              )}
            </h3>
            {summaryMonthly?.incomeChange != null && (
              <div className="mt-4 flex items-center gap-2 text-emerald-500/80 text-sm font-medium">
                <span className={`px-2 py-0.5 rounded-full border ${
                    (summaryMonthly.incomeChange || 0) >= 0 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {formatPercentage(summaryMonthly.incomeChange)}
                </span>
                <span className="text-slate-500">vs last month</span>
              </div>
            )}
            {summaryMonthly?.incomeChange == null && !summaryMonthlyLoading && (
               <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <span>No previous data</span>
               </div>
            )}
          </div>
        </div>

        {/* Expenses Card (Monthly) */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">📉</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Expenses (This Month)</p>
            <h3 className="text-2xl md:text-3xl font-bold text-rose-400">
              {summaryMonthlyLoading ? (
                <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
              ) : (
                formatCurrency(summaryMonthly?.totalExpenses || 0)
              )}
            </h3>
            {summaryMonthly?.expensesChange != null && (
               <div className="mt-4 flex items-center gap-2 text-rose-500/80 text-sm font-medium">
                <span className={`px-2 py-0.5 rounded-full border ${
                    (summaryMonthly.expensesChange || 0) <= 0 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' // Fewer expenses is good? Or just color by direction? Usually expense increase is red.
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                   {/* Explicitly show + for increase */}
                   {summaryMonthly.expensesChange > 0 ? '+' : ''}{formatPercentage(summaryMonthly.expensesChange)?.replace('+', '')} 
                </span>
                <span className="text-slate-500">vs last month</span>
              </div>
            )}
             {summaryMonthly?.expensesChange == null && !summaryMonthlyLoading && (
               <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <span>No previous data</span>
               </div>
            )}
          </div>
        </div>

        {/* Balance Card (All Time) */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group md:col-span-1 border-indigo-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">💰</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-1">Current Balance (Total)</p>
            <h3 className={`text-2xl md:text-3xl font-bold ${(summaryAllTime?.balance || 0) >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>
              {summaryAllTimeLoading ? (
                <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
              ) : (
                formatCurrency(summaryAllTime?.balance || 0)
              )}
            </h3>
             <div className="mt-4 flex items-center gap-2 text-indigo-400/80 text-sm font-medium">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                Stable
              </span>
              <span className="text-slate-500">Healthy status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-semibold text-slate-200">Recent Transactions</h2>
          <Link 
            to="/transactions" 
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group"
          >
            View All
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
          {transactionsLoading ? (
            <div className="p-6 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-slate-800 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-800 rounded" />
                    <div className="h-3 w-20 bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : recentTransactions?.data.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center text-3xl mb-4">
                📝
              </div>
              <p className="text-slate-300 font-medium text-lg">No transactions yet</p>
              <p className="text-slate-500 text-sm max-w-xs mt-1">Start tracking your finances by adding your first transaction.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {recentTransactions?.data.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner border border-white/5 shrink-0"
                    style={{ 
                      backgroundColor: `${transaction.categoryColor}15`,
                      color: transaction.categoryColor 
                    }}
                  >
                    {transaction.categoryIcon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 font-medium truncate flex items-center gap-2">
                      {transaction.description || transaction.categoryName}
                      {!transaction.description && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">Default</span>
                      )}
                    </div>
                    <div className="text-slate-500 text-sm flex items-center gap-2 mt-0.5">
                      <span>{transaction.categoryName}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full" />
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold text-lg tabular-nums tracking-tight ${
                        transaction.type === TransactionType.Income 
                          ? 'text-emerald-400' 
                          : 'text-slate-200'
                      }`}
                    >
                      {transaction.type === TransactionType.Income ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
