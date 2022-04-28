export function initializeFCM(firebaseConfig) {
  if (!firebaseConfig.messagingSenderId) {
    console.log("messagingSenderId is required");
    return false;
  }
  Promise.all([
    import(/* webpackChunkName: "firebase-app" */ "firebase/app"),
    import(/* webpackChunkName: "firebase-messaging" */ "firebase/messaging"),
  ])
    .then(([firebase, m]) => {
      const app = firebase.initializeApp({
        messagingSenderId: firebaseConfig.messagingSenderId.toString(),
        ...firebaseConfig,
      });
      const messaging = m.getMessaging(app);
      return m.getToken(messaging);
      // No need to refresh token https://github.com/firebase/firebase-js-sdk/issues/4132
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
