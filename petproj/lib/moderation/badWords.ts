/**
 * Curated from paltuu-reactnative/bad-words.js plus a Roman Urdu/Hindi list
 * (Paltuu's primary market is Pakistan, and slurs there are typed in Roman
 * script, not Devanagari or Nastaliq — so only Roman transliterations are
 * matched here).
 *
 * Split by severity rather than one flat blocklist:
 *
 *  SEVERE   -> auto shadow-hide on post/comment creation, and a hard reject
 *              on identity fields (name/username/bio/pet name/pet bio — see
 *              hasSevereIdentityMatch below). Two categories:
 *                1) Slurs/hate speech (racial/ethnic/religious/homophobic/
 *                   transphobic/ableist) and bestiality/animal-abuse
 *                   references — same bar in every language.
 *                2) ALL Roman Urdu/Hindi profanity (madarchod, chutiya,
 *                   gaand, randi, harami, ...) — a deliberate, asymmetric
 *                   product call: this is the primary language of abuse on
 *                   this app given its Pakistan market, so it's held to a
 *                   stricter bar than its English equivalent. "fucks bad
 *                   bitches" in an English bio is allowed; "madarchod" is
 *                   not, even though they're comparable in raw crudeness.
 *  MILD     -> client-side typing warning only, never blocks or hides
 *              anything server-side. Covers ordinary/strong ENGLISH
 *              profanity (the "fuck"/"cunt"/"bastard" family — allowed,
 *              just flagged) AND words that double as normal vocabulary —
 *              critically, on a *pet* app: "bitch"/"kutiya" (female dog),
 *              "ass"/"gadha" (donkey), "cock" (rooster), "kutta"/"pilla"
 *              (dog/puppy), "suar" (pig), "ullu" (owl), "sex" (an animal's
 *              sex), plus everyday Urdu/Hindi words like "gandi" ("dirty")
 *              and "dalal" ("broker/agent") that are never profanity here
 *              regardless of the stricter Urdu/Hindi bar above — they're
 *              not swears to begin with, just literal vocabulary.
 *
 * This is a first-pass curation, not a linguistic authority — when a word's
 * severity was ambiguous it was placed in MILD (a soft nudge, safe by
 * default) rather than SEVERE (an automatic content action). Two acronyms
 * from the source list ("bc", "mc") were dropped entirely: as bare 2-letter
 * tokens they'd false-positive constantly (years like "300 BC", surnames
 * like "McDonald", etc.) regardless of tier.
 */

