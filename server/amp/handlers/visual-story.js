/* eslint-disable global-require */
const { Story } = require("../../impl/api-client-impl");
const { ampStoryPageHandler } = require("./story-page");

async function visualStoryHandler(req, res, next, { client, ...rest }) {
  const story = await Story.getStoryBySlug(client, req.params.storySlug);
  if (!story || story["story-template"] !== "visual-story") return next();
  return ampStoryPageHandler(req, res, next, {
    client,
    ...rest,
  });
}

module.exports = { visualStoryHandler };
