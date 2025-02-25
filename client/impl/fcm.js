export function initializeFCM (firebaseConfig, config) {
  console.log('opts--------', firebaseConfig)
  Promise.all([
    import(/* webpackChunkName: "firebase-app" */ 'firebase/app'),
    import(/* webpackChunkName: "firebase-messaging" */ 'firebase/messaging'),
    import(/* webpackChunkName: "firebase-auth" */ 'firebase/auth')
  ])
    .then(async ([firebase, m, a]) => {
      const app = firebase.initializeApp({
        messagingSenderId: firebaseConfig.messagingSenderId.toString(),
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey,
        storageBucket: firebaseConfig.storageBucket,
        authDomain: firebaseConfig.authDomain,
        appId: firebaseConfig.appId
      })
      const messaging = m.getMessaging(app)
      const token = firebaseConfig?.vapidKey
      ? await m.getToken(messaging, {
          vapidKey: firebaseConfig.vapidKey
        })
      : await m.getToken(messaging)
      console.log("final token----", token);
      const auth = a.getAuth() // Ensure Firebase is initialized
      console.log("auth------", auth);
      const user = auth.currentUser
      console.log("user-------", user);
      if (!user) {
        console.error('User not signed in')
        return
      }
      const oauthToken = await user.getIdToken()
      console.log("final oauthToken----", oauthToken);
      return { token: token, oauthToken: oauthToken }
      // No need to refresh token https://github.com/firebase/firebase-js-sdk/issues/4132
    })
    .then(({token, oauthToken}) => {
      return registerFCMTopic(config, firebaseConfig?.serverKey, token, oauthToken)
    })
    .catch(err => {
      console.error(err)
    })
}

async function registerFCMTopic (config, fcmServerKey, token, oauthToken) {
  if (!token) {
    console.error('No Token Found')
    return
  }

  const serverKey = typeof fcmServerKey === 'function' ? await fcmServerKey(config) : fcmServerKey
  console.log('serverKey-------', serverKey)
  const url = `https://iid.googleapis.com/iid/v1/${token}/rel/topics/all`
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        'content-type': 'application/json'
      }
    })
    console.log('Registration Done Successfully')
    return
  } catch (error) {
    console.error('FCM Subscription Failed', error)
    return
  }
}
