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
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IJwtService _jwtService;
    private readonly IPasswordService _passwordService;

    public AuthController(
        IUnitOfWork unitOfWork, 
        IGoogleAuthService googleAuthService, 
        IJwtService jwtService,
        IPasswordService passwordService)
    {
        _unitOfWork = unitOfWork;
        _googleAuthService = googleAuthService;
        _jwtService = jwtService;
        _passwordService = passwordService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.ToLowerInvariant();
        var existingUser = await _unitOfWork.Users.GetByEmailAsync(email, cancellationToken);

        if (existingUser != null)
        {
            // User exists with password already set
            if (!string.IsNullOrEmpty(existingUser.PasswordHash))
            {
                return BadRequest(new { message = "Email already registered. Please sign in." });
            }

            // User exists via Google - link account by adding password
            existingUser.PasswordHash = _passwordService.HashPassword(request.Password);
            existingUser.Name = request.Name;
            existingUser.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var token = _jwtService.GenerateToken(existingUser);
            return Ok(new AuthResponse
            {
                Token = token,
                User = MapToUserDto(existingUser)
            });
        }

        // Create new user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = _passwordService.HashPassword(request.Password),
            Name = request.Name,
            ProfilePictureUrl = GetDefaultAvatarUrl(request.Name)
        };

        await _unitOfWork.Users.AddAsync(user, cancellationToken);

        // Create default categories for new users
        var defaultCategories = GetDefaultCategories(user.Id);
        foreach (var category in defaultCategories)
        {
            await _unitOfWork.Categories.AddAsync(category, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var newUserToken = _jwtService.GenerateToken(user);
        return Ok(new AuthResponse
        {
            Token = newUserToken,
            User = MapToUserDto(user)
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.ToLowerInvariant();
        var user = await _unitOfWork.Users.GetByEmailAsync(email, cancellationToken);

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // User exists but has no password (Google-only account)
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            return Unauthorized(new { message = "This account uses Google sign-in. Please sign in with Google." });
        }

        // Verify password
        if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        var token = _jwtService.GenerateToken(user);
        return Ok(new AuthResponse
        {
            Token = token,
            User = MapToUserDto(user)
        });
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        // Validate the Google ID token
        var googleUser = await _googleAuthService.ValidateGoogleTokenAsync(request.Credential, cancellationToken);
        
        if (googleUser == null)
        {
            return Unauthorized(new { message = "Invalid Google token" });
        }

        // Check if user exists by Google ID or email
        var user = await _unitOfWork.Users.GetByEmailAsync(googleUser.Email.ToLowerInvariant(), cancellationToken);
        
        bool isNewUser = user == null;
        
        if (isNewUser)
        {
            // Create new user
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = googleUser.Email.ToLowerInvariant(),
                GoogleId = googleUser.GoogleId,
                Name = googleUser.Name,
                ProfilePictureUrl = googleUser.PictureUrl
            };

            await _unitOfWork.Users.AddAsync(user, cancellationToken);

            // Create default categories for new users
            var defaultCategories = GetDefaultCategories(user.Id);
            foreach (var category in defaultCategories)
            {
                await _unitOfWork.Categories.AddAsync(category, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // Update existing user with Google info if not already linked
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = googleUser.GoogleId;
                user.Name = googleUser.Name;
                user.ProfilePictureUrl = googleUser.PictureUrl;
                user.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        var token = _jwtService.GenerateToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            User = MapToUserDto(user)
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

        return Ok(MapToUserDto(user));
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private static UserDto MapToUserDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        ProfilePictureUrl = user.ProfilePictureUrl
    };

    private static string GetDefaultAvatarUrl(string name)
    {
        var encoded = Uri.EscapeDataString(name);
        return $"https://ui-avatars.com/api/?name={encoded}&background=6366f1&color=fff&size=128";
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
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    public required string Password { get; init; }
    
    [Required]
    public required string Name { get; init; }
}

public record LoginRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; init; }
    
    [Required]
    public required string Password { get; init; }
}

public record GoogleLoginRequest
{
    [Required]
    public required string Credential { get; init; }
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
    public string? Name { get; init; }
    public string? ProfilePictureUrl { get; init; }
}

