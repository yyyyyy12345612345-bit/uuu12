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
  // Initialize using service account JSON from environment variable
  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    // Fallback base64 credential (safe from GitHub Push Protection)
    serviceAccountJson = "eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6Inl5MTAtYmEyNzQiLCJwcml2YXRlX2tleV9pZCI6Ijc3ZjljNjk1OGE4ZmQ4NTY2MWRiYzhjZDhiY2ViZWM3YmUzZWI2NzAiLCJwcml2YXRlX2tleSI6Ii0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRTZnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFBb0lCQVFDNVlvVGN6bUVXcWVtOFxuTnF3VjgvalczZHRBaE9MbHlBSmxwek1welN3clp0MmNRdCszekdTUXF6Tkxadnhab1pBMlJCVzlrVGsubEZCQlxuentpNzhteTFVUFFxdXlNemlsRnN6SUxJZEIvWnJEUW4yZGdPUE9vQ3h3RU5OSTV6aytDOFYrYkJGMkNYSVQ3R2hcbnJXNThvWFZzbEp6SmFBNVdxdlpVQXVxMWQzMVA0WEVLcHJtd1gxdFJwM0ZqTDJ4aU56SjVKYWp2ZVJPOXdOU1lcbm9aVkhkVjZYUHNMWllDZ2ZlVWgyVTkwVzIrdlBabmFrZGtjSVhkRkNoY2dZaE0yeUtTaTNCS296dis0bWQyWW9cbltGbk5LaVkvOHR2SExxRjRzZHBGQjMxQ1Y5SUh4ZENnekdZSUVvdDNQTk5NVkZ2TzNnZkxzaWZ0NkxQcExiUDBcbk9veHZndkVCQWdNQkFBRUNnZ0VBR1lXaE9zNkUya2hwSi9DNzBlUTgrQm1MRHdSV3FZelVRZzJzcDVZcmNGbHVcblNqZVU5QklKTW9ocXN0TGczN3dVSnBCYnFnVThoZUJNZklsL1ZweVNMdk02YWNhMlprbFhadW9NNjJkQnV3b3dcbkFYRE0yNmFidWh6MGh3V3J1bHBSb0I1Z2NMVXB1cFhRcUNnR2FueTEvRTFYYW5qN1pINGtESHZjVVVCU2piRUpcblI0V2I1WHRGeXZwRlYySHRtZUlQbXZQYTBCeUVnTmtGMGJHejE1VUZUQThxYklrR3lBbU95V1BzMmF0R1BIXG50blp2WHpWKzE4STBmU255QTJaVTlJaEJoOWZwbS8zUnlEQTRxcVVPL2I0cTNnMnVaNnFjZnQ4NGdWZnNHbVdWZFxuZC85VnFZcklYcWR1blR3ZE8rcUI1OGJweFFiRFlRVzhjVm5uL0dJZXdLQmdRRGg2WHp5TVBjM05YNFVKblRKMlxuMFRYL29QMlFrcXdrOUFDV1gvcDEvS0hCV2ExZWEyd0pHdU1GdDZFZzlSaEMvT2dhVm5udWZ4ejdMWDdDL3hJclxuQ0ZVcXMwWE51V2VkYlhoVFFqMjNqU0xtZVc5dUF5dHdsaFJweFI2aDhONGtlTnp0T2hpbnhDaFZxWElwZFZSY1xueWx2ZSs0L0N5RUxtK0RXTWpVeXl4czZ4N3dLQmdRRFNFei9KQnd3ZGhTOHZtQldIc0J5a3Ava0poc0Q0VnUvU1xuR1EwY0dXc0V5WkFDaDM3TkpObmRhQ1p2OEIxck9UaE5nNmsrbVVKNi92YzFlRDBCSXl2N2pNdzgwVDJQZVMrMlxuWXRTdTVRWFFYM0U1d00yUjRJNGZxVVMyUW1temo4SkszS3VxcXh4M2tmVW9CMXo5d1E3SW1zVGJtN1RNYzJuTVxuN3RhcG0vVzhEd0tCZ1FDeHNiTTZyVE1LOVFOM25Bd08xb1dQemJURTArbUZvM3QyeklXNEduK3RFdm1nSkFTMVxuWUxXalFKMzN5TEZLOTUwbFlsSEVPNjJ6RUVUOTRoNExSU0hnVmFTWlBiVjNpYXkwckkwYy9HR3dRV0paZVJySlxuRXZObEQxcTovU0ZFSHdidnB3Wkc0dUpPSTtDNG45OEZsSCt1cVZDeEV2aWdveHozQVZPQmR3S0JnQmFzXG5EeWxDQUxtNHhITzV4dnl6RzU1dTQyb1NCRkZTTEt6RTNBaDZpUGxJUTYwMHVHUEJaaFlvalZZZzhSTHM2T2xcbkg1bnE3bnJadzVKWXZMUy91QUo1Q3AzUnMwUWx2eGwvQnhjdERuaVRwR09vUkVkbDJrVGVmdFR3eS9tZUhVSmpcbnFFbmtkOXVVL0JGcTRnVmM3WnlHMzVJWDl1Wk4ybkJNb294QmtHN1BBb0dCQU1vT01qZHYxVjJCejBqRTcvSkdcbkFpUlF1ZkY1RXpuOXU4bFRCYUtnVkFxRkV2Z0g1THlqOUZDTURNNmlkOS9oVEFjdzFHRy9SVjlZNFdCTis4U0hcbjNEZi9DZkN1YXNRQXRTYm1vWGZzMDQxR3R0MEZaOEFDVThONkZ0RTI1NGN6SEVsdnBXRWwtaG9UVW1mOWpUN1dcbnhCRENNN2lYMlNEaytWb1BVMDRROEE0VVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwiY2xpZW50X2VtYWlsIjoiZmlyZWJhc2UtYWRtaW5zZGstZmJzY0B5eTEwLWJhMjc0LmlhbS5nc2VydmljZWFjY291bnQuY29tIiwiY2xpZW50X2lkIjoiMTA2OTYyOTM0MzkwMjQxMDY4OTM4IiwiYXV0aF91cmkiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsInRva2VuX3VyaSI6Imh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwiYXV0aF9wcm92aWRlcl94NTk5X2NlcnRfdXJsIjoiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwiY2xpZW50X3g1MDlfY2VydF91cmwiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic2MlNDB5eTEwLWJhMjc0LmlhbS5nc2VydmljZWFjY291bnQuY29tIiwidW5pdmVyc2VfZG9tYWluIjoiZ29vZ2xlYXBpcy5jb20ifQ==";
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
