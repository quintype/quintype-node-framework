const get = require("lodash/get");
const request = require("request-promise");

exports.webengageApi = async function webengageApi(req, res, next, { webengageApiKey, webengageLicenseCode }) {
  const eventName = get(req, ["body", "v1", "event", "name"], "");
  let eventData = {};

  switch (eventName) {
    case "story-publish":
      const { "author-name": author, headline } = req.body;
      eventData = { author, headline };
      break;
    case "push-notification-triggered":
      const { title, message } = req.body;
      eventData = { title, message };
      break;
    default:
      break;
  }
  const url = `https://api.webengage.com/v2/accounts/${webengageLicenseCode}/business/save-event`;
  try {
    await request({
      uri: url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${webengageApiKey}`,
        "content-type": "application/json",
      },
      body: { eventName: eventName, eventData: { eventData, user_type: "malibu_user" } },
      json: true,
    });
    res.status(200).send("webengage event triggered successfully");
    return;
  } catch (error) {
    res.status(500).send("webengage event failed");
    return;
  }
};
