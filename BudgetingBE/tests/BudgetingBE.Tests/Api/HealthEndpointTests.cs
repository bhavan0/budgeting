using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace BudgetingBE.Tests.Api;

public class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ReturnsSuccessStatusCode()
    {
        // Act
        var response = await _client.GetAsync("/api/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Health_ReturnsExpectedMessage()
    {
        // Act
        var response = await _client.GetAsync("/api/health");
        var content = await response.Content.ReadFromJsonAsync<HealthResponse>();

        // Assert
        Assert.NotNull(content);
        Assert.Equal("Hello from .NET!", content.Message);
        Assert.Equal("healthy", content.Status);
    }

    private record HealthResponse(string Message, string Status);
}
