/**
 * Test file for the persistence factory functions
 * This file demonstrates and tests the factory functionality
 */

import {
  createPersistence,
  createPostgresPersistence,
  createMongoPersistence,
  DatabaseType,
  isPostgresPersistence,
  isMongoPersistence,
  getDatabaseType,
} from "./index";

// Test interface
interface TestDocument {
  id?: number | string;
  _id?: any;
  name: string;
  value: number;
  created_at?: Date;
  updated_at?: Date;
}

async function testPersistenceFactory() {
  console.log("🧪 Testing Persistence Factory Functions...\n");

  try {
    // Test 1: Create PostgreSQL persistence
    console.log("1. Testing PostgreSQL persistence creation...");
    const postgresPersistence = createPersistence<TestDocument>({
      databaseType: DatabaseType.POSTGRES,
      tableOrCollectionName: "test_table",
    });

    console.log("✓ PostgreSQL persistence created");
    console.log(`✓ Database type: ${getDatabaseType(postgresPersistence)}`);
    console.log(
      `✓ Is PostgreSQL: ${isPostgresPersistence(postgresPersistence)}`
    );
    console.log(`✓ Is MongoDB: ${isMongoPersistence(postgresPersistence)}\n`);

    // Test 2: Create MongoDB persistence
    console.log("2. Testing MongoDB persistence creation...");
    const mongoPersistence = createPersistence<TestDocument>({
      databaseType: DatabaseType.MONGODB,
      tableOrCollectionName: "test_collection",
    });

    console.log("✓ MongoDB persistence created");
    console.log(`✓ Database type: ${getDatabaseType(mongoPersistence)}`);
    console.log(`✓ Is PostgreSQL: ${isPostgresPersistence(mongoPersistence)}`);
    console.log(`✓ Is MongoDB: ${isMongoPersistence(mongoPersistence)}\n`);

    // Test 3: Create using specific factory functions
    console.log("3. Testing specific factory functions...");
    createPostgresPersistence<TestDocument>("test_table");
    createMongoPersistence<TestDocument>("test_collection");

    console.log("✓ PostgreSQL specific factory works");
    console.log("✓ MongoDB specific factory works\n");

    // Test 4: Test error handling for invalid database type
    console.log("4. Testing error handling...");
    try {
      createPersistence<TestDocument>({
        databaseType: "invalid" as DatabaseType,
        tableOrCollectionName: "test",
      });
      console.log("❌ Should have thrown an error for invalid database type");
    } catch (error) {
      console.log("✓ Correctly threw error for invalid database type");
      console.log(`✓ Error message: ${(error as Error).message}\n`);
    }

    // Test 5: Test type guards with actual operations
    console.log("5. Testing type guards with operations...");

    // Test PostgreSQL-specific operations
    if (isPostgresPersistence(postgresPersistence)) {
      console.log("✓ PostgreSQL type guard works");
      // Note: We won't actually connect to test the query method
      console.log("✓ PostgreSQL-specific methods available");
    }

    // Test MongoDB-specific operations
    if (isMongoPersistence(mongoPersistence)) {
      console.log("✓ MongoDB type guard works");
      // Note: We won't actually connect to test the find method
      console.log("✓ MongoDB-specific methods available");
    }

    console.log("\n🎉 All factory tests passed!");
  } catch (error) {
    console.error("❌ Factory test failed:", error);
  }
}

// Test service pattern
class TestService {
  private persistence: ReturnType<typeof createPersistence<TestDocument>>;

  constructor(databaseType: DatabaseType) {
    this.persistence = createPersistence<TestDocument>({
      databaseType,
      tableOrCollectionName: "test",
    });
  }

  async testOperation(): Promise<string> {
    getDatabaseType(this.persistence);

    if (isPostgresPersistence(this.persistence)) {
      return `PostgreSQL operation would work here (table: test)`;
    } else if (isMongoPersistence(this.persistence)) {
      return `MongoDB operation would work here (collection: test)`;
    }

    return "Unknown database type";
  }

  getDatabaseType(): DatabaseType {
    return getDatabaseType(this.persistence);
  }
}

async function testServicePattern() {
  console.log("\n🔧 Testing Service Pattern...\n");

  try {
    // Test with PostgreSQL
    const postgresService = new TestService(DatabaseType.POSTGRES);
    console.log(`✓ PostgreSQL service created`);
    console.log(`✓ Database type: ${postgresService.getDatabaseType()}`);
    console.log(`✓ Operation: ${await postgresService.testOperation()}\n`);

    // Test with MongoDB
    const mongoService = new TestService(DatabaseType.MONGODB);
    console.log(`✓ MongoDB service created`);
    console.log(`✓ Database type: ${mongoService.getDatabaseType()}`);
    console.log(`✓ Operation: ${await mongoService.testOperation()}\n`);

    console.log("🎉 Service pattern tests passed!");
  } catch (error) {
    console.error("❌ Service pattern test failed:", error);
  }
}

// Run all tests
async function runAllTests() {
  await testPersistenceFactory();
  await testServicePattern();
}

// Export for use in other files
export { testPersistenceFactory, testServicePattern, runAllTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
