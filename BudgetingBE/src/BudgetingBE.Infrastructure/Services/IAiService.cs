using System;
using System.Threading.Tasks;

namespace BudgetingBE.Infrastructure.Services
{
    public interface IAiService
    {
        Task<string> GetChatResponseAsync(Guid userId, string userMessage);
    }
}