export const SEVERE_WORDS = [
    // --- English: racial/ethnic slurs, hate terms ---
    'chink', 'coon', 'jap', 'spac', 'nazi',
    'n1gga', 'n1gger', 'nigg3r', 'nigg4h', 'nigga', 'niggah', 'niggas', 'niggaz', 'nigger', 'niggers',

    // --- English: homophobic / transphobic / ableist slurs ---
    'fag', 'fagging', 'faggitt', 'faggot', 'faggs', 'fagot', 'fagots', 'fags',
    'gaylord', 'homo', 'dyke', 'retard', 'heshe', 'shemale',

    // --- English: bestiality / animal-abuse content — a different category
    // from "profanity" entirely, and especially relevant on a pet app ---
    'beastial', 'beastiality', 'bestial', 'bestiality',

    // --- Roman Urdu/Hindi: transphobic slurs, hate terms ---
    'hijda', 'hijra', 'hijade', 'chakka', 'takke',
    'porkistan', // derogatory term for Pakistan itself

    // --- Roman Urdu/Hindi: strong sexual / incest-based / degrading
    // insults. Unlike their English equivalents ("fuck"/"bitch"), these are
    // treated as SEVERE rather than casual swearing — a deliberate product
    // call for this market, not an oversight. ---
    'bahenchod', 'behenchod', 'bhenchod', 'bhenchodd', 'bsdk', 'b.s.d.k',
    'bhosada', 'bhosda', 'bhosdaa', 'bhosdike', 'bhonsdike', 'bhosdiki', 'bhosdiwala', 'bhosdiwale',
    'bhosdi', 'bhosri wala', 'bhosdi wala', 'bhonsri wala',
    'bhosadchodal', 'bhosadchod',
    'madarchod', 'madarchodd', 'madarchood', 'madarchoot', 'madarchut',
    'chod', 'chodd', 'chodna', 'chudna', 'chud', 'chodu', 'chodela',
    'chodo', 'chodi', 'chodne', 'chodva', 'chudo', 'chudi', 'chudne', 'chudva', 'chodai', 'chuda', 'chudai', 'chudvana',
    'chudwa', 'chudwaa', 'chudwane', 'chudwaane',
    'chutia', 'chutiya', 'chutiye', 'chutiyapa', 'chutmar', 'chut', 'choot', 'chute',
    'gaand', 'gand', 'gandu', 'gaandu', 'gandfat', 'gandfut', 'gandiya', 'gandiye', 'bund',
    'gandphatu', 'gandphati', 'gandphata', 'gandphaton', 'gand phatu', 'gand phati', 'gand phata', 'gand phaton',
    'gaandmasti', 'gand masti', 'gandmarna', 'gandmaru', 'gandmarana', 'gandmari',
    'gand marna', 'gand maru', 'gand mari', 'gand marana',
    'lund', 'land', 'lundwa', 'laude', 'laudey', 'laura', 'lora', 'lauda', 'lavda', 'lawda', 'loda', 'lode',
    'laundi', 'loundi', 'laundiya', 'loundiya', 'lulli', 'nunni', 'nunnu', 'gadhalund',
    'raand', 'rand', 'randi', 'randy', 'randwa', 'randhwa', 'randibazar', 'randibazaar',
    'chinaal', 'chinal', 'ghasti', 'ghassad',
    'harami', 'haramjada', 'haraamjaada', 'haramzyada', 'haraamzyaada', 'haraamjaade', 'haraamzaade',
    'haramzada', 'haramzadi', 'haramia', 'haraamkhor', 'haramkhor',
    'bhadua', 'bhaduaa', 'bhadva', 'bhadvaa', 'bhadwa', 'bhadwaa', 'bhandwa', 'bhadwe', 'bhadwon', 'bhadwi',
    'bhadwapanti', 'bhandi',
    'chut marike', 'land marike', 'gand mari ke', 'muth marna',
];

export const SEVERE_PHRASES = [
    // Animal-insult phrases ("son of a dog" etc.) — full phrase only; the
    // bare animal name ("kutta") stays out of SEVERE for the pet-app
    // collision reasons documented on MILD_WORDS below.
    'kutte ki zat', 'suar ki aulad', 'suar ki zat', 'gadhe ki aulad', 'gadhe ki zat',
    'bandar ki aulad', 'bandar ki zat', 'bhains ki aulad', 'bhains ki zat',
    'ullu ki aulad', 'ullu ki zat', 'lomdi ki aulad', 'lomdi ki zat',
    'bhed ki aulad', 'bhed ki zat', 'bakri ki aulad', 'bakri ki zat',
    'billi ki aulad', 'billi ki zat', 'mendhak ki aulad', 'mendhak ki zat',
];

