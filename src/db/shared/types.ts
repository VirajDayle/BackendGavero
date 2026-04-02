import { customType } from "drizzle-orm/pg-core";

/**
 * PostGIS geography(Point, 4326) — spherical distance queries
 */
export const geographyPoint = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return "geography(Point, 4326)";
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
