using BudgetingBE.Domain.Entities;

namespace BudgetingBE.Domain.Repositories;

public interface ITransactionRepository : IRepository<Transaction>
{
    Task<IEnumerable<Transaction>> GetByUserIdAsync(
        Guid userId, 
        DateTime? startDate = null, 
        DateTime? endDate = null,
        TransactionType? type = null,
        int? categoryId = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);
    
    Task<int> GetCountByUserIdAsync(
        Guid userId,
        DateTime? startDate = null,
        DateTime? endDate = null,
        TransactionType? type = null,
        int? categoryId = null,
        CancellationToken cancellationToken = default);
    
    Task<Transaction?> GetByIdAndUserIdAsync(int id, Guid userId, CancellationToken cancellationToken = default);
    
    Task<decimal> GetTotalByTypeAsync(
        Guid userId, 
        TransactionType type, 
        DateTime? startDate = null, 
        DateTime? endDate = null,
        CancellationToken cancellationToken = default);
    
    Task<IEnumerable<CategorySummary>> GetSummaryByCategoryAsync(
        Guid userId,
        TransactionType? type = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default);
    
    Task<IEnumerable<TimePeriodSummary>> GetSummaryOverTimeAsync(
        Guid userId,
        string period, // "daily", "weekly", "monthly"
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default);
}

public record CategorySummary(int CategoryId, string CategoryName, string? CategoryColor, decimal Total, int Count);
public record TimePeriodSummary(DateTime Date, decimal Income, decimal Expense);
