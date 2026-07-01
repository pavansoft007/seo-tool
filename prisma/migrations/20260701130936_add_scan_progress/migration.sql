-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalPages" INTEGER,
    "pagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "currentUrl" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Scan" ("completedAt", "createdAt", "id", "startedAt", "status", "updatedAt", "url") SELECT "completedAt", "createdAt", "id", "startedAt", "status", "updatedAt", "url" FROM "Scan";
DROP TABLE "Scan";
ALTER TABLE "new_Scan" RENAME TO "Scan";
CREATE INDEX "Scan_url_idx" ON "Scan"("url");
CREATE INDEX "Scan_status_idx" ON "Scan"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
