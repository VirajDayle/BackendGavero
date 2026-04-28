/**
 * scripts/seed-roles.ts
 * 
 * 1. Creates missing system roles (customer, shopkeeper, delivery_partner, admin).
 * 2. Assigns 'customer' role to any existing users who have no roles.
 */

import { db } from "../src/db";
import { 
  rolesTable, 
  userRolesTable, 
  userTable 
} from "../src/db/models/auth";
import { ROLES } from "../src/shared";
import { eq, inArray, notInArray, sql } from "drizzle-orm";

async function main() {
  console.log("--- Seeding Roles & Fixing Assignments ---");

  const defaultRoles = [
    { name: "Customer", slug: ROLES.CUSTOMER, description: "Standard user / shopper", isSystem: true },
    { name: "Shop Owner", slug: ROLES.SHOP_OWNER, description: "Merchant / Shop owner", isSystem: true },
    { name: "Delivery Partner", slug: ROLES.DELIVERY_PARTNER, description: "Logistic partner / Rider", isSystem: true },
    { name: "Admin", slug: ROLES.ADMIN, description: "System administrator", isSystem: true },
    { name: "Super Admin", slug: ROLES.SUPER_ADMIN, description: "Super administrator with full access", isSystem: true },
    { name: "Employee", slug: ROLES.EMPLOYEE, description: "Internal operations personnel", isSystem: true },
  ];

  for (const dr of defaultRoles) {
    const existing = await db.select().from(rolesTable).where(eq(rolesTable.slug, dr.slug)).limit(1);
    if (existing.length === 0) {
      console.log(`Creating missing role: ${dr.slug}...`);
      await db.insert(rolesTable).values(dr);
    } else {
      console.log(`Role already exists: ${dr.slug}`);
    }
  }

  // Find the customer role ID
  const [customerRole] = await db.select().from(rolesTable).where(eq(rolesTable.slug, "customer")).limit(1);
  if (!customerRole) throw new Error("Customer role not found after seeding.");

  // Fix users without roles
  console.log("Checking for users without any roles...");
  
  // Find users who are NOT in the user_roles table
  const usersWithRoles = db.select({ id: userRolesTable.userId }).from(userRolesTable);
  const usersWithoutRoles = await db
    .select({ id: userTable.id, phone: userTable.phone })
    .from(userTable)
    .where(notInArray(userTable.id, usersWithRoles));

  console.log(`Found ${usersWithoutRoles.length} users without roles.`);

  for (const user of usersWithoutRoles) {
    console.log(`Assigning 'customer' role to user: ${user.phone}...`);
    await db.insert(userRolesTable).values({
      userId: user.id,
      roleId: customerRole.id
    });
  }

  console.log("--- Process Complete ---");
  process.exit(0);
}

main().catch(console.error);
