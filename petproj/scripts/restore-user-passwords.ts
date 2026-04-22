import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

interface BackupUser {
  user_id: number;
  password: string;
  email: string;
  [key: string]: any;
}

async function restoreUserPasswords() {
  const prisma = new PrismaClient();

  try {
    // Read the backup file
    const backupFilePath = path.join(
      __dirname,
      "../backups/users_backup_2026-04-20T14-52-34-616Z.json"
    );

    if (!fs.existsSync(backupFilePath)) {
      console.error(`Backup file not found: ${backupFilePath}`);
      process.exit(1);
    }

    const backupData = JSON.parse(
      fs.readFileSync(backupFilePath, "utf-8")
    ) as BackupUser[];

    console.log(`Found ${backupData.length} users in backup file`);
    console.log("Starting password restoration...\n");

    let successCount = 0;
    let failureCount = 0;
    const failures: { userId: number; email: string; error: string }[] = [];

    for (const backupUser of backupData) {
      try {
        const { user_id, password } = backupUser;

        // Update the user's password in the database
        const updatedUser = await prisma.users.update({
          where: { user_id },
          data: { password },
          select: { user_id: true, email: true, name: true },
        });

        console.log(
          `✓ User ID ${user_id} (${updatedUser.email}): Password restored`
        );
        successCount++;
      } catch (error: any) {
        failureCount++;
        const errorMessage =
          error.code === "P2025"
            ? "User not found"
            : error.message || "Unknown error";
        failures.push({
          userId: backupUser.user_id,
          email: backupUser.email,
          error: errorMessage,
        });
        console.error(
          `✗ User ID ${backupUser.user_id} (${backupUser.email}): ${errorMessage}`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("PASSWORD RESTORATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`✓ Successfully restored: ${successCount} users`);
    console.log(`✗ Failed: ${failureCount} users`);

    if (failures.length > 0) {
      console.log("\nFailed users:");
      failures.forEach((failure) => {
        console.log(
          `  - ID ${failure.userId} (${failure.email}): ${failure.error}`
        );
      });
    }

    console.log("\nAll user passwords have been restored to their original values from the backup file.");
  } catch (error) {
    console.error("Fatal error during restoration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
restoreUserPasswords().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
