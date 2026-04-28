// MUST SET ENV VARS BEFORE ANY IMPORTS
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.DATABASE_URL = "postgres://localhost:5432/db";
process.env.JWT_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.OTP_TOKEN_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.MAPBOX_ACCESS_TOKEN = "pk.test";
process.env.CASHFREE_ID = "test";
process.env.CASHFREE_SECRET_TOKEN = "test";

// Use dynamic import to ensure env is set
const { mapDigilockerResultToKycInsert } = await import("./src/modules/profile/profile.schema");

const userId = "00000000-0000-0000-0000-000000000000";

const mockAadhaar = {
  verificationId: "test-aadhar-123",
  referenceId: 12345,
  status: "SUCCESS",
  type: "AADHAAR",
  data: {
    uid: "XXXXXXXX1234",
    name: "John Doe",
    dob: "01-01-1990",
    gender: "Male",
    careOf: "Jane Doe",
    photoLink: "http://photo.link",
    splitAddress: {
      country: "India",
      state: "Maharashtra",
      dist: "Mumbai",
      subdist: null,
      vtc: null,
      po: null,
      pincode: "400001",
      house: "101",
      street: "Main St",
      landmark: "Post Office"
    },
    yearOfBirth: 1990,
    xmlFile: null
  }
} as any;

const mockPan = {
  verificationId: "test-pan-456",
  referenceId: 67890,
  status: "SUCCESS",
  type: "PAN",
  data: {
    pan: "ABCDE1234F",
    namePanCard: "John Doe",
    dob: "01-01-1990",
    gender: "M",
    type: "Individual",
    xmlFile: null
  }
} as any;

const mockDl = {
  verificationId: "test-dl-789",
  referenceId: 11223,
  status: "SUCCESS",
  type: "DRIVING_LICENSE",
  data: {
    dlNumber: "SS0120150001234",
    name: "John Doe",
    dob: "1990-01-01",
    careOf: "Jane Doe",
    gender: "Male",
    issueDate: "01-01-2015",
    expiryDate: "01-10-2035",
    issuedAt: "Mumbai",
    presentAddress: "Main St",
    permanentAddress: "Main St",
    photoLink: null,
    xmlFile: null,
    categories: []
  }
} as any;

async function runTests() {
  console.log("Testing Aadhaar mapping...");
  const aadhaarInsert = await mapDigilockerResultToKycInsert(userId, mockAadhaar);
  console.log("Aadhaar Result dob:", aadhaarInsert.dob);
  console.log("Aadhaar Result docType:", aadhaarInsert.documentType);

  console.log("\nTesting PAN mapping...");
  const panInsert = await mapDigilockerResultToKycInsert(userId, mockPan);
  console.log("PAN Result dob:", panInsert.dob);
  console.log("PAN Result encrypted:", !!panInsert.documentNumberEncrypted);

  console.log("\nTesting DL mapping...");
  const dlInsert = await mapDigilockerResultToKycInsert(userId, mockDl);
  console.log("DL Result dob:", dlInsert.dob);
  console.log("DL Result expiresAt:", dlInsert.expiresAt);

  const ok =
    aadhaarInsert.dob === "1990-01-01" &&
    panInsert.dob === "1990-01-01" &&
    dlInsert.dob === "1990-01-01" &&
    aadhaarInsert.documentNumberLast4 === "1234" &&
    panInsert.documentNumberLast4 === "234F" &&
    dlInsert.documentNumberLast4 === "1234" &&
    dlInsert.expiresAt instanceof Date;

  if (ok) {
    console.log("\n✅ All Tests Passed!");
  } else {
    console.error("\n❌ Tests Failed!");
    console.log("Details:", {
      aadhaarDob: aadhaarInsert.dob,
      panDob: panInsert.dob,
      dlDob: dlInsert.dob,
      aadhaarLast4: aadhaarInsert.documentNumberLast4,
      panLast4: panInsert.documentNumberLast4,
      dlLast4: dlInsert.documentNumberLast4,
      dlExpiresAt: dlInsert.expiresAt
    });
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
export { };