export const MILD_WORDS = [
    // --- English: general profanity / crude-but-not-degrading / body-slang ---
    '4r5e', '5h1t', '5hit', 'a55', 'anal', 'anus', 'ar5e', 'arrse', 'arse', 'ass', 'asses', 'a_s_s',
    'b!tch', 'b17ch', 'b1tch', 'bi+ch', 'biatch', 'bitch', 'bitcher', 'bitchers', 'bitches', 'bitchin', 'bitching',
    'l3i+ch', 'l3itch',
    'b00bs', 'boob', 'boobs', 'booobs', 'boooobs', 'booooobs', 'booooooobs', 'breasts',
    'ballbag', 'balls', 'ballsack', 'bellend', 'boner', 'buceta', 'bugger', 'bum', 'butt', 'butthole',
    'buttmuch', 'buttplug',
    'c0ck', 'cawk', 'cipa', 'cl1t', 'clit', 'clitoris', 'clits', 'cock', 'cockface', 'cockhead',
    'cockmunch', 'cockmuncher', 'cocks', 'cok', 'cox',
    'crap', 'cum', 'cummer', 'cumming', 'cums', 'cyberfuc', 'cyberfuck', 'cyberfucked', 'cyberfucker',
    'cyberfuckers', 'cyberfucking',
    'damn', 'dink', 'dinks', 'dirsa', 'doggin', 'dogging', 'donkeyribber',
    'f4nny', 'fanny', 'fannyflaps', 'fannyfucker', 'fanyy', 'fatass', 'flange',
    'fingerfuck', 'fingerfucked', 'fingerfucker', 'fingerfuckers', 'fingerfucking', 'fingerfucks',
    'fistfuck', 'fistfucked', 'fistfucker', 'fistfuckers', 'fistfucking', 'fistfuckings', 'fistfucks',
    'God', 'god-dam', 'god-damned', 'goddamn', 'goddamned', 'hell', 'bloody',
    'horniest', 'horny', 'lust', 'lusting',
    'jism', 'jiz', 'jizm', 'jizz', 'spunk', 'semen',
    'jap', // kept here too as a short country-code-like token is high false-positive risk on its own outside slur context — soft warn only
    'kawk', 'kock', 'kondum', 'kondums', 'kum', 'kummer', 'kumming', 'kums',
    'm0f0', 'm0fo', 'mo-fo', 'mof0', 'mofo',
    'masochist', 'sadist',
    'muff', 'numbnuts', 'nutsack',
    'pawn', 'pecker', 'penis', 'labia', 'vulva', 'vagina', 'testical', 'testicle', 'scroat', 'scrote', 'scrotum',
    'pimpis', 'piss', 'pissed', 'pisser', 'pissers', 'pisses', 'pissflaps', 'pissin', 'pissing', 'pissoff',
    'poop', 'pube',
    'pusse', 'pussi', 'pussies', 'pussy', 'pussys', // "pussy" = cat colloquially — collision, keep MILD
    'rectum', 'schlong', 'screwing',
    's hit', 's.o.b.', 'sh!+', 'sh!t', 'sh1t', 'shi+', 's_h_i_t', 'shit', 'shite', 'shited', 'shitey',
    'shiting', 'shitings', 'shits', 'shitted', 'shitter', 'shitters', 'shitting', 'shittings', 'shitty',
    'shag', 'shagger', 'shaggin', 'shagging',
    'smut', 'snatch',
    't1tt1e5', 't1tties', 'teets', 'teez', 'tit', 'titfuck', 'tits', 'titt', 'tittie5', 'tittiefucker',
    'titties', 'tittyfuck', 'tittywank', 'titwank',
    'turd', 'wang', 'whoar', 'willies', 'willy', 'w00se',
    'goatse', 'boiolas', 'bollock', 'bollok',

    // --- English: general/strong profanity — allowed, warn-only (the
    // "fuck"/"cunt"/"bastard" family: not slurs, just swearing) ---
    'bastard', 'son-of-a-bitch',
    'whore', 'hoar', 'hoare', 'hoer', 'hore', 'slut', 'sluts', 'skank',
    'cnut', 'cunt', 'cuntlick', 'cuntlicker', 'cuntlicking', 'cunts',
    'mothafuck', 'mothafucka', 'mothafuckas', 'mothafuckaz', 'mothafucked', 'mothafucker', 'mothafuckers',
    'mothafuckin', 'mothafucking', 'mothafuckings', 'mothafucks',
    'mother fucker', 'motherfuck', 'motherfucked', 'motherfucker', 'motherfuckers', 'motherfuckin',
    'motherfucking', 'motherfuckings', 'motherfuckka', 'motherfucks',
    'muthafecker', 'muthafuckker', 'muther', 'mutherfucker', 'mutha',
    'f u c k', 'f u c k e r', 'f_u_c_k', 'fcuk', 'fcuker', 'fcuking', 'feck', 'fecker',
    'fook', 'fooker', 'fuck', 'fucka', 'fucked', 'fucker', 'fuckers', 'fuckhead', 'fuckheads',
    'fuckin', 'fucking', 'fuckings', 'fuckingshitmotherfucker', 'fuckme', 'fucks', 'fuckwhit', 'fuckwit',
    'fuk', 'fuker', 'fukker', 'fukkin', 'fuks', 'fukwhit', 'fukwit', 'fux', 'fux0r',
    'phuck', 'phuk', 'phuked', 'phuking', 'phukked', 'phukking', 'phuks', 'phuq',
    'c0cksucker', 'cock-sucker', 'cocksuck', 'cocksucked', 'cocksucker', 'cocksucking', 'cocksucks',
    'cocksuka', 'cocksukka', 'coksucka', 'cokmuncher', 'carpet muncher',
    'ass-fucker', 'assfucker', 'assfukka', 'asshole', 'assholes', 'asswhole',
    'dick', 'd1ck', 'dlck', 'dickhead', 'prick', 'pricks',
    'knob', 'knobead', 'knobed', 'knobend', 'knobhead', 'knobjocky', 'knobjokey', 'nob jokey', 'nobhead',
    'nobjocky', 'nobjokey', 'nob',
    'wank', 'wanker', 'wanky', 'tosser',
    'tw4t', 'twat', 'twathead', 'twatty', 'twunt', 'twunter',
    'pigfucker', 'dog-fucker', 'bunny fucker', 'fudge packer', 'fudgepacker',
    'shitdick', 'shitfuck', 'shitfull', 'shithead',
    'doosh', 'duche', 'penisfucker', 'smegma',

    // --- English: explicit sexual content / acts — graphic, but a content
    // rating concern rather than a slur; warn-only ---
    'blowjob', 'blowjobs', 'blow job', 'cumshot', 'gangbang', 'gangbanged', 'gangbangs',
    'hardcoresex', 'hotsex', 'phonesex', 'gaysex',
    'cunilingus', 'cunillingus', 'cunnilingus', 'kunilingus', 'fellate', 'fellatio', 'felching',
    'rimjaw', 'rimming',
    'm45terbate', 'ma5terb8', 'ma5terbate', 'master-bate', 'masterb8', 'masterbat*', 'masterbat3',
    'masterbate', 'masterbation', 'masterbations', 'masturbate',
    'porn', 'porno', 'pornography', 'pornos', 'pron', 'p0rn',
    'orgasim', 'orgasims', 'orgasm', 'orgasms',
    'ejaculate', 'ejaculated', 'ejaculates', 'ejaculating', 'ejaculatings', 'ejaculation', 'ejakulate',
    'jack-off', 'jackoff', 'jerk-off', 'xrated', 'xxx',
    'dildo', 'dildos', 'viagra', 'v14gra', 'v1gra', 'cyalis',

    // --- Roman Urdu/Hindi: literal animal/body vocabulary (pet-app collisions) and mild/casual terms ---
    'aad', 'aand',
    'bevda', 'bewda', 'bevdey', 'bewday',
    'bevakoof', 'bevkoof', 'bevkuf', 'bewakoof', 'bewkoof', 'bewkuf',
    'bakchod', 'bakchodd', 'bakchodi',
    'babbe', 'babbey', 'bube', 'bubey', 'mamme', 'mammey', 'boobley', 'buuble', 'baable',
    'bur', 'burr', 'buurr', 'buur',
    'charsi',
    'chooche', 'choochi', 'chuchi', 'chuchiyan', 'chuuche',
    'chuttad', 'chutad',
    'dalaal', 'dalal', 'dalle', 'dalley', // "dalal" also means broker/agent
    'fattu',
    'gadha', 'gadhe', // donkey
    'goo', 'gu',
    'gote', 'gotey', 'gotte',
    'hag', 'haggu', 'hagne', 'hagney',
    'jhat', 'jhaat', 'jhaatu', 'jhatu', 'jhaant',
    'kutta', 'kutte', 'kuttey', // dog
    'kutia', 'kutiya', 'kuttiya', 'kutti', // female dog
    'landi', 'landy',
    'ling', // also just means "gender/sign" in formal Hindi/Urdu
    'launda', 'lounde', 'laundey', // also colloquial for "guy/dude"
    'maar', 'maro', 'marunga', 'marana', 'marani', 'marane', // "hit" — everyday verb collision
    'moot', 'mut', 'mootne', 'mutne', 'mooth', 'muth', 'muthi', 'mutthal',
    'paaji', 'paji',
    'pesaab', 'pesab', 'peshaab', 'peshab', 'pisaab', 'pisab',
    'pkmkb',
    'pilla', 'pillay', 'pille', 'pilley', // puppy / literal
    'suar', // pig
    'tatte', 'tatti', 'tatty',
    'ullu', // owl / mild "idiot"
    'gandi', // just means "dirty"
    'jigolo',
    'kamina', 'kamini',
    'bakland',
    'badir', 'badirchand',
];

