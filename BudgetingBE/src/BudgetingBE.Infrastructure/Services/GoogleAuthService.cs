using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BudgetingBE.Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly HttpClient _httpClient;
    private readonly string? _clientId;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(HttpClient httpClient, IConfiguration configuration, ILogger<GoogleAuthService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _clientId = configuration["Google:ClientId"];
        
        if (string.IsNullOrEmpty(_clientId))
        {
            _logger.LogWarning("Google:ClientId is not configured. Google Sign-In will not work.");
        }
    }

    public async Task<GoogleUserInfo?> ValidateGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_clientId))
        {
            _logger.LogError("Cannot validate Google token because Google:ClientId is not configured.");
            return null;
        }

        try
        {
            // Validate the token using Google's tokeninfo endpoint
            var response = await _httpClient.GetAsync(
                $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Google token validation failed. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var tokenInfo = await response.Content.ReadFromJsonAsync<GoogleTokenInfo>(cancellationToken);
            
            if (tokenInfo == null)
            {
                _logger.LogWarning("Google token info is null.");
                return null;
            }

            // Verify the token was issued for our app
            if (tokenInfo.Aud != _clientId)
            {
                _logger.LogWarning("Google token audience mismatch. Expected: {Expected}, Got: {Actual}", _clientId, tokenInfo.Aud);
                return null;
            }

            // Check token expiration
            if (tokenInfo.Exp != null && long.TryParse(tokenInfo.Exp, out var expUnix))
            {
                var expTime = DateTimeOffset.FromUnixTimeSeconds(expUnix);
                if (expTime < DateTimeOffset.UtcNow)
                {
                    _logger.LogWarning("Google token expired.");
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during Google token validation.");
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
