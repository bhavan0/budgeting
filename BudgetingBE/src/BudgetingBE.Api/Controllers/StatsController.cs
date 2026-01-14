using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;

namespace BudgetingBE.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public StatsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var totalIncome = await _unitOfWork.Transactions.GetTotalByTypeAsync(
            userId.Value, TransactionType.Income, startDate, endDate, cancellationToken);
        
        var totalExpenses = await _unitOfWork.Transactions.GetTotalByTypeAsync(
            userId.Value, TransactionType.Expense, startDate, endDate, cancellationToken);

        double? incomeChange = null;
        double? expenseChange = null;

        if (startDate.HasValue && endDate.HasValue)
        {
            // Calculate previous period
            var duration = endDate.Value - startDate.Value;
            var prevEndDate = startDate.Value.AddDays(-1);
            var prevStartDate = prevEndDate.Subtract(duration);

            var prevIncome = await _unitOfWork.Transactions.GetTotalByTypeAsync(
                userId.Value, TransactionType.Income, prevStartDate, prevEndDate, cancellationToken);
            
            var prevExpenses = await _unitOfWork.Transactions.GetTotalByTypeAsync(
                userId.Value, TransactionType.Expense, prevStartDate, prevEndDate, cancellationToken);

            if (prevIncome > 0)
                incomeChange = (double)((totalIncome - prevIncome) / prevIncome) * 100;
            else if (totalIncome > 0)
                incomeChange = 100;

            if (prevExpenses > 0)
                expenseChange = (double)((totalExpenses - prevExpenses) / prevExpenses) * 100;
            else if (totalExpenses > 0)
                expenseChange = 100;
        }

        return Ok(new SummaryDto
        {
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            Balance = totalIncome - totalExpenses,
            IncomeChange = incomeChange,
            ExpensesChange = expenseChange
        });
    }

    [HttpGet("by-category")]
    public async Task<IActionResult> GetByCategory(
        [FromQuery] TransactionType? type,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var summary = await _unitOfWork.Transactions.GetSummaryByCategoryAsync(
            userId.Value, type, startDate, endDate, cancellationToken);

        return Ok(summary.Select(s => new CategoryStatsDto
        {
            CategoryId = s.CategoryId,
            CategoryName = s.CategoryName,
            CategoryColor = s.CategoryColor,
            Total = s.Total,
            Count = s.Count
        }));
    }

    [HttpGet("over-time")]
    public async Task<IActionResult> GetOverTime(
        [FromQuery] string period = "daily",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        // Default to last 30 days if no dates provided
        var end = endDate ?? DateTime.UtcNow.Date;
        var start = startDate ?? end.AddDays(-30);

        var summary = await _unitOfWork.Transactions.GetSummaryOverTimeAsync(
            userId.Value, period, start, end, cancellationToken);

        return Ok(summary.Select(s => new TimePeriodStatsDto
        {
            Date = s.Date,
            Income = s.Income,
            Expense = s.Expense,
            Net = s.Income - s.Expense
        }));
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

public record SummaryDto
{
    public decimal TotalIncome { get; init; }
    public decimal TotalExpenses { get; init; }
    public decimal Balance { get; init; }
    public double? IncomeChange { get; init; }
    public double? ExpensesChange { get; init; }
}

public record CategoryStatsDto
{
    public int CategoryId { get; init; }
    public required string CategoryName { get; init; }
    public string? CategoryColor { get; init; }
    public decimal Total { get; init; }
    public int Count { get; init; }
}

public record TimePeriodStatsDto
{
    public DateTime Date { get; init; }
    public decimal Income { get; init; }
    public decimal Expense { get; init; }
    public decimal Net { get; init; }
}
