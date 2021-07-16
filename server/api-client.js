/**
 * This module just re-exports all symbols from [@quintype/backend](https://developers.quintype.com/quintype-node-backend)
 *
 * However, each exported class has one extra member function added called *cacheKeys(publisherId)*, which returns cache keys for that object (Story or Collection).
 *
 * ```javascript
 * import { Story, Author, CustomPath, Collection, Member, Entity } from "@quintype/framework/server/api-client";
 * ```
 * @category Server
 * @module api-client
 */
// istanbul ignore file
// istanbul ignore file
const config = require("./publisher-config");
const {
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
} = require("./impl/api-client-impl");

const defaultClient = new Client(config.sketches_host);
const cachedSecondaryClients = {};

function getClient(hostname) {
  return getClientImpl(config, cachedSecondaryClients, hostname) || defaultClient;
}

function initializeAllClients() {
  const promises = [defaultClient.getConfig()];
  if (!config.skip_warm_config) {
    Object.entries(config.host_to_api_host || []).forEach(([host, apiHost]) => {
      const client = new Client(apiHost);
      cachedSecondaryClients[host] = client;
      promises.push(client.getConfig());
    });
  }
  return Promise.all(promises);
}

module.exports = {
  Story,
  Author,
  CustomPath,
  Collection,
  Member,
  Entity,
  MenuGroups,
  Config,
  AmpConfig,

  client: defaultClient,
  getClient,
  initializeAllClients,
};
