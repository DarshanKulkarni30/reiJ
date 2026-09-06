/**
 * Rei - Admin Claim Assignment Utility
 * 
 * Sets the `admin: true` custom claim and updates the user profile document role to "admin".
 * Security: This script is executed by authorized project operators via CLI.
 * There is NEVER a public "make me admin" button in the client application.
 * 
 * Usage:
 *   node scripts/set-admin.js <USER_UID_OR_EMAIL>
 */

import admin from "firebase-admin";

const targetUser = process.argv[2];

if (!targetUser) {
  console.error("Usage: node scripts/set-admin.js <USER_UID_OR_EMAIL>");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "reij-83c6f";

try {
  admin.initializeApp({
    projectId,
  });
  console.log(`[Firebase Admin] Initialized for project: ${projectId}`);
} catch (err) {
  console.error("[Firebase Admin] Initialization failed:", err.message);
  process.exit(1);
}

async function setAdmin() {
  try {
    let userRecord;
    if (targetUser.includes("@")) {
      userRecord = await admin.auth().getUserByEmail(targetUser);
    } else {
      userRecord = await admin.auth().getUser(targetUser);
    }

    const uid = userRecord.uid;
    console.log(`Found user: ${userRecord.email || uid} (${uid})`);

    // 1. Set Firebase Auth custom user claim
    await admin.auth().setCustomUserClaims(uid, {
      admin: true,
    });
    console.log(`✓ Set custom claim { admin: true } for UID: ${uid}`);

    // 2. Set role: "admin" on their profile document in Firestore
    const userDocRef = admin.firestore().collection("users").doc(uid);
    await userDocRef.set(
      {
        role: "admin",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`✓ Updated /users/${uid} profile document with role: "admin"`);

    console.log("\nSuccess! The user can now access the Admin Dashboard upon next token refresh/login.");
    console.log("Privacy Reminder: Admins can ONLY see aggregate system health and counts.");
    console.log("Admins NEVER have access to read, export, or search other users' journals, locations, or photos.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to assign admin claim:", error.message);
    process.exit(1);
  }
}

setAdmin();
