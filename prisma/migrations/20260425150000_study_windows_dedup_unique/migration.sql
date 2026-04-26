-- Deduplicate StudyWindow rows and add a unique constraint preventing future
-- duplicates. Background: regenerateWindows() was called per-connection from a
-- parallel cron, so users with multiple synced calendars accumulated 2x (or more)
-- copies of every detected window. The application-side fix serializes regenerate
-- via a per-user advisory lock; this constraint is the database-level backstop.

-- Step 1: collapse duplicates. For each (userId, startTime, endTime) group we
-- keep the row most likely to carry real history: prefer rows with a StudySession
-- attached, then break ties by oldest createdAt, then by id. Any other dupes get
-- deleted. Cascading FKs on study_sessions.windowId => study_windows.id handle
-- session cleanup if a session-less duplicate survived our preference order.
WITH ranked AS (
  SELECT
    sw.id,
    ROW_NUMBER() OVER (
      PARTITION BY sw."userId", sw."startTime", sw."endTime"
      ORDER BY
        CASE WHEN ss.id IS NULL THEN 1 ELSE 0 END,  -- session-bearing rows first
        sw."createdAt" ASC,
        sw.id ASC
    ) AS rn
  FROM "study_windows" sw
  LEFT JOIN "study_sessions" ss ON ss."windowId" = sw.id
)
DELETE FROM "study_windows"
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 2: enforce one window per (userId, startTime, endTime) going forward.
CREATE UNIQUE INDEX "study_windows_user_time_unique"
  ON "study_windows" ("userId", "startTime", "endTime");
