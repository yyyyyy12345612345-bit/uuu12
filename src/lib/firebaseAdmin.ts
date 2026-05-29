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
  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. " +
      "Please add it in Vercel Project Settings -> Environment Variables."
    );
  }

  // If it's base64 encoded, decode it first
  if (!serviceAccountJson.trim().startsWith("{") && !serviceAccountJson.trim().startsWith("[")) {
    try {
      serviceAccountJson = Buffer.from(serviceAccountJson, "base64").toString("utf-8");
    } catch (e) {
      // Ignore and try parsing directly
    }
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    // Safe parse: handle double-escaped newlines commonly introduced by env variables
    const formattedJson = serviceAccountJson.replace(/\\n/g, "\n");
    serviceAccount = JSON.parse(formattedJson);
  } catch (e: any) {
    // Fallback: try parsing the original value directly without modification
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (fallbackError: any) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Parse error: ${fallbackError.message}. ` +
        `Length of key: ${serviceAccountJson.length}. Starts with: ${serviceAccountJson.slice(0, 20)}`
      );
    }
  }

  // Ensure private key newlines are correct
  if (serviceAccount.privateKey) {
    serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, "\n");
  }

  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return adminApp;
}

export function getAdminAuth(): admin.auth.Auth {
  return admin.auth(getAdminApp());
}
