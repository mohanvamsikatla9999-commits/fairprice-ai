import { env } from "@/config/env";
import { MockMapsProvider } from "./mock-maps-provider";
import type { MapsProvider } from "./types";

export type {
  DistanceResult,
  GeocodeResult,
  GeoPoint,
  MapsProvider,
  ReverseGeocodeResult,
} from "./types";
export { MockMapsProvider } from "./mock-maps-provider";

export function createMapsProvider(): MapsProvider {
  switch (env.MAPS_PROVIDER) {
    case "mock":
    default:
      return new MockMapsProvider();
  }
}
