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

      // No need to refresh token https://github.com/firebase/firebase-js-sdk/issues/4132
      requestPermission(m, firebaseConfig, messaging)
    })
    .catch(err => {
      console.log('fcm initialization error---------', err)
      console.error(err)
    })
}

async function requestPermission (m, firebaseConfig, messaging) {
  console.log('request oermission------')
  //requesting permission using Notification API
  const permission = await Notification.requestPermission()

  if (permission === 'granted') {
    const token = await m.getToken(messaging, {
      vapidKey: firebaseConfig.vapidKey
    })

    //We can send token to server
    console.log('Token generated : ', token)
    m.onMessage(messaging, ({ notification }) => {
      console.log('========notification', messaging, notification)
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon
      })
    })
  } else if (permission === 'denied') {
    //notifications are blocked
    alert('You denied for the notification')
  }
}
