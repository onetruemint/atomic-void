/**
 * Example usage of the persistence factory functions
 * This file demonstrates how to use the factory functions to create persistence instances
 */

import {
  createPersistence,
  createPostgresPersistence,
  createMongoPersistence,
  DatabaseType,
  PersistenceImplementation,
  isPostgresPersistence,
  isMongoPersistence,
  getDatabaseType,
} from "./index";

// Example data models
interface User {
  id?: number | string;
  _id?: any;
  name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

interface Product {
  id?: number | string;
  _id?: any;
  name: string;
  price: number;
  category: string;
  created_at?: Date;
  updated_at?: Date;
}

// Example service that can work with any persistence implementation
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

  async close(): Promise<void> {
    if (isPostgresPersistence(this.persistence)) {
      await this.persistence.close();
    } else if (isMongoPersistence(this.persistence)) {
      await this.persistence.close();
    }
  }
}

// Example 1: Using the factory function with environment-based database selection
export function createUserServiceFromEnvironment(): UserService {
  const databaseType =
    (process.env.DATABASE_TYPE as DatabaseType) || DatabaseType.POSTGRES;

  const persistence = createPersistence<User>({
    databaseType,
    tableOrCollectionName: "users",
  });

  return new UserService(persistence);
}

// Example 2: Using the factory function with explicit configuration
export function createUserServiceWithConfig(): UserService {
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

  return new UserService(persistence);
}

// Example 3: Using specific factory functions
export function createPostgresUserService(): UserService {
  const persistence = createPostgresPersistence<User>("users", {
    host: "localhost",
    port: 5432,
    database: "myapp",
    user: "myuser",
    password: "mypassword",
  });

  return new UserService(persistence);
}

export function createMongoUserService(): UserService {
  const persistence = createMongoPersistence<User>("users", {
    host: "localhost",
    port: 27017,
    database: "myapp",
    username: "myuser",
    password: "mypassword",
  });

  return new UserService(persistence);
}

// Example 4: Dynamic service creation based on database type
export function createServiceForDatabaseType(
  databaseType: DatabaseType,
  tableOrCollectionName: string
): UserService {
  const persistence = createPersistence<User>({
    databaseType,
    tableOrCollectionName,
  });

  return new UserService(persistence);
}

// Example 5: Working with multiple persistence implementations
export class MultiDatabaseService {
  private userPersistence: PersistenceImplementation<User>;
  private productPersistence: PersistenceImplementation<Product>;

  constructor(
    userDatabaseType: DatabaseType,
    productDatabaseType: DatabaseType
  ) {
    this.userPersistence = createPersistence<User>({
      databaseType: userDatabaseType,
      tableOrCollectionName: "users",
    });

    this.productPersistence = createPersistence<Product>({
      databaseType: productDatabaseType,
      tableOrCollectionName: "products",
    });
  }

  async createUser(
    userData: Omit<User, "id" | "_id" | "created_at" | "updated_at">
  ): Promise<string | number | null> {
    return await this.userPersistence.create(userData as User);
  }

  async createProduct(
    productData: Omit<Product, "id" | "_id" | "created_at" | "updated_at">
  ): Promise<string | number | null> {
    return await this.productPersistence.create(productData as Product);
  }

  async getUserById(id: string | number): Promise<User | null> {
    return await this.userPersistence.get(id);
  }

  async getProductById(id: string | number): Promise<Product | null> {
    return await this.productPersistence.get(id);
  }

  // Example of using type guards to access database-specific features
  async getUserCount(): Promise<number> {
    if (isMongoPersistence(this.userPersistence)) {
      return await this.userPersistence.count({});
    } else if (isPostgresPersistence(this.userPersistence)) {
      // For PostgreSQL, we'd need to use a custom query
      const result = await this.userPersistence.query(
        "SELECT COUNT(*) FROM users"
      );
      return parseInt(result.rows[0].count);
    }
    return 0;
  }

  async searchUsers(query: string): Promise<User[]> {
    if (isMongoPersistence(this.userPersistence)) {
      return await this.userPersistence.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      });
    } else if (isPostgresPersistence(this.userPersistence)) {
      const result = await this.userPersistence.query(
        "SELECT * FROM users WHERE name ILIKE $1 OR email ILIKE $1",
        [`%${query}%`]
      );
      return result.rows as User[];
    }
    return [];
  }

  async healthCheck(): Promise<{ users: boolean; products: boolean }> {
    const userHealth = await this.userPersistence.healthCheck();
    const productHealth = await this.productPersistence.healthCheck();

    return {
      users: userHealth,
      products: productHealth,
    };
  }

  async close(): Promise<void> {
    if (isPostgresPersistence(this.userPersistence)) {
      await this.userPersistence.close();
    } else if (isMongoPersistence(this.userPersistence)) {
      await this.userPersistence.close();
    }

    if (isPostgresPersistence(this.productPersistence)) {
      await this.productPersistence.close();
    } else if (isMongoPersistence(this.productPersistence)) {
      await this.productPersistence.close();
    }
  }
}

// Example 6: Express route setup with dynamic persistence
export function setupUserRoutes(app: any, userService: UserService) {
  app.post("/users", async (req: any, res: any) => {
    try {
      const userId = await userService.createUser(req.body);
      res
        .status(201)
        .json({ id: userId, message: "User created successfully" });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/users/:id", async (req: any, res: any) => {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/users/:id", async (req: any, res: any) => {
    try {
      const userIdResult = await userService.updateUser(
        req.params.id,
        req.body
      );
      if (!userIdResult) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: userIdResult, message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/users/:id", async (req: any, res: any) => {
    try {
      const success = await userService.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/health", async (req: any, res: any) => {
    try {
      const isHealthy = await userService.healthCheck();
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "healthy" : "unhealthy",
        database: isHealthy ? "connected" : "disconnected",
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res
        .status(503)
        .json({ status: "unhealthy", error: "Health check failed" });
    }
  });
}

// Example usage in a microservice
export async function initializeMicroservice() {
  // Create user service based on environment
  const userService = createUserServiceFromEnvironment();

  // Create product service with specific database
  const productService = new UserService(
    createPersistence<Product>({
      databaseType: DatabaseType.MONGODB,
      tableOrCollectionName: "products",
    })
  );

  // Check database types
  console.log(
    "User database type:",
    getDatabaseType(userService["persistence"])
  );
  console.log(
    "Product database type:",
    getDatabaseType(productService["persistence"])
  );

  // Perform health checks
  const userHealth = await userService.healthCheck();
  const productHealth = await productService.healthCheck();

  console.log("User database health:", userHealth);
  console.log("Product database health:", productHealth);

  return { userService, productService };
}
