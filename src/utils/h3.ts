// =============================================================================
// H3 Spatial Indexing Utilities
//
// Thin wrapper around h3-js for converting GPS coordinates to Uber H3
// hexagonal cell indexes. H3 cells are precomputed at write time so
// read-path proximity queries use fast B-tree IN(...) lookups instead
// of expensive PostGIS ST_DWithin sequential scans.
//
// Resolution guide:
//   Res 7  ~1.22 km edge → city-level clustering, coarse "near me"
//   Res 9  ~174 m  edge → neighbourhood-level, delivery zone bucketing
// =============================================================================

import { latLngToCell, gridDisk, polygonToCells, cellToBoundary } from "h3-js";
import type { Polygon } from "geojson";
/**
 * Returns the 6 vertices of the H3 hexagon for visualization.
 *
 * @param h3Index 15-character hex string
 * @returns Array of [lat, lng] points forming the hexagon
 */
export function h3ToBoundary(h3Index: string): [number, number][] {
  return cellToBoundary(h3Index);
}

export function h3ToGeoJsonPolygon(h3Index: string): Polygon {
  const latLngPairs = cellToBoundary(h3Index);

  const ring: number[][] = latLngPairs.map(([lat, lng]) => [lng, lat]);
  ring.push(ring[0]); // close the ring

  return {
    type: "Polygon",
    coordinates: [ring],
  };
}

/**
 * Returns all H3 cells whose centers are within the given polygon.
 *
 * @param coordinates  Array of [lat, lng] points forming the closed ring
 * @param resolution   H3 resolution (e.g. 7 for city zones)
 * @returns Array of 15-character hex strings
 */
export function polyfill(
  geoJson: Polygon,
  resolution: number,
): string[] {
  return polygonToCells(
    geoJson.coordinates,
    resolution,
    true // ✅ VERY IMPORTANT
  );
}
/** City-level clustering — ~1.22 km hex edge */
export const H3_RES_CITY = 7;

/** Neighbourhood-level — ~174 m hex edge */
export const H3_RES_NEIGHBOURHOOD = 9;

/**
 * Convert lat/lng to an H3 index at the given resolution.
 *
 * @param lat  Latitude  (-90 to 90)
 * @param lng  Longitude (-180 to 180)
 * @param resolution  H3 resolution level (0–15)
 * @returns  15-character hex string e.g. "891f1d48177ffff"
 */
export function coordsToH3(
  lat: number,
  lng: number,
  resolution: number,
): string {
  return latLngToCell(lat, lng, resolution);
}

/**
 * Convenience — returns H3 indexes at both standard resolutions in one call.
 *
 * @returns `{ res7, res9 }` hex strings
 */
export function coordsToH3Multi(
  lat: number,
  lng: number,
): { res7: string; res9: string } {
  return {
    res7: latLngToCell(lat, lng, H3_RES_CITY),
    res9: latLngToCell(lat, lng, H3_RES_NEIGHBOURHOOD),
  };
}

/**
 * Return all H3 cells within `k` rings of the given cell (inclusive).
 *
 * Ring 0 = the cell itself
 * Ring 1 = 7 cells (self + 6 neighbours)
 * Ring 2 = 19 cells
 *
 * Use this to expand a user's location into a search set for IN(...) queries.
 *
 * @param h3Index  Centre cell
 * @param k        Number of rings (0 = just the centre)
 * @returns Array of H3 index strings
 */
export function h3KRing(h3Index: string, k: number): string[] {
  return gridDisk(h3Index, k);
}
