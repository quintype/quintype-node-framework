const { get } = require("lodash");
const request = require("request-promise");

exports.registerFCMTopic = async function registerFCM(
  req,
  res,
  next,
  { config, client, publisherConfig, fcmServerKey }
) {
  const token = get(req, ["body", "token"], null);
  if (!token) {
    res.status(400).send("No Token Found");
    return;
  }

  const serverKey = typeof fcmServerKey === "function" ? await fcmServerKey(config) : fcmServerKey;

  if (!serverKey) {
    res.status(500).send("Server Key is not available");
    return;
  }
  const url = `https://iid.googleapis.com/iid/v1/${token}/rel/topics/all`;
  try {
    await request({
      uri: url,
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "content-type": "application/json",
      },
    });
    res.status(200).send("Registration Done Suceessfuly");
    return;
  } catch (error) {
    res.status(500).send("FCM Subscription Failed");
    return;
  }
};
