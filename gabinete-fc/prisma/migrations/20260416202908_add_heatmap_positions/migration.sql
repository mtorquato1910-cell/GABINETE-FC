-- AlterTable
ALTER TABLE "behavior_events" ADD COLUMN "posX" REAL;
ALTER TABLE "behavior_events" ADD COLUMN "posY" REAL;

-- CreateIndex
CREATE INDEX "behavior_events_pageUrl_eventType_idx" ON "behavior_events"("pageUrl", "eventType");
