const { get } = require('lodash')
const admin = require('firebase-admin')

exports.registerFCMTopic = async function registerFCM (
  req,
  res,
  next,
  { config, client, publisherConfig, fcmServerKey }
) {
  console.log('fcm server')
  const token = get(req, ['body', 'token'], null)
  if (!token) {
    res.status(400).send('No Token Found')
    return
  }

  const serviceAccount = typeof fcmServerKey === 'function' ? await fcmServerKey(config) : fcmServerKey
  console.log('fcmServerKey=====', serviceAccount)
  console.log('client=', client)
  console.log('admin.apps.length', admin.apps.length)

  console.log('client=', client)
  console.log('admin.apps.length', admin.apps.length)

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }

  console.log('admin-----', admin)
  try {
    const data = await admin.messaging().subscribeToTopic(token, 'all')
    console.log(`Successfully subscribed to topic----: ${data}`)
    res.status(200).send(`Registration Done Successfully ${data}`)
    return
  } catch (error) {
    console.error('Error subscribing to topic----:', error)
    res.status(500).send(`FCM Subscription Failed: ${error}`)
    return
  }
}
