-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserCostume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "costumeType" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL
);
INSERT INTO "new_UserCostume" ("approved", "costumeType", "id", "name", "userId") SELECT "approved", "costumeType", "id", "name", "userId" FROM "UserCostume";
DROP TABLE "UserCostume";
ALTER TABLE "new_UserCostume" RENAME TO "UserCostume";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
