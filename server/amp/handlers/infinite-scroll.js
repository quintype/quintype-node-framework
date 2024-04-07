const { AmpConfig } = require("../../impl/api-client-impl");
const InfiniteScrollAmp = require("../helpers/infinite-scroll");
const { setCorsHeaders } = require("../helpers");
const get = require("lodash/get");
const cloneDeep = require("lodash/cloneDeep");

// eslint-disable-next-line consistent-return
async function storyPageInfiniteScrollHandler(req, res, next, { client, config, ...rest }) {
  const ampConfig = await config.memoizeAsync("amp-config", async () => await AmpConfig.getAmpConfig(client));
  const opts = cloneDeep(rest);
  const infiniteScrollSource = get(opts, ["featureConfig", "infiniteScroll", "source"], "collection");

  const infiniteScrollAmp = new InfiniteScrollAmp({
    opts,
    config,
    ampConfig,
    publisherConfig: config,
    client,
    queryParams: req.query,
    infiniteScrollSource,
  });
  const jsonResponse = await infiniteScrollAmp.getResponse();
  if (jsonResponse instanceof Error) return handleErrorResponse(res, next, jsonResponse);
  res.set("Content-Type", "application/json; charset=utf-8");
  setCorsHeaders({ req, res, next, publisherConfig: config });

  if (!res.headersSent) return res.send(jsonResponse);
}

function handleErrorResponse(res, next, error) {
  const errorMessage = error.message;
  if (errorMessage === `Query param "story-id" missing`) {
    return res.status(400).send(errorMessage);
  }
  return next(errorMessage);
}

module.exports = { storyPageInfiniteScrollHandler };
