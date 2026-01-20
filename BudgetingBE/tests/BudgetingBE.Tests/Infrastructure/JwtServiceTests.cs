using System.IdentityModel.Tokens.Jwt;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BudgetingBE.Tests.Infrastructure;

public class JwtServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly JwtService _jwtService;

    public JwtServiceTests()
    {
        var configValues = new Dictionary<string, string?>
        {
            { "Jwt:SecretKey", "ThisIsAVeryLongSecretKeyForTesting12345678901234567890" },
            { "Jwt:Issuer", "TestIssuer" },
            { "Jwt:Audience", "TestAudience" },
            { "Jwt:ExpirationMinutes", "60" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        _jwtService = new JwtService(_configuration);
    }

    [Fact]
    public void GenerateToken_ReturnsValidJwtToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com"
        };

        // Act
        var token = _jwtService.GenerateToken(user);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        var handler = new JwtSecurityTokenHandler();
        Assert.True(handler.CanReadToken(token));
    }

    [Fact]
    public void GenerateToken_ContainsExpectedClaims()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com"
        };

        // Act
        var token = _jwtService.GenerateToken(user);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        Assert.Equal(userId.ToString(), jwtToken.Subject);
        Assert.Contains(jwtToken.Claims, c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "test@example.com");
        Assert.Equal("TestIssuer", jwtToken.Issuer);
        Assert.Contains("TestAudience", jwtToken.Audiences);
    }

    [Fact]
    public void ValidateToken_ReturnsUserId_ForValidToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com"
        };
        var token = _jwtService.GenerateToken(user);

        // Act
        var result = _jwtService.ValidateToken(token);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Value);
    }

    [Fact]
    public void ValidateToken_ReturnsNull_ForInvalidToken()
    {
        // Arrange
        var invalidToken = "invalid.jwt.token";

        // Act
        var result = _jwtService.ValidateToken(invalidToken);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void ValidateToken_ReturnsNull_ForEmptyToken()
    {
        // Act
        var result = _jwtService.ValidateToken(string.Empty);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void Constructor_ThrowsException_WhenSecretKeyNotConfigured()
    {
        // Arrange
        var configValues = new Dictionary<string, string?>
        {
            { "Jwt:Issuer", "TestIssuer" }
        };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new JwtService(config));
    }
}
