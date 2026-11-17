-- Keep a copy of every deleted pet listing (PALTU-166)
--
-- Deleting a listing removed the pets row together with its photos, tags and
-- adoption applications, so once an owner marked a pet adopted and deleted it
-- we lost the contact number and anyone who had applied (PET#935, 17 Nov 2026).
--
-- deleted_pets keeps the whole listing as it was at the moment of deletion.
-- Live pages never read it, so nothing deleted can reappear on the site.
--
--   * archive_pet(pet_id, deleted_by, deleted_via) copies a live listing in.
--     Both delete endpoints call it first, inside their transaction, before
--     they remove photos, tags and applications.
--   * A BEFORE DELETE trigger on pets calls it too, so a listing removed any
--     other way (an account deletion cascading, a manual DELETE) is still
--     kept. When the endpoint already archived it, the trigger does nothing.
--
-- Admins search the archive at GET /api/v1/admin/pets/deleted.
--
-- Idempotent: safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS deleted_pets (
    pet_id          INTEGER PRIMARY KEY,
    owner_id        INTEGER,
    pet_name        TEXT,
    adoption_status TEXT,
    contact_number  TEXT,
    owner_name      TEXT,
    owner_email     TEXT,
    listing         JSONB NOT NULL,
    images          JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
    applications    JSONB NOT NULL DEFAULT '[]'::jsonb,
    deleted_by      INTEGER,
    deleted_via     TEXT,
    deleted_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deleted_pets_owner_id_idx ON deleted_pets (owner_id);
CREATE INDEX IF NOT EXISTS deleted_pets_deleted_at_idx ON deleted_pets (deleted_at DESC);

CREATE OR REPLACE FUNCTION archive_pet(p_pet_id INTEGER, p_deleted_by INTEGER, p_deleted_via TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO deleted_pets (
        pet_id, owner_id, pet_name, adoption_status, contact_number,
        owner_name, owner_email, listing, images, tags, applications,
        deleted_by, deleted_via
    )
    SELECT
        p.pet_id, p.owner_id, p.pet_name, p.adoption_status, p.contact_number,
        u.name, u.email, to_jsonb(p),
        COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i."order") FROM pet_images i WHERE i.pet_id = p.pet_id), '[]'::jsonb),
        COALESCE((SELECT jsonb_agg(t.tag_name ORDER BY t.tag_name)
                    FROM pet_tag_assignments a JOIN pet_tags t ON t.tag_id = a.tag_id
                   WHERE a.pet_id = p.pet_id), '[]'::jsonb),
        COALESCE((SELECT jsonb_agg(to_jsonb(ap) ORDER BY ap.adoption_id) FROM adoption_applications ap WHERE ap.pet_id = p.pet_id), '[]'::jsonb),
        p_deleted_by, p_deleted_via
    FROM pets p
    LEFT JOIN users u ON u.user_id = p.owner_id
    WHERE p.pet_id = p_pet_id
    ON CONFLICT (pet_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION archive_pet_before_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM archive_pet(OLD.pet_id, NULL, 'database');
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS pets_archive_before_delete ON pets;
CREATE TRIGGER pets_archive_before_delete
    BEFORE DELETE ON pets
    FOR EACH ROW EXECUTE FUNCTION archive_pet_before_delete();

COMMIT;
