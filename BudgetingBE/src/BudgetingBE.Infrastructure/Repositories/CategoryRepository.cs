using Microsoft.EntityFrameworkCore;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;
using BudgetingBE.Infrastructure.Data;

namespace BudgetingBE.Infrastructure.Repositories;

public class CategoryRepository : Repository<Category>, ICategoryRepository
{
    public CategoryRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Category>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Type)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Category>> GetByUserIdAndTypeAsync(Guid userId, TransactionType type, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.UserId == userId && c.Type == type)
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetByIdAndUserIdAsync(int id, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);
    }
}
