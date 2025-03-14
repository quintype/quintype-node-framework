export function initializeFCM(firebaseConfig) {
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
      return m.getToken(messaging, { vapidKey: firebaseConfig.vapidKey });
    })
    .then((token) => {
      return registerFCMTopic(token);
    })
    .catch((err) => {
      console.error(err);
    });
}

function registerFCMTopic(token) {
  return fetch("/register-fcm-topic", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: token }),
  });
}
