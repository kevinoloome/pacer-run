// Cities offered as suggestions when posting a run, each with its time zone.
// Anyone can type a city that isn't listed: it then uses the time zone of
// the device they're posting from.

export const CITIES = [
  { name: "Nairobi, Kenya", tz: "Africa/Nairobi" },
  { name: "Mombasa, Kenya", tz: "Africa/Nairobi" },
  { name: "Kisumu, Kenya", tz: "Africa/Nairobi" },
  { name: "Eldoret, Kenya", tz: "Africa/Nairobi" },
  { name: "Kampala, Uganda", tz: "Africa/Kampala" },
  { name: "Dar es Salaam, Tanzania", tz: "Africa/Dar_es_Salaam" },
  { name: "Kigali, Rwanda", tz: "Africa/Kigali" },
  { name: "Addis Ababa, Ethiopia", tz: "Africa/Addis_Ababa" },
  { name: "Lagos, Nigeria", tz: "Africa/Lagos" },
  { name: "Accra, Ghana", tz: "Africa/Accra" },
  { name: "Cape Town, South Africa", tz: "Africa/Johannesburg" },
  { name: "Johannesburg, South Africa", tz: "Africa/Johannesburg" },
  { name: "Cairo, Egypt", tz: "Africa/Cairo" },
  { name: "London, UK", tz: "Europe/London" },
  { name: "Manchester, UK", tz: "Europe/London" },
  { name: "Paris, France", tz: "Europe/Paris" },
  { name: "Berlin, Germany", tz: "Europe/Berlin" },
  { name: "Amsterdam, Netherlands", tz: "Europe/Amsterdam" },
  { name: "Madrid, Spain", tz: "Europe/Madrid" },
  { name: "Lisbon, Portugal", tz: "Europe/Lisbon" },
  { name: "Dubai, UAE", tz: "Asia/Dubai" },
  { name: "Mumbai, India", tz: "Asia/Kolkata" },
  { name: "Bengaluru, India", tz: "Asia/Kolkata" },
  { name: "Singapore", tz: "Asia/Singapore" },
  { name: "Tokyo, Japan", tz: "Asia/Tokyo" },
  { name: "Seoul, South Korea", tz: "Asia/Seoul" },
  { name: "Sydney, Australia", tz: "Australia/Sydney" },
  { name: "Melbourne, Australia", tz: "Australia/Melbourne" },
  { name: "Auckland, New Zealand", tz: "Pacific/Auckland" },
  { name: "New York, USA", tz: "America/New_York" },
  { name: "Boston, USA", tz: "America/New_York" },
  { name: "Chicago, USA", tz: "America/Chicago" },
  { name: "Denver, USA", tz: "America/Denver" },
  { name: "San Francisco, USA", tz: "America/Los_Angeles" },
  { name: "Los Angeles, USA", tz: "America/Los_Angeles" },
  { name: "Toronto, Canada", tz: "America/Toronto" },
  { name: "Mexico City, Mexico", tz: "America/Mexico_City" },
  { name: "São Paulo, Brazil", tz: "America/Sao_Paulo" },
];

export const DEFAULT_TZ = "Africa/Nairobi";

export function deviceTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
}

// Time zone for a typed city: a known suggestion wins, otherwise the device's.
export function tzForCity(city) {
  const c = (city || "").trim().toLowerCase();
  const hit = CITIES.find((x) => x.name.toLowerCase() === c);
  return hit ? hit.tz : deviceTz();
}

const KEY = "pacer.homeCity";

export function getHomeCity() {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function setHomeCity(city) {
  try {
    if (city) localStorage.setItem(KEY, city);
    else localStorage.removeItem(KEY);
  } catch {}
}
