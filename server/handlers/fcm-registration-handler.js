const { get } = require('lodash')
const admin = require('firebase-admin')

exports.registerFCMTopic = async function registerFCM (
  req,
  res,
  next,
  { config, client, publisherConfig, fcmServiceCreds }
) {
  console.log('fcm server')
  const token = get(req, ['body', 'token'], null)
  if (!token) {
    res.status(400).send('No Token Found')
    return
  }

  const serviceAccount = typeof fcmServiceCreds === 'function' ? await fcmServiceCreds(config) : fcmServiceCreds

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }

  try {
    const data = await admin.messaging().subscribeToTopic(token, 'all')
    res.status(200).send(`Registration Done Successfully ${data}`)
    return
  } catch (error) {
    res.status(500).send(`FCM Subscription Failed: ${error}`)
    return
  }
}
