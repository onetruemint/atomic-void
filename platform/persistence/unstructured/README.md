# MongoPersistence

A MongoDB implementation of the Persistence interface for the OTM Template platform.

## Usage

```typescript
import { MongoPersistence } from "@platform/persistence/unstructured/mongo";

// Define your data model
interface User {
  _id?: ObjectId;
  id?: string;
  name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

// Create a new instance for the 'users' collection
const userPersistence = new MongoPersistence<User>("users");

// Or with custom configuration
const userPersistence = new MongoPersistence<User>("users", {
  host: "localhost",
  port: 27017,
  database: "myapp",
  username: "myuser",
  password: "mypassword",
  authSource: "admin",
});

// Connect to MongoDB (optional - will auto-connect on first operation)
await userPersistence.connect();

// Create a new user
const newUser = await userPersistence.create({
  name: "John Doe",
  email: "john@example.com",
});

// Get a user by ID
const user = await userPersistence.get("507f1f77bcf86cd799439011");

// Update a user
await userPersistence.update({
  _id: new ObjectId("507f1f77bcf86cd799439011"),
  name: "Jane Doe",
  email: "jane@example.com",
});

// Upsert (insert or update)
await userPersistence.upsert({
  _id: new ObjectId("507f1f77bcf86cd799439011"),
  name: "Updated Name",
  email: "updated@example.com",
});

// Delete a user
await userPersistence.delete({ _id: new ObjectId("507f1f77bcf86cd799439011") });

// Find multiple users
const users = await userPersistence.find({ name: "John Doe" });

// Find a single user
const userByName = await userPersistence.findOne({ email: "john@example.com" });

// Count users
const userCount = await userPersistence.count({ active: true });

// Create an index
await userPersistence.createIndex({ email: 1 }, { unique: true });

// Health check
const isHealthy = await userPersistence.healthCheck();

// Close the connection when done
await userPersistence.close();
```

## Environment Variables

The class uses the following environment variables with defaults:

- `MONGO_HOST` (default: "localhost")
- `MONGO_PORT` (default: "27017")
- `MONGO_DB` (default: "otm-template")
- `MONGO_USERNAME` (default: "otm-template-user")
- `MONGO_PASSWORD` (default: "otm-template-password")
- `MONGO_AUTH_SOURCE` (default: "admin")

## Features

- **Connection Management**: Automatic connection handling with lazy connection
- **Type Safety**: Full TypeScript support with generic types
- **ObjectId Support**: Automatic conversion between string IDs and ObjectIds
- **Timestamps**: Automatic created_at and updated_at timestamp management
- **Error Handling**: Comprehensive error handling and logging
- **Health Checks**: Built-in database health monitoring
- **Advanced Queries**: Support for complex MongoDB queries and operations
- **Index Management**: Built-in index creation and management
- **Environment Configuration**: Automatic configuration from environment variables

## MongoDB-Specific Features

### Additional Methods

- `find(query, options)`: Find multiple documents with optional query and options
- `findOne(query, options)`: Find a single document with optional query and options
- `count(query)`: Count documents matching the query
- `createIndex(indexSpec, options)`: Create indexes on the collection
- `dropCollection()`: Drop the entire collection
- `getCollection()`: Get the raw MongoDB collection for advanced operations
- `getDatabase()`: Get the raw MongoDB database instance

### ID Handling

The class supports both `_id` (MongoDB ObjectId) and `id` (string) fields:

- When creating documents, MongoDB will generate an `_id` if not provided
- When updating/upserting, you can use either `_id` or `id` field
- String IDs are automatically converted to ObjectIds when needed

### Timestamps

The class automatically adds `created_at` and `updated_at` timestamps:

- `created_at`: Added when creating new documents (if not already present)
- `updated_at`: Added when updating or upserting documents

## Connection Management

The class uses lazy connection - it will automatically connect to MongoDB on the first operation. You can also manually connect using the `connect()` method.

```typescript
// Manual connection
await userPersistence.connect();

// Check connection status
const isConnected = userPersistence.isConnectionOpen();

// Close connection
await userPersistence.close();
```
