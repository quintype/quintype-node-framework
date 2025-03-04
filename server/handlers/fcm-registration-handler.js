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
    "private_key_id": "4ea922d1ecf4ff6cbf08cd2b0ff0208ed79bae4d",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6yNeTiXFdRXBd\nXV7FDolHJFVM08l8xceihVuP4sZ07LR9FJwuLG5YCr5x1DfICf3Ezj3OPBJgo50f\n6amclTX/O9B/PZcs/cKRNrHjLzU1EL+zSdJfssjHhRLh3ExvWMbqEvVyXMoVmRUJ\nPMeBo9i0x4T8VrHuqYzLzq+PboUj+o0TIZjCVRgvuh/Ge7apmRjR7shaHFy9vkPC\nrDa3Xfnl8vWhr8T2B2/pEUmMwYrgWZpHQmGnMyIwjVyauucFHTtmhzsvXrdXio5v\nqgoEimtF4+IMuTZL8VFIivi34Cghe9k6Ki14PbGJBYwsolpbQ8Jo8+VS+SHWx6Pb\ngs3hbmTfAgMBAAECggEAAt2IFZ2w6wPPuE1X4fARcvwbZ0jhYbQgfJTvNXuPvtIK\n53D6/7TeLwJxUUYuDQTYWjE+1BQQ1htJPVe4zNAIxUHA0Fv0Jz7nUvhcZRuSyZ3H\nQolYAr03nklFn3ML4HabFT1xSCVYDtFcqya1cTIMbm+pQLO8Kvnxe49P+QRY/FLZ\nwX9gpF+tlqZrf+clGer43Vwxr78Z8K5akXEVuJ8IIisr+tg5iK3zmG6eeI0Yrr9K\nw4HRDrymKFKSg7bjPKRHvJDnfZJ9HTGf1tjlJWGzaNMK7rZgJRFABSvOT5/1/cmH\n674D4wYuA6BB1ZdfMqyZwCliRlUCdmav/3JKrICVIQKBgQD+5O2Kx/hhWD3R/j16\nAOc44hpxRRbP3HdmuXybIpNFiGHMSKWpSPnaEjmQQOqlemaicbrgT0J/k8/qQ3HU\nEkoyTY2CqIwgmKTVWcrL9RiWQm5uTOgFCWpRBg7jC4GnQFxomoWp7FkFiFxeoRX1\niwWQg317KXqNPvbMT8H6GkEZIQKBgQC7mEZwAd5kRh8lcUQVf1Cvg6nFQpqqxRt+\nzBPR15GVt0xscIYlQfMPEwr2utwFyPUAnFXNIl80+5mx9dQDsm6DA0UyXcOWANIX\nP2TeBuk3Cn2I9pQKVRvAp8VwzH57NK3p7ehkSNB4Phx4FLnzUe/HSE1vVegRZzO3\nZwvWTOm9/wKBgHqgVitjIvpqAmvJXXgZgSPbmw8NRvk/Pm48JFdaHfHgt/QYqyIz\nCojAJdNhd8GejkvuXRJW704DJY61XcjB99IVf1PxlGCGLx65MRhIVMjNMuV7uE/c\nBLrwKC9QtNJq40ortMxX+UfxH0cjRjY36Lhqme6ruNrFBOSsJk0VXmYhAoGBAK9s\nfWnehX3ViOi1m4pSzTvj7o01dHb+7XBMHLidUlnj18aMDxWmL0nIb/c70+Zg/qM8\njovOeaONKDOfg0yVvfwrwbiQsAaE6/GraYKqicnbuHqswtFKtzIYcWzC/f/uyjc4\nL5of8TqQMoUkNKNR2tzLQwY7GlGz5Uu7Q/l5YRc3AoGAHLo8Nl36+FbCan+mK//f\nSjkcaDxyq3ouiENsVtJDHsB7NpsZD6JZ1kRTIzlt6Sx0Pd91dQDr0D/AVEHjevka\ns8FnLu5o9gSAGX0MVi+u+Ti3K4fb2TDaJMIH3B4SGx4NdNsSlw+kqklfZb3zDyPh\n0gDMhA+h+QJSyy2a1ggfpjQ=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@quintypeqa-d3e3f.iam.gserviceaccount.com",
    "client_id": "104205441223663960831",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40quintypeqa-d3e3f.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }

  console.log("client=", client);
  console.log("admin.apps.length", admin.apps.length);

  if (!admin.apps.length) { admin.initializeApp({ credential: admin.credential.cert(serviceJson), }); }

  console.log("admin-----", admin)
  try {
    const data = await admin.messaging().subscribeToTopic(token, "all");
    console.log(`Successfully subscribed to topic----: ${data}`);
    res.status(200).send(`Registration Done Successfully ${data}`);
    return;
  } catch (error) {
    console.error("Error subscribing to topic----:", error);
    res.status(500).send(`FCM Subscription Failed: ${error}`);
    return;
  }
}
