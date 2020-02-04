// istanbul ignore file
// This file is not documented

const { Story, Collection } = require("./api-client");
const templateOptions = require("./impl/template-options");

exports.catalogDataLoader = function catalogDataLoader(client, config) {
  return Story.getStories(client).then(stories => {
    return {
      stories: stories.map(story => story.asJson()),
      cacheKeys: [`static`],
      templateOptions
    };
  });
};

exports.homeCollectionOrStories = function homeCollectionOrStories(
  client,
  depth = 1
) {
  return Collection.getCollectionBySlug(
    client,
    "home",
    { "item-type": "collection" },
    { depth }
  ).then(collection => {
    if (collection) return collection;
    return Story.getStories(client).then(stories =>
      Collection.build({
        slug: "home",
        name: "Home",
        template: "default",
        items: [
          {
            type: "collection",
            name: "Home",
            template: "default",
            items: stories.map(story => ({
              type: "story",
              story: story.asJson()
            }))
          }
        ]
      })
    );
  });
};
