-- Vets at Home (Express Vet) coupon codes (PALTU-131)
--
-- 100 printed single-use coupons, each worth Rs 500 off a Vets at Home visit.
-- The client enters the code at booking (POST /api/v1/express-vet/requests).
-- The server marks it used by that user and booking in the same transaction
-- as the request insert. If that booking is cancelled or expires before the
-- visit, the code is released so the printed coupon isn't wasted.
--
-- express_vet_requests gets coupon_id + discount_pkr so the discount is part of
-- the booking record. Amount payable = max(price - discount_pkr, 0), where price
-- is final_price_pkr once the dispatcher sets it, otherwise starting_price_pkr.
--
-- Idempotent: safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS express_vet_coupons (
  coupon_id       BIGSERIAL PRIMARY KEY,
  code            VARCHAR(16) NOT NULL UNIQUE,  -- stored uppercase; lookups normalise input
  discount_pkr    INTEGER NOT NULL DEFAULT 500 CHECK (discount_pkr > 0),
  is_used         BOOLEAN NOT NULL DEFAULT false,
  used_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  request_id      BIGINT REFERENCES express_vet_requests(request_id) ON DELETE SET NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE express_vet_requests
  ADD COLUMN IF NOT EXISTS coupon_id BIGINT REFERENCES express_vet_coupons(coupon_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_pkr INTEGER NOT NULL DEFAULT 0;

INSERT INTO express_vet_coupons (code) VALUES
  ('QGW4N'), ('GU8BN'), ('DCFWA'), ('K2VEP'), ('ZDV59'), ('Q437S'), ('9VSEU'), ('8RQ76'), ('BNMAA'), ('ZAVTQ'),
  ('9DS4P'), ('YW3CV'), ('FHKWT'), ('UJTZX'), ('VPX86'), ('4CCV6'), ('U3VKE'), ('BBD8U'), ('M6FUA'), ('PVXT7'),
  ('UHFHF'), ('3SJGV'), ('VRZHK'), ('5R3B9'), ('9ZZA2'), ('GAD2M'), ('7ZP6S'), ('MKYXW'), ('ZXS4Z'), ('CGDGG'),
  ('WGNU5'), ('KEABV'), ('CGS8U'), ('GE45V'), ('JDX26'), ('XD8QS'), ('NJXZJ'), ('RR364'), ('DYD46'), ('GB26U'),
  ('N38E8'), ('TFD5B'), ('9QN3Z'), ('HS33M'), ('8QRGE'), ('QYTME'), ('G9U9U'), ('WH4ZG'), ('ANS29'), ('W6T6M'),
  ('ZBQ59'), ('GQYUH'), ('5FDQT'), ('DJWX9'), ('E49ZS'), ('2S5QQ'), ('K4WYK'), ('YAT2V'), ('CE32T'), ('MRUWW'),
  ('AKFTU'), ('YT5MR'), ('RR9HH'), ('RU4MY'), ('6VN2J'), ('7YS55'), ('K3ESH'), ('N4UJY'), ('4RB6C'), ('Z2R7R'),
  ('438ZV'), ('3Y4YZ'), ('JG8J3'), ('BJERF'), ('6EWH9'), ('296BV'), ('FHUZZ'), ('HH6YW'), ('ED7NY'), ('WFNCU'),
  ('2CQVZ'), ('NS8Y5'), ('B4GCZ'), ('DEK8U'), ('7NGZT'), ('RSTY8'), ('2CFER'), ('J6NFF'), ('WJWAW'), ('P4BVN'),
  ('95WW2'), ('UFKMJ'), ('EKVQW'), ('UZCE8'), ('NSFNQ'), ('79Q2J'), ('9F9QM'), ('BK3C3'), ('AV9TD'), ('U4CWJ')
ON CONFLICT (code) DO NOTHING;

COMMIT;
