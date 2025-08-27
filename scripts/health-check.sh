#!/bin/bash

# Health check script for csTimer deployment
set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  source .env
fi

# Configuration
PROJECT_ID="${PROJECT_ID}"
SERVICE_NAME="${SERVICE_NAME:-cstimer}"
REGION="${REGION:-us-central1}"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID environment variable is required"
  exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
  echo "❌ Could not get service URL. Is the service deployed?"
  exit 1
fi

echo "🏥 Running health checks for: $SERVICE_URL"

# Test health endpoint
echo "Testing health endpoint..."
if curl -f -s "${SERVICE_URL}/health.php" > /dev/null; then
  echo "✅ Health endpoint responding"
else
  echo "⚠️  Health endpoint not responding"
fi

# Test main application
echo "Testing main application..."
if curl -f -s "${SERVICE_URL}" > /dev/null; then
  echo "✅ Main application responding"
else
  echo "❌ Main application not responding"
  exit 1
fi

# Test cold start performance (simulate idle timeout)
echo "🧊 Testing cold start performance..."
echo "   Waiting 15 minutes for potential cold start..."
sleep 900  # 15 minutes

echo "   Testing response after idle period..."
START_TIME=$(date +%s)
if curl -f -s "${SERVICE_URL}" > /dev/null; then
  END_TIME=$(date +%s)
  RESPONSE_TIME=$((END_TIME - START_TIME))
  echo "✅ Cold start successful in ${RESPONSE_TIME} seconds"
  
  if [ $RESPONSE_TIME -gt 10 ]; then
    echo "⚠️  Cold start took ${RESPONSE_TIME}s - this may cause 502 errors"
  fi
else
  echo "❌ Cold start failed - 502 error likely"
  exit 1
fi

echo "🎉 All health checks passed!"