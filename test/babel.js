const ROOT_PATH = require("path").resolve(__dirname, "..");

require("babel-register")({
  presets: ["react"],
  plugins: ["transform-es2015-modules-commonjs", "quintype-assets"],
  ignore(file) {
    return file.startsWith(ROOT_PATH + "/node_modules");
  }
});
