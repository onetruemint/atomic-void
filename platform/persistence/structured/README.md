# PostgresPersistence

A PostgreSQL implementation of the Persistence interface for the OTM Template platform.

## Usage

```typescript
import { PostgresPersistence } from "@platform/persistence/structured/postgres";

// Define your data model
interface User {
  id?: number;
  name: string;
  email: string;
  created_at?: Date;
}

// Create a new instance for the 'users' table
const userPersistence = new PostgresPersistence<User>("users");

// Or with custom configuration
const userPersistence = new PostgresPersistence<User>("users", {
  host: "localhost",
  port: 5432,
  database: "myapp",
  user: "myuser",
  password: "mypassword",
});

// Create a new user
const newUser = await userPersistence.create({
  name: "John Doe",
  email: "john@example.com",
});

// Get a user by ID
const user = await userPersistence.get(1);

// Update a user
await userPersistence.update({
  id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
});

// Upsert (insert or update)
await userPersistence.upsert({
  id: 1,
  name: "Updated Name",
  email: "updated@example.com",
});

// Delete a user
await userPersistence.delete({ id: 1 });

// Health check
const isHealthy = await userPersistence.healthCheck();

// Close the connection pool when done
await userPersistence.close();
```

## Environment Variables

The class uses the following environment variables with defaults:

- `POSTGRES_HOST` (default: "localhost")
- `POSTGRES_PORT` (default: "5432")
- `POSTGRES_DB` (default: "otm-template")
- `POSTGRES_USER` (default: "postgres")
- `POSTGRES_PASSWORD` (default: "password")

## Features

- **Connection Pooling**: Uses pg.Pool for efficient connection management
- **Type Safety**: Full TypeScript support with generic types
- **Error Handling**: Comprehensive error handling and logging
- **Health Checks**: Built-in database health monitoring
- **Transaction Support**: Access to raw clients for transaction management
- **Environment Configuration**: Automatic configuration from environment variables
