const { get } = require('lodash')
const request = require('request-promise')
const { initializeApp } = require('firebase/app')
const { getMessaging } = require('firebase/messaging')

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

  const firebaseConfig = {
    apiKey: 'AIzaSyDh-FPToRoj1b_XvL6hWnZ84jlb_AaWG1U',
    authDomain: 'quintypeqa-d3e3f.firebaseapp.com',
    projectId: 'quintypeqa-d3e3f',
    storageBucket: 'quintypeqa-d3e3f.firebasestorage.app',
    messagingSenderId: '919899876354',
    appId: '1:919899876354:web:2ac17705ee7fc8364f4b1b',
    measurementId: 'G-V72DFHSJVX'
  }
  const app = initializeApp(firebaseConfig)
  console.log('initialze app')
  getMessaging().subscribeToTopic(token, "all")
  .then((response) => {
    console.log("successfully subscribe topic", response)
  })
  .catch((error) => {
    console.log('Error subscribing to topic:', error);
  });
}
