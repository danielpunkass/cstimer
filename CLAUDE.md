# csTimer Project Instructions

## Project Overview
This is csTimer, a professional speedcubing/training timer web application. The project uses PHP with nginx in a Docker container and can be deployed to Google Cloud.

## Docker Configuration
- Main Dockerfile: `Docker/Dockerfile`
- Uses multi-stage build with Alpine Linux
- Runs nginx + PHP-FPM
- Supports both development (`DEPLOY=0`) and production (`DEPLOY=1`) modes
- Development serves from `/src`, production serves from `/dist`

## Development Commands
```bash
# Run in development mode
cd Docker
docker compose up --build

# Run in production mode  
cd Docker
DEPLOY=1 docker compose up --build
```

## Build Process
- Uses Java/OpenJDK for build process (`make dist`)
- Production build creates optimized files in `/dist`
- Development mode serves files directly from `/src`

## Key Directories
- `/src` - Source code and development files
- `/dist` - Built/optimized production files  
- `/Docker` - Docker configuration files
- `/docker-nginx-fpm` - Additional Docker configurations

## Google Cloud Deployment

### Setup
1. Copy environment configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your Google Cloud project details
   ```

2. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

### Automated Deployment
Run the complete build and deployment process:
```bash
export PROJECT_ID=your-gcp-project-id
./scripts/deploy-all.sh
```

### Individual Scripts
- `./scripts/build.sh` - Build and push Docker image to GCR
- `./scripts/deploy.sh` - Deploy to Google Cloud Run
- `./scripts/deploy-all.sh` - Complete build and deploy process

### Environment Variables
Key variables for deployment:
- `PROJECT_ID` - Your Google Cloud project ID (required)
- `SERVICE_NAME` - Cloud Run service name (default: cstimer)
- `REGION` - Deployment region (default: us-central1)
- `MIN_INSTANCES` - Minimum instances (default: 0, cost-optimized)
- `MEMORY` - Memory allocation (default: 512Mi)
- `CPU` - CPU allocation (default: 1)
- `TIMEOUT` - Request timeout (default: 600s)
- `STARTUP_TIMEOUT` - Container startup timeout (default: 240s)

### Monitoring & Health Checks
- View logs: `gcloud logs read --service=cstimer --project=YOUR_PROJECT_ID`
- Console: https://console.cloud.google.com/run
- Health check: `./scripts/health-check.sh`
- Rollback: `gcloud run services replace-traffic SERVICE_NAME --to-revisions=PREVIOUS=100`

### Cold Start Optimization
The deployment is configured to minimize costs while preventing 502 errors:
- **MIN_INSTANCES=0** - No idle costs, instances scale to zero
- **Gen2 execution environment** - 3x faster cold starts
- **CPU boost during startup** - Extra CPU during container initialization
- **Optimized PHP-FPM** - Static process model for consistent startup
- **Extended timeouts** - 600s request timeout, 240s startup timeout
- **Health endpoints** - `/health.php` for monitoring

## Important Notes
- This is a fork of the original csTimer project
- Some functions may not work properly on domains other than cstimer.net
- Uses Progressive Web App features for mobile support
- Supports multiple languages via Crowdin
- Cost-optimized deployment scales to zero when idle but prevents 502 errors