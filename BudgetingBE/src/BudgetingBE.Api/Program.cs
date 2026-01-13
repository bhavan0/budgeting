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

// Add Infrastructure services (EF Core, Repositories, Unit of Work)
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
