// scripts/simpleTestCleanup.js
import { MongoClient } from "mongodb";

async function cleanupTestDatabase() {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    console.log("🔥 CLEANING TEST DATABASE...\n");

    await client.connect();
    console.log("✅ Connected to MongoDB");

    // Get the test database
    const db = client.db("taskMangerTest");

    // Method 1: Drop the entire database
    console.log("1. Attempting to drop test database...");
    try {
      await db.dropDatabase();
      console.log("✅ Test database dropped successfully!");
    } catch (error) {
      console.log("⚠️  Database drop failed, trying collection approach...");

      // Method 2: Drop just the users collection
      console.log("2. Attempting to drop users collection...");
      try {
        const collection = db.collection("users");
        await collection.drop();
        console.log("✅ Users collection dropped successfully!");
      } catch (collError) {
        console.log("⚠️  Collection drop failed, trying manual cleanup...");

        // Method 3: Manual cleanup
        console.log("3. Manual cleanup - removing documents and indexes...");
        const collection = db.collection("users");

        // Remove all documents
        const deleteResult = await collection.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} documents`);

        // List and drop indexes
        const indexes = await collection.listIndexes().toArray();
        console.log(`Found ${indexes.length} indexes`);

        for (const index of indexes) {
          if (index.name !== "_id_") {
            try {
              await collection.dropIndex(index.name);
              console.log(`✅ Dropped index: ${index.name}`);
            } catch (indexError) {
              console.log(
                `⚠️  Could not drop index ${index.name}: ${indexError.message}`
              );
            }
          }
        }
      }
    }

    console.log("\n🎉 TEST DATABASE CLEANUP COMPLETED!");
    console.log("🚀 You can now run: npm test");
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
  } finally {
    await client.close();
    console.log("✅ Disconnected from MongoDB");
  }
}

cleanupTestDatabase();
