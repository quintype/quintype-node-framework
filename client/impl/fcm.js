export function initializeFCM (firebaseConfig) {
  Promise.all([
    import(/* webpackChunkName: "firebase-app" */ 'firebase/app'),
    import(/* webpackChunkName: "firebase-messaging" */ 'firebase/messaging')
  ])
    .then(async ([firebase, m]) => {
      console.log('firebaseConfig=====', firebaseConfig)
      const app = firebase.initializeApp({
        messagingSenderId: firebaseConfig.messagingSenderId.toString(),
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey,
        storageBucket: firebaseConfig.storageBucket,
        authDomain: firebaseConfig.authDomain,
        appId: firebaseConfig.appId
      })
      const messaging = m.getMessaging(app)
      await requestPermission(m, firebaseConfig, messaging)
      m.onMessage(messaging, ({ notification }) => {
        console.log('notificaation----- client', notification)
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
  console.log('permission------', permission)
  if (permission === 'granted') {
    const token = m.getToken(messaging, {
      vapidKey: firebaseConfig.vapidKey
    })
    return registerFCMTopic(token)
  } else if (permission === 'denied') {
    console.log('notifications are denied')
    return
  }
}

function registerFCMTopic (token) {
  return fetch('/register-fcm-topic', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: token })
  })
}
