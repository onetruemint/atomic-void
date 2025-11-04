/**
 * Jest tests for the persistence factory functions
 */

import {
  createPersistence,
  createPostgresPersistence,
  createMongoPersistence,
  DatabaseType,
  isPostgresPersistence,
  isMongoPersistence,
  getDatabaseType,
} from "../index";

// Test interface
interface TestDocument extends Record<string, any> {
  id?: number | string;
  _id?: any;
  name: string;
  value: number;
  created_at?: Date;
  updated_at?: Date;
}

describe("Persistence Factory", () => {
  describe("createPersistence", () => {
    it("should create PostgreSQL persistence when DatabaseType.POSTGRES is specified", () => {
      const persistence = createPersistence<TestDocument>({
        databaseType: DatabaseType.POSTGRES,
        tableOrCollectionName: "test_table",
      });

      expect(persistence).toBeDefined();
      expect(isPostgresPersistence(persistence)).toBe(true);
      expect(isMongoPersistence(persistence)).toBe(false);
      expect(getDatabaseType(persistence)).toBe(DatabaseType.POSTGRES);
    });

    it("should create MongoDB persistence when DatabaseType.MONGODB is specified", () => {
      const persistence = createPersistence<TestDocument>({
        databaseType: DatabaseType.MONGODB,
        tableOrCollectionName: "test_collection",
      });

      expect(persistence).toBeDefined();
      expect(isPostgresPersistence(persistence)).toBe(false);
      expect(isMongoPersistence(persistence)).toBe(true);
      expect(getDatabaseType(persistence)).toBe(DatabaseType.MONGODB);
    });

    it("should throw an error for unsupported database types", () => {
      expect(() => {
        createPersistence<TestDocument>({
          databaseType: "invalid" as DatabaseType,
          tableOrCollectionName: "test",
        });
      }).toThrow("Unsupported database type: invalid");
    });
  });

  describe("createPostgresPersistence", () => {
    it("should create a PostgreSQL persistence instance", () => {
      const persistence = createPostgresPersistence<TestDocument>("test_table");

      expect(persistence).toBeDefined();
      expect(isPostgresPersistence(persistence)).toBe(true);
      expect(getDatabaseType(persistence)).toBe(DatabaseType.POSTGRES);
    });

    it("should create a PostgreSQL persistence instance with config", () => {
      const config = {
        host: "localhost",
        port: 5432,
        database: "testdb",
        user: "testuser",
        password: "testpass",
      };

      const persistence = createPostgresPersistence<TestDocument>(
        "test_table",
        config
      );

      expect(persistence).toBeDefined();
      expect(isPostgresPersistence(persistence)).toBe(true);
    });
  });

  describe("createMongoPersistence", () => {
    it("should create a MongoDB persistence instance", () => {
      const persistence =
        createMongoPersistence<TestDocument>("test_collection");

      expect(persistence).toBeDefined();
      expect(isMongoPersistence(persistence)).toBe(true);
      expect(getDatabaseType(persistence)).toBe(DatabaseType.MONGODB);
    });

    it("should create a MongoDB persistence instance with config", () => {
      const config = {
        host: "localhost",
        port: 27017,
        database: "testdb",
        username: "testuser",
        password: "testpass",
      };

      const persistence = createMongoPersistence<TestDocument>(
        "test_collection",
        config
      );

      expect(persistence).toBeDefined();
      expect(isMongoPersistence(persistence)).toBe(true);
    });
  });

  describe("Type Guards", () => {
    it("should correctly identify PostgreSQL persistence", () => {
      const postgresPersistence =
        createPostgresPersistence<TestDocument>("test_table");

      expect(isPostgresPersistence(postgresPersistence)).toBe(true);
      expect(isMongoPersistence(postgresPersistence)).toBe(false);
    });

    it("should correctly identify MongoDB persistence", () => {
      const mongoPersistence =
        createMongoPersistence<TestDocument>("test_collection");

      expect(isPostgresPersistence(mongoPersistence)).toBe(false);
      expect(isMongoPersistence(mongoPersistence)).toBe(true);
    });
  });

  describe("getDatabaseType", () => {
    it("should return correct database type for PostgreSQL", () => {
      const persistence = createPostgresPersistence<TestDocument>("test_table");
      expect(getDatabaseType(persistence)).toBe(DatabaseType.POSTGRES);
    });

    it("should return correct database type for MongoDB", () => {
      const persistence =
        createMongoPersistence<TestDocument>("test_collection");
      expect(getDatabaseType(persistence)).toBe(DatabaseType.MONGODB);
    });
  });
});

describe("Service Pattern with Factory", () => {
  class TestService {
    private persistence: ReturnType<typeof createPersistence<TestDocument>>;

    constructor(databaseType: DatabaseType) {
      this.persistence = createPersistence<TestDocument>({
        databaseType,
        tableOrCollectionName: "test",
      });
    }

    getDatabaseType(): DatabaseType {
      return getDatabaseType(this.persistence);
    }

    isPostgres(): boolean {
      return isPostgresPersistence(this.persistence);
    }

    isMongo(): boolean {
      return isMongoPersistence(this.persistence);
    }
  }

  it("should create service with PostgreSQL persistence", () => {
    const service = new TestService(DatabaseType.POSTGRES);

    expect(service.getDatabaseType()).toBe(DatabaseType.POSTGRES);
    expect(service.isPostgres()).toBe(true);
    expect(service.isMongo()).toBe(false);
  });

  it("should create service with MongoDB persistence", () => {
    const service = new TestService(DatabaseType.MONGODB);

    expect(service.getDatabaseType()).toBe(DatabaseType.MONGODB);
    expect(service.isPostgres()).toBe(false);
    expect(service.isMongo()).toBe(true);
  });
});
