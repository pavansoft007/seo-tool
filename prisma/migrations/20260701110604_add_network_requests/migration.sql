-- CreateTable
CREATE TABLE "NetworkRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER,
    "sizeBytes" INTEGER,
    "timingMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NetworkRequest_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NetworkRequest_pageId_idx" ON "NetworkRequest"("pageId");

-- CreateIndex
CREATE INDEX "NetworkRequest_resourceType_idx" ON "NetworkRequest"("resourceType");
