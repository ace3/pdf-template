build:
	docker-compose build

up:
	docker-compose up

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose down
	docker-compose up --build

deploy:
	gcloud config set project pt-dki-451706
	docker build --platform=linux/amd64 -t gcr.io/pt-dki-451706/pdf-template:latest .
	docker push gcr.io/pt-dki-451706/pdf-template:latest
	gcloud run deploy pdf-template \
		--image gcr.io/pt-dki-451706/pdf-template:latest \
		--platform managed \
		--region asia-southeast2 \
		--allow-unauthenticated \
		--cpu 2 \
		--port 3000 \
		--timeout 100s \
		--max-instances 5 \
		--memory 4Gi \
		--project pt-dki-451706