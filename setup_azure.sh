#!/bin/bash

# Configuration
RESOURCE_GROUP="rg-budgeting-free"
LOCATION="eastus" # or your preferred location
CONTAINER_APP_ENV="cae-budgeting-free"
STATIC_WEB_APP="swa-budgeting-fe"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

echo "--- Starting Azure Setup ---"
echo "Using Subscription: $SUBSCRIPTION_ID"

# 1. Create Resource Group
echo "Creating Resource Group '$RESOURCE_GROUP'..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Create Container App Environment (Consumption)
echo "Creating Container Apps Environment '$CONTAINER_APP_ENV'..."
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-workload-profiles false # Consumption only

# 3. Create Static Web App (Free)
echo "Creating Static Web App '$STATIC_WEB_APP'..."
az staticwebapp create \
  --name $STATIC_WEB_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free

# 4. Create Service Principal for GitHub Actions
echo "Creating Service Principal for GitHub Actions..."
SP_NAME="sp-budgeting-github"
AZURE_CREDENTIALS=$(az ad sp create-for-rbac --name $SP_NAME --role contributor --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP --json-auth)

# 5. Get Static Web App Deployment Token
SWA_TOKEN=$(az staticwebapp secrets list --name $STATIC_WEB_APP --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv)

echo ""
echo "--- Resources Created Successfully! ---"
echo ""
echo "=== ACTION REQUIRED: Add these Secrets to your GitHub Repository ==="
echo ""
echo "Secret Name: AZURE_CREDENTIALS"
echo "Value:"
echo "$AZURE_CREDENTIALS"
echo ""
echo "Secret Name: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "Value: $SWA_TOKEN"
echo ""
echo "Also remember to add:"
echo "- DOCKER_USERNAME"
echo "- DOCKER_PASSWORD"
echo "- NEON_CONNECTION_STRING"
echo ""
