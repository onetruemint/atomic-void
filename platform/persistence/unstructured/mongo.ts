import {
  MongoClient,
  Db,
  Collection,
  ObjectId,
  InsertOneResult,
  UpdateResult,
  DeleteResult,
  FindOptions,
  MongoClientOptions,
} from "mongodb";
import { Persistence } from "../Persistence";
import { fetchEnvVar } from "../../utils";

export interface MongoConfig {
  uri?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  authSource?: string;
  ssl?: boolean;
  maxPoolSize?: number;
  minPoolSize?: number;
  maxIdleTimeMS?: number;
  serverSelectionTimeoutMS?: number;
  connectTimeoutMS?: number;
  socketTimeoutMS?: number;
}

export class MongoPersistence<T extends Record<string, any>>
  implements Persistence<T>
{
  private client: MongoClient;
  private db: Db;
  private collection: Collection<T>;
  private collectionName: string;
  private isConnected: boolean = false;

  constructor(collectionName: string, config?: MongoConfig) {
    this.collectionName = collectionName;

    // Default configuration with environment variable fallbacks
    const defaultConfig: MongoConfig = {
      host: fetchEnvVar("MONGO_HOST", "localhost"),
      port: parseInt(fetchEnvVar("MONGO_PORT", "27017")),
      database: fetchEnvVar("MONGO_DB", "otm-template"),
      username: fetchEnvVar("MONGO_USERNAME", "otm-template-user"),
      password: fetchEnvVar("MONGO_PASSWORD", "otm-template-password"),
      authSource: fetchEnvVar("MONGO_AUTH_SOURCE", "admin"),
      ssl: process.env["NODE_ENV"] === "production",
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 0,
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Build connection URI
    const uri = this.buildConnectionUri(finalConfig);

    // MongoDB client options
    const clientOptions: MongoClientOptions = {
      maxPoolSize: finalConfig.maxPoolSize || 10,
      minPoolSize: finalConfig.minPoolSize || 2,
      maxIdleTimeMS: finalConfig.maxIdleTimeMS || 30000,
      serverSelectionTimeoutMS: finalConfig.serverSelectionTimeoutMS || 5000,
      connectTimeoutMS: finalConfig.connectTimeoutMS || 10000,
      socketTimeoutMS: finalConfig.socketTimeoutMS || 0,
      ssl: finalConfig.ssl || false,
    };

    this.client = new MongoClient(uri, clientOptions);
    this.db = this.client.db(finalConfig.database);
    this.collection = this.db.collection<T>(this.collectionName);
  }

  private buildConnectionUri(config: MongoConfig): string {
    if (config.uri) {
      return config.uri;
    }

    const protocol = config.ssl ? "mongodb+srv" : "mongodb";
    const auth =
      config.username && config.password
        ? `${config.username}:${config.password}@`
        : "";
    const host = config.host || "localhost";
    const port = config.port ? `:${config.port}` : "";
    const database = config.database || "otm-template";
    const authSource = config.authSource
      ? `?authSource=${config.authSource}`
      : "";

    return `${protocol}://${auth}${host}${port}/${database}${authSource}`;
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
      this.isConnected = true;
      console.log(`Connected to MongoDB collection: ${this.collectionName}`);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  /**
   * Ensure connection is established
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  /**
   * Create a new document in the collection
   */
  async create(data: T): Promise<string | number | null | undefined> {
    await this.ensureConnection();

    try {
      const document = { ...data } as any;

      // Add timestamps if not present
      if (!document.created_at) {
        document.created_at = new Date();
      }
      if (!document.updated_at) {
        document.updated_at = new Date();
      }

      const result: InsertOneResult = await this.collection.insertOne(document);
      return result.insertedId?.toString() || null;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  /**
   * Update an existing document in the collection
   */
  async update(data: T): Promise<string | number | null | undefined> {
    await this.ensureConnection();

    try {
      const document = data as any;
      const { _id, id, ...updateData } = document;

      const documentId = _id || id;
      if (!documentId) {
        throw new Error("ID is required for update operation");
      }

      // Convert string ID to ObjectId if needed
      const objectId =
        typeof documentId === "string" ? new ObjectId(documentId) : documentId;

      // Add updated timestamp
      updateData.updated_at = new Date();

      const result: UpdateResult = await this.collection.updateOne(
        { _id: objectId } as any,
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return null;
      }

      return documentId.toString();
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  }

  /**
   * Insert or update a document (upsert)
   */
  async upsert(data: T): Promise<string | number | null | undefined> {
    await this.ensureConnection();

    try {
      const document = data as any;
      const { _id, id, ...upsertData } = document;

      const documentId = _id || id;

      if (!documentId) {
        // If no ID provided, treat as create
        return this.create(data);
      }

      // Convert string ID to ObjectId if needed
      const objectId =
        typeof documentId === "string" ? new ObjectId(documentId) : documentId;

      // Add timestamps
      if (!upsertData.created_at) {
        upsertData.created_at = new Date();
      }
      upsertData.updated_at = new Date();

      await this.collection.updateOne(
        { _id: objectId } as any,
        { $set: upsertData },
        { upsert: true }
      );

      return documentId.toString();
    } catch (error) {
      console.error("Error upserting document:", error);
      throw error;
    }
  }

  /**
   * Delete a document from the collection
   */
  async delete(data: T): Promise<string | number | null | undefined> {
    await this.ensureConnection();

    try {
      const document = data as any;
      const { _id, id } = document;

      const documentId = _id || id;
      if (!documentId) {
        throw new Error("ID is required for delete operation");
      }

      // Convert string ID to ObjectId if needed
      const objectId =
        typeof documentId === "string" ? new ObjectId(documentId) : documentId;

      const result: DeleteResult = await this.collection.deleteOne({
        _id: objectId,
      } as any);

      if (result.deletedCount === 0) {
        return null;
      }

      return documentId.toString();
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async get(id: number | string | null | undefined): Promise<T | null> {
    await this.ensureConnection();

    try {
      if (!id) {
        return null;
      }

      // Convert string ID to ObjectId if needed
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      const document = await this.collection.findOne({ _id: objectId } as any);
      return (document as T) || null;
    } catch (error) {
      console.error("Error getting document:", error);
      throw error;
    }
  }

  /**
   * Find documents with optional query and options
   */
  async find(query: any = {}, options: FindOptions<T> = {}): Promise<T[]> {
    await this.ensureConnection();

    try {
      const documents = await this.collection.find(query, options).toArray();
      return documents as T[];
    } catch (error) {
      console.error("Error finding documents:", error);
      throw error;
    }
  }

  /**
   * Find a single document with optional query and options
   */
  async findOne(
    query: any = {},
    options: FindOptions<T> = {}
  ): Promise<T | null> {
    await this.ensureConnection();

    try {
      const document = await this.collection.findOne(query, options);
      return (document as T) || null;
    } catch (error) {
      console.error("Error finding document:", error);
      throw error;
    }
  }

  /**
   * Count documents matching the query
   */
  async count(query: any = {}): Promise<number> {
    await this.ensureConnection();

    try {
      return await this.collection.countDocuments(query);
    } catch (error) {
      console.error("Error counting documents:", error);
      throw error;
    }
  }

  /**
   * Create indexes on the collection
   */
  async createIndex(indexSpec: any, options: any = {}): Promise<string> {
    await this.ensureConnection();

    try {
      return await this.collection.createIndex(indexSpec, options);
    } catch (error) {
      console.error("Error creating index:", error);
      throw error;
    }
  }

  /**
   * Drop the collection
   */
  async dropCollection(): Promise<boolean> {
    await this.ensureConnection();

    try {
      await this.collection.drop();
      return true;
    } catch (error) {
      console.error("Error dropping collection:", error);
      return false;
    }
  }

  /**
   * Get the collection instance for advanced operations
   */
  getCollection(): Collection<T> {
    return this.collection;
  }

  /**
   * Get the database instance
   */
  getDatabase(): Db {
    return this.db;
  }

  /**
   * Close the MongoDB connection
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log("Disconnected from MongoDB");
    }
  }

  /**
   * Health check for the MongoDB connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnection();
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error("MongoDB health check failed:", error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  isConnectionOpen(): boolean {
    return this.isConnected;
  }
}
