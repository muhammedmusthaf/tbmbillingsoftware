
import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";

const API_URL = import.meta.env.VITE_API_URL;

let listenersRegistered = false;

const saveTokenToBackend = async (fcmToken) => {
  const jwtToken = localStorage.getItem("token");

  if (!jwtToken) {
    console.log("User not logged in. FCM token not uploaded.");
    return;
  }

  const response = await fetch(`${API_URL}/api/device/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      token: fcmToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Device registration failed: ${response.status}`);
  }

  console.log("FCM device registered with backend");
};

export const registerPushNotifications = async () => {
  try {
    // Push registration is only for the native Android app.
    if (!Capacitor.isNativePlatform()) return null;

    let permission = await FirebaseMessaging.checkPermissions();

    if (permission.receive !== "granted") {
      permission = await FirebaseMessaging.requestPermissions();
    }

    if (permission.receive !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Listen for refreshed FCM tokens.
    if (!listenersRegistered) {
      await FirebaseMessaging.addListener(
        "tokenReceived",
        async ({ token }) => {
          try {
            await saveTokenToBackend(token);
          } catch (error) {
            console.error("Refreshed FCM token upload failed:", error);
          }
        }
      );

      await FirebaseMessaging.addListener(
        "notificationReceived",
        (notification) => {
          console.log("Push notification received:", notification);
        }
      );

      await FirebaseMessaging.addListener(
        "notificationActionPerformed",
        (action) => {
          console.log("Push notification opened:", action);
        }
      );

      listenersRegistered = true;
    }

    const result = await FirebaseMessaging.getToken();

    await saveTokenToBackend(result.token);

    console.log("FCM registration completed");

    return result.token;
  } catch (error) {
    console.error("Push notification registration failed:", error);
    return null;
  }
};
