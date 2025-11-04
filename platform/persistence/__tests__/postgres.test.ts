/**
 * Jest tests for PostgreSQL persistence
 */

import { PostgresPersistence } from "../structured/postgres";

// Mock the pg module
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({
        rows: [{ id: 1 }],
        rowCount: 1,
      }),
      release: jest.fn(),
    }),
    on: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock the utils module
jest.mock("../../utils", () => ({
  fetchEnvVar: jest.fn((key: string, defaultValue: string) => {
    const envVars: Record<string, string> = {
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: "5432",
      POSTGRES_DB: "testdb",
      POSTGRES_USER: "testuser",
      POSTGRES_PASSWORD: "testpass",
    };
    return envVars[key] || defaultValue;
  }),
}));

interface TestDocument extends Record<string, any> {
  id?: number;
  name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

describe("PostgresPersistence", () => {
  let persistence: PostgresPersistence<TestDocument>;

  beforeEach(() => {
    persistence = new PostgresPersistence<TestDocument>("test_table");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create a PostgresPersistence instance", () => {
      expect(persistence).toBeDefined();
    });

    it("should create a PostgresPersistence instance with custom config", () => {
      const config = {
        host: "custom-host",
        port: 5433,
        database: "custom-db",
        user: "custom-user",
        password: "custom-pass",
      };

      const customPersistence = new PostgresPersistence<TestDocument>(
        "test_table",
        config
      );
      expect(customPersistence).toBeDefined();
    });
  });

  describe("create", () => {
    it("should create a new record", async () => {
      const testData: TestDocument = {
        name: "Test User",
        email: "test@example.com",
      };

      const result = await persistence.create(testData);
      expect(result).toBe(1);
    });
  });

  describe("get", () => {
    it("should get a record by ID", async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 1, name: "Test User", email: "test@example.com" }],
        }),
        release: jest.fn(),
      };

      // Mock the pool.connect method
      const pool = (persistence as any).pool;
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await persistence.get(1);
      expect(result).toEqual({
        id: 1,
        name: "Test User",
        email: "test@example.com",
      });
    });

    it("should return null for non-existent record", async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [],
        }),
        release: jest.fn(),
      };

      const pool = (persistence as any).pool;
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await persistence.get(999);
      expect(result).toBeNull();
    });

    it("should return null for null/undefined ID", async () => {
      const result = await persistence.get(null);
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update an existing record", async () => {
      const testData: TestDocument = {
        id: 1,
        name: "Updated User",
        email: "updated@example.com",
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 1 }],
          rowCount: 1,
        }),
        release: jest.fn(),
      };

      const pool = (persistence as any).pool;
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await persistence.update(testData);
      expect(result).toBe(1);
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
    it("should delete a record", async () => {
      const testData: TestDocument = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 1 }],
          rowCount: 1,
        }),
        release: jest.fn(),
      };

      const pool = (persistence as any).pool;
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await persistence.delete(testData);
      expect(result).toBe(1);
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
    it("should upsert a record with ID", async () => {
      const testData: TestDocument = {
        id: 1,
        name: "Upserted User",
        email: "upserted@example.com",
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 1 }],
          rowCount: 1,
        }),
        release: jest.fn(),
      };

      const pool = (persistence as any).pool;
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await persistence.upsert(testData);
      expect(result).toBe(1);
    });

    it("should create a record when no ID is provided", async () => {
      const testData: TestDocument = {
        name: "New User",
        email: "new@example.com",
      };

      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 2 }],
          rowCount: 1,
        }),
        release: jest.fn(),
      };

      const pool = (persistence as any).pool;
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await persistence.upsert(testData);
      expect(result).toBe(2);
    });
  });

  describe("healthCheck", () => {
    it("should return true when database is healthy", async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
        release: jest.fn(),
      };

      const pool = (persistence as any).pool;
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await persistence.healthCheck();
      expect(result).toBe(true);
    });

    it("should return false when database is unhealthy", async () => {
      const pool = (persistence as any).pool;
      pool.connect = jest
        .fn()
        .mockRejectedValue(new Error("Connection failed"));

      const result = await persistence.healthCheck();
      expect(result).toBe(false);
    });
  });
});
