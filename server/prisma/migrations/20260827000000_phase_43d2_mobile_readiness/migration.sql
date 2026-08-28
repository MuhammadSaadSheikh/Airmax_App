-- Preserve pre-Phase 4.3D.2 complaints without inventing historical titles.
-- Application validation requires a 3-150 character title for every new row.
ALTER TABLE "Complaint"
ADD COLUMN "title" TEXT;

COMMENT ON COLUMN "Complaint"."title" IS
'Nullable only for legacy reconciliation; new API-created complaints require a title.';
