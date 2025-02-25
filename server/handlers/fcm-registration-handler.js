const { get } = require('lodash')
const request = require('request-promise')
const admin = require('firebase-admin')

exports.registerFCMTopic = async function registerFCM (
  req,
  res,
  next,
  { config, client, publisherConfig, fcmServerKey, fcmServiceAccountJson }
) {
  const token = get(req, ['body', 'token'], null)
  if (!token) {
    res.status(400).send('No Token Found')
    return
  }

  const serviceAccount = await fcmServiceAccountJson
    .then(serviceAccount => {
      console.log('service account----fdsdf', serviceAccount)
      return serviceAccount
    })
    .catch(error => {
      res.status(400).send(`No Service Account Json: ${error}`)
      return
    })

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })

  console.log('admin------', admin)
  const oauthToken = await admin.credential
    .cert(serviceAccount)
    .getAccessToken()
    .then(tokenObj => {
      console.log('OAuth2 Access Token:', tokenObj)
      if (tokenObj?.access_token) {
        return tokenObj.access_token
      }
    })
    .catch(error => res.status(400).send(`Oauth Token is not available: ${error}`))

  const url = `https://iid.googleapis.com/iid/v1/${token}/rel/topics/all`
  await request({
    uri: url,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${oauthToken}`,
      'content-type': 'application/json'
    }
  })
    .then(() => res.status(200).send('Registration Done Successfully'))
    .catch(error => res.status(500).send(`FCM Subscription Failed: ${error}`))
}
