// Kenyan towns offered as suggestions when posting a run. Anyone can type
// another place. Every run uses Kenya time (Africa/Nairobi).

export const CITIES = [
  { name: "Nairobi, Kenya", tz: "Africa/Nairobi" },
  { name: "Mombasa, Kenya", tz: "Africa/Nairobi" },
  { name: "Kisumu, Kenya", tz: "Africa/Nairobi" },
  { name: "Nakuru, Kenya", tz: "Africa/Nairobi" },
  { name: "Eldoret, Kenya", tz: "Africa/Nairobi" },
  { name: "Thika, Kenya", tz: "Africa/Nairobi" },
  { name: "Kitengela, Kenya", tz: "Africa/Nairobi" },
  { name: "Ruiru, Kenya", tz: "Africa/Nairobi" },
  { name: "Kiambu, Kenya", tz: "Africa/Nairobi" },
  { name: "Machakos, Kenya", tz: "Africa/Nairobi" },
  { name: "Naivasha, Kenya", tz: "Africa/Nairobi" },
  { name: "Nyeri, Kenya", tz: "Africa/Nairobi" },
  { name: "Nanyuki, Kenya", tz: "Africa/Nairobi" },
  { name: "Malindi, Kenya", tz: "Africa/Nairobi" },
  { name: "Diani, Kenya", tz: "Africa/Nairobi" },
  { name: "Kakamega, Kenya", tz: "Africa/Nairobi" },
  { name: "Kisii, Kenya", tz: "Africa/Nairobi" },
  { name: "Meru, Kenya", tz: "Africa/Nairobi" },
  { name: "Embu, Kenya", tz: "Africa/Nairobi" },
  { name: "Kericho, Kenya", tz: "Africa/Nairobi" },
];

export const DEFAULT_TZ = "Africa/Nairobi";

// Kenya has one time zone, so every run uses it.
export function tzForCity() {
  return DEFAULT_TZ;
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
