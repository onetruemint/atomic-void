/**
 * Example usage of PostgresPersistence
 * This file demonstrates how to use the PostgresPersistence class in a microservice
 */

import { PostgresPersistence } from "./postgres";

// Example data model for a user
interface User {
  id?: number;
  name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

// Example data model for a product
interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  in_stock: boolean;
  created_at?: Date;
}

// Example microservice setup
export class UserService {
  private userPersistence: PostgresPersistence<User>;

  constructor() {
    // Initialize with default configuration (uses environment variables)
    this.userPersistence = new PostgresPersistence<User>("users");
  }

  async createUser(
    userData: Omit<User, "id" | "created_at" | "updated_at">
  ): Promise<number | null> {
    const userId = await this.userPersistence.create({
      ...userData,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return userId as number;
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.userPersistence.get(id);
  }

  async updateUser(
    id: number,
    updates: Partial<Omit<User, "id" | "created_at">>
  ): Promise<number | null> {
    const existingUser = await this.userPersistence.get(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser = {
      ...existingUser,
      ...updates,
      updated_at: new Date(),
    };

    return (await this.userPersistence.update(updatedUser)) as number;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.userPersistence.delete({ id });
    return result !== null;
  }

  async healthCheck(): Promise<boolean> {
    return await this.userPersistence.healthCheck();
  }

  async close(): Promise<void> {
    await this.userPersistence.close();
  }
}

// Example Express route usage
export function setupUserRoutes(app: any, userService: UserService) {
  // Create user
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

  // Get user by ID
  app.get("/users/:id", async (req: any, res: any) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user
  app.put("/users/:id", async (req: any, res: any) => {
    try {
      const userId = parseInt(req.params.id);
      const userIdResult = await userService.updateUser(userId, req.body);

      if (!userIdResult) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ id: userIdResult, message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/users/:id", async (req: any, res: any) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await userService.deleteUser(userId);

      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Health check
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
