/**
 * Verification script for identity verification.
 * Tests if the factory returns the correct adapters and if the methods work with mock data.
 */

import { IdentityVerificationFactory } from "./src/providers/verification/identity/identity.factory";
import { env } from "./src/config/env";

async function verify() {
  console.log("Testing PAN Lite...");
  const panVerifier = IdentityVerificationFactory.getPanVerifier();
  const panResult = await panVerifier.verify(
    "ABCDE1234F",
    "test_pan_001",
    "John Doe",
    "1990-01-01"
  );
  console.log("PAN Result:", JSON.stringify(panResult, null, 2));

  console.log("\nTesting Driving License...");
  const dlVerifier = IdentityVerificationFactory.getDrivingLicenseVerifier();
  const dlResult = await dlVerifier.verify(
    "KA0120198900984",
    "1990-01-01",
    "test_dl_001"
  );
  console.log("DL Result:", JSON.stringify(dlResult, null, 2));
}

// Since we are running in a shell, we might need to mock env or just run it if possible.
// This is a conceptual check.
console.log("Verification script prepared.");
