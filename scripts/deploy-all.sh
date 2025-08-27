#!/bin/bash

# Complete build and deployment automation for csTimer
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo -e "${BLUE}📋 Loading configuration from .env file...${NC}"
  source .env
fi

# Configuration with defaults
PROJECT_ID="${PROJECT_ID}"
SERVICE_NAME="${SERVICE_NAME:-cstimer}"
REGION="${REGION:-us-central1}"

# Validate required environment variables
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: PROJECT_ID environment variable is required${NC}"
  echo "Set it with: export PROJECT_ID=your-gcp-project-id"
  exit 1
fi

echo -e "${BLUE}🚀 Starting complete deployment process for csTimer${NC}"
echo -e "${YELLOW}Project: $PROJECT_ID${NC}"
echo -e "${YELLOW}Service: $SERVICE_NAME${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
  echo -e "${RED}Error: Not authenticated with gcloud${NC}"
  echo "Run: gcloud auth login"
  exit 1
fi

# Set the project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${BLUE}📋 Ensuring required APIs are enabled...${NC}"
gcloud services enable containerregistry.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet

# Configure Docker for GCR
echo -e "${BLUE}🔧 Configuring Docker for Google Container Registry...${NC}"
gcloud auth configure-docker --quiet

# Generate a unique tag
TAG=$(date +%Y%m%d-%H%M%S)
export TAG

echo -e "${BLUE}🏷️  Using tag: $TAG${NC}"
echo ""

# Step 1: Build the Docker image
echo -e "${GREEN}Step 1/2: Building Docker image...${NC}"
./scripts/build.sh

echo ""

# Step 2: Deploy to Cloud Run
echo -e "${GREEN}Step 2/2: Deploying to Cloud Run...${NC}"
./scripts/deploy.sh

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}💡 Pro tips:${NC}"
echo -e "   • View logs: gcloud logs read --service=$SERVICE_NAME --project=$PROJECT_ID"
echo -e "   • Monitor: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
echo -e "   • Rollback: gcloud run services replace-traffic $SERVICE_NAME --to-revisions=PREVIOUS=100 --region=$REGION"