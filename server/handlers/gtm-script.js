const get = require("lodash/get");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");

const partialTemplateStr = fs.readFileSync(path.join(__dirname, "../views/partial/gtm.ejs"), {
  encoding: "utf-8",
});

const partialTemplate = ejs.compile(partialTemplateStr);

exports.getGtmScript = function getGtmScript({ publisherConfig = {} }) {
  const gtmConfig = get(publisherConfig, ["publisher", "google_tag_manager"], {});
  const timeOut = gtmConfig.timeOut || 1000;
  const isGtmEnabled = gtmConfig.is_enable || false;
  const gtmId = gtmConfig.id;
  console.log("isGtmEnabled !!!", isGtmEnabled);
  const renderedContent = isGtmEnabled ? partialTemplate({ timeOut, gtmId }) : null;

  return renderedContent;
};
