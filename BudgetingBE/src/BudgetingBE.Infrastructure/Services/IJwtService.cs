using BudgetingBE.Domain.Entities;

namespace BudgetingBE.Infrastructure.Services;

public interface IJwtService
{
    string GenerateToken(User user);
    Guid? ValidateToken(string token);
}
