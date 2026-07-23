-- ============================================================
-- Tag rubrics — one-line "what this tag means" descriptions.
-- Run once against AWS RDS paltuudb, after 002_tag_taxonomy_cleanup.sql.
--
-- Purpose: consistency beats precision for interest scoring — the additive
-- affinity score only crosses a useful threshold when the SAME tag is
-- applied to similar posts every time. A written rubric per tag is what
-- lets two different admins (or the same admin months apart) make the same
-- call. Surfaced in the admin tagging queue as tag-chip tooltips and in the
-- taxonomy manager as an editable field.
-- ============================================================

ALTER TABLE content_tags ADD COLUMN IF NOT EXISTS description TEXT;

BEGIN;

-- Species
UPDATE content_tags SET description = 'Post is clearly about a cat (photo, video, or caption).'                                        WHERE slug = 'cat';
UPDATE content_tags SET description = 'Post is clearly about a dog.'                                                                    WHERE slug = 'dog';
UPDATE content_tags SET description = 'Post is clearly about a bird (incl. parrots, budgies).'                                          WHERE slug = 'bird';
UPDATE content_tags SET description = 'Post is about fish or an aquarium setup.'                                                        WHERE slug = 'fish';
UPDATE content_tags SET description = 'Post is about a rabbit.'                                                                          WHERE slug = 'rabbit';
UPDATE content_tags SET description = 'Post is about a reptile (lizard, turtle, snake, gecko).'                                         WHERE slug = 'reptile';
UPDATE content_tags SET description = 'Any other pet/animal species not covered above (hamster, guinea pig, hedgehog, etc).'            WHERE slug = 'other-animal';

-- Topic
UPDATE content_tags SET description = 'Pet is available for adoption, or the post is about rehoming/fostering. NOT a post about an animal the poster already keeps.' WHERE slug = 'adoption';
UPDATE content_tags SET description = 'An ongoing life-update narrative (a running story about the poster''s pet over time). NOT every casual/everyday photo — that has no tag by default. Tag tightly or this becomes a low-signal catch-all like the retired photo/video tags.' WHERE slug = 'diary';
UPDATE content_tags SET description = 'Post is meant to be funny/comedic in a non-meme-format way (a funny caption or moment). See "Meme" for meme-format posts specifically.' WHERE slug = 'funny';
UPDATE content_tags SET description = 'Post is about grooming, bathing, fur/coat care, or haircuts.'                                    WHERE slug = 'grooming';
UPDATE content_tags SET description = 'Vet visits, illness, injury, vaccination, or clinic-related content. NOT a post that merely shows a healthy-looking pet.' WHERE slug = 'health';
UPDATE content_tags SET description = 'A pet is reported lost or found, or a lost-and-found reunion story.'                             WHERE slug = 'lost-found';
UPDATE content_tags SET description = 'A specific milestone: birthday, gotcha-day, adoption anniversary. NOT a routine/everyday post.' WHERE slug = 'milestone';
UPDATE content_tags SET description = 'Training, obedience work, potty training, or teaching commands/tricks.'                          WHERE slug = 'training';
UPDATE content_tags SET description = 'Diet, feeding, nutrition, or treats. Use instead of Health for anything that is not a vet/illness matter.' WHERE slug = 'food';
UPDATE content_tags SET description = 'Street animals, community feeding, TNR (trap-neuter-return), or a rescue story that is not a formal adoption listing.' WHERE slug = 'rescue';

-- Content type
UPDATE content_tags SET description = 'Post is in meme format (image macro, joke template, etc). This is a genuine content judgment — NOT derivable from post_type, unlike the retired Photo/Video/Text tags.' WHERE slug = 'meme';

-- Mood
UPDATE content_tags SET description = 'Primarily "aww"/adorable in tone.'                                                                WHERE slug = 'cute';
UPDATE content_tags SET description = 'Teaches something — tips, a guide, or how-to advice for other pet owners.'                        WHERE slug = 'educational';
UPDATE content_tags SET description = 'The poster is asking for help or advice, not just sharing.'                                       WHERE slug = 'question';
UPDATE content_tags SET description = 'The poster is venting or frustrated about something.'                                             WHERE slug = 'rant';

-- Retired tags — kept for historical reference on already-tagged posts.
-- Do not select these for new tagging; is_active=false already hides them
-- from the queue and the onboarding picker.
UPDATE content_tags SET description = 'RETIRED — fully derivable from post_type/media_type and carries near-zero personalization signal (almost every post is a photo). Do not use for new tagging.' WHERE slug = 'photo';
UPDATE content_tags SET description = 'RETIRED — fully derivable from post_type/media_type. Do not use for new tagging.' WHERE slug = 'video';
UPDATE content_tags SET description = 'RETIRED — fully derivable from post_type/media_type. Do not use for new tagging.' WHERE slug = 'text';

COMMIT;
