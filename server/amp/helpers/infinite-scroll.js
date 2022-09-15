class InfiniteScrollAmp {
  constructor({ story, ampConfig, client, publisherConfig, queryParams, infiniteScroll }) {
    this.story = story;
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

  async getInfiniteScrollList(storyId) {
    const sourceType = this.infiniteScroll && this.infiniteScroll.source;
    let filteredItems = [];
    if (sourceType === "relatedStoriesApi") {
      const relatedStoriesList = await this.story.getRelatedStories(this.client);
      if (!relatedStoriesList)
        return false;
      return filteredItems = this.getFilteredApiItems(relatedStoriesList);
    } else {
      const collection = await this.client.getCollectionBySlug("amp-infinite-scroll");
      if (!collection || (collection.items && !collection.items.length) || collection.error || collection === null)
        return false;
      return filteredItems = this.getFilteredCollItems(collection, storyId);
    }
  }

  async getResponse({ itemsTaken }) {
    const { "story-id": storyId } = this.queryParams;
    if (!storyId) return new Error(`Query param "story-id" missing`);
    const filteredItems = await this.getInfiniteScrollList(storyId);
    if (typeof filteredItems === "boolean") return new Error(`Infinite scroll collection amp-infinite-scroll returned falsy value`);
    const slicedItems = filteredItems.slice(itemsTaken);
    const formattedData = this.formatData({ itemsArr: slicedItems });
    return JSON.stringify(formattedData);
  }

  async getInitialInlineConfig({ itemsToTake, storyId }) {
    if (!itemsToTake || !storyId) return new Error("Required params for getInitialInlineConfig missing");
    const filteredItems = await this.getInfiniteScrollList(storyId);
    if (typeof filteredItems === "boolean") return null;
    const slicedItems = filteredItems.slice(0, itemsToTake);
    const formattedData = slicedItems.length > 0 && this.formatData({
      itemsArr: slicedItems,
      type: "inline",
    });
    return JSON.stringify(formattedData);
  }
}
module.exports = InfiniteScrollAmp;
