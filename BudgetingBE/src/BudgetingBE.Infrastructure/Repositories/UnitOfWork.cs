using BudgetingBE.Domain.Repositories;
using BudgetingBE.Infrastructure.Data;

namespace BudgetingBE.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IUserRepository? _userRepository;
    private ICategoryRepository? _categoryRepository;
    private ITransactionRepository? _transactionRepository;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => _userRepository ??= new UserRepository(_context);
    public ICategoryRepository Categories => _categoryRepository ??= new CategoryRepository(_context);
    public ITransactionRepository Transactions => _transactionRepository ??= new TransactionRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
