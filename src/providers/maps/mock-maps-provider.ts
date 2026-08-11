import type {
  DistanceResult,
  GeocodeResult,
  GeoPoint,
  MapsProvider,
  ReverseGeocodeResult,
} from "./types";

const CITY_COORDS: Record<string, GeoPoint & { state: string }> = {
  bengaluru: { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  bangalore: { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  mumbai: { lat: 19.076, lng: 72.8777, state: "Maharashtra" },
  delhi: { lat: 28.6139, lng: 77.209, state: "Delhi" },
  hyderabad: { lat: 17.385, lng: 78.4867, state: "Telangana" },
  chennai: { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  pune: { lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
  kolkata: { lat: 22.5726, lng: 88.3639, state: "West Bengal" },
};

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export class MockMapsProvider implements MapsProvider {
  readonly name = "mock";

  async geocode(query: string): Promise<GeocodeResult | null> {
    const key = query.trim().toLowerCase();
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      if (key.includes(city)) {
        return {
          label: `${city[0]!.toUpperCase()}${city.slice(1)}, ${coords.state}, India`,
          city: city === "bangalore" ? "Bengaluru" : city[0]!.toUpperCase() + city.slice(1),
          state: coords.state,
          country: "IN",
          point: { lat: coords.lat, lng: coords.lng },
          provider: this.name,
        };
      }
    }
    return {
      label: query,
      country: "IN",
      point: { lat: 20.5937, lng: 78.9629 },
      provider: this.name,
    };
  }

  async reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult | null> {
    let best: { city: string; state: string; dist: number } | null = null;
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      const dist = haversineMeters(point, coords);
      if (!best || dist < best.dist) {
        best = { city, state: coords.state, dist };
      }
    }
    if (!best || best.dist > 80_000) {
      return {
        label: "India",
        country: "IN",
        point,
        provider: this.name,
      };
    }
    const cityName =
      best.city === "bangalore"
        ? "Bengaluru"
        : best.city[0]!.toUpperCase() + best.city.slice(1);
    return {
      label: `${cityName}, ${best.state}, India`,
      city: cityName,
      state: best.state,
      country: "IN",
      point,
      provider: this.name,
    };
  }

  async distance(a: GeoPoint, b: GeoPoint): Promise<DistanceResult> {
    const meters = Math.round(haversineMeters(a, b));
    return {
      meters,
      kilometers: Math.round((meters / 1000) * 10) / 10,
      provider: this.name,
    };
  }
}
