using Microsoft.EntityFrameworkCore;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;
using BudgetingBE.Infrastructure.Data;

namespace BudgetingBE.Infrastructure.Repositories;

public class TransactionRepository : Repository<Transaction>, ITransactionRepository
{
    public TransactionRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Transaction>> GetByUserIdAsync(
        Guid userId,
        DateTime? startDate = null,
        DateTime? endDate = null,
        TransactionType? type = null,
        int? categoryId = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = BuildFilteredQuery(userId, startDate, endDate, type, categoryId);

        return await query
            .Include(t => t.Category)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountByUserIdAsync(
        Guid userId,
        DateTime? startDate = null,
        DateTime? endDate = null,
        TransactionType? type = null,
        int? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        var query = BuildFilteredQuery(userId, startDate, endDate, type, categoryId);
        return await query.CountAsync(cancellationToken);
    }

    public async Task<Transaction?> GetByIdAndUserIdAsync(int id, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, cancellationToken);
    }

    public async Task<decimal> GetTotalByTypeAsync(
        Guid userId,
        TransactionType type,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(t => t.UserId == userId && t.Type == type);

        if (startDate.HasValue)
            query = query.Where(t => t.Date >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(t => t.Date <= endDate.Value);

        return await query.SumAsync(t => t.Amount, cancellationToken);
    }

    public async Task<IEnumerable<CategorySummary>> GetSummaryByCategoryAsync(
        Guid userId,
        TransactionType? type = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(t => t.UserId == userId);

        if (type.HasValue)
            query = query.Where(t => t.Type == type.Value);
        if (startDate.HasValue)
            query = query.Where(t => t.Date >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(t => t.Date <= endDate.Value);

        return await query
            .GroupBy(t => new { t.CategoryId, t.Category.Name, t.Category.Color })
            .Select(g => new CategorySummary(
                g.Key.CategoryId,
                g.Key.Name,
                g.Key.Color,
                g.Sum(t => t.Amount),
                g.Count()))
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<TimePeriodSummary>> GetSummaryOverTimeAsync(
        Guid userId,
        string period,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(t => t.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(t => t.Date >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(t => t.Date <= endDate.Value);

        // Fetch data first, then group in memory to avoid EF translation issues
        var transactions = await query
            .Select(t => new { t.Date, t.Type, t.Amount })
            .ToListAsync(cancellationToken);

        var grouped = period.ToLower() switch
        {
            "weekly" => transactions
                .GroupBy(t => new { t.Date.Year, Week = System.Globalization.ISOWeek.GetWeekOfYear(t.Date) })
                .Select(g => new TimePeriodSummary(
                    g.Min(t => t.Date),
                    g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                    g.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)
                )),
            "monthly" => transactions
                .GroupBy(t => new { t.Date.Year, t.Date.Month })
                .Select(g => new TimePeriodSummary(
                    new DateTime(g.Key.Year, g.Key.Month, 1),
                    g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                    g.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)
                )),
            _ => transactions
                .GroupBy(t => t.Date.Date)
                .Select(g => new TimePeriodSummary(
                    g.Key,
                    g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                    g.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)
                ))
        };

        return grouped.OrderBy(g => g.Date);
    }

    private IQueryable<Transaction> BuildFilteredQuery(
        Guid userId,
        DateTime? startDate,
        DateTime? endDate,
        TransactionType? type,
        int? categoryId)
    {
        var query = _dbSet.Where(t => t.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(t => t.Date >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(t => t.Date <= endDate.Value);
        if (type.HasValue)
            query = query.Where(t => t.Type == type.Value);
        if (categoryId.HasValue)
            query = query.Where(t => t.CategoryId == categoryId.Value);

        return query;
    }
}
