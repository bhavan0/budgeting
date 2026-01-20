using BudgetingBE.Domain.Entities;
using BudgetingBE.Infrastructure.Services;
using Moq;
using Xunit;

namespace BudgetingBE.Tests.Api;

/// <summary>
/// Unit tests for auth-related services.
/// Integration tests for AuthController require a running database
/// and should be run via Docker or in CI/CD pipeline.
/// </summary>
public class AuthServiceTests
{
    [Fact]
    public void PasswordService_HashPassword_ReturnsNonEmptyHash()
    {
        // Arrange
        var service = new PasswordService();
        var password = "TestPassword123";

        // Act
        var hash = service.HashPassword(password);

        // Assert
        Assert.NotNull(hash);
        Assert.NotEmpty(hash);
        Assert.NotEqual(password, hash);
    }

    [Fact]
    public void PasswordService_VerifyPassword_ReturnsTrueForCorrectPassword()
    {
        // Arrange
        var service = new PasswordService();
        var password = "TestPassword123";
        var hash = service.HashPassword(password);

        // Act
        var result = service.VerifyPassword(password, hash);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void PasswordService_VerifyPassword_ReturnsFalseForWrongPassword()
    {
        // Arrange
        var service = new PasswordService();
        var password = "TestPassword123";
        var wrongPassword = "WrongPassword456";
        var hash = service.HashPassword(password);

        // Act
        var result = service.VerifyPassword(wrongPassword, hash);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void PasswordService_HashesAreDifferentDueToSalting()
    {
        // Arrange
        var service = new PasswordService();
        var password = "TestPassword123";

        // Act
        var hash1 = service.HashPassword(password);
        var hash2 = service.HashPassword(password);

        // Assert - BCrypt uses random salts
        Assert.NotEqual(hash1, hash2);
    }
}
