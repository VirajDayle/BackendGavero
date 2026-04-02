/**
 * scripts/make-admin.ts
 * 
 * Usage: bun scripts/make-admin.ts <phone_number>
 * Example: bun scripts/make-admin.ts +919876543210
 */

import { db } from "../src/db";
import { 
  UserRepository, 
  RoleRepository, 
  UserRoleRepository 
} from "../src/modules/auth/auth.repository";
import { normalizePhone } from "../src/utils/phone";

async function main() {
  const phoneArg = process.argv[2];
  if (!phoneArg) {
    console.error("Usage: bun scripts/make-admin.ts <phone_number>");
    process.exit(1);
  }

  const phone = normalizePhone(phoneArg);
  console.log(`Promoting user with phone: ${phone} to admin...`);

  const userRepo = new UserRepository(db);
  const roleRepo = new RoleRepository(db);
  const userRoleRepo = new UserRoleRepository(db);

  // 1. Find the user
  const user = await userRepo.findByPhone(phone);
  if (!user) {
    console.error(`User with phone ${phone} not found. Please register first via API/App.`);
    process.exit(1);
  }
  console.log(`Found user: ${user.name || "Unnamed"} (ID: ${user.id})`);

  // 2. Find or Create the 'admin' role
  let adminRole = await roleRepo.findBySlug("admin");
  if (!adminRole) {
    console.log("'admin' role not found. Creating it...");
    adminRole = await roleRepo.create({
      name: "Administrator",
      slug: "admin",
      description: "Full system access",
      isSystem: true
    });
  }
  console.log(`Target Role: ${adminRole.name} (ID: ${adminRole.id})`);

  // 3. Assign the role
  const assignment = await userRoleRepo.assign({
    userId: user.id,
    roleId: adminRole.id
  });

  if (assignment) {
    console.log("SUCCESS: User promoted to admin.");
  } else {
    console.log("User is already an admin or assignment failed.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
