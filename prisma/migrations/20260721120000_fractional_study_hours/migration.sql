-- Allow minute-precision study hours (e.g. 7.5 = 7:30am).
-- Existing integer values remain valid as whole hours.
ALTER TABLE "SavedStudyPlan"
  ALTER COLUMN "dayStartHour" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "dayEndHour" SET DATA TYPE DOUBLE PRECISION;
