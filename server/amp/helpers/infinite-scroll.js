class InfiniteScrollAmp {
  constructor({ ampConfig, client, publisherConfig, queryParams, infiniteScroll }) {
    this.client = client;
    this.publisherConfig = publisherConfig;
    this.queryParams = queryParams;
    this.infiniteScroll = infiniteScroll;
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
      title: item.story.headline,
      url: `/amp/story/${item.story.slug}`,
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
    const s3Key = item.story["hero-image-s3-key"];
    const hostWithProtocol = /^https:\/\//.test(cdnImage) ? cdnImage : `https://${cdnImage}`;
    return `${hostWithProtocol}/${s3Key}?format=webp&w=250`;
  }

  throwError(srcType) {
    return new Error(`Infinite scroll powered by ${srcType} returned falsy value`);
  }

  getInfiniteScrollSource = async (story, storyId) => {
    const sourceType = this.infiniteScroll.source;
    if (sourceType === "relatedStoriesApi") {
      const relatedStoriesList = await story.getRelatedStories(this.client);
      if (!relatedStoriesList)
        return new Error(`RelatedStories List returned falsy value`);
      return this.getFilteredApiItems(relatedStoriesList);
    } else {
      const collection = await this.client.getCollectionBySlug("amp-infinite-scroll");
      if (!collection || collection.error)
        return new Error(`Infinite scroll collection returned falsy value`);
      return this.getFilteredCollItems(collection, storyId);
    }
  };

  async getResponse({ itemsTaken }) {
    const { "story-id": storyId } = this.queryParams;
    if (!storyId) return new Error(`Query param "story-id" missing`);
    const story = await this.client.getStoryById(storyId);
    const filteredItems = await this.getInfiniteScrollSource(story, storyId);
    const slicedItems = filteredItems.slice(itemsTaken);
    const formattedData = this.formatData({ itemsArr: slicedItems });
    return JSON.stringify(formattedData);
  }

  async getInitialInlineConfig({ itemsToTake, story }) {
    const storyId = story["story-content-id"];
    if (!itemsToTake || !storyId) return new Error("Required params for getInitialInlineConfig missing");
    const filteredItems = await this.getInfiniteScrollSource(story, storyId);
    const slicedItems = filteredItems.slice(0, itemsToTake);
    const formattedData = this.formatData({
      itemsArr: slicedItems,
      type: "inline",
    });

    return JSON.stringify(formattedData);
  }
}

module.exports = InfiniteScrollAmp;
