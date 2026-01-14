namespace BudgetingBE.Domain.Entities;

public class Transaction
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime Date { get; set; }
    public TransactionType Type { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign keys
    public int CategoryId { get; set; }
    public Guid UserId { get; set; }

    // Navigation properties
    public Category Category { get; set; } = null!;
    public User User { get; set; } = null!;
}
