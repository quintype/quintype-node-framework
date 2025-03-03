const { get } = require('lodash')
const request = require('request-promise')
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

  const fcmServiceAccountJson = {
    type: 'service_account',
    project_id: 'quintypeqa-d3e3f',
    private_key_id: 'a1473bd141e2db350a48dbd3a53811ec165ef117',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCzSqFIBu5ZVRnc\nRS8oBvPEDe75W80LMPsWAc+KhnSMdZr8Hwv3V2TlRECz1ty+NuiOsXoIZvTk+K6h\ntgBJnKXFFcah6O3huuUqnORZVxK4vjCyW7YP3dULsny4Xk22XruV9ktcfpfN5ruI\nyZfo7V0P0NZwr++tKTHhO/XL8io3qsUWbPwSIE5Z+8aQQIrRLr0j/zo5lKuwQDPN\nAA9BvxTSG1iPDg8r08/R5oteGjXbE5I5hfFsNImJFsGQaO4Q39EpSZxFmNlTdd3t\n+aO4J4EJFWe7W54uO+0d0xm4M7/xkIXgWnxlK2Qb0KUff7psF9ybA9a9AiXQlgKh\nE+2EZQvTAgMBAAECggEAPavrJEp2DDZwqcsGeH9DtGmSjSWdtz7G73/58s1jI7mE\ncTsAs7jVFOPQWcwLrEZY4lR8BI3dqTE9aJShLrD6eHuQErt7sAzIrUrAZVbFMtUB\nDSjszDJjCR4BNq4Bjzywy9mnfI5zCzlVwqyNW2riewE78hEioW6tIKuuVdPb37+B\n+uSprLdh/rtlC3xHJoPCIlOy6J5JbQRQwb3A88ZRgmJmPGG/CsRpz+CVU1Bsfnp+\nk2N8enhMo2NaYWq8oHjY3IdTPXWpzEIMnlsICmLAi5RbzwqSDgyUHey+gAAPVpIg\nb1qjlG8ywv0l00lCgxEspRLGI/+yiu4J5+N8CrLVcQKBgQC4lWf1BVMSvbBIc9j1\n3qJRagjq80GAjVYxnN3g36W46MDU3kPKKw2UtFmlJkcJi2DGdJBthmBVRsrPy4X0\n8dbHpISjXb4KAruhjgaAuWDk2ii9v86Nc3g6hW0tJC9dHbE9u5G0oYQsQ95a1BwY\nRU/rlvZjzLTnBBrSnzCiZ5SF6QKBgQD4qQ3JuQ+0B29edoLrh02DG4v65T1UjG0j\nxG08qcOg+KDnV7aYk/GjfF5+/hUEjgg0U3oiCv/4HulGK4hobl0LrvGasriC9T6j\nQZlUD2F5QnVAHeMzOOaJQ8wFk2it1rS4G+/kMvTkNxyDo0Lz8hHWtlxh89un26hd\nJgqKcXyiWwKBgCl4R7bgz10yiNx+SoxSzJ0F+aLvrBO5rVfQKnlPRehZQpmQpiJR\nsedq7YkRJHycd82eeqRgwFvoX8B3tUzm2J5Z9ALQGNYe7xDI2+UnwQEpkmWvJjTZ\ncHWVbIXrz0hYV23LKl0uvIdFaDt31CgPynjfndOmNi6A2ZXgdgjGxLOhAoGAIGcH\nIO44maEOZiTTUpXDB/6i8wLERyw1XJ/QDEOi9mrvrLXFWYSNzFv8hFffrURE1Wy7\nUYxVZqPAiiBKGjGndkpJuXroiEgk7Wky7b1DWmXKmZxLavVTNTfcci2PSnfb/NHH\nJNlvB/4WfSDdLKSypmQFDc6VJP5+pgS7Aude8lkCgYBM/EU9353WcWTjqMfcNDm7\nbsyDPyWibzRR29WxZWJQ9aLiVYyXTA1/dVvSkf5AluGXuMzvBuvvT0p4kj8taKI2\ny8jPHgbeWxh/cu2bg/mBxPoRTREVB7qSpJDrn/aNkL4aSXxvKI5R4ZDGppBAJMte\nkl1I6HpeDAeOTEKTdWcBvg==\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-lhl93@quintypeqa-d3e3f.iam.gserviceaccount.com',
    client_id: '109643262832063811200',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-lhl93%40quintypeqa-d3e3f.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com'
  }

  admin.initializeApp({
    credential: admin.credential.cert(fcmServiceAccountJson)
  })

  console.log('admin------', admin)
  const oauthToken = await admin.credential
    .cert(serviceAccount)
    .getAccessToken()
    .then(tokenObj => {
      console.log('OAuth2 Access Token:', tokenObj)
      if (tokenObj && tokenObj.access_token) {
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
      'content-type': 'application/json',
      access_token_auth: true
    }
  })
    .then(() => res.status(200).send('Registration Done Successfully'))
    .catch(error => res.status(500).send(`FCM Subscription Failed: ${error}`))
}
