using Microsoft.EntityFrameworkCore;
using BudgetingBE.Domain.Entities;

namespace BudgetingBE.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Todo> Todos => Set<Todo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Todo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Seed data
        modelBuilder.Entity<Todo>().HasData(
            new Todo { Id = 1, Title = "Learn .NET 10", IsCompleted = false, CreatedAt = DateTime.UtcNow },
            new Todo { Id = 2, Title = "Build a layered API", IsCompleted = false, CreatedAt = DateTime.UtcNow },
            new Todo { Id = 3, Title = "Connect to PostgreSQL", IsCompleted = true, CreatedAt = DateTime.UtcNow }
        );
    }
}
