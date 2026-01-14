using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;
using Microsoft.Extensions.Configuration;

namespace BudgetingBE.Infrastructure.Services
{
    public class OpenRouterAiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly ITransactionRepository _transactionRepository;
        private readonly IConfiguration _configuration;
        private const string OpenRouterBaseUrl = "https://openrouter.ai/api/v1/chat/completions";

        public OpenRouterAiService(HttpClient httpClient, ITransactionRepository transactionRepository, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _transactionRepository = transactionRepository;
            _configuration = configuration;
        }

        public async Task<string> GetChatResponseAsync(Guid userId, string userMessage)
        {
            var apiKey = _configuration["OpenRouter:ApiKey"];
            var model = _configuration["OpenRouter:Model"] ?? "google/gemini-2.0-flash-001";

            if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_OPENROUTER_KEY_HERE")
            {
                // Return a mock response if key is missing
                return "AI functionality is not configured. Please check your API key settings.";
            }

            // 1. Gather Context
            var context = await BuildFinancialContextAsync(userId);

            // 2. Prepare Request
            var requestBody = new
            {
                model = model,
                messages = new object[]
                {
                    new {
                        role = "system",
                        content = $"You are a helpful and knowledgeable financial assistant for a budgeting app. " +
                                  $"You have access to the user's financial data for the last 30 days. " +
                                  $"Use this data to answer their questions accurately. " +
                                  $"If the data is insufficient, say so. " +
                                  $"Be concise, friendly, and encouraging. " +
                                  $"Here is the user's current financial context (Last 30 days):\n{context}"
                    },
                    new {
                        role = "user",
                        content = userMessage
                    }
                }
            };

            // 3. Send Request
            var request = new HttpRequestMessage(HttpMethod.Post, OpenRouterBaseUrl);
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = JsonContent.Create(requestBody);

            try
            {
                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadFromJsonAsync<JsonElement>();
                var content = responseJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

                return content ?? "I couldn't generate a response.";
            }
            catch (Exception ex)
            {
                return $"Error communicating with AI service: {ex.Message}";
            }
        }

        private async Task<string> BuildFinancialContextAsync(Guid userId)
        {
            // Fetch all-time data (no date filters)
            
            // 1. Recent Transactions (limit to 500 to fit in context window)
            var transactions = await _transactionRepository.GetByUserIdAsync(
                userId, null, null, page: 1, pageSize: 500
            );

            // 2. Category Summaries (All Time)
            var categorySummary = await _transactionRepository.GetSummaryByCategoryAsync(
                userId, startDate: null, endDate: null
            );

            // 3. Overall Totals (All Time)
            var income = await _transactionRepository.GetTotalByTypeAsync(userId, TransactionType.Income, null, null);
            var expenses = await _transactionRepository.GetTotalByTypeAsync(userId, TransactionType.Expense, null, null);
            var balance = income - expenses;

            // 4. Monthly History (All Time)
            var monthlyStats = (await _transactionRepository.GetSummaryOverTimeAsync(userId, "monthly", null, null)).ToList();

            // 5. Trend Analysis
            var lastMonth = monthlyStats.LastOrDefault();
            var prevMonth = monthlyStats.Count > 1 ? monthlyStats[monthlyStats.Count - 2] : null;
            var lastMonthNet = lastMonth != null ? lastMonth.Income - lastMonth.Expense : 0;
            var prevMonthNet = prevMonth != null ? prevMonth.Income - prevMonth.Expense : 0;

            var contextData = new
            {
                Period = "All Time",
                Summary = new 
                {
                    TotalIncome = income,
                    TotalExpenses = expenses,
                    NetBalance = balance
                },
                Trends = new 
                {
                    AverageMonthlyNet = monthlyStats.Any() ? monthlyStats.Average(m => m.Income - m.Expense) : 0,
                    LastMonthNet = lastMonthNet,
                    PreviousMonthNet = prevMonthNet,
                    MonthOverMonthChange = lastMonthNet - prevMonthNet,
                    Direction = lastMonthNet > prevMonthNet ? "Improving" : (lastMonthNet < prevMonthNet ? "Declining" : "Stable")
                },
                CategoryBreakdown = categorySummary.OrderByDescending(c => c.Total).Select(c => new 
                { 
                    Name = c.CategoryName, 
                    Amount = c.Total, 
                    Count = c.Count 
                }),
                MonthlyHistory = monthlyStats.Select(m => new 
                {
                    Month = m.Date.ToString("yyyy-MM"),
                    Income = m.Income,
                    Expense = m.Expense,
                    Net = m.Income - m.Expense
                }),
                LatestTransactions = transactions.Select(t => new
                {
                    Date = t.Date.ToString("yyyy-MM-dd"),
                    Type = t.Type.ToString(),
                    Amount = t.Amount,
                    Category = t?.Category?.Name ?? "Uncategorized",
                    Description = t.Description
                })
            };

            return JsonSerializer.Serialize(contextData, new JsonSerializerOptions { WriteIndented = true });
        }
    }
}
