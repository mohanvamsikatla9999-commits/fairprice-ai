export type GeoPoint = {
  lat: number;
  lng: number;
};

export type GeocodeResult = {
  label: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  point: GeoPoint;
  provider: string;
};

export type ReverseGeocodeResult = GeocodeResult;

export type DistanceResult = {
  meters: number;
  kilometers: number;
  provider: string;
};

export interface MapsProvider {
  readonly name: string;
  geocode(query: string): Promise<GeocodeResult | null>;
  reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult | null>;
  distance(a: GeoPoint, b: GeoPoint): Promise<DistanceResult>;
}
