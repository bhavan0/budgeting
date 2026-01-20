using System.Net;
using System.Text.Json;
using BudgetingBE.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace BudgetingBE.Tests.Infrastructure;

public class GoogleAuthServiceTests
{
    private readonly Mock<ILogger<GoogleAuthService>> _loggerMock;
    private readonly string _testClientId = "test-client-id.apps.googleusercontent.com";

    public GoogleAuthServiceTests()
    {
        _loggerMock = new Mock<ILogger<GoogleAuthService>>();
    }

    private IConfiguration CreateConfiguration(string? clientId = null)
    {
        var configValues = new Dictionary<string, string?>
        {
            { "Google:ClientId", clientId ?? _testClientId }
        };
        return new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();
    }

    private HttpClient CreateMockHttpClient(HttpResponseMessage response)
    {
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(response);

        return new HttpClient(handlerMock.Object);
    }

    [Fact]
    public async Task ValidateGoogleTokenAsync_ReturnsNull_WhenClientIdNotConfigured()
    {
        // Arrange
        var config = CreateConfiguration(null);
        var httpClient = new HttpClient();
        var service = new GoogleAuthService(httpClient, config, _loggerMock.Object);

        // Act
        var result = await service.ValidateGoogleTokenAsync("some-token");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateGoogleTokenAsync_ReturnsNull_WhenGoogleApiReturnsError()
    {
        // Arrange
        var config = CreateConfiguration();
        var response = new HttpResponseMessage(HttpStatusCode.BadRequest);
        var httpClient = CreateMockHttpClient(response);
        var service = new GoogleAuthService(httpClient, config, _loggerMock.Object);

        // Act
        var result = await service.ValidateGoogleTokenAsync("invalid-token");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateGoogleTokenAsync_ReturnsNull_WhenAudienceMismatch()
    {
        // Arrange
        var config = CreateConfiguration();
        var tokenInfo = new
        {
            sub = "123456789",
            email = "test@example.com",
            name = "Test User",
            picture = "https://example.com/photo.jpg",
            aud = "different-client-id",
            exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds().ToString()
        };
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(JsonSerializer.Serialize(tokenInfo))
        };
        var httpClient = CreateMockHttpClient(response);
        var service = new GoogleAuthService(httpClient, config, _loggerMock.Object);

        // Act
        var result = await service.ValidateGoogleTokenAsync("valid-token");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateGoogleTokenAsync_ReturnsNull_WhenTokenExpired()
    {
        // Arrange
        var config = CreateConfiguration();
        var tokenInfo = new
        {
            sub = "123456789",
            email = "test@example.com",
            name = "Test User",
            picture = "https://example.com/photo.jpg",
            aud = _testClientId,
            exp = DateTimeOffset.UtcNow.AddHours(-1).ToUnixTimeSeconds().ToString()
        };
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(JsonSerializer.Serialize(tokenInfo))
        };
        var httpClient = CreateMockHttpClient(response);
        var service = new GoogleAuthService(httpClient, config, _loggerMock.Object);

        // Act
        var result = await service.ValidateGoogleTokenAsync("expired-token");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateGoogleTokenAsync_ReturnsUserInfo_ForValidToken()
    {
        // Arrange
        var config = CreateConfiguration();
        var tokenInfo = new
        {
            sub = "123456789",
            email = "test@example.com",
            name = "Test User",
            picture = "https://example.com/photo.jpg",
            aud = _testClientId,
            exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds().ToString()
        };
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(JsonSerializer.Serialize(tokenInfo))
        };
        var httpClient = CreateMockHttpClient(response);
        var service = new GoogleAuthService(httpClient, config, _loggerMock.Object);

        // Act
        var result = await service.ValidateGoogleTokenAsync("valid-token");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("123456789", result.GoogleId);
        Assert.Equal("test@example.com", result.Email);
        Assert.Equal("Test User", result.Name);
        Assert.Equal("https://example.com/photo.jpg", result.PictureUrl);
    }
}
