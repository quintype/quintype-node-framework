export function initializeFCM (firebaseConfig) {
  Promise.all([
    import(/* webpackChunkName: "firebase-app" */ 'firebase/app'),
    import(/* webpackChunkName: "firebase-messaging" */ 'firebase/messaging')
  ])
    .then(([firebase, m]) => {
      console.log('m-----------', m)
      const app = firebase.initializeApp({
        messagingSenderId: firebaseConfig.messagingSenderId.toString(),
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey,
        storageBucket: firebaseConfig.storageBucket,
        authDomain: firebaseConfig.authDomain,
        appId: firebaseConfig.appId
      })
      const messaging = m.getMessaging(app)
      m.onMessage(messaging, ({ notification }) => {
        console.log('========notification', messaging, notification)
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon
        })
      })
      // No need to refresh token https://github.com/firebase/firebase-js-sdk/issues/4132
    })
    .catch(err => {
      console.log('fcm initialization error---------', err)
      console.error(err)
    })
}
