const get = require("lodash/get");
const request = require("request-promise");
const userAttributes = require("../webengage-user-attributes");

exports.triggerWebengageNotifications = async function triggerWebengageNotifications(
  req,
  res,
  next,
  { apiKey, licenseCode }
) {
  const eventName = get(req, ["body", "v1", "event", "name"], "");
  const url = `https://api.webengage.com/v2/accounts/${licenseCode}/business/save-event`;

  try {
    await request({
      uri: url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: { eventName: eventName, eventData: { ...req.body, ...userAttributes } },
      json: true,
    });
    res.status(200).send("webengage event triggered successfully");
    return;
  } catch (error) {
    res.status(500).send("webengage event failed");
    return;
  }
};
