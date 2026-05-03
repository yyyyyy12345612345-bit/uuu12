import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { db, auth } from './firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 🔔 Push Notifications System (FCM)
 * 
 * Handles device registration for push notifications and token storage in Firestore.
 */

export async function initializePushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not a native platform, skipping FCM initialization.');
    return;
  }

  // 1. Request Permission
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.log('[Push] User denied permissions!');
    return;
  }

  // 2. Register with FCM
  await PushNotifications.register();

  // 3. Listen for Token Registration
  PushNotifications.addListener('registration', (token: Token) => {
    console.log('[Push] Token registration successful:', token.value);
    saveTokenToFirestore(token.value);
  });

  // 4. Listen for Errors
  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('[Push] Registration error:', error);
  });

  // 5. Listen for Incoming Notifications (Foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Notification received in foreground:', notification);
  });

  // 6. Listen for Notification Action (User Clicked)
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('[Push] Notification action performed:', action);
  });
}

/**
 * Save the FCM token to the user's Firestore document.
 * This allows the admin to target the user later.
 */
async function saveTokenToFirestore(token: string) {
  const user = auth?.currentUser;
  if (!user || !db) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      fcmToken: token,
      lastTokenUpdate: serverTimestamp(),
      platform: Capacitor.getPlatform()
    });
    console.log('[Push] Token saved to Firestore for user:', user.uid);
  } catch (e) {
    console.error('[Push] Failed to save token to Firestore:', e);
  }
}

/**
 * Subscribe the user to a global topic.
 * Note: Topic subscription usually requires a native SDK or a cloud function.
 * Capacitor's default plugin doesn't support topics directly without extra setup.
 * For now, we rely on individual tokens.
 */