export interface BadWordMatch {
    severe: string[];
    mild: string[];
}

function escapeForRegex(word: string): string {
    return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function buildMatcher(words: string[]): RegExp | null {
    if (words.length === 0) return null;
    const pattern = words.map(escapeForRegex).join('|');
    return new RegExp(`\\b(?:${pattern})\\b`, 'gi');
}

const SEVERE_RE = buildMatcher([...SEVERE_WORDS, ...SEVERE_PHRASES]);
const MILD_RE = buildMatcher(MILD_WORDS);

/**
 * Scans free text for SEVERE and MILD matches. Case-insensitive, whole-word
 * (so "assassin" never matches "ass", "grasshopper" never matches "ass", etc).
 * Returns deduped, lowercased matches — empty arrays for clean text.
 */
export function matchBadWords(text: string): BadWordMatch {
    if (!text) return { severe: [], mild: [] };
    const severe = SEVERE_RE ? Array.from(new Set((text.match(SEVERE_RE) ?? []).map((w) => w.toLowerCase()))) : [];
    const mild = MILD_RE ? Array.from(new Set((text.match(MILD_RE) ?? []).map((w) => w.toLowerCase()))) : [];
    return { severe, mild };
}

export function hasSevereMatch(text: string): boolean {
    if (!text || !SEVERE_RE) return false;
    SEVERE_RE.lastIndex = 0;
    return SEVERE_RE.test(text);
}

/**
 * Identity fields (display name, username, pet name, bios) get glued
 * together with underscores/periods/digits instead of spaces — "chink_boy"
 * or "n1gger.khan" — where \b never breaks (both '_' and digits are \w, so
 * there's no word-boundary transition either side of the slur). This turns
 * those separators into real spaces before matching, so the same \b-based
 * regex still catches them, WITHOUT switching to raw substring matching
 * (which would wrongly flag e.g. "raccoon_lover" for containing "coon").
 */
export function normalizeForIdentifierMatch(text: string): string {
    return text.replace(/[._]+/g, ' ').replace(/\d+/g, ' ');
}

/**
 * Unlike a post/comment, an identity field (name, username, bio, pet
 * name/bio) can't be shadow-hidden — it's always fully public, so a SEVERE
 * match here should reject the write outright rather than let it through
 * and hide it after the fact. Callers should treat `true` as a hard 400.
 * Note this only ever fires on the narrow SEVERE list (slurs/hate/
 * bestiality) — a pet bio like "fucks bad bitches" is MILD and is allowed.
 */
export function hasSevereIdentityMatch(text: string): boolean {
    if (!text) return false;
    return hasSevereMatch(normalizeForIdentifierMatch(text));
}
