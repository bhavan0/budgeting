using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using BudgetingBE.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add Controllers
builder.Services.AddControllers();

// Add OpenAPI services
builder.Services.AddOpenApi();

// Configure JWT Authentication
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BudgetingApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "BudgetingApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Add Infrastructure services (EF Core, Repositories, Unit of Work, Auth Services)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddInfrastructure(connectionString);

var app = builder.Build();

// Apply migrations (only if database is configured)
if (!string.IsNullOrEmpty(connectionString))
{
    app.Services.ApplyMigrations();
}

// Enable CORS
app.UseCors();

// OpenAPI + Scalar API Reference (Development only)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Health endpoint
app.MapGet("/api/health", () => new
{
    message = "Hello from .NET!",
    status = "healthy"
})
.WithName("GetHealth")
.WithTags("Health")
.WithOpenApi();

// Map Controllers
app.MapControllers();

app.Run();

// Make the Program class accessible for testing
public partial class Program { }
