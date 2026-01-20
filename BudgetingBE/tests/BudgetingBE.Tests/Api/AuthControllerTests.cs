using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;
using BudgetingBE.Infrastructure.Services;

namespace BudgetingBE.Tests.Api;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClientWithMocks(
        Mock<IUnitOfWork>? unitOfWorkMock = null,
        Mock<IPasswordService>? passwordServiceMock = null,
        Mock<IJwtService>? jwtServiceMock = null)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing registrations
                var descriptorsToRemove = services
                    .Where(d => d.ServiceType == typeof(IUnitOfWork) ||
                                d.ServiceType == typeof(IPasswordService) ||
                                d.ServiceType == typeof(IJwtService))
                    .ToList();

                foreach (var descriptor in descriptorsToRemove)
                {
                    services.Remove(descriptor);
                }

                // Add mocks
                if (unitOfWorkMock != null)
                    services.AddScoped(_ => unitOfWorkMock.Object);
                if (passwordServiceMock != null)
                    services.AddScoped(_ => passwordServiceMock.Object);
                if (jwtServiceMock != null)
                    services.AddScoped(_ => jwtServiceMock.Object);
            });
        }).CreateClient();
    }

    #region Register Tests

    [Fact]
    public async Task Register_WithNewEmail_CreatesUserAndReturnsToken()
    {
        // Arrange
        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        userRepoMock.Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var categoryRepoMock = new Mock<ICategoryRepository>();
        categoryRepoMock.Setup(r => r.AddAsync(It.IsAny<Category>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock.Setup(u => u.Users).Returns(userRepoMock.Object);
        unitOfWorkMock.Setup(u => u.Categories).Returns(categoryRepoMock.Object);
        unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var passwordServiceMock = new Mock<IPasswordService>();
        passwordServiceMock.Setup(p => p.HashPassword(It.IsAny<string>())).Returns("hashed_password");

        var jwtServiceMock = new Mock<IJwtService>();
        jwtServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("test_token");

        var client = CreateClientWithMocks(unitOfWorkMock, passwordServiceMock, jwtServiceMock);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "newuser@example.com",
            Password = "Password123!",
            Name = "New User"
        });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(content);
        Assert.Equal("test_token", content.Token);
        Assert.Equal("newuser@example.com", content.User.Email);
    }

    [Fact]
    public async Task Register_WithExistingGoogleEmail_AddsPasswordAndReturnsToken()
    {
        // Arrange
        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "googleuser@example.com",
            GoogleId = "google123",
            Name = "Google User",
            PasswordHash = null // No password - Google-only user
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(r => r.GetByEmailAsync("googleuser@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock.Setup(u => u.Users).Returns(userRepoMock.Object);
        unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var passwordServiceMock = new Mock<IPasswordService>();
        passwordServiceMock.Setup(p => p.HashPassword(It.IsAny<string>())).Returns("hashed_password");

        var jwtServiceMock = new Mock<IJwtService>();
        jwtServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("test_token");

        var client = CreateClientWithMocks(unitOfWorkMock, passwordServiceMock, jwtServiceMock);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "googleuser@example.com",
            Password = "Password123!",
            Name = "Updated Name"
        });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(content);
        Assert.Equal("test_token", content.Token);
    }

    [Fact]
    public async Task Register_WithExistingPasswordEmail_ReturnsBadRequest()
    {
        // Arrange
        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "existing@example.com",
            PasswordHash = "existing_hash",
            Name = "Existing User"
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(r => r.GetByEmailAsync("existing@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock.Setup(u => u.Users).Returns(userRepoMock.Object);

        var client = CreateClientWithMocks(unitOfWorkMock);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "existing@example.com",
            Password = "Password123!",
            Name = "New User"
        });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(content);
        Assert.Contains("already registered", content.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "invalid-email",
            Password = "Password123!",
            Name = "Test User"
        });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithShortPassword_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = "test@example.com",
            Password = "short",
            Name = "Test User"
        });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    #endregion

    #region Login Tests

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            PasswordHash = "hashed_password",
            Name = "Test User"
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(r => r.GetByEmailAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock.Setup(u => u.Users).Returns(userRepoMock.Object);

        var passwordServiceMock = new Mock<IPasswordService>();
        passwordServiceMock.Setup(p => p.VerifyPassword("Password123!", "hashed_password")).Returns(true);

        var jwtServiceMock = new Mock<IJwtService>();
        jwtServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("test_token");

        var client = CreateClientWithMocks(unitOfWorkMock, passwordServiceMock, jwtServiceMock);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "user@example.com",
            Password = "Password123!"
        });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(content);
        Assert.Equal("test_token", content.Token);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        // Arrange
        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            PasswordHash = "hashed_password",
            Name = "Test User"
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(r => r.GetByEmailAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock.Setup(u => u.Users).Returns(userRepoMock.Object);

        var passwordServiceMock = new Mock<IPasswordService>();
        passwordServiceMock.Setup(p => p.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        var client = CreateClientWithMocks(unitOfWorkMock, passwordServiceMock);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "user@example.com",
            Password = "WrongPassword!"
        });

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithNonExistentEmail_ReturnsUnauthorized()
    {
        // Arrange
        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock.Setup(u => u.Users).Returns(userRepoMock.Object);

        var client = CreateClientWithMocks(unitOfWorkMock);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "nonexistent@example.com",
            Password = "Password123!"
        });

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithGoogleOnlyAccount_ReturnsUnauthorizedWithHelpfulMessage()
    {
        // Arrange
        var googleOnlyUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "googleonly@example.com",
            GoogleId = "google123",
            PasswordHash = null, // No password
            Name = "Google User"
        };

        var userRepoMock = new Mock<IUserRepository>();
        userRepoMock.Setup(r => r.GetByEmailAsync("googleonly@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(googleOnlyUser);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock.Setup(u => u.Users).Returns(userRepoMock.Object);

        var client = CreateClientWithMocks(unitOfWorkMock);

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "googleonly@example.com",
            Password = "Password123!"
        });

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(content);
        Assert.Contains("Google", content.Message, StringComparison.OrdinalIgnoreCase);
    }

    #endregion

    private record AuthResponse(string Token, UserDto User);
    private record UserDto(Guid Id, string Email, string? Name, string? ProfilePictureUrl);
    private record ErrorResponse(string Message);
}
