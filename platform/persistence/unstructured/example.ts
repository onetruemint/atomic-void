/**
 * Example usage of MongoPersistence
 * This file demonstrates how to use the MongoPersistence class in a microservice
 */

import { ObjectId } from "mongodb";
import { MongoPersistence } from "./mongo";

// Example data model for a user
interface User {
  _id?: ObjectId;
  id?: string;
  name: string;
  email: string;
  age?: number;
  active: boolean;
  preferences: {
    theme: string;
    notifications: boolean;
  };
  created_at?: Date;
  updated_at?: Date;
}

// Example data model for a product
interface Product {
  _id?: ObjectId;
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  in_stock: boolean;
  metadata: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

// Example microservice setup
export class UserService {
  private userPersistence: MongoPersistence<User>;

  constructor() {
    // Initialize with default configuration (uses environment variables)
    this.userPersistence = new MongoPersistence<User>("users");
  }

  async initialize(): Promise<void> {
    // Connect to MongoDB
    await this.userPersistence.connect();

    // Create indexes for better performance
    await this.userPersistence.createIndex({ email: 1 }, { unique: true });
    await this.userPersistence.createIndex({ name: 1 });
    await this.userPersistence.createIndex({ active: 1 });
  }

  async createUser(
    userData: Omit<User, "_id" | "id" | "created_at" | "updated_at">
  ): Promise<string | null> {
    const userId = await this.userPersistence.create({
      ...userData,
      active: true,
      preferences: {
        theme: "light",
        notifications: true,
        ...userData.preferences,
      },
    });
    return userId as string;
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userPersistence.get(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userPersistence.findOne({ email });
  }

  async getActiveUsers(): Promise<User[]> {
    return await this.userPersistence.find({ active: true });
  }

  async searchUsers(query: string): Promise<User[]> {
    return await this.userPersistence.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });
  }

  async updateUser(
    id: string,
    updates: Partial<Omit<User, "_id" | "id" | "created_at">>
  ): Promise<string | null> {
    const existingUser = await this.userPersistence.get(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser = {
      ...existingUser,
      ...updates,
    };

    return (await this.userPersistence.update(updatedUser)) as string;
  }

  async deactivateUser(id: string): Promise<boolean> {
    const result = await this.userPersistence.update({
      _id: new ObjectId(id),
      active: false,
    } as User);
    return result !== null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userPersistence.delete({ _id: new ObjectId(id) });
    return result !== null;
  }

  async getUserCount(): Promise<number> {
    return await this.userPersistence.count({ active: true });
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

  // Get user by email
  app.get("/users/email/:email", async (req: any, res: any) => {
    try {
      const user = await userService.getUserByEmail(req.params.email);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user by email:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Search users
  app.get("/users/search/:query", async (req: any, res: any) => {
    try {
      const users = await userService.searchUsers(req.params.query);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Get active users
  app.get("/users/active", async (req: any, res: any) => {
    try {
      const users = await userService.getActiveUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ error: "Failed to fetch active users" });
    }
  });

  // Update user
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

  // Deactivate user
  app.patch("/users/:id/deactivate", async (req: any, res: any) => {
    try {
      const success = await userService.deactivateUser(req.params.id);

      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  });

  // Delete user
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

  // Get user count
  app.get("/users/stats/count", async (req: any, res: any) => {
    try {
      const count = await userService.getUserCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting user count:", error);
      res.status(500).json({ error: "Failed to get user count" });
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

// Example advanced MongoDB operations
export class AdvancedUserService extends UserService {
  async getUsersWithPagination(
    page: number = 1,
    limit: number = 10,
    sortBy: string = "created_at",
    sortOrder: 1 | -1 = -1
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const users = await this.userPersistence.find(
      {},
      {
        skip,
        limit,
        sort: { [sortBy]: sortOrder },
      }
    );
    const total = await this.userPersistence.count({});
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
    };
  }

  async getUsersByAgeRange(minAge: number, maxAge: number): Promise<User[]> {
    return await this.userPersistence.find({
      age: { $gte: minAge, $lte: maxAge },
    });
  }

  async getUsersByTags(tags: string[]): Promise<User[]> {
    return await this.userPersistence.find({
      "preferences.tags": { $in: tags },
    });
  }

  async aggregateUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    averageAge: number;
    topThemes: { theme: string; count: number }[];
  }> {
    const collection = this.userPersistence.getCollection();

    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ["$active", 1, 0] },
          },
          averageAge: { $avg: "$age" },
        },
      },
    ];

    const stats = await collection.aggregate(pipeline).toArray();

    const themeStats = await collection
      .aggregate([
        { $group: { _id: "$preferences.theme", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    return {
      totalUsers: stats[0]?.totalUsers || 0,
      activeUsers: stats[0]?.activeUsers || 0,
      averageAge: stats[0]?.averageAge || 0,
      topThemes: themeStats.map((item) => ({
        theme: item._id,
        count: item.count,
      })),
    };
  }
}
