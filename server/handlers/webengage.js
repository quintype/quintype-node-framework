const request = require("request-promise");

exports.webengageApi = async function webengageApi(req, res) {
  const webengageLicenseCode = "311c5229";
  const webengageApiKey = "2d5cb58e-7160-4f2a-b423-0c0d8007dd9c";
  let eventData = {};
  const eventName = req.body.v1.event.name;

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

  console.log("hit /webengage-api by syncing ---->", eventName, eventData);
  const url = `https://api.webengage.com/v1/accounts/${webengageLicenseCode}/events`;
  try {
    await request({
      uri: url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${webengageApiKey}`,
        "content-type": "application/json",
      },
      body: { eventName: eventName, eventData: { eventData }, userId: eventName },
      json: true,
    });
    res.status(200).send("webengage event triggered successfully");
    return;
  } catch (error) {
    res.status(500).send("webengage event failed");
    return;
  }
};
