-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventSignup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'signed_up',
    "notes" TEXT,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "costumeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventSignup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventSignup_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "UserCostume" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EventSignup" ("costumeId", "createdAt", "eventId", "id", "notes", "status", "updatedAt", "userId") SELECT "costumeId", "createdAt", "eventId", "id", "notes", "status", "updatedAt", "userId" FROM "EventSignup";
DROP TABLE "EventSignup";
ALTER TABLE "new_EventSignup" RENAME TO "EventSignup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
