namespace BudgetingBE.Domain.Entities;

public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public TransactionType Type { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign key
    public Guid UserId { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
