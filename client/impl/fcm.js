export function initializeFCM(firebaseConfig, config) {
  console.log("opts--------", firebaseConfig);
  Promise.all([
    import(/* webpackChunkName: "firebase-app" */ "firebase/app"),
    import(/* webpackChunkName: "firebase-messaging" */ "firebase/messaging"),
  ])
    .then(([firebase, m]) => {
      const app = firebase.initializeApp({
        messagingSenderId: firebaseConfig.messagingSenderId.toString(),
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey,
        storageBucket: firebaseConfig.storageBucket,
        authDomain: firebaseConfig.authDomain,
        appId: firebaseConfig.appId,
      });
      const messaging = m.getMessaging(app);
      return firebaseConfig?.vapidKey ? m.getToken(messaging, {
        vapidKey: `${firebaseConfig?.vapidKey}`
      }) : m.getToken(messaging);
      // No need to refresh token https://github.com/firebase/firebase-js-sdk/issues/4132
    })
    .then((token) => {
      return registerFCMTopic(token, firebaseConfig.serverKey, config);
    })
    .catch((err) => {
      console.error(err);
    });
}

async function registerFCMTopic(token, fcmServerKey, config) {
    if (!token) {
      console.error("No Token Found");
      return;
    }

    const serverKey = typeof fcmServerKey === "function" ? await fcmServerKey(config) : fcmServerKey;
    console.log("serverKey-------", serverKey);
    const url = `https://iid.googleapis.com/iid/v1/${token}/rel/topics/all`;
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `key=${serverKey}`,
          "content-type": "application/json",
        },
      });
      console.log("Registration Done Successfully");
      return;
    } catch (error) {
      console.error("FCM Subscription Failed", error);
      return;
    }
  };
