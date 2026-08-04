-- ============================================================
-- Migration 012: Prune and clean up the `cities` table
--
-- The list had grown to 235 rows scraped from a generic "cities of Pakistan"
-- dataset. Three classes of junk in there:
--
--   1. Localities that are INSIDE a city we already list (Nazimabad is a
--      Karachi neighbourhood, Qasimabad is a Hyderabad one).
--   2. One real place split across two rows, or listed twice
--      ("Haveli" + "Lakha" are both Haveli Lakha; "Darya Khan" appears twice
--      with identical coordinates).
--   3. Villages of a few thousand people that will never carry a listing
--      ("Chak", "Mithani", "Soianwala", ...).
--
-- This is not cosmetic. findNearestCity() (src/utils/geo.ts) snaps a user's
-- GPS position to the closest city CENTROID, so a locality row inside a big
-- city silently steals that city's users:
--
--   Nazimabad's centroid sits 8.2 km from Karachi's. Everyone in northern and
--   central Karachi resolves to city_id 137, not 1 — so "Pets Near You" and
--   every city-filtered query returns nothing for them, in our largest market.
--   Same for Qasimabad (4.7 km from Hyderabad) and Saidu Sharif (2.9 km from
--   Mingora).
--
-- Deleting the locality rows is what makes those users resolve to the real
-- city. The village deletions are pure decluttering — they just widen each
-- surviving city's catchment, which is the behaviour we want.
--
-- NOTHING IS ORPHANED AND NO city_id IS EVER SET TO NULL. Every row that
-- points at a removed city is repointed first:
--   - merged rows go to their explicit parent city
--   - deleted villages go to the nearest surviving city by haversine, which
--     is exactly where findNearestCity would have put them anyway
--
-- The tables holding those references are discovered from the catalogue at
-- run time rather than listed here. app/schema.txt is out of date — it shows
-- three FKs onto cities (pets, lost_and_found_posts, users) but the live
-- database has more, adoption_applications among them, and a hardcoded list
-- fails on whichever one it missed. The DO block below picks up every FK that
-- actually exists, including any added after this migration was written.
-- ============================================================

BEGIN;

-- ── 1. Name fixes ────────────────────────────────────────────
-- The source dataset truncated multi-word names at the second word, which is
-- why four of Pakistan's larger cities read as fragments. Renames, not
-- deletes — these rows are fine, their labels were not.
UPDATE public.cities SET city_name = 'Dera Ghazi Khan'     WHERE city_id = 23;
UPDATE public.cities SET city_name = 'Rahim Yar Khan'      WHERE city_id = 83;
UPDATE public.cities SET city_name = 'Toba Tek Singh'      WHERE city_id = 99;
UPDATE public.cities SET city_name = 'Dera Ismail Khan'    WHERE city_id = 174;
UPDATE public.cities SET city_name = 'Tando Muhammad Khan' WHERE city_id = 154;
UPDATE public.cities SET city_name = 'Karor Lal Esan'      WHERE city_id = 47;
UPDATE public.cities SET city_name = 'Banda Daud Shah'     WHERE city_id = 163;
UPDATE public.cities SET city_name = 'Liaquatpur'          WHERE city_id = 59;

-- Misspelling.
UPDATE public.cities SET city_name = 'Shikarpur'           WHERE city_id = 149;

-- District names where the dataset should have used the actual city. Kech is
-- the district; Turbat is the city in it — and Turbat is Balochistan's second
-- largest, so it was effectively missing from the app entirely.
UPDATE public.cities SET city_name = 'Turbat'              WHERE city_id = 214;
UPDATE public.cities SET city_name = 'Pishin'              WHERE city_id = 228;

-- Halves of a split name, kept as the surviving row of each pair (the other
-- half is merged into it in step 3).
UPDATE public.cities SET city_name = 'Haveli Lakha'        WHERE city_id = 38;
UPDATE public.cities SET city_name = 'Jalalpur Jattan'     WHERE city_id = 40;

-- ── 2. Which rows go, and where their references land ────────
CREATE TEMP TABLE city_removal (
  old_id integer PRIMARY KEY,
  new_id integer,            -- filled in below; never left NULL
  reason text NOT NULL
) ON COMMIT DROP;

-- 2a. Duplicates and in-city localities, each with an explicit parent.
INSERT INTO city_removal (old_id, new_id, reason) VALUES
  (137, 1,   'Nazimabad -> Karachi (8.2 km, a Karachi town)'),
  (139, 113, 'Qasimabad -> Hyderabad (4.7 km, a Hyderabad taluka)'),
  (194, 189, 'Saidu Sharif -> Mingora (2.9 km, contiguous)'),
  (198, 189, 'Swat -> Mingora (district name; Mingora is the city)'),
  (39,  38,  'Lakha -> Haveli Lakha (same place split across two rows)'),
  (41,  40,  'Jattan -> Jalalpur Jattan (same place split across two rows)'),
  (173, 22,  'Darya Khan -> Darya Khan (exact duplicate, identical coords)');

