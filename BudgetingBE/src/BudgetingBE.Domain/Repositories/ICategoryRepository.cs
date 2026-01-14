using BudgetingBE.Domain.Entities;

namespace BudgetingBE.Domain.Repositories;

public interface ICategoryRepository : IRepository<Category>
{
    Task<IEnumerable<Category>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Category>> GetByUserIdAndTypeAsync(Guid userId, TransactionType type, CancellationToken cancellationToken = default);
    Task<Category?> GetByIdAndUserIdAsync(int id, Guid userId, CancellationToken cancellationToken = default);
}
