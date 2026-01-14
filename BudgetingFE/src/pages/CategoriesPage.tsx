import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, TransactionType, Category, CreateCategoryRequest } from '../lib/api';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#B0BEC5', '#4CAF50', '#8BC34A', '#00BCD4', '#9C27B0', '#FF9800'];
const ICONS = ['🍽️', '🚗', '🛍️', '🎬', '📱', '🏥', '📦', '💰', '💻', '📈', '💵', '🏠', '✈️', '🎮', '📚', '🎁'];

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [typeFilter, setTypeFilter] = useState<TransactionType>(TransactionType.Expense);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#4ECDC4');
  const [error, setError] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', typeFilter],
    queryFn: () => categoriesApi.getAll(typeFilter),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCategoryRequest> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon || '📦');
    setColor(category.color || '#4ECDC4');
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure? Transactions using this category will not be deleted.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(undefined);
    setName('');
    setIcon('📦');
    setColor('#4ECDC4');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: { name, icon, color },
      });
    } else {
      createMutation.mutate({
        name,
        icon,
        color,
        type: typeFilter,
      });
    }
  };

  const isLoading2 = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          + Add
        </button>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
        <button
          onClick={() => setTypeFilter(TransactionType.Expense)}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
            typeFilter === TransactionType.Expense
              ? 'bg-red-500/20 text-red-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Expense Categories
        </button>
        <button
          onClick={() => setTypeFilter(TransactionType.Income)}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
            typeFilter === TransactionType.Income
              ? 'bg-green-500/20 text-green-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Income Categories
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl p-4 animate-pulse">
              <div className="w-12 h-12 bg-slate-700 rounded-xl mb-3" />
              <div className="h-4 w-20 bg-slate-700 rounded" />
            </div>
          ))
        ) : categories?.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400">
            No categories yet. Add your first one!
          </div>
        ) : (
          categories?.map((category) => (
            <div
              key={category.id}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 hover:bg-slate-700/30 transition-colors group relative"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon}
              </div>
              <div className="text-white font-medium truncate">{category.name}</div>
              <div className="flex items-center gap-1 mt-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-slate-400 text-xs">{category.color}</span>
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full sm:max-w-md bg-slate-800 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="sm:hidden w-12 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-6">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Category name"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                        icon === i
                          ? 'bg-indigo-500/30 ring-2 ring-indigo-500'
                          : 'bg-slate-700/50 hover:bg-slate-700'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading2}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {isLoading2 ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
