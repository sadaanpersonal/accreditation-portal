import { getCountries } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";

const labels = en as Record<string, string>;

// All ISO countries (names), sorted A–Z. Israel (IL) is excluded.
export const COUNTRIES: string[] = getCountries()
  .filter((code) => code !== "IL")
  .map((code) => labels[code])
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b));
