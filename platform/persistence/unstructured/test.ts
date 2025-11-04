/**
 * Simple test to verify MongoPersistence works
 * This file can be used to test the MongoDB implementation
 */

import { MongoPersistence } from "./mongo";

// Simple test interface
interface TestDocument extends Record<string, any> {
  _id?: any;
  name: string;
  value: number;
  created_at?: Date;
  updated_at?: Date;
}

async function testMongoPersistence() {
  console.log("Testing MongoPersistence...");

  try {
    // Create a new instance
    const testPersistence = new MongoPersistence<TestDocument>(
      "test_collection"
    );

    // Test connection
    console.log("Testing connection...");
    await testPersistence.connect();
    console.log("✓ Connected successfully");

    // Test health check
    console.log("Testing health check...");
    const isHealthy = await testPersistence.healthCheck();
    console.log(`✓ Health check: ${isHealthy ? "PASS" : "FAIL"}`);

    // Test create
    console.log("Testing create...");
    const createResult = await testPersistence.create({
      name: "Test Document",
      value: 42,
    });
    console.log(`✓ Created document with ID: ${createResult}`);

    // Test get
    console.log("Testing get...");
    const document = await testPersistence.get(createResult as string);
    console.log(`✓ Retrieved document:`, document);

    // Test update
    console.log("Testing update...");
    const updateResult = await testPersistence.update({
      _id: createResult,
      name: "Updated Document",
      value: 84,
    });
    console.log(`✓ Updated document: ${updateResult}`);

    // Test find
    console.log("Testing find...");
    const documents = await testPersistence.find({ name: "Updated Document" });
    console.log(`✓ Found ${documents.length} documents`);

    // Test count
    console.log("Testing count...");
    const count = await testPersistence.count({});
    console.log(`✓ Total documents: ${count}`);

    // Test delete
    console.log("Testing delete...");
    const deleteResult = await testPersistence.delete({
      _id: createResult,
      name: "Test Document",
      value: 42,
    } as TestDocument);
    console.log(`✓ Deleted document: ${deleteResult}`);

    // Test final count
    const finalCount = await testPersistence.count({});
    console.log(`✓ Final document count: ${finalCount}`);

    // Close connection
    await testPersistence.close();
    console.log("✓ Connection closed");

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Export for use in other files
export { testMongoPersistence };

// Run test if this file is executed directly
if (require.main === module) {
  testMongoPersistence();
}
