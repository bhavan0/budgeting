using BudgetingBE.Domain.Entities;

namespace BudgetingBE.Infrastructure.Services;

public interface IGoogleAuthService
{
    Task<GoogleUserInfo?> ValidateGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default);
}

public record GoogleUserInfo(string GoogleId, string Email, string? Name, string? PictureUrl);
