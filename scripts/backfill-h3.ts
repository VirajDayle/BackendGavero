/**
 * scripts/backfill-h3.ts
 *
 * One-time script to populate h3_index_res7 and h3_index_res9 columns
 * for all existing rows in addresses, shops, and shop_branches that
 * have GPS coordinates.
 */

import { db } from "../src/db";
import { addressesTable, shopsTable, shopBranchesTable } from "../src/db/schema";
import { coordsToH3Multi } from "../src/utils/h3";
import { sql, isNotNull, and, eq } from "drizzle-orm";

async function backfill() {
  console.log("🚀 Starting H3 backfill...");

  try {
    // 1. BACKFILL ADDRESSES
    const addresses = await db
      .select({
        id: addressesTable.id,
        lng: sql<number>`ST_X(${addressesTable.location}::geometry)`,
        lat: sql<number>`ST_Y(${addressesTable.location}::geometry)`,
      })
      .from(addressesTable)
      .where(isNotNull(addressesTable.location));

    console.log(`📍 Found ${addresses.length} addresses to backfill...`);
    for (const addr of addresses) {
      const h3 = coordsToH3Multi(addr.lat, addr.lng);
      await db
        .update(addressesTable)
        .set({ h3IndexRes7: h3.res7, h3IndexRes9: h3.res9 })
        .where(eq(addressesTable.id, addr.id));
    }
    console.log("✅ Addresses backfilled.");

    // 2. BACKFILL SHOPS
    const shops = await db
      .select({
        id: shopsTable.id,
        lng: sql<number>`ST_X(${shopsTable.location}::geometry)`,
        lat: sql<number>`ST_Y(${shopsTable.location}::geometry)`,
      })
      .from(shopsTable)
      .where(isNotNull(shopsTable.location));

    console.log(`🏪 Found ${shops.length} shops to backfill...`);
    for (const shop of shops) {
      const h3 = coordsToH3Multi(shop.lat, shop.lng);
      await db
        .update(shopsTable)
        .set({ h3IndexRes7: h3.res7, h3IndexRes9: h3.res9 })
        .where(eq(shopsTable.id, shop.id));
    }
    console.log("✅ Shops backfilled.");

    // 3. BACKFILL SHOP BRANCHES
    const branches = await db
      .select({
        id: shopBranchesTable.id,
        lng: sql<number>`ST_X(${shopBranchesTable.location}::geometry)`,
        lat: sql<number>`ST_Y(${shopBranchesTable.location}::geometry)`,
      })
      .from(shopBranchesTable)
      .where(isNotNull(shopBranchesTable.location));

    console.log(`🏢 Found ${branches.length} shop branches to backfill...`);
    for (const branch of branches) {
      const h3 = coordsToH3Multi(branch.lat, branch.lng);
      await db
        .update(shopBranchesTable)
        .set({ h3IndexRes7: h3.res7, h3IndexRes9: h3.res9 })
        .where(eq(shopBranchesTable.id, branch.id));
    }
    console.log("✅ Shop branches backfilled.");

    console.log("\n✨ H3 backfill completed successfully!");
  } catch (error) {
    console.error("\n❌ Backfill failed:");
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

backfill();
