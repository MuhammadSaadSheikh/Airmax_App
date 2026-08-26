-- Additive Phase 4.3D amendment. INACTIVE remains a distinct legacy-supported
-- technician status; no existing values are renamed or migrated.
ALTER TYPE "TechnicianStatus" ADD VALUE IF NOT EXISTS 'ON_LEAVE';

-- Existing assignment rows intentionally retain a NULL actor. Application code
-- requires assignedById for every assignment created after this migration.
ALTER TABLE "TechnicianAssignment"
ADD COLUMN "assignedById" UUID;

CREATE INDEX "TechnicianAssignment_assignedById_assignedAt_idx"
ON "TechnicianAssignment"("assignedById", "assignedAt");

ALTER TABLE "TechnicianAssignment"
ADD CONSTRAINT "TechnicianAssignment_assignedById_fkey"
FOREIGN KEY ("assignedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
