const { AmpConfig } = require("../../impl/api-client-impl");
const InfiniteScrollAmp = require("../helpers/infinite-scroll");
const { setCorsHeaders } = require("../helpers");

// eslint-disable-next-line consistent-return
async function storyPageInfiniteScrollHandler(req, res, next, { client, config }) {
  const ampConfig = await config.memoizeAsync("amp-config", async () => await AmpConfig.getAmpConfig(client));

  const infiniteScrollAmp = new InfiniteScrollAmp({
    ampConfig,
    publisherConfig: config,
    client,
    queryParams: req.query,
  });
  const jsonResponse = await infiniteScrollAmp.getResponse({ itemsTaken: 5 }); // itemsTaken has to match with itemsToTake in ampStoryPageHandler
  if (jsonResponse instanceof Error) return next(jsonResponse);
  res.set("Content-Type", "application/json; charset=utf-8");
  setCorsHeaders({ req, res, next, publisherConfig: config });

  if (!res.headersSent) return res.send(jsonResponse);
}

module.exports = { storyPageInfiniteScrollHandler };
