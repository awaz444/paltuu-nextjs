-- Add Duck to the Bird breeds (PALTU-169)
--
-- Listing 953, a male pecking duck (19 Nov 2026), had nowhere to go but
-- Bird > Other. Ducks are birds, so like Pigeon they are a Bird breed rather
-- than a species of their own. This is the row lib/breeds.ts now seeds, with
-- the same sort order db/breeds_migration.ts would give it: Duck right after
-- Pigeon, then Not sure and Other.
--
-- Also moves listing 953 from Bird > Other to Bird > Duck, only while it is
-- still filed as Bird > Other.
--
-- Idempotent: safe to re-run.

BEGIN;

INSERT INTO breeds (category_id, name, slug, kind, aliases, sort_order)
SELECT pc.category_id, 'Duck', 'duck', 'breed',
       ARRAY['ducks', 'duckling', 'ducklings', 'batakh', 'battakh', 'batak', 'badak', 'pekin', 'pekin duck', 'peking',
             'peking duck', 'pecking duck', 'mallard', 'khaki campbell', 'campbell', 'call duck', 'muscovy', 'runner duck',
             'indian runner']::text[],
       80
  FROM pet_category pc
 WHERE pc.category_name = 'Bird'
ON CONFLICT (category_id, slug) DO UPDATE
   SET name = EXCLUDED.name, kind = EXCLUDED.kind, aliases = EXCLUDED.aliases,
       sort_order = EXCLUDED.sort_order, updated_at = now();

UPDATE breeds b
   SET sort_order = CASE b.slug WHEN 'not-sure' THEN 90 WHEN 'other' THEN 100 END, updated_at = now()
  FROM pet_category pc
 WHERE pc.category_id = b.category_id AND pc.category_name = 'Bird'
   AND b.slug IN ('not-sure', 'other')
   AND b.sort_order IS DISTINCT FROM CASE b.slug WHEN 'not-sure' THEN 90 WHEN 'other' THEN 100 END;

UPDATE pets p
   SET breed_id = duck.breed_id, pet_breed = 'Duck'
  FROM breeds duck
  JOIN pet_category pc ON pc.category_id = duck.category_id AND pc.category_name = 'Bird'
  JOIN breeds other ON other.category_id = duck.category_id AND other.slug = 'other'
 WHERE duck.slug = 'duck'
   AND p.pet_id = 953
   AND p.pet_type = duck.category_id
   AND p.breed_id = other.breed_id;

COMMIT;
