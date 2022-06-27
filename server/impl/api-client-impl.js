const {
  Client,
  Story,
  Author,
  CustomPath,
  Member,
  Collection,
  Entity,
  MenuGroups,
  Config,
  AmpConfig,
} = require("@quintype/backend");
const {
  storyToCacheKey,
  collectionToCacheKey,
  authorToCacheKey,
  sorterToCacheKey,
  customUrlToCacheKey,
} = require("../caching");
const _ = require("lodash");

function getClientImpl(config, cachedSecondaryClients, hostname) {
  return cachedSecondaryClients[hostname] || createTemporaryClient(config, hostname);
}

function createTemporaryClient(config, hostname) {
  const configuredHosts = config.host_to_api_host || {};
  if (configuredHosts[hostname]) {
    return new Client(configuredHosts[hostname], true);
  }

  const matchedMadridUrl = (config.wildcard_to_api_host || []).find((str) => hostname.includes(str));

  if (matchedMadridUrl) return new Client(`http://${hostname.replace(matchedMadridUrl, ".internal")}`, true);

  const matchedString = (config.host_to_automatic_api_host || []).find((str) => hostname.includes(str));

  if (matchedString) return new Client(`https://${hostname.replace(matchedString, "")}`, true);
}

function itemToCacheKey(publisherId, item, depth) {
  switch (item.type) {
    case "story":
      return [storyToCacheKey(publisherId, item.story)];
    case "collection":
      return Collection.build(item).cacheKeys(publisherId, depth);
    default:
      return [];
  }
}

function getItemCacheKeys(publisherId, items, depth) {
  const storyCacheKeys = [];
  const collectionCacheKeys = [];
  items.map((item) => {
    switch (item.type) {
      case "story":
        storyCacheKeys.push(storyToCacheKey(publisherId, item.story));
        break;
      case "collection":
        const collectionKeys = Collection.build(item).getCollectionCacheKeys(publisherId, depth - 1);
        storyCacheKeys.push(...collectionKeys.storyCacheKeys);
        collectionCacheKeys.push(...collectionKeys.collectionCacheKeys);
        break;
    }
  });
  return { storyCacheKeys, collectionCacheKeys };
}

// TODO: Can getCollectionCacheKeys be removed?
Collection.prototype.getCollectionCacheKeys = function (publisherId, depth) {
  if (!depth) {
    return {
      storyCacheKeys: [],
      collectionCacheKeys: [collectionToCacheKey(publisherId, this)],
    };
  }
  const { storyCacheKeys, collectionCacheKeys } = getItemCacheKeys(publisherId, this.items, depth);
  collectionCacheKeys.unshift(collectionToCacheKey(publisherId, this));
  return { storyCacheKeys, collectionCacheKeys };
};

Collection.prototype.isAutomated = function () {
  return !!this.automated;
};

Collection.prototype.getChildCollections = function () {
  return this.items && this.items.filter((i) => i.type === "collection");
};

Collection.prototype.getCacheableChildItems = function () {
  return this.isAutomated() ? this.getChildCollections() : this.items;
};

Collection.prototype.isLeafCollection = function () {
  return !this.getCacheableChildItems() && !this["collection-cache-keys"];
};

Collection.prototype.cacheKeys = function (publisherId, depth) {
  if (depth < 0 || this.isLeafCollection()) {
    return [collectionToCacheKey(publisherId, this)];
  }
  const remainingDepth = _.isNumber(depth) ? depth - 1 : depth;
  return [
    ...(this["collection-cache-keys"] ? this["collection-cache-keys"] : []),
    ..._.flatMap(this.getCacheableChildItems(), (item) => itemToCacheKey(publisherId, item, remainingDepth)),
  ];
};

Story.prototype.cacheKeys = function (publisherId) {
  return [storyToCacheKey(publisherId, this)].concat(
    (this.authors || []).map((author) => authorToCacheKey(publisherId, author))
  );
};

Story.sorterToCacheKey = sorterToCacheKey;

Author.prototype.cacheKeys = function (publisherId) {
  const { author } = this;
  return author && author.id ? [authorToCacheKey(publisherId, author)] : null;
};

CustomPath.prototype.cacheKeys = function (publisherId) {
  const { page } = this;
  return page && page.id ? [customUrlToCacheKey(publisherId, page)] : null;
};

module.exports = {
  getClientImpl,
  Client,
  Story,
  Author,
  CustomPath,
  Member,
  Collection,
  Entity,
  MenuGroups,
  Config,
  AmpConfig,
};
