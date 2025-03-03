export function initializeFCM (firebaseConfig) {
  Promise.all([
    import(/* webpackChunkName: "firebase-app" */ 'firebase/app'),
    import(/* webpackChunkName: "firebase-messaging" */ 'firebase/messaging')
  ])
    .then(([firebase, m]) => {
      const app = firebase.initializeApp({
        messagingSenderId: firebaseConfig.messagingSenderId.toString(),
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey,
        storageBucket: firebaseConfig.storageBucket,
        authDomain: firebaseConfig.authDomain,
        appId: firebaseConfig.appId
      })
      const messaging = m.getMessaging(app)
      requestPermission(m, firebaseConfig, messaging)
      m.onMessage(messaging, ({ notification }) => {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon
        })
      })
    })
    .catch(err => {
      console.error(`FCM subscription failed ${err}`)
    })
}

async function requestPermission (m, firebaseConfig, messaging) {
  const permission = await Notification.requestPermission()

  if (permission === 'granted') {
    const token = await m.getToken(messaging, {
      vapidKey: firebaseConfig.vapidKey
    })
  } else if (permission === 'denied') {
    console.log('notifications are denied')
  }
}
