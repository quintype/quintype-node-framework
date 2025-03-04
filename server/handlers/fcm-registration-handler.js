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
    "private_key_id": "29bc24fc9fc68a7f6f4a721bcee23c8b7b484611",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCorIJj5JyGokHU\n17cOTsDCqwhjA/mfSDrvhcd784bxXxO1jBsuRzSYsXdZ60qHWHKdiAVw4p8ZyIme\n9eK0tB2xR9vGCTISwlhtn1V+NcAcMGExDKwOHcixFm4UoV4ztHJ/Fv8dxspgfmsK\nNKixroNQbVbcQFoh6aPiErPc//CG1B8KfRR4in+yN+mlYrzb1KGOeRo+Rck6YPoO\nZjDBqUxf+UibKv305LdGQh5H54CV676DWPLKPImJUdIQLga+y0WCAcYv3tN8b5CN\ncp+1CnAOxSQPXU8sRj1J/49UtilBFyY1ijUS61zt9Xxz6ZU/wnj3ujgzkh6KwT6/\nAt61TtUjAgMBAAECggEAL6etnzNz1cX5+3yGx5AQfe98ix0QZaQuooWVeruvIHrQ\nQra25zhO7+UT51/Gyr5+g2tuvhoJAWvbFgI6bvuEeBXpTeZDM3GdMjuWF/ZvtIcm\nroj6A3L+xKmlqEZ/KvSMdMO2iF8lxmVxMIz4LFs11n9NzySPUo2EM9c84e+dsTm+\nyiektbngdNd0LgzChpsF9yRNV44XxkA5cifIWw7eobR7o8RohhhUtogWUxTAkiC1\nwyox5o+fkcnYzjvAwHr61TWSdjaDEwKEBEglRXTixdejM7SRs2K5ZyAYpp047ACz\ncwG6MQrhkkLQp+PV+cemaMeKjqCMmuC9youYFHDv4QKBgQC3pRxWiqRFexcPl73r\nBM7ZzTxaDQvgQrYIL7DQJjDh/uk9jyWj9Y/97wPMy9pyw4qYAdp05ZqC8IswczY1\n/BJii2GofkgG2XmUyOF7eMo5qzD8dJDFQ/rm8YoXpQFdWTO+LYCOwRfJy4Elzscd\nr5wLP206Qla/FiEz/ihe7SYIBwKBgQDrIWBQr5eAFNdlAqAcZdmj42IvPmVxc6iE\nARceiR7M7A17CHsWtrSjA47iObMUeUSPXPBm/Ks7ZGJGXHn1bHPSbM2wzdXwLPn6\nkVqJFjo8i5XMo7S9Hnxhb5w9BvME9kzSjM4gZDpK5HQwAXwWl/sRaZOt1TSUxq1O\nO8YqnSyrBQKBgBfLwTxFgruuE3LlyqolWVhHi8ZvYlaQzl2JMHQIPtVJ3pcncU0p\niJry2Z8z2v577/16YAA9sCO/X4nLo/6ixw8V2HWox1R74ZEx5mXFZQ7L6/EKeafW\nAzDho28k5mReJqJB6yKUSqzPPdDUVmC2XJXohhLCfdMM3wiJqlmCiScJAoGBAOGZ\nBHBmCVY6qO+htT2J+2fjozDxDSPtdKIy6ZvCtGqpkcWaPX9tjaNapp0n/0qFj+J9\nqasmgqRZjHE2CU4Q4I/lFPWuiLYIcVCYZeViDj5JL1FJQQCzX2OdUqq7IDCCoPLj\nZmJtyABTcacdxZFoANyUD72Z8vlMJrwJXflFFLaBAoGBAJGsQd/g8LAG7NRMYpDd\nXrAn4+bjFsQ0PkFxt5o2hgMmL/RrKZtMNEtoNEqR8TeUQo+DWPJiu0Hiy9hEAGvz\nh5DaEffOUIqKDu1wPpSLsPnsD5UOmZ/LC/9uMRK7+UHg9ZzZnRe59Wug67qkvMhx\nwVjjAg9e4wxdD6pwd+RBgcSi\n-----END PRIVATE KEY-----\n",
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
