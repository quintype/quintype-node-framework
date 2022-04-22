const ROOT_PATH = require("path").resolve(__dirname, "..");

require("babel-register")({
  presets: [
    "react",
    {
      runtime: "automatic",
    },
  ],
  plugins: ["transform-es2015-modules-commonjs", "transform-object-rest-spread", "quintype-assets"],
  ignore(file) {
    return file.startsWith(ROOT_PATH + "/node_modules");
  },
});
