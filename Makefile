.PHONY: build up down restart logs clean help

# Default target
help:
	@echo "Usage:"
	@echo "  make build    - Build or rebuild services"
	@echo "  make up       - Create and start containers in detached mode"
	@echo "  make down     - Stop and remove containers, networks, and images"
	@echo "  make restart  - Restart services"
	@echo "  make logs     - View output from containers"
	@echo "  make clean    - Remove all stopped containers and unused images"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	docker system prune -f
