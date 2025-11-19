# Persistence Layer

A unified persistence layer for the Atomic Void platform that supports both PostgreSQL and MongoDB databases through a common interface.

## Overview

The persistence layer provides a consistent API for database operations across different database types. It includes:

- **Persistence Interface**: Common interface for all database operations
- **PostgreSQL Implementation**: Full-featured PostgreSQL persistence with connection pooling
- **MongoDB Implementation**: Full-featured MongoDB persistence with document support
- **Factory Functions**: Easy creation of persistence instances based on database type

## Quick Start

```typescript
import {
  createPersistence,
  DatabaseType,
  PersistenceImplementation,
} from "@platform/persistence";

// Define your data model
interface User {
  id?: number | string;
  _id?: any;
  name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

// Create a persistence instance based on database type
const userPersistence = createPersistence<User>({
  databaseType: DatabaseType.POSTGRES, // or DatabaseType.MONGODB
  tableOrCollectionName: "users",
});

// Use the persistence instance
const userId = await userPersistence.create({
  name: "John Doe",
  email: "john@example.com",
});

const user = await userPersistence.get(userId);
```

## Factory Functions

### Main Factory Function

```typescript
import { createPersistence, DatabaseType } from "@platform/persistence";

// Create with environment-based configuration
const persistence = createPersistence<User>({
  databaseType: DatabaseType.POSTGRES,
  tableOrCollectionName: "users",
});

// Create with custom configuration
const persistence = createPersistence<User>({
  databaseType: DatabaseType.MONGODB,
  tableOrCollectionName: "users",
  config: {
    host: "localhost",
    port: 27017,
    database: "myapp",
    username: "myuser",
    password: "mypassword",
  },
});
```

### Specific Factory Functions

```typescript
import {
  createPostgresPersistence,
  createMongoPersistence,
} from "@platform/persistence";

// Create PostgreSQL persistence
const postgresPersistence = createPostgresPersistence<User>("users", {
  host: "localhost",
  port: 5432,
  database: "myapp",
  user: "myuser",
  password: "mypassword",
});

// Create MongoDB persistence
const mongoPersistence = createMongoPersistence<User>("users", {
  host: "localhost",
  port: 27017,
  database: "myapp",
  username: "myuser",
  password: "mypassword",
});
```

## Type Guards and Utilities

```typescript
import {
  isPostgresPersistence,
  isMongoPersistence,
  getDatabaseType,
  DatabaseType,
} from "@platform/persistence";

// Check persistence type
if (isPostgresPersistence(persistence)) {
  // Access PostgreSQL-specific methods
  const result = await persistence.query("SELECT * FROM users");
}

if (isMongoPersistence(persistence)) {
  // Access MongoDB-specific methods
  const users = await persistence.find({ active: true });
}

// Get database type
const dbType = getDatabaseType(persistence);
console.log(`Using ${dbType} database`);
```

## Environment Variables

### PostgreSQL

- `POSTGRES_HOST` (default: "localhost")
- `POSTGRES_PORT` (default: "5432")
- `POSTGRES_DB` (default: "atomic-void")
- `POSTGRES_USER` (default: "postgres")
- `POSTGRES_PASSWORD` (default: "password")

### MongoDB

- `MONGO_HOST` (default: "localhost")
- `MONGO_PORT` (default: "27017")
- `MONGO_DB` (default: "atomic-void")
- `MONGO_USERNAME` (default: "atomic-void-user")
- `MONGO_PASSWORD` (default: "atomic-void-password")
- `MONGO_AUTH_SOURCE` (default: "admin")

## Common Interface Methods

All persistence implementations support these methods:

```typescript
// Create a new record
const id = await persistence.create(data);

// Get a record by ID
const record = await persistence.get(id);

// Update a record
const updatedId = await persistence.update(data);

// Upsert (insert or update)
const upsertedId = await persistence.upsert(data);

// Delete a record
const deletedId = await persistence.delete(data);

// Health check
const isHealthy = await persistence.healthCheck();

// Close connection
await persistence.close();
```

## Database-Specific Features

### PostgreSQL Features

```typescript
if (isPostgresPersistence(persistence)) {
  // Execute custom SQL queries
  const result = await persistence.query(
    "SELECT * FROM users WHERE active = $1",
    [true]
  );

  // Get raw client for transactions
  const client = await persistence.getClient();

  // Connection pooling is handled automatically
}
```

### MongoDB Features

```typescript
if (isMongoPersistence(persistence)) {
  // Find multiple documents
  const users = await persistence.find({ active: true });

  // Find single document
  const user = await persistence.findOne({ email: "john@example.com" });

  // Count documents
  const count = await persistence.count({ active: true });

  // Create indexes
  await persistence.createIndex({ email: 1 }, { unique: true });

  // Access raw collection for advanced operations
  const collection = persistence.getCollection();
}
```

## Service Pattern Example

```typescript
export class UserService {
  private persistence: PersistenceImplementation<User>;

  constructor(persistence: PersistenceImplementation<User>) {
    this.persistence = persistence;
  }

  async createUser(
    userData: Omit<User, "id" | "_id" | "created_at" | "updated_at">
  ): Promise<string | number | null> {
    return await this.persistence.create(userData as User);
  }

  async getUserById(id: string | number): Promise<User | null> {
    return await this.persistence.get(id);
  }

  async updateUser(
    id: string | number,
    updates: Partial<User>
  ): Promise<string | number | null> {
    const existingUser = await this.persistence.get(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser = { ...existingUser, ...updates };
    return await this.persistence.update(updatedUser);
  }

  async deleteUser(id: string | number): Promise<boolean> {
    const existingUser = await this.persistence.get(id);
    if (!existingUser) {
      return false;
    }

    const result = await this.persistence.delete(existingUser);
    return result !== null;
  }

  async healthCheck(): Promise<boolean> {
    return await this.persistence.healthCheck();
  }
}

// Usage
const userService = new UserService(
  createPersistence<User>({
    databaseType: DatabaseType.POSTGRES,
    tableOrCollectionName: "users",
  })
);
```

## Microservice Integration

```typescript
// In your microservice
import { createPersistence, DatabaseType } from "@platform/persistence";

// Create persistence based on environment or configuration
const databaseType =
  (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;

const userPersistence = createPersistence<User>({
  databaseType,
  tableOrCollectionName: "users",
});

// Use in your Express routes
app.post("/users", async (req, res) => {
  try {
    const userId = await userPersistence.create(req.body);
    res.status(201).json({ id: userId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});
```

## Error Handling

All persistence implementations include comprehensive error handling:

```typescript
try {
  const user = await persistence.get("invalid-id");
} catch (error) {
  console.error("Database error:", error);
  // Handle specific error types
}
```

## Health Monitoring

```typescript
// Check database health
const isHealthy = await persistence.healthCheck();

// Use in health check endpoints
app.get("/health", async (req, res) => {
  const isHealthy = await persistence.healthCheck();
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    database: isHealthy ? "connected" : "disconnected",
  });
});
```

## Best Practices

1. **Use the factory function** for easy database switching
2. **Implement proper error handling** for all database operations
3. **Use type guards** when accessing database-specific features
4. **Close connections** when shutting down your application
5. **Monitor health** with regular health checks
6. **Use environment variables** for configuration
7. **Implement proper logging** for debugging and monitoring