-- 2b. Villages and non-places. Either a hamlet whose row exists only because
-- the source dataset had one, or a district with no town of its own.
-- Coordinates rounded to whole/half degrees are the tell — those were never
-- surveyed, just approximated.
INSERT INTO city_removal (old_id, new_id, reason) VALUES
  -- Punjab
  (4,   NULL, 'Ahmed Nager (misspelt Ahmad Nagar Chatha, village)'),
  (6,   NULL, 'Ali Khan (truncated name, village)'),
  (16,  NULL, 'Chillianwala (village)'),
  (24,  NULL, 'Dhaular (village)'),
  (62,  NULL, 'Mamoori (village)'),
  (70,  NULL, 'Mianwali Bangla (village)'),
  (78,  NULL, 'Qaimpur (village)'),
  (79,  NULL, 'Qila Didar (truncated Qila Didar Singh, village)'),
  (95,  NULL, 'Soianwala (village)'),
  (96,  NULL, 'Siranwali (village, and the coordinates are wrong)'),
  -- Sindh
  (104, NULL, 'Bhirkan'),
  (105, NULL, 'Rajo Khanani'),
  (106, NULL, 'Chak ("chak" just means village)'),
  (117, NULL, 'Jungshahi'),
  (121, NULL, 'Keti Bandar'),
  (128, NULL, 'Mithani'),
  (133, NULL, 'Naudero'),
  (135, NULL, 'Naushara'),
  (145, NULL, 'Shahbandar'),
  (151, NULL, 'Tangwani'),
  -- Khyber Pakhtunkhwa
  (159, NULL, 'Adezai'),
  (162, NULL, 'Ayubia (a national park, not a town)'),
  (167, NULL, 'Birote'),
  (175, NULL, 'Doaba'),
  (184, NULL, 'Latamber'),
  (188, NULL, 'Mastuj'),
  (196, NULL, 'Shewa Adda'),
  (203, NULL, 'Tordher'),
  -- Balochistan
  (212, NULL, 'Kacchi (district, no town of the name)'),
  (221, NULL, 'Lehri');

-- Point every village at the nearest city that survives this migration. Same
-- haversine as findNearestCity, so a pet listed in Dhaular lands where a phone
-- standing in Dhaular would have resolved anyway. Candidates exclude
-- everything being removed, so no reference is repointed at a doomed row.
UPDATE city_removal r
   SET new_id = n.city_id
  FROM public.cities p
  CROSS JOIN LATERAL (
    SELECT c.city_id
      FROM public.cities c
     WHERE c.city_id <> p.city_id
       AND NOT EXISTS (SELECT 1 FROM city_removal x WHERE x.old_id = c.city_id)
       AND c.latitude IS NOT NULL
       AND c.longitude IS NOT NULL
     -- The inner haversine term only; it rises monotonically with distance,
     -- so ordering by it ranks identically to the full formula.
     ORDER BY (
                power(sin(radians(c.latitude  - p.latitude)  / 2), 2)
              + cos(radians(p.latitude)) * cos(radians(c.latitude))
              * power(sin(radians(c.longitude - p.longitude) / 2), 2)
              )
     LIMIT 1
  ) n
 WHERE p.city_id = r.old_id
   AND r.new_id IS NULL;

-- A NULL here would mean a row we are about to delete has nowhere to send its
-- references, which would either orphan them or silently null them out. Stop
-- instead — better a failed migration than a listing that vanishes.
DO $$
DECLARE unresolved text;
BEGIN
  SELECT string_agg(old_id::text || ' (' || reason || ')', ', ')
    INTO unresolved
    FROM city_removal WHERE new_id IS NULL;
  IF unresolved IS NOT NULL THEN
    RAISE EXCEPTION 'No surviving city to reassign to for: %', unresolved;
  END IF;
END $$;

-- ── 3. Repoint every reference, then delete ──────────────────
-- Walks pg_constraint for FKs onto cities(city_id) instead of naming tables,
-- so a table nobody remembered (adoption_applications) can't break the run.
DO $$
DECLARE
  fk       record;
  moved    bigint;
  total    bigint := 0;
BEGIN
  FOR fk IN
    SELECT con.conrelid::regclass AS tbl,
           att.attname            AS col
      FROM pg_constraint con
      JOIN pg_attribute  att
        ON att.attrelid = con.conrelid
       AND att.attnum   = con.conkey[1]
     WHERE con.contype  = 'f'
       AND con.confrelid = 'public.cities'::regclass
       AND cardinality(con.conkey) = 1
     ORDER BY 1
  LOOP
    EXECUTE format(
      'UPDATE %s t SET %I = r.new_id FROM city_removal r WHERE t.%I = r.old_id',
      fk.tbl, fk.col, fk.col
    );
    GET DIAGNOSTICS moved = ROW_COUNT;
    total := total + moved;
    IF moved > 0 THEN
      RAISE NOTICE 'repointed % row(s) in %.%', moved, fk.tbl, fk.col;
    END IF;
  END LOOP;
  RAISE NOTICE 'repointed % row(s) in total', total;
END $$;

DELETE FROM public.cities
 WHERE city_id IN (SELECT old_id FROM city_removal);

COMMIT;
