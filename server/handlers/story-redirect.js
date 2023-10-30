const { Story } = require("../impl/api-client-impl");
const { addCacheHeadersToResult } = require("./cdn-caching");
const { storyToCacheKey } = require("../caching");

exports.redirectStory = function redirectStory(
  req,
  res,
  next,
  { logError, config, client, cdnProvider = null, sMaxAge, maxAge }
) {
  const storySlug = req.params.storySlug.toLowerCase() || "";
  return Story.getStoryBySlug(client, storySlug)
    .then((story) => {
      if (story) {
        addCacheHeadersToResult({
          res: res,
          cacheKeys: [storyToCacheKey(config["publisher-id"], story)],
          cdnProvider: cdnProvider,
          config: config,
          sMaxAge,
          maxAge,
        });
        return res.redirect(301, `/${story.slug}`);
      } else {
        return next();
      }
    })
    .catch((e) => next());
};
