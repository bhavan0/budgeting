import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, transactionsApi, TransactionType, Category, CreateTransactionRequest, Transaction } from '../lib/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [error, setError] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories', type],
    queryFn: () => categoriesApi.getAll(type),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      handleClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTransactionRequest> }) =>
      transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      handleClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setDate(transaction.date.split('T')[0]);
      setCategoryId(transaction.categoryId);
    } else {
      resetForm();
    }
  }, [transaction, isOpen]);

  const resetForm = () => {
    setType(TransactionType.Expense);
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategoryId('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (categoryId === '') {
      setError('Please select a category');
      return;
    }

    const data: CreateTransactionRequest = {
      amount: parseFloat(amount),
      description: description || undefined,
      date: new Date(date).toISOString(),
      type,
      categoryId: categoryId as number,
    };

    if (transaction) {
      updateMutation.mutate({ id: transaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-t sm:border border-slate-700/50 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Handle for mobile */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-600 rounded-full mx-auto mt-3" />

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Type Toggle */}
            <div className="flex gap-2 p-1.5 bg-slate-900/80 rounded-xl border border-slate-700/50">
              <button
                type="button"
                onClick={() => {
                  setType(TransactionType.Expense);
                  setCategoryId('');
                }}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  type === TransactionType.Expense
                    ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 shadow-lg shadow-red-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setType(TransactionType.Income);
                  setCategoryId('');
                }}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  type === TransactionType.Income
                    ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 shadow-lg shadow-green-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
              <div className="flex items-center bg-slate-900/80 border border-slate-700/50 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
                <span className="pl-4 text-slate-400 text-lg font-medium select-none">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="flex-1 px-2 py-3.5 bg-transparent text-white text-lg font-medium placeholder-slate-600 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : '')}
                required
                className="w-full px-4 py-3.5 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
              >
                <option value="" className="bg-slate-900">Select category</option>
                {categories?.map((cat: Category) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="What was this for?"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3.5 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-200 border border-slate-600/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : transaction ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
