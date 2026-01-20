using BudgetingBE.Domain.Entities;
using Xunit;

namespace BudgetingBE.Tests.Domain;

public class TransactionTests
{
    [Fact]
    public void Transaction_DefaultCreatedAt_ShouldBeUtcNow()
    {
        // Arrange & Act
        var transaction = new Transaction();

        // Assert
        Assert.True((DateTime.UtcNow - transaction.CreatedAt).TotalSeconds < 1);
    }

    [Fact]
    public void Transaction_DefaultId_ShouldBeZero()
    {
        // Arrange & Act
        var transaction = new Transaction();

        // Assert
        Assert.Equal(0, transaction.Id);
    }

    [Fact]
    public void Transaction_DefaultAmount_ShouldBeZero()
    {
        // Arrange & Act
        var transaction = new Transaction();

        // Assert
        Assert.Equal(0m, transaction.Amount);
    }

    [Fact]
    public void Transaction_DefaultType_ShouldBeExpense()
    {
        // Arrange & Act
        var transaction = new Transaction();

        // Assert
        Assert.Equal(TransactionType.Expense, transaction.Type);
    }

    [Fact]
    public void Transaction_DefaultDescription_ShouldBeNull()
    {
        // Arrange & Act
        var transaction = new Transaction();

        // Assert
        Assert.Null(transaction.Description);
    }

    [Fact]
    public void Transaction_SetsPropertiesCorrectly()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var date = DateTime.UtcNow;

        // Act
        var transaction = new Transaction
        {
            Amount = 100.50m,
            Description = "Test transaction",
            Date = date,
            Type = TransactionType.Income,
            CategoryId = 1,
            UserId = userId
        };

        // Assert
        Assert.Equal(100.50m, transaction.Amount);
        Assert.Equal("Test transaction", transaction.Description);
        Assert.Equal(date, transaction.Date);
        Assert.Equal(TransactionType.Income, transaction.Type);
        Assert.Equal(1, transaction.CategoryId);
        Assert.Equal(userId, transaction.UserId);
    }
}
