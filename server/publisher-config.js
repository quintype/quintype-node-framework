/**
 * This namespace exposes a the publisher config from publisher.yml
 * ```javascript
 * import config from "@quintype/framework/server/publisher-config";
 *
 * config["sketches_host"]
 * ```
 * @category Server
 * @module publisher-config
 */
// istanbul ignore file


const fs = require("fs");
const yaml = require("js-yaml");

const publisher = yaml.load(fs.readFileSync("config/publisher.yml"));

module.exports = publisher;
