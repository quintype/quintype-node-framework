class InfiniteScrollAmp {
  constructor({ ampConfig, client, publisherConfig, queryParams, infiniteScrollSource }) {
    this.client = client;
    this.publisherConfig = publisherConfig;
    this.queryParams = queryParams;
    this.infiniteScrollSource = infiniteScrollSource;
  }

  // eslint-disable-next-line class-methods-use-this
  getFilteredCollItems(coll, storyId) {
    return coll.items.filter(
      ({ type, story }) =>
        type === "story" &&
        story["story-content-id"] !== storyId &&
        story.access !== "subscription" &&
        story["story-template"] !== "visual-story"
    );
  }

  getFilteredApiItems(relatedStories) {
    return relatedStories.filter(
      (story) =>
        story.access !== "subscription" &&
        story["story-template"] !== "visual-story"
    );
  }

  formatData({ itemsArr, type }) {
    // formats configuration as per need of amp infinite scroll
    const arr = itemsArr.map((item) => ({
      image: this.getImagePath(item),
      title: item.headline,
      url: `/amp/story/${item.slug}`,
    }));
    switch (type) {
      case "inline":
        return arr;
      default:
        return {
          pages: arr,
        };
    }
  }

  getImagePath(item) {
    const cdnImage = this.publisherConfig["cdn-image"];
    const s3Key = item["hero-image-s3-key"];
    const hostWithProtocol = /^https:\/\//.test(cdnImage) ? cdnImage : `https://${cdnImage}`;
    return `${hostWithProtocol}/${s3Key}?format=webp&w=250`;
  }

  async getInfiniteScrollList({ storyId, type, offset = 0, limit = null }) {
    let filteredItems = [];
    const params = {
      ...(offset && { offset }),
      ...(limit && { limit }),
    };
    if (this.infiniteScrollSource === "relatedStoriesApi") {
      const relatedStoriesList = await this.client.getRelatedStories(storyId, null, params);
      if (!relatedStoriesList || (relatedStoriesList["related-stories"] && !relatedStoriesList["related-stories"].length) || relatedStoriesList["related-stories"].error || relatedStoriesList === null)
        return new Error();
      return filteredItems = this.getFilteredApiItems(relatedStoriesList["related-stories"]);
    } else {
      const collection = await this.client.getCollectionBySlug("amp-infinite-scroll");
      if (!collection || (collection.items && !collection.items.length) || collection.error || collection === null)
        return new Error();
      const collectionItems = this.getFilteredCollItems(collection, storyId).map(items => items.story);
      return filteredItems = type === "inlineConfig"
        ? collectionItems.slice(0, 5)
        : collectionItems.slice(5);
    }
  }

  async getResponse() {
    const { "story-id": storyId } = this.queryParams;
    if (!storyId) return new Error(`Query param "story-id" missing`);
    const filteredItems =
      await this.getInfiniteScrollList({ storyId, type: "remoteConfig", offset: 5 });
    if (filteredItems instanceof Error) return new Error(`Infinite scroll collection amp-infinite-scroll returned falsy value`);
    const formattedData = this.formatData({ itemsArr: filteredItems });
    return JSON.stringify(formattedData);
  }

  async getInitialInlineConfig({ storyId }) {
    if (!storyId) return new Error("Required params for getInitialInlineConfig missing");
    const filteredItems =
      await this.getInfiniteScrollList({ storyId, type: "inlineConfig", offset: 0, limit: 5 });

    if (filteredItems instanceof Error) return null;
    const formattedData = filteredItems.length > 0 && this.formatData({
      itemsArr: filteredItems,
      type: "inline",
    });
    return JSON.stringify(formattedData);
  }
}
module.exports = InfiniteScrollAmp;
