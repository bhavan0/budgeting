# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files
COPY BudgetingBE.sln ./
COPY src/BudgetingBE.Api/*.csproj ./src/BudgetingBE.Api/
COPY src/BudgetingBE.Domain/*.csproj ./src/BudgetingBE.Domain/
COPY src/BudgetingBE.Infrastructure/*.csproj ./src/BudgetingBE.Infrastructure/
COPY tests/BudgetingBE.Tests/*.csproj ./tests/BudgetingBE.Tests/

# Restore all projects
RUN dotnet restore

# Copy all source files
COPY . .

# Build and publish
RUN dotnet publish src/BudgetingBE.Api/BudgetingBE.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "BudgetingBE.Api.dll"]
