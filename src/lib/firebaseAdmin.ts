import * as admin from "firebase-admin";

let adminApp: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (adminApp) return adminApp;

  // Check if already initialized
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }

  // Initialize using service account JSON from environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. " +
      "Get the service account key from Firebase Console → Project Settings → Service Accounts."
    );
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.");
  }

  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return adminApp;
}

export function getAdminAuth(): admin.auth.Auth {
  return admin.auth(getAdminApp());
}
