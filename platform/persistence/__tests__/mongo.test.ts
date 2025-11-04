/**
 * Jest tests for MongoDB persistence
 */

import { MongoPersistence } from "../unstructured/mongo";

// Mock the mongodb module
jest.mock("mongodb", () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({
          insertedId: { toString: () => "507f1f77bcf86cd799439011" },
        }),
        findOne: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          name: "Test User",
          email: "test@example.com",
        }),
        updateOne: jest.fn().mockResolvedValue({
          matchedCount: 1,
          modifiedCount: 1,
        }),
        deleteOne: jest.fn().mockResolvedValue({
          deletedCount: 1,
        }),
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            {
              _id: "507f1f77bcf86cd799439011",
              name: "Test User",
              email: "test@example.com",
            },
          ]),
        }),
        countDocuments: jest.fn().mockResolvedValue(1),
        createIndex: jest.fn().mockResolvedValue("email_1"),
        drop: jest.fn().mockResolvedValue(undefined),
      }),
      admin: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue({ ok: 1 }),
      }),
    }),
  })),
  ObjectId: jest.fn().mockImplementation((id) => ({
    toString: () => id || "507f1f77bcf86cd799439011",
  })),
}));

// Mock the utils module
jest.mock("../../utils", () => ({
  fetchEnvVar: jest.fn((key: string, defaultValue: string) => {
    const envVars: Record<string, string> = {
      MONGO_HOST: "localhost",
      MONGO_PORT: "27017",
      MONGO_DB: "testdb",
      MONGO_USERNAME: "testuser",
      MONGO_PASSWORD: "testpass",
      MONGO_AUTH_SOURCE: "admin",
    };
    return envVars[key] || defaultValue;
  }),
}));

interface TestDocument extends Record<string, any> {
  _id?: any;
  id?: string;
  name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

describe("MongoPersistence", () => {
  let persistence: MongoPersistence<TestDocument>;

  beforeEach(() => {
    persistence = new MongoPersistence<TestDocument>("test_collection");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create a MongoPersistence instance", () => {
      expect(persistence).toBeDefined();
    });

    it("should create a MongoPersistence instance with custom config", () => {
      const config = {
        host: "custom-host",
        port: 27018,
        database: "custom-db",
        username: "custom-user",
        password: "custom-pass",
      };

      const customPersistence = new MongoPersistence<TestDocument>(
        "test_collection",
        config
      );
      expect(customPersistence).toBeDefined();
    });
  });

  describe("create", () => {
    it("should create a new document", async () => {
      const testData: TestDocument = {
        name: "Test User",
        email: "test@example.com",
      };

      const result = await persistence.create(testData);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should add timestamps when creating", async () => {
      const testData: TestDocument = {
        name: "Test User",
        email: "test@example.com",
      };

      await persistence.create(testData);

      const collection = (persistence as any).collection;
      expect(collection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test User",
          email: "test@example.com",
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        })
      );
    });
  });

  describe("get", () => {
    it("should get a document by ID", async () => {
      const result = await persistence.get("507f1f77bcf86cd799439011");
      expect(result).toEqual({
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        email: "test@example.com",
      });
    });

    it("should return null for non-existent document", async () => {
      const collection = (persistence as any).collection;
      collection.findOne = jest.fn().mockResolvedValue(null);

      const result = await persistence.get("nonexistent");
      expect(result).toBeNull();
    });

    it("should return null for null/undefined ID", async () => {
      const result = await persistence.get(null);
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update an existing document", async () => {
      const testData: TestDocument = {
        _id: "507f1f77bcf86cd799439011",
        name: "Updated User",
        email: "updated@example.com",
      };

      const result = await persistence.update(testData);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should throw error when ID is missing", async () => {
      const testData: TestDocument = {
        name: "Test User",
        email: "test@example.com",
      };

      await expect(persistence.update(testData)).rejects.toThrow(
        "ID is required for update operation"
      );
    });
  });

  describe("delete", () => {
    it("should delete a document", async () => {
      const testData: TestDocument = {
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        email: "test@example.com",
      };

      const result = await persistence.delete(testData);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should throw error when ID is missing", async () => {
      const testData: TestDocument = {
        name: "Test User",
        email: "test@example.com",
      };

      await expect(persistence.delete(testData)).rejects.toThrow(
        "ID is required for delete operation"
      );
    });
  });

  describe("upsert", () => {
    it("should upsert a document with ID", async () => {
      const testData: TestDocument = {
        _id: "507f1f77bcf86cd799439011",
        name: "Upserted User",
        email: "upserted@example.com",
      };

      const result = await persistence.upsert(testData);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should create a document when no ID is provided", async () => {
      const testData: TestDocument = {
        name: "New User",
        email: "new@example.com",
      };

      const result = await persistence.upsert(testData);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });
  });

  describe("find", () => {
    it("should find documents with query", async () => {
      const result = await persistence.find({ name: "Test User" });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        email: "test@example.com",
      });
    });

    it("should find all documents when no query provided", async () => {
      const result = await persistence.find();
      expect(result).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("should find a single document", async () => {
      const result = await persistence.findOne({ email: "test@example.com" });
      expect(result).toEqual({
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        email: "test@example.com",
      });
    });
  });

  describe("count", () => {
    it("should count documents", async () => {
      const result = await persistence.count({ active: true });
      expect(result).toBe(1);
    });
  });

  describe("createIndex", () => {
    it("should create an index", async () => {
      const result = await persistence.createIndex(
        { email: 1 },
        { unique: true }
      );
      expect(result).toBe("email_1");
    });
  });

  describe("healthCheck", () => {
    it("should return true when database is healthy", async () => {
      const result = await persistence.healthCheck();
      expect(result).toBe(true);
    });

    it("should return false when database is unhealthy", async () => {
      const db = (persistence as any).db;
      db.admin = jest.fn().mockReturnValue({
        ping: jest.fn().mockRejectedValue(new Error("Connection failed")),
      });

      const result = await persistence.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe("connection management", () => {
    it("should track connection status", () => {
      expect(persistence.isConnectionOpen()).toBe(false);
    });

    it("should connect when needed", async () => {
      await persistence.connect();
      expect(persistence.isConnectionOpen()).toBe(true);
    });
  });
});
