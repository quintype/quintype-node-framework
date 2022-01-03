## Migrate from v6 to v7 of @quintype/framework

In version 7 of @quintype/framework, we've bumped [webpack](https://www.npmjs.com/package/webpack) from version 4 to 5. Please refer webpack's official migration doc [here](https://webpack.js.org/migrate/5/)

PR in malibu for reference > https://github.com/quintype/malibu-advanced/pull/332/files

In your malibu app,

- bump `"@quintype/framework": "^7.x.x"`
- bump build `"@quintype/build": "^4.x.x",`
- bump components (if applicable) `"@quintype/components": "^3.x.x"`
- bump arrow (if applicable) `"@quintype/arrow": "^3.x.x"`
- bump SEO `"@quintype/seo": "^1.39.x"`
- update `react` and `react-dom` to latest minor version (16.14.0 at the time of writing)
- update `react-redux` to latest minor version (7.2.5 at the time of writing)
- you'll also need a library like [axios](https://www.npmjs.com/package/axios) or something similar to make api calls for HMR to work during development
- Bump following dependancies (whichever are applicable):
  - "lint-staged": "^11.2.3",
    "nodemon": "^2.0.14",
    "postcss": "^8.3.11",
    "eslint": "^8.1.0",
    "prettier": "2.4.1",
    "react-test-renderer": "^17.0.2",
    "stylelint": "^14.0.0",
    "stylelint-config-recommended-scss": "^5.0.0",
    "stylelint-scss": "^4.0.0",
    "svg-sprite-loader": "^6.0.10",
    "svg-transform-loader": "^2.0.13",
    "webpack": "^5.59.1",
    "webpack-bundle-analyzer": "^4.5.0",
    "webpack-cli": "4.9.1",
    "webpack-dev-server": "^4.3.1",
    "svgo-loader": "^3.0.0"
- create a file called `nodemon.json`, add following to it
  ```json
  {
    "verbose": true,
    "delay": 2500
  }
  ```
- in `app/server/helpers/index.js`, change

  ```js
  function getAsset(asset, qtAssetHelpers) {
    const { assetPath, readAsset } = qtAssetHelpers;
    return assetPath(asset) ? readAsset(asset) : "";
  }
  ```

  to

  ```js
  async function getAsset(asset, qtAssetHelpers) {
    const { assetPath, readAsset } = qtAssetHelpers;
    const assetAbsolutePath = assetPath(asset);

    if (process.env.NODE_ENV === "development") {
      try {
        // using axios here, can use any other package to make below call
        const { data } = await axios.get(assetAbsolutePath);
        return data;
      } catch (error) {
        console.warn("HMR chunk rendering failure");
        console.warn(error);
        return "";
      }
    }

    return assetAbsolutePath ? readAsset(asset) : "";
  }
  ```

- webpack has changed the API of `webpack.config.js` (check migration doc given above fore more info), so we gotta change the config accordingly. _Please note that your project might not need below change if you're not using SVG sprites. In that case please change the webpack config as per the new API_

change what's applicable

```js
const webpackConfig = require("@quintype/build/config/webpack");
const path = require("path");

const SpriteLoaderPlugin = require("svg-sprite-loader/plugin");
const svgSprite = {
  test: /\.svg$/,
  loader: "svg-sprite-loader",
  options: {
    extract: true,
    publicPath: "/",
    symbolId: (filePath) => {
      return path.basename(filePath).replace(".svg", "").toLowerCase();
    },
    spriteFilename: process.env.NODE_ENV === "production" ? "sprite-[hash].svg" : "sprite.svg",
    esModule: false,
  },
};

webpackConfig.module.rules.push(svgSprite);
webpackConfig.module.rules.find((rule) => rule.loader === "file-loader").exclude = [
  /app\/assets\/icons\/[a-z-]+\.svg$/,
];

const svgPlugin = () =>
  new SpriteLoaderPlugin({
    plainSprite: true,
  });

webpackConfig.plugins.push(svgPlugin());

module.exports = {
  ...webpackConfig,
};
```

to

```js
const SpriteLoaderPlugin = require("svg-sprite-loader/plugin");
const path = require("path");
const webpackConfig = require("@quintype/build/config/webpack");

const { plugins, output, module: webpackModule } = webpackConfig;
if (process.env.NODE_ENV !== "production") output.path = path.resolve("./public");
const getSpritePlugin = () => new SpriteLoaderPlugin({ plainSprite: true });
const insertIntoIndex = (arr, index, newItem) => [...arr.slice(0, index), newItem, ...arr.slice(index)];
const enhancedPlugins = insertIntoIndex(plugins, 1, getSpritePlugin());
const spriteRule = {
  test: /\.svg$/,
  use: [
    {
      loader: "svg-sprite-loader",
      options: {
        extract: true,
        spriteFilename: process.env.NODE_ENV === "production" ? "svg-sprite-[hash].svg" : "svg-sprite.svg",
        esModule: false,
      },
    },
    "svg-transform-loader",
    "svgo-loader",
  ],
};

const enhancedRules = insertIntoIndex(webpackModule.rules, 5, spriteRule);
enhancedRules[8] = {
  test: /\.(jpe?g|gif|png|woff|woff2|eot|ttf|wav|mp3|ico|mp4)$/,
  loader: "file-loader",
  options: { context: "./app/assets", name: "[name].[ext]" },
};

module.exports = {
  ...webpackConfig,
  module: { ...webpackModule, ...{ rules: enhancedRules } },
  plugins: enhancedPlugins,
};
```

- please test thoroughly. Also webpack 5 shows warnings in browser, please resolve them if present
