// Usage: node scripts/hash-password.js yourPassword
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nAdd this to your .env.local as ADMIN_PASSWORD_HASH:\n");
console.log(hash);
console.log("");
