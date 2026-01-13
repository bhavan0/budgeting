using Microsoft.EntityFrameworkCore;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;
using BudgetingBE.Infrastructure.Data;

namespace BudgetingBE.Infrastructure.Repositories;

public class TodoRepository : Repository<Todo>, ITodoRepository
{
    public TodoRepository(AppDbContext context) : base(context) { }

    public override async Task<IEnumerable<Todo>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Todo>> GetCompletedAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(t => t.IsCompleted)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Todo>> GetPendingAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(t => !t.IsCompleted)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
