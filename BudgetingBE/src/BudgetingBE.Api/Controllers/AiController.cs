using System.Security.Claims;
using BudgetingBE.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BudgetingBE.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;

    public AiController(IAiService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Message cannot be empty" });
        }

        var response = await _aiService.GetChatResponseAsync(userId, request.Message);
        return Ok(new ChatResponse { Response = response });
    }
}

public record ChatRequest
{
    public required string Message { get; init; }
}

public record ChatResponse
{
    public required string Response { get; init; }
}
