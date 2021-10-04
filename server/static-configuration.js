/**
 * This namespace exposes all yaml files that are in the config directory.
 *
 * ```javascript
 * import { my_file } from "@quintype/framework/server/static-configuration";
 * my_file["key"] // reads from config/my_file.yml
 * ```
 *
 * @category Server
 * @module static-configuration
 */
// istanbul ignore file

const fs = require("fs");
const yaml = require("js-yaml");

module.exports = fs
  .readdirSync("config")
  .filter((x) => x.match(/\.yml$/))
  .reduce((acc, x) => {
    acc[x.replace(/\.yml$/, "")] = yaml.load(
      fs.readFileSync(`config/${x}`)
    );
    return acc;
  }, {});
