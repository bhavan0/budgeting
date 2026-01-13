using BudgetingBE.Domain.Entities;

namespace BudgetingBE.Domain.Repositories;

public interface ITodoRepository : IRepository<Todo>
{
    Task<IEnumerable<Todo>> GetCompletedAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Todo>> GetPendingAsync(CancellationToken cancellationToken = default);
}
