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
public class CategoriesController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public CategoriesController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TransactionType? type, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        IEnumerable<Category> categories;
        if (type.HasValue)
        {
            categories = await _unitOfWork.Categories.GetByUserIdAndTypeAsync(userId.Value, type.Value, cancellationToken);
        }
        else
        {
            categories = await _unitOfWork.Categories.GetByUserIdAsync(userId.Value, cancellationToken);
        }

        return Ok(categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Icon = c.Icon,
            Color = c.Color,
            Type = c.Type
        }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var category = await _unitOfWork.Categories.GetByIdAndUserIdAsync(id, userId.Value, cancellationToken);
        if (category == null) return NotFound();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Icon = category.Icon,
            Color = category.Color,
            Type = category.Type
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var category = new Category
        {
            Name = request.Name,
            Icon = request.Icon,
            Color = request.Color,
            Type = request.Type,
            UserId = userId.Value
        };

        await _unitOfWork.Categories.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Icon = category.Icon,
            Color = category.Color,
            Type = category.Type
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var category = await _unitOfWork.Categories.GetByIdAndUserIdAsync(id, userId.Value, cancellationToken);
        if (category == null) return NotFound();

        category.Name = request.Name ?? category.Name;
        category.Icon = request.Icon ?? category.Icon;
        category.Color = request.Color ?? category.Color;

        _unitOfWork.Categories.Update(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Icon = category.Icon,
            Color = category.Color,
            Type = category.Type
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var category = await _unitOfWork.Categories.GetByIdAndUserIdAsync(id, userId.Value, cancellationToken);
        if (category == null) return NotFound();

        _unitOfWork.Categories.Delete(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

public record CategoryDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public string? Icon { get; init; }
    public string? Color { get; init; }
    public TransactionType Type { get; init; }
}

public record CreateCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public required string Name { get; init; }
    public string? Icon { get; init; }
    public string? Color { get; init; }
    [Required]
    public TransactionType Type { get; init; }
}

public record UpdateCategoryRequest
{
    [MaxLength(100)]
    public string? Name { get; init; }
    public string? Icon { get; init; }
    public string? Color { get; init; }
}
