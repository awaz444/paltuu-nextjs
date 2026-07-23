-- ============================================================
-- Pre-beta tag taxonomy cleanup
-- Run once against AWS RDS paltuudb, before external testers begin tagging.
--
-- 1. Deactivate photo/video/text — fully derivable from post_type /
--    social_post_media.media_type, near-zero personalization signal
--    (nearly every post is a photo), and currently shown to new users at
--    onboarding under "Content I enjoy" (/social/content-tags filters
--    is_active). is_active=false removes them from the admin tagger, the
--    feed affinity CTE, and the onboarding picker in one flag.
-- 2. Add food and rescue — common topics in a PK pet community that are
--    currently forced into health/diary and adoption/lost-found.
-- 3. Populate keyword_aliases on every remaining active tag — this is what
--    powers the admin tagging queue's hashtag -> primary-tag pre-selection
--    (matchHashtagToTag in lib/tagInference.ts); with empty arrays that
--    matcher almost never fires.
-- 4. Add "other" alias to other-animal — production pet_profiles.species
--    contains "Other", which doesn't match the other-animal slug.
-- ============================================================

BEGIN;

-- 1. Deactivate derivable / low-signal content_type tags
UPDATE content_tags
   SET is_active = false
 WHERE slug IN ('photo', 'video', 'text');

-- 2. Add the two topic gaps
INSERT INTO content_tags (slug, label, category, keyword_aliases)
VALUES
  ('food',   'Food & Diet', 'topic', ARRAY['diet','nutrition','treats','feeding','khana']),
  ('rescue', 'Rescue',      'topic', ARRAY['street animal','stray','tnr','rescued','rescuing'])
ON CONFLICT (slug) DO NOTHING;

-- 3. Keyword aliases for existing active tags (skips photo/video/text; food/rescue set above)
UPDATE content_tags SET keyword_aliases = ARRAY['cats','kitty','kitten','billi','meow']            WHERE slug = 'cat';
UPDATE content_tags SET keyword_aliases = ARRAY['dogs','puppy','pup','doggo','kutta']              WHERE slug = 'dog';
UPDATE content_tags SET keyword_aliases = ARRAY['birds','parrot','budgie','tota']                  WHERE slug = 'bird';
UPDATE content_tags SET keyword_aliases = ARRAY['aquarium','betta','goldfish']                     WHERE slug = 'fish';
UPDATE content_tags SET keyword_aliases = ARRAY['bunny','khargosh']                                WHERE slug = 'rabbit';
UPDATE content_tags SET keyword_aliases = ARRAY['lizard','turtle','snake','gecko']                 WHERE slug = 'reptile';
UPDATE content_tags SET keyword_aliases = ARRAY['other','hamster','guinea pig','hedgehog']         WHERE slug = 'other-animal';

UPDATE content_tags SET keyword_aliases = ARRAY['memes','lol','relatable']                         WHERE slug = 'meme';
UPDATE content_tags SET keyword_aliases = ARRAY['adorable','aww','sweet']                          WHERE slug = 'cute';
UPDATE content_tags SET keyword_aliases = ARRAY['tips','guide','howto','advice']                   WHERE slug = 'educational';
UPDATE content_tags SET keyword_aliases = ARRAY['help','ask','anyone','suggestions']                WHERE slug = 'question';
UPDATE content_tags SET keyword_aliases = ARRAY['vent','frustrated']                                WHERE slug = 'rant';

UPDATE content_tags SET keyword_aliases = ARRAY['adopt','rehome','foster']                         WHERE slug = 'adoption';
UPDATE content_tags SET keyword_aliases = ARRAY['daily update','dailylife']                        WHERE slug = 'diary';
UPDATE content_tags SET keyword_aliases = ARRAY['humor','comedy']                                  WHERE slug = 'funny';
UPDATE content_tags SET keyword_aliases = ARRAY['groom','bath','fur','haircut']                    WHERE slug = 'grooming';
UPDATE content_tags SET keyword_aliases = ARRAY['vet','sick','vaccine','clinic','injury']          WHERE slug = 'health';
UPDATE content_tags SET keyword_aliases = ARRAY['lost','found','missing','reunited']               WHERE slug = 'lost-found';
UPDATE content_tags SET keyword_aliases = ARRAY['birthday','gotchaday','anniversary']              WHERE slug = 'milestone';
UPDATE content_tags SET keyword_aliases = ARRAY['train','obedience','potty','commands']            WHERE slug = 'training';

COMMIT;
