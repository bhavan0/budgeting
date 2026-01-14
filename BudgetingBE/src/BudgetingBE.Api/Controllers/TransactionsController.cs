using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;

namespace BudgetingBE.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public TransactionsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] TransactionType? type,
        [FromQuery] int? categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var transactions = await _unitOfWork.Transactions.GetByUserIdAsync(
            userId.Value, startDate, endDate, type, categoryId, page, pageSize, cancellationToken);

        var totalCount = await _unitOfWork.Transactions.GetCountByUserIdAsync(
            userId.Value, startDate, endDate, type, categoryId, cancellationToken);

        return Ok(new PaginatedResponse<TransactionDto>
        {
            Data = transactions.Select(MapToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var transaction = await _unitOfWork.Transactions.GetByIdAndUserIdAsync(id, userId.Value, cancellationToken);
        if (transaction == null) return NotFound();

        return Ok(MapToDto(transaction));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        // Verify category belongs to user
        var category = await _unitOfWork.Categories.GetByIdAndUserIdAsync(request.CategoryId, userId.Value, cancellationToken);
        if (category == null) return BadRequest(new { message = "Invalid category" });

        var transaction = new Transaction
        {
            Amount = request.Amount,
            Description = request.Description,
            Date = request.Date,
            Type = request.Type,
            CategoryId = request.CategoryId,
            UserId = userId.Value
        };

        await _unitOfWork.Transactions.AddAsync(transaction, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Reload to get category info
        var created = await _unitOfWork.Transactions.GetByIdAndUserIdAsync(transaction.Id, userId.Value, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, MapToDto(created!));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTransactionRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var transaction = await _unitOfWork.Transactions.GetByIdAndUserIdAsync(id, userId.Value, cancellationToken);
        if (transaction == null) return NotFound();

        if (request.CategoryId.HasValue)
        {
            var category = await _unitOfWork.Categories.GetByIdAndUserIdAsync(request.CategoryId.Value, userId.Value, cancellationToken);
            if (category == null) return BadRequest(new { message = "Invalid category" });
            transaction.CategoryId = request.CategoryId.Value;
        }

        transaction.Amount = request.Amount ?? transaction.Amount;
        transaction.Description = request.Description ?? transaction.Description;
        transaction.Date = request.Date ?? transaction.Date;
        transaction.Type = request.Type ?? transaction.Type;

        _unitOfWork.Transactions.Update(transaction);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _unitOfWork.Transactions.GetByIdAndUserIdAsync(transaction.Id, userId.Value, cancellationToken);
        return Ok(MapToDto(updated!));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var transaction = await _unitOfWork.Transactions.GetByIdAndUserIdAsync(id, userId.Value, cancellationToken);
        if (transaction == null) return NotFound();

        _unitOfWork.Transactions.Delete(transaction);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private static TransactionDto MapToDto(Transaction t) => new()
    {
        Id = t.Id,
        Amount = t.Amount,
        Description = t.Description,
        Date = t.Date,
        Type = t.Type,
        CategoryId = t.CategoryId,
        CategoryName = t.Category?.Name,
        CategoryColor = t.Category?.Color,
        CategoryIcon = t.Category?.Icon
    };
}

public record TransactionDto
{
    public int Id { get; init; }
    public decimal Amount { get; init; }
    public string? Description { get; init; }
    public DateTime Date { get; init; }
    public TransactionType Type { get; init; }
    public int CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public string? CategoryColor { get; init; }
    public string? CategoryIcon { get; init; }
}

public record CreateTransactionRequest
{
    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; init; }
    public string? Description { get; init; }
    [Required]
    public DateTime Date { get; init; }
    [Required]
    public TransactionType Type { get; init; }
    [Required]
    public int CategoryId { get; init; }
}

public record UpdateTransactionRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal? Amount { get; init; }
    public string? Description { get; init; }
    public DateTime? Date { get; init; }
    public TransactionType? Type { get; init; }
    public int? CategoryId { get; init; }
}

public record PaginatedResponse<T>
{
    public required List<T> Data { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages { get; init; }
}
