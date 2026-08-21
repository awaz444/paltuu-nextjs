-- Vets at Home ("Express Vet") — on-demand home-visit vet/grooming dispatch, Karachi-only at launch.
-- Live dispatch system layered on top of the existing static home_vet clinic directory (untouched).
-- category/species/status are plain VARCHAR + CHECK, not Postgres enum types, matching the rest of
-- this schema's convention (role, moderation_state, etc. are all plain strings).

BEGIN;

CREATE TABLE IF NOT EXISTS express_vet_requests (
  request_id      BIGSERIAL PRIMARY KEY,
  client_user_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category        VARCHAR(20) NOT NULL
    CHECK (category IN ('express_vet', 'normal_vet', 'neutering', 'spaying', 'vaccination', 'grooming')),
  species         VARCHAR(10) NOT NULL
    CHECK (species IN ('dog', 'cat', 'other')),
  sub_service     VARCHAR(100),
  city_id         INTEGER NOT NULL REFERENCES cities(city_id),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending_dispatch'
    CHECK (status IN ('pending_dispatch', 'claimed', 'assigned', 'completed', 'cancelled', 'expired')),

  questionnaire_version VARCHAR(20) NOT NULL,
  questionnaire_answers JSONB NOT NULL,

  address_line     TEXT NOT NULL,
  address_landmark TEXT,
  latitude         DECIMAL(10, 8),
  longitude        DECIMAL(11, 8),

  contact_phone VARCHAR(30) NOT NULL,

  starting_price_pkr INTEGER NOT NULL,
  final_price_pkr    INTEGER,

  dispatcher_notes TEXT,

  claimed_by_dispatcher_id  INTEGER REFERENCES users(user_id),
  claimed_at                TIMESTAMPTZ,
  assigned_provider_id      BIGINT, -- FK added after express_vet_providers exists (see below)
  assigned_by_dispatcher_id INTEGER REFERENCES users(user_id),
  assigned_at                TIMESTAMPTZ,
  completed_at                TIMESTAMPTZ,
  cancelled_at                 TIMESTAMPTZ,
  cancel_reason                 TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS express_vet_providers (
  provider_id           BIGSERIAL PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  photo_url              TEXT,
  years_experience        INTEGER,
  qualifications           TEXT,
  categories                VARCHAR(20)[] NOT NULL DEFAULT '{}'
    CHECK (categories <@ ARRAY['express_vet', 'normal_vet', 'neutering', 'spaying', 'vaccination', 'grooming']::VARCHAR(20)[]),
  phone_number              VARCHAR(30),
  is_active                  BOOLEAN NOT NULL DEFAULT TRUE,
  rating                      DECIMAL(3, 2),
  total_reviews                INTEGER NOT NULL DEFAULT 0,
  created_by_dispatcher_id      INTEGER NOT NULL REFERENCES users(user_id),
  linked_user_id                 INTEGER REFERENCES users(user_id),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE express_vet_requests
  ADD CONSTRAINT fk_express_vet_requests_provider
  FOREIGN KEY (assigned_provider_id) REFERENCES express_vet_providers(provider_id);

CREATE TABLE IF NOT EXISTS express_vet_claims (
  claim_id       BIGSERIAL PRIMARY KEY,
  request_id     BIGINT NOT NULL REFERENCES express_vet_requests(request_id) ON DELETE CASCADE,
  dispatcher_id  INTEGER NOT NULL REFERENCES users(user_id),
  claimed_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at    TIMESTAMPTZ,
  release_reason TEXT
);

CREATE TABLE IF NOT EXISTS express_vet_reviews (
  review_id       BIGSERIAL PRIMARY KEY,
  request_id      BIGINT NOT NULL UNIQUE REFERENCES express_vet_requests(request_id) ON DELETE CASCADE,
  provider_id     BIGINT NOT NULL REFERENCES express_vet_providers(provider_id) ON DELETE CASCADE,
  client_user_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  structured_answers JSONB,
  review_content     TEXT,
  addon_reason_tags   VARCHAR(50)[] NOT NULL DEFAULT '{}'
    CHECK (addon_reason_tags <@ ARRAY['Additional Treatment', 'Medication/Prescription', 'Diagnostic Test/Lab Work', 'Extra Grooming Service', 'Other']::VARCHAR(50)[]),
  addon_total_pkr       INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS express_vet_rate_cards (
  rate_card_id       SERIAL PRIMARY KEY,
  category           VARCHAR(20) NOT NULL
    CHECK (category IN ('express_vet', 'normal_vet', 'neutering', 'spaying', 'vaccination', 'grooming')),
  species            VARCHAR(10) NOT NULL
    CHECK (species IN ('dog', 'cat', 'other')),
  sub_service         VARCHAR(100),
  city_id               INTEGER NOT NULL REFERENCES cities(city_id),
  starting_price_pkr     INTEGER NOT NULL,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (category, species, sub_service, city_id)
);

CREATE TABLE IF NOT EXISTS express_vet_dispatcher_status (
  dispatcher_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  is_on_duty    BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_express_vet_requests_dispatch_queue ON express_vet_requests(status, city_id, category);
CREATE INDEX IF NOT EXISTS idx_express_vet_requests_client ON express_vet_requests(client_user_id, status);
CREATE INDEX IF NOT EXISTS idx_express_vet_requests_dispatcher ON express_vet_requests(claimed_by_dispatcher_id, status);
CREATE INDEX IF NOT EXISTS idx_express_vet_requests_provider_active ON express_vet_requests(assigned_provider_id, status);

CREATE INDEX IF NOT EXISTS idx_express_vet_providers_is_active ON express_vet_providers(is_active);

CREATE INDEX IF NOT EXISTS idx_express_vet_claims_request ON express_vet_claims(request_id);
CREATE INDEX IF NOT EXISTS idx_express_vet_claims_dispatcher ON express_vet_claims(dispatcher_id, claimed_at);

CREATE INDEX IF NOT EXISTS idx_express_vet_reviews_provider ON express_vet_reviews(provider_id);

COMMIT;
