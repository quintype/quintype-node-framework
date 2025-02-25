const { get } = require('lodash')
const request = require('request-promise')
const admin = require('firebase-admin')

async function getServiceAccount () {
  console.log('getserviceaccount----------')
  const response = await request({
    uri: 'https://github.com/ReenaSingh07/fcm-service-account/blob/main/pbahead.json'
  })
  const serviceAccount = await response.json()
  return serviceAccount
}

exports.registerFCMTopic = async function registerFCM (
  req,
  res,
  next,
  { config, client, publisherConfig, fcmServerKey }
) {
  const token = get(req, ['body', 'token'], null)
  if (!token) {
    res.status(400).send('No Token Found')
    return
  }
  
  const serviceAccount = await getServiceAccount()
  console.log('service account----', serviceAccount)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
  console.log('admin------', admin)
  async function generateAccessToken () {
    const token = await admin.credential.cert(serviceAccount).getAccessToken()
    console.log('OAuth2 Access Token:', token)
    return token
  }

  const oauthToken = generateAccessToken()

  if (!oauthToken) {
    res.status(500).send('Oauth Token is not available')
    return
  }

  const url = `https://iid.googleapis.com/iid/v1/${token}/rel/topics/all`
  try {
    await request({
      uri: url,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        'content-type': 'application/json'
      }
    })
    res.status(200).send('Registration Done Suceessfuly')
    return
  } catch (error) {
    res.status(500).send('FCM Subscription Failed', error)
    return
  }
}
