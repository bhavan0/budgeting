using BudgetingBE.Domain.Entities;
using Xunit;

namespace BudgetingBE.Tests.Domain;

public class CategoryTests
{
    [Fact]
    public void Category_DefaultCreatedAt_ShouldBeUtcNow()
    {
        // Arrange & Act
        var category = new Category { Name = "Test Category" };

        // Assert
        Assert.True((DateTime.UtcNow - category.CreatedAt).TotalSeconds < 1);
    }

    [Fact]
    public void Category_DefaultId_ShouldBeZero()
    {
        // Arrange & Act
        var category = new Category { Name = "Test Category" };

        // Assert
        Assert.Equal(0, category.Id);
    }

    [Fact]
    public void Category_DefaultType_ShouldBeExpense()
    {
        // Arrange & Act
        var category = new Category { Name = "Test Category" };

        // Assert
        Assert.Equal(TransactionType.Expense, category.Type);
    }

    [Fact]
    public void Category_DefaultTransactions_ShouldBeEmptyCollection()
    {
        // Arrange & Act
        var category = new Category { Name = "Test Category" };

        // Assert
        Assert.NotNull(category.Transactions);
        Assert.Empty(category.Transactions);
    }

    [Fact]
    public void Category_OptionalProperties_ShouldBeNull()
    {
        // Arrange & Act
        var category = new Category { Name = "Test Category" };

        // Assert
        Assert.Null(category.Icon);
        Assert.Null(category.Color);
    }

    [Fact]
    public void Category_SetsPropertiesCorrectly()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var category = new Category
        {
            Name = "Food & Dining",
            Icon = "🍽️",
            Color = "#FF6B6B",
            Type = TransactionType.Income,
            UserId = userId
        };

        // Assert
        Assert.Equal("Food & Dining", category.Name);
        Assert.Equal("🍽️", category.Icon);
        Assert.Equal("#FF6B6B", category.Color);
        Assert.Equal(TransactionType.Income, category.Type);
        Assert.Equal(userId, category.UserId);
    }
}
