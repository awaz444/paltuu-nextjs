-- ============================================================
-- Migration 005: Add Pet Profiles
-- Creates three new tables for the personal pet profile feature.
-- These are completely separate from the `pets` adoption listings table.
-- ============================================================

BEGIN;

-- ── 1. pet_profiles ───────────────────────────────────────────────────────────
-- Personal pet profile owned by a user. NOT an adoption listing.
-- is_listed_for_adoption + adoption_listing_id track a conversion to the pets table.
CREATE TABLE IF NOT EXISTS pet_profiles (
    pet_profile_id          SERIAL PRIMARY KEY,
    owner_id                INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name                    VARCHAR(100) NOT NULL,
    species                 VARCHAR(50)  NOT NULL,   -- 'Dog','Cat','Bird','Rabbit','Fish','Reptile','Other'
    breed                   VARCHAR(100),
    gender                  VARCHAR(20)  NOT NULL DEFAULT 'unknown',  -- 'male','female','unknown'
    date_of_birth           DATE,
    bio                     VARCHAR(500),
    avatar_url              VARCHAR(500),
    is_listed_for_adoption  BOOLEAN      NOT NULL DEFAULT false,
    adoption_listing_id     INTEGER      REFERENCES pets(pet_id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pet_profiles_owner_id
    ON pet_profiles(owner_id);

CREATE INDEX IF NOT EXISTS idx_pet_profiles_species
    ON pet_profiles(species);

CREATE INDEX IF NOT EXISTS idx_pet_profiles_created_at
    ON pet_profiles(created_at DESC);

-- ── 2. pet_profile_photos ─────────────────────────────────────────────────────
-- Gallery photos for a pet profile. Max 20 enforced at API layer.
CREATE TABLE IF NOT EXISTS pet_profile_photos (
    photo_id        SERIAL      PRIMARY KEY,
    pet_profile_id  INTEGER     NOT NULL REFERENCES pet_profiles(pet_profile_id) ON DELETE CASCADE,
    photo_url       VARCHAR(500) NOT NULL,
    caption         VARCHAR(200),
    ordering        INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pet_profile_photos_profile_id
    ON pet_profile_photos(pet_profile_id);

CREATE INDEX IF NOT EXISTS idx_pet_profile_photos_ordering
    ON pet_profile_photos(pet_profile_id, ordering);

-- ── 3. post_pet_tags ──────────────────────────────────────────────────────────
-- Links social_posts to pet_profiles (many-to-many).
-- pet_profile_id references the PERSONAL pet profile, NOT the adoption pets table.
CREATE TABLE IF NOT EXISTS post_pet_tags (
    post_id         BIGINT  NOT NULL REFERENCES social_posts(post_id) ON DELETE CASCADE,
    pet_profile_id  INTEGER NOT NULL REFERENCES pet_profiles(pet_profile_id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, pet_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_post_pet_tags_pet_profile_id
    ON post_pet_tags(pet_profile_id);

CREATE INDEX IF NOT EXISTS idx_post_pet_tags_post_id
    ON post_pet_tags(post_id);

COMMIT;
