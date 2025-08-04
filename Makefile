# Go PDF Template Service Makefile

.PHONY: build run clean docker-build docker-run test fmt vet

# Variables
BINARY_NAME=main
DOCKER_IMAGE=pdf-template-go
PORT=3000
PROJECT_ID=pt-dki-451706
REGION=asia-southeast2
SERVICE_NAME=pdf-template-go

# Build the application
build:
	go build -o $(BINARY_NAME) main.go

# Run the application locally
run: build
	./$(BINARY_NAME)

# Clean build artifacts
clean:
	rm -f $(BINARY_NAME)
	go clean

# Build Docker image
docker-build:
	docker build -t $(DOCKER_IMAGE) .

# Run Docker container
docker-run: docker-build
	docker run -p $(PORT):$(PORT) \
		-v $(PWD):/app/templates:ro \
		$(DOCKER_IMAGE)

# Build for Cloud Run (linux/amd64)
build-cloud:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o $(BINARY_NAME) main.go

# Test the application
test:
	go test -v ./...

# Format Go code
fmt:
	go fmt ./...

# Vet Go code
vet:
	go vet ./...

# Download dependencies
deps:
	go mod download
	go mod tidy

# Development mode with auto-reload (requires air)
dev:
	air

# Install air for development
install-air:
	go install github.com/cosmtrek/air@latest

deploy:
	gcloud builds submit --tag gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)
	gcloud run deploy $(SERVICE_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(SERVICE_NAME) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--memory 2Gi \
		--cpu 2 \
		--timeout 300 \
		--concurrency 10 \
		--set-env-vars NODE_ENV=production

# Deploy with specific settings for PDF generation workload
deploy-optimized:
	gcloud builds submit --tag gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)
	gcloud run deploy $(SERVICE_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(SERVICE_NAME) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--memory 4Gi \
		--cpu 4 \
		--timeout 600 \
		--concurrency 5 \
		--set-env-vars NODE_ENV=production \
		--add-cloudsql-instances $(PROJECT_ID):$(REGION):your-db-instance

# Test deployment locally with Docker
test-docker: docker-build
	docker run -p $(PORT):$(PORT) \
		-e NODE_ENV=production \
		$(DOCKER_IMAGE)

# Show help
help:
	@echo "Available targets:"
	@echo "  build        - Build the application"
	@echo "  run          - Build and run the application"
	@echo "  clean        - Clean build artifacts"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Build and run Docker container"
	@echo "  build-cloud  - Build for Cloud Run deployment"
	@echo "  test         - Run tests"
	@echo "  fmt          - Format Go code"
	@echo "  vet          - Vet Go code"
	@echo "  deps         - Download and tidy dependencies"
	@echo "  dev          - Run in development mode with auto-reload"
	@echo "  install-air  - Install air for development"
	@echo "  deploy       - Deploy to Cloud Run"
	@echo "  deploy-optimized - Deploy to Cloud Run with optimized settings"
	@echo "  test-docker  - Test Docker image locally"
	@echo "  help         - Show this help message"
