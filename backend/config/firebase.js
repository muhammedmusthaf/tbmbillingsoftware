
import {
  initializeApp,
  getApps,
  cert,
} from "firebase-admin/app";

import { getMessaging } from "firebase-admin/messaging";

let firebaseMessaging = null;

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

if (
  FIREBASE_PROJECT_ID &&
  FIREBASE_CLIENT_EMAIL &&
  FIREBASE_PRIVATE_KEY
) {
  const firebaseApp =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        });

  firebaseMessaging = getMessaging(firebaseApp);

  console.log("Firebase Admin connected successfully");
} else {
  console.warn("Firebase credentials missing. Push notifications disabled.");
}

export { firebaseMessaging };
