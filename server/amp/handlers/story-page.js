const urlLib = require("url");
const set = require("lodash/set");
const get = require("lodash/get");
const isEmpty = require("lodash/isEmpty");
const cloneDeep = require("lodash/cloneDeep");
const merge = require("lodash/merge");
const { Story, AmpConfig } = require("../../impl/api-client-impl");
const { optimize, getDomainSpecificOpts } = require("../helpers");
const { storyToCacheKey } = require("../../caching");
const { addCacheHeadersToResult } = require("../../handlers/cdn-caching");
const { getRedirectUrl } = require("../../../server/redirect-url-helper");

/**
 * ampStoryPageHandler gets all the things needed and calls "ampifyStory" function (which comes from ampLib)
 * From ampifyStory's perspective,
 *  - ampConfig is /api/v1/amp/config
 *  - publisherConfig is /api/v1/config
 *  - additionalConfig is an obj containing any extra config. If the publisher passes an async function "opts.getAdditionalConfig", its returnd value is merged into additionalConfig. Use case - Ahead can use this to fetch the pagebuilder config
 *  - to set timezone in structured data on amp pages, set it in blacknight  Ex: publisher.yml-> publisher->timezone:“Asia/Kolkata”
 *
 * @category AmpHandler
 */

async function ampStoryPageHandler(
  req,
  res,
  next,
  {
    client,
    config,
    domainSlug,
    seo = "",
    cdnProvider = null,
    ampLibrary = require("@quintype/amp"),
    additionalConfig = require("../../publisher-config"),
    InfiniteScrollAmp = require("../helpers/infinite-scroll"),
    isVisualStory = false,
    ...rest
  }
) {
  try {
    const opts = cloneDeep(rest);
    const redirectUrls = opts && opts.redirectUrls;
    const getEnableAmp = get(opts, ["enableAmp"], true);
    const enableAmp = typeof getEnableAmp === "function" ? opts.enableAmp(config) : getEnableAmp;

    if (typeof redirectUrls === "function" || (redirectUrls && Object.keys(redirectUrls).length > 0)) {
      await getRedirectUrl(req, res, next, { redirectUrls, config });
    }
    const story = await Story.getStoryBySlug(client, req.params["0"]);
    const isAmpDisabled = get(story, ["metadata", "story-attributes", "disable-amp-for-single-story", "0"], "false");

    if ((!isVisualStory && !enableAmp) || isAmpDisabled === "true") {
      return res.redirect(301, `/${req.params[0]}`);
    }

    const domainSpecificOpts = getDomainSpecificOpts(opts, domainSlug);
    const url = urlLib.parse(req.url, true);
    const { ampifyStory, unsupportedStoryElementsPresent } = ampLibrary;
    // eslint-disable-next-line no-return-await
    const ampConfig = await config.memoizeAsync("amp-config", async () => await AmpConfig.getAmpConfig(client));
    let relatedStoriesCollection;
    let relatedStories = [];

    if (!story) return next();
    if (ampConfig["related-collection-id"])
      relatedStoriesCollection = await client.getCollectionBySlug(ampConfig["related-collection-id"]);
    if (relatedStoriesCollection && relatedStoriesCollection.items) {
      const storiesToTake = get(domainSpecificOpts, ["featureConfig", "relatedStories", "storiesToTake"], 5);
      relatedStories = relatedStoriesCollection.items
        .filter((item) => item.type === "story" && item.id !== story["story-content-id"])
        .slice(0, storiesToTake)
        .map((item) => item.story);
    }
    if (relatedStories.length) {
      set(domainSpecificOpts, ["featureConfig", "relatedStories", "stories"], relatedStories);
    }

    if (
      unsupportedStoryElementsPresent(story) &&
      ampConfig.ampConfig["invalid-elements-strategy"] === "redirect-to-web-version"
    )
      return res.redirect(story.url);

    const timezone = get(additionalConfig, ["publisher", "timezone"], null);
    const seoInstance = typeof seo === "function" ? seo(config, "story-page-amp") : seo;
    const seoTags =
      seoInstance && seoInstance.getMetaTags(config, "story-page-amp", { data: { story, timezone }, config }, { url });

    const infiniteScrollConfig = get(opts, ["featureConfig", "infiniteScroll"], "");
    const infiniteScrollSource = get(infiniteScrollConfig, ["source"], "collection");
    const inlineConfig = get(infiniteScrollConfig, ["inlineConfig"], "");
    const remoteConfigEndpoint = get(infiniteScrollConfig, ["remoteConfigEndpoint"], "");

    let infiniteScrollInlineConfig = [];

    if (infiniteScrollSource === "custom") {
      if (!inlineConfig || !remoteConfigEndpoint)
        throw new Error("Required params of 'custom' source (inlineConfig /remoteConfigEndpoint) is missing!!");
      infiniteScrollInlineConfig = await inlineConfig();
    } else {
      const infiniteScrollAmp = new InfiniteScrollAmp({
        opts,
        config,
        ampConfig,
        publisherConfig: config,
        client,
        infiniteScrollSource,
      });
      infiniteScrollInlineConfig = await infiniteScrollAmp.getInitialInlineConfig({
        storyId: story["story-content-id"],
      });
    }
    if (infiniteScrollInlineConfig instanceof Error) return next(infiniteScrollInlineConfig);
    if (infiniteScrollInlineConfig) {
      set(
        domainSpecificOpts,
        ["featureConfig", "infiniteScroll", "infiniteScrollInlineConfig"],
        infiniteScrollInlineConfig
      );
    }
    const mergedAdditionalConfig = {};
    if (opts.getAdditionalConfig && opts.getAdditionalConfig instanceof Function) {
      const fetchedAdditionalConfig = await opts.getAdditionalConfig({
        story,
        apiConfig: config.config,
        ampApiConfig: ampConfig.ampConfig,
        publisherConfig: additionalConfig,
      });
      merge(mergedAdditionalConfig, additionalConfig, fetchedAdditionalConfig);
    }

    const ampHtml = ampifyStory({
      story,
      publisherConfig: config.config,
      ampConfig: ampConfig.ampConfig,
      additionalConfig: isEmpty(mergedAdditionalConfig) ? additionalConfig : mergedAdditionalConfig,
      opts: { ...domainSpecificOpts, domainSlug },
      seo: seoTags ? seoTags.toString() : "",
    });
    if (ampHtml instanceof Error) return next(ampHtml);

    res.set("Content-Type", "text/html");
    addCacheHeadersToResult({
      res,
      cacheKeys: storyToCacheKey(config["publisher-id"], story),
      cdnProvider,
      config,
    });

    const optimizeAmpHtml = get(domainSpecificOpts, ["featureConfig", "optimizeAmpHtml"], true);
    const finalResponse = optimizeAmpHtml ? await optimize(ampHtml) : ampHtml;

    return res.send(finalResponse);
  } catch (e) {
    return next(e);
  }
}

module.exports = { ampStoryPageHandler };
