# skilder - Backend

## Environment Configuration

This backend service uses environment variables for configuration. The service will look for a `.env` file in:

- `packages/backend/.env` (package-specific environment)

### Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your specific configuration values.

### Required Environment Variables

- `DGRAPH_ENDPOINT`: GraphQL endpoint for DGraph database
- `NATS_URL`: NATS server URL
- `NATS_CLUSTER_ID`: NATS cluster identifier
- `NATS_CLIENT_ID`: NATS client identifier
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment mode (development/production)
- `LOG_LEVEL`: Logging level (default: info)
- `JWT_SECRET`: Secret for JWT token signing
- `BCRYPT_ROUNDS`: Number of bcrypt rounds for password hashing

### Running the Service

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```
