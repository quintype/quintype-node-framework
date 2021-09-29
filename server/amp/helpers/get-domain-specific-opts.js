const merge = require("lodash/merge");
const cloneDeep = require("lodash/cloneDeep");

/**
 * Pick the correct opts for the subdomain
 * Uses the config for main domain as a fallback for subdomains. i.e. if a user us on entertainment subdomain and if opts.entertainment.slots is an empty obj, take opts.slots as a fallback
 *
 * @param {Object} opts the opts object coming from FE app
 * @param {string|null|undefined} domainSlug the domain slug as specified in publisher.yml under domain_mapping
 * @returns {Object} The correct opts object for the domain/subdomain
 */

function getDomainSpecificOpts(opts = {}, domainSlug = null) {
  if (!domainSlug || !opts.domains || !opts.domains[domainSlug]) return opts;

  const clone = cloneDeep(opts);
  delete clone.domains;
  const domainSpecificOpts = opts.domains[domainSlug];
  const mergedOptions = merge(clone, domainSpecificOpts);

  return mergedOptions;
}

module.exports = { getDomainSpecificOpts };
