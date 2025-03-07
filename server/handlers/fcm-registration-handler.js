const { get } = require('lodash')
const admin = require('firebase-admin')
const logger = require('../logger')

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
    await admin.messaging().subscribeToTopic(token, 'all')
    res.status(200).send('Topic Registered Successfully')
    logger.info("Topic Registered Successfully")
    return
  } catch (error) {
    res.status(500).send(`FCM Subscription Failed: ${error}`)
    logger.error({
      level: 'error',
      logged_data: {
        request: {
          host: '',
          path: '/register-fcm-topic',
          time: Date.now(),
          method: 'post'
        },
        response: {
          statusCode: 500,
          message: error
        }
      },
      message: `PATH => /register-fcm-topic`
    })
    return
  }
}
