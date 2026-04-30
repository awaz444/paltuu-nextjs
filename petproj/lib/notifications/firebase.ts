import * as admin from "firebase-admin";

/**
 * Initialize Firebase Admin SDK
 * Credentials come from environment variables
 */

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App {
  // Return cached instance if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountBase64) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT environment variable is not set. " +
      "Please set it to your Firebase service account JSON (base64 encoded)."
    );
  }

  try {
    // Decode base64 service account
    const serviceAccountJson = Buffer.from(serviceAccountBase64, "base64").toString("utf-8");
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize Firebase Admin SDK
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log("✅ Firebase Admin SDK initialized");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw new Error(
      `Firebase initialization failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get Firebase Messaging instance
 */
export function getMessaging(): admin.messaging.Messaging {
  const app = initializeFirebase();
  return admin.messaging(app);
}

/**
 * Get Firebase Admin instance
 */
export function getFirebaseAdmin(): typeof admin {
  initializeFirebase();
  return admin;
}
