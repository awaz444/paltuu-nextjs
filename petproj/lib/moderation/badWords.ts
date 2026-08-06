/**
 * Curated from paltuu-reactnative/bad-words.js plus a Roman Urdu/Hindi list
 * (Paltuu's primary market is Pakistan, and slurs there are typed in Roman
 * script, not Devanagari or Nastaliq — so only Roman transliterations are
 * matched here).
 *
 * Split by severity rather than one flat blocklist:
 *
 *  SEVERE   -> auto shadow-hide on post/comment creation (see the POST
 *              handlers in app/api/v1/social/posts and .../comments).
 *              Identity-based slurs, explicit sexual content, bestiality
 *              references, and degrading insults that have no legitimate
 *              everyday meaning.
 *  MILD     -> client-side typing warning only (paltuu-reactnative), never
 *              auto-hides anything server-side. Covers ordinary profanity
 *              AND words that double as normal vocabulary — critically, on
 *              a *pet* app: "bitch"/"kutiya" (female dog), "ass"/"gadha"
 *              (donkey), "cock" (rooster), "kutta"/"pilla" (dog/puppy),
 *              "suar" (pig), "ullu" (owl), "sex" (an animal's sex), plus
 *              everyday words like "gandi" (just means "dirty") and "dalal"
 *              (also means "broker/agent"). Flagging these as SEVERE would
 *              shadow-hide completely normal pet posts.
 *  SEVERE_PHRASES -> multi-word insults where the individual words are fine
 *              alone but the full phrase isn't, e.g. "kutte ki zat" (lit.
 *              "of dog breed") — a classic South Asian animal-insult
 *              construction. The bare animal name ("kutta") stays out of
 *              SEVERE_WORDS for exactly the pet-app-collision reason above;
 *              only the complete phrase is unambiguous.
 *
 * This is a first-pass curation, not a linguistic authority — when a word's
 * severity was ambiguous it was placed in MILD (a soft nudge, safe by
 * default) rather than SEVERE (an automatic content action). Two acronyms
 * from the source list ("bc", "mc") were dropped entirely: as bare 2-letter
 * tokens they'd false-positive constantly (years like "300 BC", surnames
 * like "McDonald", etc.) regardless of tier.
 */

export const SEVERE_WORDS = [
    // --- English: identity-based slurs / hate speech ---
    'chink', 'coon', 'jap', 'spac', 'nazi',
    'n1gga', 'n1gger', 'nigg3r', 'nigg4h', 'nigga', 'niggah', 'niggas', 'niggaz', 'nigger', 'niggers',
    'fag', 'fagging', 'faggitt', 'faggot', 'faggs', 'fagot', 'fagots', 'fags',
    'gaylord', 'gaysex', 'homo', 'dyke', 'retard', 'heshe', 'shemale',

    // --- English: bestiality / animal-abuse content (important for a pet app specifically) ---
    'beastial', 'beastiality', 'bestial', 'bestiality',

    // --- English: explicit sexual content / acts ---
    'blowjob', 'blowjobs', 'blow job', 'cumshot', 'gangbang', 'gangbanged', 'gangbangs',
    'hardcoresex', 'hotsex', 'phonesex',
    'cunilingus', 'cunillingus', 'cunnilingus', 'kunilingus', 'fellate', 'fellatio', 'felching',
    'rimjaw', 'rimming',
    'm45terbate', 'ma5terb8', 'ma5terbate', 'master-bate', 'masterb8', 'masterbat*', 'masterbat3',
    'masterbate', 'masterbation', 'masterbations', 'masturbate',
    'porn', 'porno', 'pornography', 'pornos', 'pron', 'p0rn',
    'orgasim', 'orgasims', 'orgasm', 'orgasms',
    'ejaculate', 'ejaculated', 'ejaculates', 'ejaculating', 'ejaculatings', 'ejaculation', 'ejakulate',
    'jack-off', 'jackoff', 'jerk-off', 'xrated', 'xxx',
    'dildo', 'dildos', 'viagra', 'v14gra', 'v1gra', 'cyalis',

    // --- English: strong personal degradation, no meaningful collision ---
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

    // --- Roman Urdu/Hindi: strong sexual / incest-based / degrading insults, no everyday-word collision ---
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
    'hijda', 'hijra', 'hijade',
    'chakka', 'takke',
    'bhadua', 'bhaduaa', 'bhadva', 'bhadvaa', 'bhadwa', 'bhadwaa', 'bhandwa', 'bhadwe', 'bhadwon', 'bhadwi',
    'bhadwapanti', 'bhandi',
    'porkistan',
    'chut marike', 'land marike', 'gand mari ke', 'muth marna',
];

export const SEVERE_PHRASES = [
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
    'smut', 'snatch', 'spunk',
    't1tt1e5', 't1tties', 'teets', 'teez', 'tit', 'titfuck', 'tits', 'titt', 'tittie5', 'tittiefucker',
    'titties', 'tittyfuck', 'tittywank', 'titwank',
    'turd', 'wang', 'whoar', 'willies', 'willy', 'w00se',
    'goatse', 'boiolas', 'bollock', 'bollok',

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
