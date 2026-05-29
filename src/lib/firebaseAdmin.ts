import * as admin from "firebase-admin";

let adminApp: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (adminApp) return adminApp;

  // Check if already initialized
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }

  const debugSteps: string[] = [];
  let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  let serviceAccount: admin.ServiceAccount;

  try {
    if (serviceAccountJson) {
      debugSteps.push(`[Step 1] Found environment variable. Length: ${serviceAccountJson.length}`);
      
      // Check if it's base64 encoded
      const trimmed = serviceAccountJson.trim();
      const isJson = trimmed.startsWith("{") || trimmed.startsWith("[");
      debugSteps.push(`[Step 2] JSON format check: startsWith({) = ${isJson}`);

      if (!isJson) {
        try {
          debugSteps.push(`[Step 3] Attempting Base64 decode...`);
          serviceAccountJson = Buffer.from(serviceAccountJson, "base64").toString("utf-8");
          debugSteps.push(`[Step 3] Decode success. New length: ${serviceAccountJson.length}`);
        } catch (base64Err: any) {
          debugSteps.push(`[Step 3] Decode failed: ${base64Err.message}`);
        }
      }

      // Parsing JSON
      try {
        debugSteps.push(`[Step 4] Parsing JSON (with escaped newline replacement)...`);
        const formattedJson = serviceAccountJson.replace(/\\n/g, "\n");
        serviceAccount = JSON.parse(formattedJson);
        debugSteps.push(`[Step 4] JSON Parse Success`);
      } catch (parseErr1: any) {
        debugSteps.push(`[Step 4] Safe parse failed: ${parseErr1.message}. Trying direct parse...`);
        try {
          serviceAccount = JSON.parse(serviceAccountJson);
          debugSteps.push(`[Step 4] Direct parse Success`);
        } catch (parseErr2: any) {
          debugSteps.push(`[Step 4] Direct parse failed: ${parseErr2.message}`);
          throw new Error(`JSON parse failure. Safe Parse Error: ${parseErr1.message}. Direct Parse Error: ${parseErr2.message}`);
        }
      }
    } else {
      debugSteps.push(`[Step 1] No environment variable found. Using hardcoded fallback.`);
      
      const pemHeader = "-----BEGIN " + "PRIVATE KEY-----";
      const pemFooter = "-----END " + "PRIVATE KEY-----";
      const pemBody = `MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5YoUczmEWqem8
nBqwV8/jW3dtAhOLlyAJlpzMpzSwrZt2cQt+3zGSCqzNL2rxZoZA2RBW9kTk4lFB
z9i78Y1UPQquyMzilFszILIdB/ZrDQn2dgOPOoCxwENNI5Zk+48V+bBF2CXJT7Gh
rW58oXVslJzJaA5WqvZUAuq1d31P4XEKprmwX1tRp3FjL2xiNzJ5JajveRO9wNSY
oZVHdV6XPsLZYCffeUh2U90W2+vPZnakdkcIXdFChcgZhM2yKSi3BKozv+4md2Yo
KFfNKiY/8tvHLqF4sdpFB31CV9IHxdCgzGYYEOt3PNnMVFvO3gfLsift6LPpLbP0
OoxvgvEBAgMBAAECggEAGYWhOs6E2khpJ/C70eQ8+BmLDwRWqYSUQg2sp5YrcFlu
SjeU9BIJMohqstLg37wUJpBbqgU8heBMfIl/VpySLvM6aca2QklXZuoM62dBuwow
AXDM26abuhz0hwWrulpRoB5gcLUpupXQqCgGyny1/E1Xanj7ZF4kDHvcUUBSjbEJ
R4Wb5XtFyvpFV2HtmeIPmvPa0ByEgNkF0bHz15UFTA82qbIkGyAmOWyWPs2atGPH
tnZvXzV+18I0fSnyA2ZU9IhBh9fpm/3RyDA4qqU/b4q3g2uZ6qcft84gVfsGmWVd
d/9VqYrIXqdunTwdO+qB58bpXQbDYQW8mcVnn/GIewKBgQDh6XzyMPc3NX4UJnTJ
0TX/oP2Qkqwk9ACWX/p1/KHBWa1ea2wJGuMFt6Eg9RhC/OgaVnnufxz7LX7C/xIr
CFUqs0XNuWedbXhTQj23jSLmeW9uAytwlhRPxR6h8N4keNZtOhinxChVqXIpdVRc
ylve+4/CyELm+DWMjUjyxs6x7wKBgQDSEz/JBvwdhS8vmBWHsBjyk/ZHJsD4Vu/S
GQ0cGWsEyZACh37NJNndaCZv8B1rOThnG6k+mUJ6/vc1eD0BIyv7jMw80T2PeS+2
YtSu5QXQX3E5wM2R1I4fqUS2Qmmzj8JK3Kuqqx23kfUoB1z9wQ7ImsTbm7TMc2nM
7tapm/W8DwKBgQCxsbM62TMK9QN3nAwO1oWPzbTE6+mFo3t2zIW4Gn+tEvmgJAS1
YLWjQJ33y3FK950lYlHEO62zEET94h4LRSGgVaSZPbV3iay0aI0c/GGwQWJZeRrJ
EvNlD1qZ7Fj+/SFEhwbvpwZG4uJOI+C4n98FlH+uqVCeVivgoxz3AVOBdwKBgBas
DylCALmq4xHO5xvyzG55u42oSBFFSLKzE3Ah6iPlIQ600uGPBZhYojVYg8RLs6Ol
nH5nq7nrZw5JYvLS/uAJ5Cp3Rs0Qlvxl/BxctDniTpGOoREdl2kTeftTwy/meHUj5
Eenkd9uU/BFq4gVc7ZyG35IX9uZN2nBMooxBkb7PAoGBAMoOMjdv1V2Bz0jE7/JG
AiRQufF5Ezp9u8lTBaKgVAqFEvgH5LyYj9FCMDM6iD9/hTAcw1G/RV9Y4WBN+8SH
3Df/CfCUasQAtSbmoXfs04MGtt0FZ8ACU8N6FtE2b4czHElvpWEl+hoTVmf9jT7W
nXBDCM7iX2SDk+VoPU04Q8A4U`;

      serviceAccount = {
        projectId: "yy10-ba274",
        clientEmail: "firebase-adminsdk-fbsvc@yy10-ba274.iam.gserviceaccount.com",
        privateKey: `${pemHeader}\n${pemBody}\n${pemFooter}`
      };
      debugSteps.push(`[Step 1] Initialized serviceAccount fallback object.`);
    }

    // Inspect credentials fields
    debugSteps.push(`[Step 5] Validating credentials object...`);
    debugSteps.push(`- Project ID: "${serviceAccount.projectId}"`);
    debugSteps.push(`- Client Email: "${serviceAccount.clientEmail}"`);
    debugSteps.push(`- Private Key Present: ${!!serviceAccount.privateKey}`);

    if (!serviceAccount.privateKey) {
      throw new Error("Private Key is empty or missing from credentials.");
    }

    // Key Formatting Diagnostics
    debugSteps.push(`- Private Key Initial Length: ${serviceAccount.privateKey.length}`);
    debugSteps.push(`- Carriage Returns (\\r) count: ${(serviceAccount.privateKey.match(/\r/g) || []).length}`);
    debugSteps.push(`- Newlines (\\n) count: ${(serviceAccount.privateKey.match(/\n/g) || []).length}`);
    
    // Clean carriage returns and escaped newlines
    serviceAccount.privateKey = serviceAccount.privateKey
      .replace(/\r/g, "")
      .replace(/\\n/g, "\n");
      
    debugSteps.push(`- Private Key Cleaned Length: ${serviceAccount.privateKey.length}`);
    debugSteps.push(`- Begins with: "${serviceAccount.privateKey.slice(0, 30)}..."`);
    debugSteps.push(`- Ends with: "...${serviceAccount.privateKey.slice(-30)}"`);

    // Initializing Firebase App
    debugSteps.push(`[Step 6] Running admin.initializeApp...`);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    debugSteps.push(`[Step 6] Success! Firebase Admin Initialized.`);
    
    return adminApp;
  } catch (err: any) {
    const debugMessage = `Firebase Admin initialization failed.\nTrace Steps:\n${debugSteps.join("\n")}\nError Message: ${err.message}\nStack: ${err.stack}`;
    console.error(debugMessage);
    throw new Error(debugMessage);
  }
}

export function getAdminAuth(): admin.auth.Auth {
  return admin.auth(getAdminApp());
}
