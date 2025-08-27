#!/bin/bash

# Deployment script for csTimer to Google Cloud Run
set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  source .env
fi

# Configuration
PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
SERVICE_NAME="${SERVICE_NAME:-cstimer}"
REGION="${REGION:-us-central1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
TAG="${TAG:-latest}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

# Cloud Run configuration
MIN_INSTANCES="${MIN_INSTANCES:-0}"
MAX_INSTANCES="${MAX_INSTANCES:-10}"
MEMORY="${MEMORY:-512Mi}"
CPU="${CPU:-1}"
TIMEOUT="${TIMEOUT:-600}"
STARTUP_TIMEOUT="${STARTUP_TIMEOUT:-240}"

echo "🚀 Deploying ${SERVICE_NAME} to Google Cloud Run"
echo "   Project: ${PROJECT_ID}"
echo "   Region: ${REGION}"
echo "   Image: ${FULL_IMAGE_NAME}"

# Deploy to Cloud Run
gcloud run deploy "${SERVICE_NAME}" \
  --image="${FULL_IMAGE_NAME}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --allow-unauthenticated \
  --memory="${MEMORY}" \
  --cpu="${CPU}" \
  --min-instances="${MIN_INSTANCES}" \
  --max-instances="${MAX_INSTANCES}" \
  --timeout="${TIMEOUT}" \
  --cpu-boost \
  --execution-environment=gen2 \
  --set-env-vars="DEPLOY=1" \
  --startup-probe="httpGet.path=/health.php,periodSeconds=2,timeoutSeconds=1,failureThreshold=20" \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")

echo "✅ Deployment successful!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "📊 Configuration:"
echo "   Min instances: ${MIN_INSTANCES}"
echo "   Max instances: ${MAX_INSTANCES}"
echo "   Memory: ${MEMORY}"
echo "   CPU: ${CPU}"
echo "   Timeout: ${TIMEOUT}s"

# Test the deployment
echo "🧪 Testing deployment..."
if curl -f -s "${SERVICE_URL}" > /dev/null; then
  echo "✅ Service is responding correctly"
else
  echo "⚠️  Service may not be responding correctly"
  echo "   Check logs: gcloud logs read --service=${SERVICE_NAME} --project=${PROJECT_ID}"
fi
