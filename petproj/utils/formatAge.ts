export const formatAge = (ageMonths: number | null | undefined): string => {
  if (ageMonths === null || ageMonths === undefined || ageMonths < 0) {
    return "Unknown age";
  }

  if (ageMonths === 0) {
    return "Newborn";
  }

  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  const yearStr = years > 0 ? `${years} ${years === 1 ? "Year" : "Years"}` : "";
  const monthStr = months > 0 ? `${months} ${months === 1 ? "Month" : "Months"}` : "";

  if (yearStr && monthStr) {
    return `${yearStr}, ${monthStr}`;
  }

  return yearStr || monthStr;
};
