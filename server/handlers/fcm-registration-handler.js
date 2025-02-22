const { get } = require("lodash");
const request = require("request-promise");
const admin = require("firebase-admin/app");

exports.registerFCMTopic = async function registerFCM(
  req,
  res,
  next,
  { config, client, publisherConfig, fcmServerKey }
) {
  console.log("register fcm token initial-------");
  const token = get(req, ["body", "token"], null);
  if (!token) {
    res.status(400).send("No Token Found");
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (err) {
    console.log("server fcm app initialization error", err);
  }

  console.log("admin--------", admin);
  async function getOAuthToken() {
    console.log("coming under getoauthtoken-----");
    try {
      const accessToken = await admin.credential.applicationDefault().getAccessToken();
      console.log("OAuth2 Token:", accessToken.access_token);
      return accessToken.access_token;
    } catch (error) {
      console.log("Error fetching OAuth2 token:", error);
    }
  }

  // const serverKey = typeof fcmServerKey === "function" ? await fcmServerKey(config) : fcmServerKey;
  const oauthToken = getOAuthToken();
  console.log("oauthToken==========", oauthToken);
  if (!oauthToken) {
    res.status(500).send("oauth token is not available");
    return;
  }

  const url = `https://iid.googleapis.com/iid/v1/${token}/rel/topics/all`;
  try {
    await request({
      uri: url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        access_token_auth: true,
      },
    });
    res.status(200).send("Registration Done Successfully");
    return;
  } catch (error) {
    console.log("fcm registration error:", error);
    res.status(500).send("FCM Subscription Failed");
    return;
  }
};
