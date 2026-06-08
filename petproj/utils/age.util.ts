/**
 * utils/age.util.ts
 *
 * Returns a human-readable age string computed from a date of birth.
 * Age is NEVER stored — always computed at response time.
 *
 * Examples:
 *   '3 years'
 *   '8 months'
 *   '2 years 4 months'
 *   'less than a month'
 *   null  (when dob is null/undefined)
 */
export function calculateAge(dob: Date | string | null | undefined): string | null {
    if (!dob) return null;

    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;

    const now = new Date();
    let years  = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth()    - birth.getMonth();

    // Adjust if we haven't reached the birth month/day yet this year
    if (months < 0) {
        years--;
        months += 12;
    }
    // If same month but day hasn't come yet, subtract one month
    if (months === 0 && now.getDate() < birth.getDate()) {
        years--;
        months = 11;
    } else if (now.getDate() < birth.getDate()) {
        months--;
        if (months < 0) {
            years--;
            months += 12;
        }
    }

    if (years === 0 && months === 0) return 'less than a month';
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
}
