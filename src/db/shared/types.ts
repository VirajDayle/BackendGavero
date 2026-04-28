import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

/**
 * PostGIS geography(Point, 4326) — spherical distance queries
 */
export const geographyPoint = customType<{
  data: { lng: number; lat: number };  // what your app sees
  driverData: string;                   // what DB sends back (WKB hex)
}>({
  dataType() {
    return "geography(Point, 4326)";
  },
  toDriver(value: { lng: number; lat: number }) {
    return sql`ST_SetSRID(ST_MakePoint(${value.lng}, ${value.lat}), 4326)`;
  },
  fromDriver(value: string): { lng: number; lat: number } {
    // PostGIS returns WKB hex — parse it
    // WKB Point: bytes 5-12 = X (lng), bytes 13-20 = Y (lat)
    const buf = Buffer.from(value, "hex");
    const lng = buf.readDoubleLE(5);
    const lat = buf.readDoubleLE(13);
    return { lng, lat };
  },
});

/**
 * PostGIS geography(Polygon, 4326) — boundary/area queries
 */
export const geographyPolygon = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return "geography(Polygon, 4326)";
  },
});
