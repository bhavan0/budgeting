import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, TransactionType, Transaction } from '../lib/api';
import { TransactionModal } from '../components/TransactionModal';

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', typeFilter, page],
    queryFn: () =>
      transactionsApi.getAll({
        type: typeFilter === 'all' ? undefined : typeFilter,
        page,
        pageSize,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          + Add
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
        {(['all', TransactionType.Expense, TransactionType.Income] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => {
              setTypeFilter(filter);
              setPage(1);
            }}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
              typeFilter === filter
                ? filter === TransactionType.Income
                  ? 'bg-green-500/20 text-green-400'
                  : filter === TransactionType.Expense
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-indigo-500/20 text-indigo-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {filter === 'all' ? 'All' : filter === TransactionType.Income ? 'Income' : 'Expenses'}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-slate-700 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No transactions found
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {data?.data.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 flex items-center gap-3 hover:bg-slate-700/30 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${transaction.categoryColor}20` }}
                >
                  {transaction.categoryIcon || '💵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {transaction.description || transaction.categoryName}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {transaction.categoryName} • {formatDate(transaction.date)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      transaction.type === TransactionType.Income ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {transaction.type === TransactionType.Income ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="text-slate-400 text-sm">
              Page {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={editingTransaction}
      />
    </div>
  );
}
