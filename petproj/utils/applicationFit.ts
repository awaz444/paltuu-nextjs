// How an adoption application lines up with the pet's listed needs. Moved out of
// the old /adoption-applicants page (PALTU-141) so My Listings can show it next
// to each applicant.
//
// Children and other pets get a verdict; "time left alone" is free text, so it
// is only shown side by side for the owner to judge.

export type Verdict = "fits" | "check" | null;
export interface FitRow {
    need: string;
    pet: string;
    them: string;
    verdict: Verdict;
}

export interface FitApplication {
    age_of_youngest_child: string | number | null;
    other_pets_details: string | null;
    pet_left_alone: string | null;
}

export interface FitPet {
    min_age_of_children?: number | null;
    can_live_with_dogs?: boolean | null;
    can_live_with_cats?: boolean | null;
    must_have_someone_home?: boolean | null;
}

const NO_PETS = /^\s*(no|none|nil|nothing|n\/?a)\b/i;
const DOG_WORDS = /\b(dog|dogs|puppy|puppies)\b/i;
const CAT_WORDS = /\b(cat|cats|kitten|kittens)\b/i;

export function assessFit(app: FitApplication, pet: FitPet | null | undefined): FitRow[] {
    const minAge = pet?.min_age_of_children ?? 0;
    const rawAge = app.age_of_youngest_child;
    const age = rawAge === null || rawAge === "" ? NaN : Number(rawAge);
    const children: FitRow = {
        need: "Children",
        pet: minAge > 0 ? `Fine with kids aged ${minAge}+` : "Fine with children of any age",
        them: Number.isFinite(age) ? `Youngest is ${age}` : "No children mentioned",
        verdict: !Number.isFinite(age) || age >= minAge ? "fits" : "check",
    };

    const dogsOk = !!pet?.can_live_with_dogs;
    const catsOk = !!pet?.can_live_with_cats;
    const text = (app.other_pets_details || "").trim();
    const none = !text || NO_PETS.test(text);
    const hasDog = !none && DOG_WORDS.test(text);
    const hasCat = !none && CAT_WORDS.test(text);
    const others: FitRow = {
        need: "Other pets",
        pet:
            dogsOk && catsOk
                ? "Good with dogs and cats"
                : catsOk
                  ? "Good with cats only"
                  : dogsOk
                    ? "Good with dogs only"
                    : "Not listed as good with other pets",
        them: none ? "No other pets" : text,
        verdict: none ? "fits" : (hasDog && !dogsOk) || (hasCat && !catsOk) ? "check" : hasDog || hasCat ? "fits" : null,
    };

    const company: FitRow = {
        need: "Company",
        pet: pet?.must_have_someone_home ? "Needs someone home most of the day" : "Fine alone for a few hours",
        them: app.pet_left_alone?.trim() || "Not stated",
        verdict: null,
    };

    return [children, others, company];
}

/** "2 of 2 fit" summary, or null when nothing could be judged. */
export function fitSummary(rows: FitRow[]): { fits: number; total: number; hasCheck: boolean } | null {
    const judged = rows.filter((r) => r.verdict !== null);
    if (judged.length === 0) return null;
    return {
        fits: judged.filter((r) => r.verdict === "fits").length,
        total: judged.length,
        hasCheck: judged.some((r) => r.verdict === "check"),
    };
}
