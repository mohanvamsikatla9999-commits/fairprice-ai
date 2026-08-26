export type IndiaCity = {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  areas?: string[];
};

/** Major India cities for marketplace locality + SEO. */
export const INDIA_CITIES: IndiaCity[] = [
  {
    slug: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    lat: 17.385,
    lng: 78.4867,
    areas: ["Madhapur", "Kondapur", "Gachibowli", "Hitech City", "Banjara Hills", "Secunderabad"],
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    areas: ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Electronic City", "Jayanagar"],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    areas: ["Andheri", "Bandra", "Powai", "Thane", "Navi Mumbai", "Dadar"],
  },
  {
    slug: "delhi",
    name: "Delhi",
    state: "Delhi",
    lat: 28.6139,
    lng: 77.209,
    areas: ["Saket", "Connaught Place", "Dwarka", "Rohini", "South Extension", "Karol Bagh"],
  },
  { slug: "noida", name: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.391, areas: ["Sector 18", "Sector 62"] },
  { slug: "gurgaon", name: "Gurugram", state: "Haryana", lat: 28.4595, lng: 77.0266, areas: ["Cyber City", "Golf Course Road"] },
  {
    slug: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    areas: ["T Nagar", "Anna Nagar", "Velachery", "OMR", "Adyar"],
  },
  {
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    areas: ["Hinjewadi", "Kothrud", "Viman Nagar", "Baner", "Hadapsar"],
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    areas: ["Salt Lake", "Park Street", "Howrah", "New Town"],
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    lat: 23.0225,
    lng: 72.5714,
    areas: ["SG Highway", "Navrangpura", "Satellite", "Bopal"],
  },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { slug: "chandigarh", name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { slug: "kochi", name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { slug: "indore", name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { slug: "lucknow", name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
];

export const SAFE_MEETUP_TEMPLATES: Record<string, string[]> = {
  hyderabad: ["Inorbit Mall Cyberabad", "GVK One Banjara Hills", "Forum Sujana Mall"],
  bengaluru: ["Phoenix Marketcity", "UB City", "Indiranagar 100 Feet Rd police booth area"],
  mumbai: ["Phoenix Palladium", "Bandra Linking Road plaza", "Andheri Infinity Mall"],
  delhi: ["Select Citywalk Saket", "Connaught Place Central Park", "Ambience Mall Vasant Kunj"],
  default: ["Local police station lobby", "Busy shopping mall food court", "Metro station entrance"],
};

export function findCityBySlug(slug: string): IndiaCity | undefined {
  return INDIA_CITIES.find((c) => c.slug === slug.toLowerCase());
}

export function findCityByName(name: string): IndiaCity | undefined {
  const n = name.trim().toLowerCase();
  return INDIA_CITIES.find(
    (c) => c.name.toLowerCase() === n || c.slug === n.replace(/\s+/g, "-"),
  );
}

/** Haversine distance in km */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
