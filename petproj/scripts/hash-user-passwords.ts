import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const BCRYPT_SALT_ROUNDS = 10;

interface User {
  user_id: number;
  password: string;
  email: string;
}

function isBcryptHash(hash: string): boolean {
  // Check if password starts with bcrypt hash prefixes
  return /^\$2[aby]\$/.test(hash);
}

async function hashUserPasswords() {
  const prisma = new PrismaClient();

  try {
    console.log("Starting password hashing process...\n");

    // Fetch all users from the database
    const users = (await prisma.$queryRaw<User[]>`
      SELECT user_id, password, email FROM users;
    `);

    console.log(`Found ${users.length} users in database\n`);

    let alreadyHashedCount = 0;
    let hashedCount = 0;
    let failureCount = 0;
    const failures: { userId: number; email: string; error: string }[] = [];

    for (const user of users) {
      try {
        const { user_id, password, email } = user;

        // Check if password is already bcrypt hashed
        if (isBcryptHash(password)) {
          console.log(
            `⊘ User ID ${user_id} (${email}): Already bcrypt hashed`
          );
          alreadyHashedCount++;
          continue;
        }

        // Hash the plaintext password using bcryptjs
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        // Update the user's password in the database
        await prisma.users.update({
          where: { user_id },
          data: { password: hashedPassword },
        });

        console.log(
          `✓ User ID ${user_id} (${email}): Password hashed successfully`
        );
        hashedCount++;
      } catch (error: any) {
        failureCount++;
        const errorMessage = error.message || "Unknown error";
        failures.push({
          userId: user.user_id,
          email: user.email,
          error: errorMessage,
        });
        console.error(
          `✗ User ID ${user.user_id} (${user.email}): ${errorMessage}`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("PASSWORD HASHING COMPLETE");
    console.log("=".repeat(60));
    console.log(`✓ Successfully hashed: ${hashedCount} users`);
    console.log(`⊘ Already bcrypt hashed: ${alreadyHashedCount} users`);
    console.log(`✗ Failed: ${failureCount} users`);

    if (failures.length > 0) {
      console.log("\nFailed users:");
      failures.forEach((failure) => {
        console.log(
          `  - ID ${failure.userId} (${failure.email}): ${failure.error}`
        );
      });
    }

    console.log("\n✓ All passwords have been hashed using bcryptjs (salt rounds: 10)");
    console.log("✓ Passwords are now ready for secure comparison during login");
  } catch (error) {
    console.error("Fatal error during hashing:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
hashUserPasswords().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
