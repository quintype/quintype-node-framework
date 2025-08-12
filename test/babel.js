const ROOT_PATH = require("path").resolve(__dirname, "..");

require("@babel/register")({
  presets: ["@babel/preset-react"],
  plugins: ["@babel/plugin-transform-modules-commonjs", "@babel/plugin-proposal-object-rest-spread", "quintype-assets"],
  ignore: [(file) => file.startsWith(ROOT_PATH + "/node_modules")],
});
