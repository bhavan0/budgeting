namespace BudgetingBE.Domain.Repositories;

public interface IUnitOfWork : IDisposable
{
    ITodoRepository Todos { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
