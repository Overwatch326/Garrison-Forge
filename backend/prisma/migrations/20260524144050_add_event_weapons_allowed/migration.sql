-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "official" BOOLEAN NOT NULL DEFAULT true,
    "eventType" TEXT NOT NULL,
    "participants" TEXT NOT NULL,
    "costumes" TEXT,
    "childrenOk" BOOLEAN NOT NULL DEFAULT false,
    "weaponsAllowed" TEXT NOT NULL DEFAULT 'none',
    "location" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("childrenOk", "costumes", "createdAt", "createdById", "description", "endTime", "eventType", "id", "location", "official", "participants", "startTime", "title", "updatedAt") SELECT "childrenOk", "costumes", "createdAt", "createdById", "description", "endTime", "eventType", "id", "location", "official", "participants", "startTime", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
