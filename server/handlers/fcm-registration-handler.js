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

  const serviceJson = {
    "type": "service_account",
    "project_id": "quintypeqa-d3e3f",
    "private_key_id": "9c3f45b63e03303855e8ac2280fffd14cbdac5d0",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCaS8CvwHwBux9f\nhvpCrZCV3jHvzkeXn3AW7riB1L+Qi4C0YPzTLQPIBIdizTyjzVCj6RJ4tTU8Va+F\nwMOHEbwbbEGKaRXOiNqn5+xW2CVYd0OlcYQs2tkplmhzOs0kCk8k0dyx38SKJPXL\nIhMv5mCS6iTzX+2M091HFb0SA25/LF/mPnpFxG420V/SPny64cXf0GZQHTEU3f1Q\nJstZHdAwEjCsL9PNPnhNqX5/hgk5MHj3Mf7qqThTCqa0eH0cgIHAG07ybUeD1V8b\nYxOFrumvF7KWRbBgqmNkimDwIpG4D1wMpwbC3BEr7aUOuxrv2qCAQ4QoFvZdBQ7R\nSh3fR7shAgMBAAECggEAAe1K2HRier6N9spSSd7N82iGmOCLfsJ3hW/L3II4y2WJ\n8PwU7Y8OZlMefOPu2zsAjsV7F7MSpBXhXD3Nq1GJQadAKR96GF3Xljkkd6quymGr\nQHplZ06Ail819M9x5FP1IaggdepjSNg153MoiG9Q+ttjT1SeEbrLygbErqrd4xxu\nANl6Y8nTXuL9pc68yvHW3b5qwW8rWwG5Os8IgJbnb4IdmRJH4htruaLeAA+XlvXQ\n1VtWxRAva0QXjJBtOOPR8B2FAxO4zAlEzml2refVlr0OWwE8a2As5wNq1aoVSwGr\n0KVjGuybTAErmpJaPhPGPbvndEhrnKFO46rSQTG/IQKBgQDGa0HFVFs4HUo7Y94l\nckshnjS9yizo9Rnj5v5gQeQ5IEVVfyjD69lbPk8NaI3utMFS8GeYKUw4nAUUc0DE\ncVQgD/tvkdbBPr0rZSEZubMO2QLLl5+HBctO/RxHFLMyQ2y3usZPXmcO1n8QNagH\nRprkcLQkBj46vwvqyMnMfZzbUQKBgQDHEoyn07htEfJ349lr/NCDd1t1sLjeGcW4\nNAu9j9u1TH1+STP16lgy0dYhgkbqvIEKrqYu5ulM/NWJ6sr3N62QELWn6ACIP5L+\nGrT/0dgfAA20eWagBXBb1De8wKcTG8OUOsXbEdDpRrp2bqno0ZsSbOgOS0BcuUaJ\nFThqS4ZO0QKBgFns5mQOdUEbVTdRba6++/oCf5i8dlomK1O0rvjlJBAX5hR3ivww\nedP2i1FiX2EeHrf+KJU3skm9vDemfGYLjrrxQ10vVYtDaeyu6q+ED/jctX2b/Drv\nj1L/N7+nTAetsyoZxiLWgBKjd/bauoqBn1WFFr907OMnDrmbwomhLGPhAoGAe0tj\nzjX1DaiF8fcunBFS23m7LaMsfHKd4L5rXxaQTzN2rhaMlgx0X9VSuCJF5fCmQ4Vz\n66ycZlBZuTewSXk0h/uxZrLsUXZ+hd7op2DCaEDSPCrMguObeWRwuPjhAZa6hT35\nePsJ1tE1f1B+73GSh9Dn0KKO1F7z7sczz7HDF2ECgYAUBolIWCksZ7BxETX/iqZG\nfx81ri1MMoXuE1Oclbe9xM/5AtoB23MZ3nZwvHQJ5RzBgo5Hd+yC94HPhrEQe/6M\nXW/7iSpoO10idGqKlHO7IdVlhx9LYbDy5wTLNERS2dqFeFZ2RXOD1//oPFsivP2i\noTVKebFru5KYFHcqCokdRw==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-lhl93@quintypeqa-d3e3f.iam.gserviceaccount.com",
    "client_id": "109643262832063811200",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-lhl93%40quintypeqa-d3e3f.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }
  
console.log("client=", client);
console.log("admin.apps.length", admin.apps.length);

  if (!admin.apps.length) { admin.initializeApp({ credential: admin.credential.cert(serviceJson), }); }

  console.log("admin-----", admin)
  try {
    const res = await admin.messaging().subscribeToTopic(token, "all");
    console.log(`Successfully subscribed to topic----: ${data}`);
    res.status(200).send(`Registration Done Successfully ${data}`);
    return;
  } catch (error) {
    console.error("Error subscribing to topic----:", error);
    res.status(500).send(`FCM Subscription Failed: ${error}`);
    return;
  }
}
