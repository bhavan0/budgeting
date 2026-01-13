using BudgetingBE.Domain.Repositories;
using BudgetingBE.Infrastructure.Data;

namespace BudgetingBE.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private ITodoRepository? _todoRepository;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public ITodoRepository Todos => _todoRepository ??= new TodoRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
