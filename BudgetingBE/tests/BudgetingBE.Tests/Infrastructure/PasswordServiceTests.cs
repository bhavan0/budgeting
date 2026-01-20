using BudgetingBE.Infrastructure.Services;

namespace BudgetingBE.Tests.Infrastructure;

public class PasswordServiceTests
{
    private readonly PasswordService _passwordService;

    public PasswordServiceTests()
    {
        _passwordService = new PasswordService();
    }

    [Fact]
    public void HashPassword_ReturnsNonEmptyHash()
    {
        // Arrange
        var password = "TestPassword123!";

        // Act
        var hash = _passwordService.HashPassword(password);

        // Assert
        Assert.False(string.IsNullOrEmpty(hash));
        Assert.NotEqual(password, hash);
    }

    [Fact]
    public void HashPassword_ReturnsDifferentHashForSamePassword()
    {
        // Arrange
        var password = "TestPassword123!";

        // Act
        var hash1 = _passwordService.HashPassword(password);
        var hash2 = _passwordService.HashPassword(password);

        // Assert - BCrypt should generate different hashes due to salting
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void VerifyPassword_ReturnsTrueForCorrectPassword()
    {
        // Arrange
        var password = "TestPassword123!";
        var hash = _passwordService.HashPassword(password);

        // Act
        var result = _passwordService.VerifyPassword(password, hash);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void VerifyPassword_ReturnsFalseForWrongPassword()
    {
        // Arrange
        var password = "TestPassword123!";
        var wrongPassword = "WrongPassword456!";
        var hash = _passwordService.HashPassword(password);

        // Act
        var result = _passwordService.VerifyPassword(wrongPassword, hash);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void VerifyPassword_ReturnsFalseForEmptyPassword()
    {
        // Arrange
        var password = "TestPassword123!";
        var hash = _passwordService.HashPassword(password);

        // Act
        var result = _passwordService.VerifyPassword("", hash);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void HashPassword_HandlesSpecialCharacters()
    {
        // Arrange
        var password = "P@$$w0rd!#%&*()[]{}";

        // Act
        var hash = _passwordService.HashPassword(password);
        var result = _passwordService.VerifyPassword(password, hash);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void HashPassword_HandlesUnicodeCharacters()
    {
        // Arrange
        var password = "パスワード123日本語";

        // Act
        var hash = _passwordService.HashPassword(password);
        var result = _passwordService.VerifyPassword(password, hash);

        // Assert
        Assert.True(result);
    }
}
