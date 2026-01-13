using BudgetingBE.Domain.Entities;
using Xunit;

namespace BudgetingBE.Tests.Domain;

public class TodoTests
{
    [Fact]
    public void Todo_DefaultCreatedAt_ShouldBeUtcNow()
    {
        // Arrange & Act
        var todo = new Todo { Title = "Test Todo" };

        // Assert
        Assert.True((DateTime.UtcNow - todo.CreatedAt).TotalSeconds < 1);
    }

    [Fact]
    public void Todo_DefaultIsCompleted_ShouldBeFalse()
    {
        // Arrange & Act
        var todo = new Todo { Title = "Test Todo" };

        // Assert
        Assert.False(todo.IsCompleted);
    }
}
