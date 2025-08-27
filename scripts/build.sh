#!/bin/bash

# Build script for csTimer Docker image
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
TAG="${TAG:-$(date +%Y%m%d-%H%M%S)}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

# Build dist files first
echo "🔨 Building dist files..."
if [ -f Makefile ]; then
  make dist
  echo "✅ Dist files built successfully"
else
  echo "⚠️  No Makefile found, skipping make dist"
fi

echo "🐳 Building Docker image: ${FULL_IMAGE_NAME}"

# Build the Docker image with production settings
docker build \
  -f Docker/Dockerfile \
  -t "${FULL_IMAGE_NAME}" \
  --build-arg DEPLOY=1 \
  --platform linux/amd64 \
  .

echo "✅ Docker image built successfully: ${FULL_IMAGE_NAME}"

# Tag as latest
docker tag "${FULL_IMAGE_NAME}" "${IMAGE_NAME}:latest"
echo "🏷️  Tagged as latest: ${IMAGE_NAME}:latest"

# Push to Google Container Registry
echo "📤 Pushing image to GCR..."
docker push "${FULL_IMAGE_NAME}"
docker push "${IMAGE_NAME}:latest"

echo "✅ Image pushed successfully!"
echo "📋 Image details:"
echo "   Full name: ${FULL_IMAGE_NAME}"
echo "   Registry: gcr.io/${PROJECT_ID}"
echo "   Service: ${SERVICE_NAME}"
echo "   Tag: ${TAG}"