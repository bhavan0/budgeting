using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace BudgetingBE.Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly HttpClient _httpClient;
    private readonly string _clientId;

    public GoogleAuthService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _clientId = configuration["Google:ClientId"] ?? throw new ArgumentNullException("Google:ClientId is not configured");
    }

    public async Task<GoogleUserInfo?> ValidateGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate the token using Google's tokeninfo endpoint
            var response = await _httpClient.GetAsync(
                $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var tokenInfo = await response.Content.ReadFromJsonAsync<GoogleTokenInfo>(cancellationToken);
            
            if (tokenInfo == null)
            {
                return null;
            }

            // Verify the token was issued for our app
            if (tokenInfo.Aud != _clientId)
            {
                return null;
            }

            // Check token expiration
            if (tokenInfo.Exp != null && long.TryParse(tokenInfo.Exp, out var expUnix))
            {
                var expTime = DateTimeOffset.FromUnixTimeSeconds(expUnix);
                if (expTime < DateTimeOffset.UtcNow)
                {
                    return null;
                }
            }

            return new GoogleUserInfo(
                tokenInfo.Sub!,
                tokenInfo.Email!,
                tokenInfo.Name,
                tokenInfo.Picture
            );
        }
        catch
        {
            return null;
        }
    }

    private record GoogleTokenInfo
    {
        public string? Sub { get; init; }
        public string? Email { get; init; }
        public string? Name { get; init; }
        public string? Picture { get; init; }
        public string? Aud { get; init; }
        public string? Exp { get; init; }
        public string? EmailVerified { get; init; }
    }
}
