using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;
using BudgetingBE.Infrastructure.Services;

namespace BudgetingBE.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public AuthController(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IJwtService jwtService)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (await _unitOfWork.Users.EmailExistsAsync(request.Email, cancellationToken))
        {
            return BadRequest(new { message = "Email already registered" });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = _passwordHasher.HashPassword(request.Password)
        };

        await _unitOfWork.Users.AddAsync(user, cancellationToken);

        // Create default categories for the user
        var defaultCategories = GetDefaultCategories(user.Id);
        foreach (var category in defaultCategories)
        {
            await _unitOfWork.Categories.AddAsync(category, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            User = new UserDto { Id = user.Id, Email = user.Email }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email.ToLowerInvariant(), cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        var token = _jwtService.GenerateToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            User = new UserDto { Id = user.Id, Email = user.Email }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        if (user == null) return NotFound();

        return Ok(new UserDto { Id = user.Id, Email = user.Email });
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private static List<Category> GetDefaultCategories(Guid userId)
    {
        return new List<Category>
        {
            // Expense categories
            new() { Name = "Food & Dining", Icon = "🍽️", Color = "#FF6B6B", Type = TransactionType.Expense, UserId = userId },
            new() { Name = "Transportation", Icon = "🚗", Color = "#4ECDC4", Type = TransactionType.Expense, UserId = userId },
            new() { Name = "Shopping", Icon = "🛍️", Color = "#45B7D1", Type = TransactionType.Expense, UserId = userId },
            new() { Name = "Entertainment", Icon = "🎬", Color = "#96CEB4", Type = TransactionType.Expense, UserId = userId },
            new() { Name = "Bills & Utilities", Icon = "📱", Color = "#FFEAA7", Type = TransactionType.Expense, UserId = userId },
            new() { Name = "Healthcare", Icon = "🏥", Color = "#DDA0DD", Type = TransactionType.Expense, UserId = userId },
            new() { Name = "Other", Icon = "📦", Color = "#B0BEC5", Type = TransactionType.Expense, UserId = userId },
            
            // Income categories
            new() { Name = "Salary", Icon = "💰", Color = "#4CAF50", Type = TransactionType.Income, UserId = userId },
            new() { Name = "Freelance", Icon = "💻", Color = "#8BC34A", Type = TransactionType.Income, UserId = userId },
            new() { Name = "Investments", Icon = "📈", Color = "#00BCD4", Type = TransactionType.Income, UserId = userId },
            new() { Name = "Other Income", Icon = "💵", Color = "#9C27B0", Type = TransactionType.Income, UserId = userId }
        };
    }
}

public record RegisterRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; init; }

    [Required]
    [MinLength(6)]
    public required string Password { get; init; }
}

public record LoginRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; init; }

    [Required]
    public required string Password { get; init; }
}

public record AuthResponse
{
    public required string Token { get; init; }
    public required UserDto User { get; init; }
}

public record UserDto
{
    public Guid Id { get; init; }
    public required string Email { get; init; }
}
