using BudgetingBE.Domain.Entities;
using Xunit;

namespace BudgetingBE.Tests.Domain;

public class UserTests
{
    [Fact]
    public void User_DefaultCreatedAt_ShouldBeUtcNow()
    {
        // Arrange & Act
        var user = new User { Email = "test@example.com" };

        // Assert
        Assert.True((DateTime.UtcNow - user.CreatedAt).TotalSeconds < 1);
    }

    [Fact]
    public void User_DefaultId_ShouldBeEmptyGuid()
    {
        // Arrange & Act
        var user = new User { Email = "test@example.com" };

        // Assert
        Assert.Equal(Guid.Empty, user.Id);
    }

    [Fact]
    public void User_DefaultCategories_ShouldBeEmptyCollection()
    {
        // Arrange & Act
        var user = new User { Email = "test@example.com" };

        // Assert
        Assert.NotNull(user.Categories);
        Assert.Empty(user.Categories);
    }

    [Fact]
    public void User_DefaultTransactions_ShouldBeEmptyCollection()
    {
        // Arrange & Act
        var user = new User { Email = "test@example.com" };

        // Assert
        Assert.NotNull(user.Transactions);
        Assert.Empty(user.Transactions);
    }

    [Fact]
    public void User_DefaultUpdatedAt_ShouldBeNull()
    {
        // Arrange & Act
        var user = new User { Email = "test@example.com" };

        // Assert
        Assert.Null(user.UpdatedAt);
    }

    [Fact]
    public void User_OptionalProperties_ShouldBeNull()
    {
        // Arrange & Act
        var user = new User { Email = "test@example.com" };

        // Assert
        Assert.Null(user.PasswordHash);
        Assert.Null(user.GoogleId);
        Assert.Null(user.Name);
        Assert.Null(user.ProfilePictureUrl);
    }
}
