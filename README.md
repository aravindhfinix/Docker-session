# Docker Session - Node.js with Redis and MongoDB

A simple Node.js application demonstrating Docker containerization with Redis and MongoDB connections.

## Quick Start

```bash
# Start all services
docker-compose up --build

# Access the application
curl http://localhost:3000/health
```

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### MongoDB Endpoints
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users

### Redis Endpoints
- `POST /api/cache` - Store a key-value pair
- `GET /api/cache/:key` - Get value by key
- `GET /api/cache` - Get all cached keys

## Services

- **Node.js App**: Port 3000
- **MongoDB**: Port 27017
- **Redis**: Port 6379

## Quick Command Reference

### Viewing Logs

```bash
# View app logs
docker compose logs app

# Follow logs in real-time
docker compose logs -f app

# Using docker-compose syntax (with sudo if needed)
sudo docker-compose logs -f app
```

### Accessing Containers

```bash
# Enter the app container
docker compose exec app sh

# Check Node version inside container
docker compose exec app node --version

# Run any command inside container
docker compose exec app <command>
```

### Image Management

```bash
# List all images
docker images

# Remove unused images
docker image prune -a -f

# Remove all images (⚠️ dangerous!)
docker rmi -f $(docker images -q)

# Complete system cleanup
docker system prune -a -f
```

For more commands and detailed explanations, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Documentation

For detailed step-by-step instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

