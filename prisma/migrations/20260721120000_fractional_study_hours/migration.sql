-- Allow minute-precision study hours (e.g. 7.5 = 7:30am).
-- Existing integer values remain valid as whole hours.
-- Table is @@map("saved_study_plans") in schema.prisma.
ALTER TABLE "saved_study_plans"
  ALTER COLUMN "dayStartHour" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "dayEndHour" SET DATA TYPE DOUBLE PRECISION;
