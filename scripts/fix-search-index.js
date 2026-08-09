// One-time fix: drops the old "book_fulltext_index" that was created before
// the language_override fix, so Mongoose can recreate it correctly.
//
// Usage:
//   node scripts/fix-search-index.js "mongodb+srv://user:pass@cluster.mongodb.net/miftah-ul-uloom"
//
// (paste your real MONGODB_URI in quotes as the argument)

const mongoose = require("mongoose");

const uri = process.argv[2];
if (!uri) {
  console.error('Usage: node scripts/fix-search-index.js "<your MONGODB_URI>"');
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collection = db.collection("books");

  const indexes = await collection.indexes();
  const hasOldIndex = indexes.some((idx) => idx.name === "book_fulltext_index");

  if (hasOldIndex) {
    await collection.dropIndex("book_fulltext_index");
    console.log('✅ Old "book_fulltext_index" dropped. It will be recreated correctly on next app connection.');
  } else {
    console.log('ℹ️ No "book_fulltext_index" found — nothing to fix. You can add books now.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
