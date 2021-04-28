const assert = require("assert");

const {
  getClientImpl,
  Client,
  Story,
  Author,
  Collection,
  CustomPath,
} = require("../../server/impl/api-client-impl");

describe("ApiClient", function () {
  describe("getClient", function () {
    it("returns a cachedSecondaryClient if present", function () {
      const expectedClient = new Client("foo.staging.quintype.io", true);
      const client = getClientImpl(
        {},
        { "foo.com": expectedClient },
        "foo.com"
      );
      assert.equal(expectedClient, client);
    });

    it("creates a temporary client if it matches a string", function () {
      const client = getClientImpl(
        { host_to_automatic_api_host: ["-web"] },
        {},
        "foo-web.staging.quintype.io"
      );
      assert.equal("https://foo.staging.quintype.io", client.baseUrl);
    });

    it("creates a temporary client if it matches a string with a .", function () {
      const client = getClientImpl(
        { host_to_automatic_api_host: [".madrid"] },
        {},
        "foo.madrid.quintype.io"
      );
      assert.equal("https://foo.quintype.io", client.baseUrl);
    });

    it("creates a temporary client if host_to_api_host_is set", function () {
      const client = getClientImpl(
        {
          host_to_api_host: {
            "foo.madrid.quintype.io": "https://foo.quintype.io",
          },
        },
        {},
        "foo.madrid.quintype.io"
      );
      assert.equal("https://foo.quintype.io", client.baseUrl);
    });

    it("returns null if no client is found", function () {
      const client = getClientImpl({}, {}, "www.unknown.com");
      assert.equal(null, client);
    });
  });

  describe("Collection", () => {
    it("should return collection as non-automated when automated key is not present in a collection", () => {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42"],
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
        ],
      });
      assert.strictEqual(collection.isAutomated(), false);
    });

    it("should return collection as non-automated when automated is false in a collection", () => {
      const collection = Collection.build({
        id: "42",
        automated: false,
        "collection-cache-keys": ["c/1/42"],
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
        ],
      });
      assert.strictEqual(collection.isAutomated(), false);
    });

    it("should return collection as automated for an automated collection", () => {
      const collection = Collection.build({
        id: "42",
        automated: true,
        "collection-cache-keys": ["c/1/42", "sc/1/1233"],
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
        ],
      });
      assert.strictEqual(collection.isAutomated(), true);
    });

    it("should return all child stories at current level for a collection", () => {
      const collection = Collection.build({
        id: "42",
        automated: true,
        "collection-cache-keys": ["c/1/42", "sc/1/1233"],
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
          {
            type: "story",
            story: { id: "1e5acfe4-d8d2-40f8-a8f4-049cf1ac9fb4" },
          },
        ],
      });

      assert.strictEqual(collection.getChildStories().length, 2);
      assert.strictEqual(collection.getChildStories().filter((f) => f.type === "story").length, 2);
    });

    it("should handle get child stories when items is missing in a collection", () => {
      const collection = Collection.build({
        id: "42",
        automated: true,
        "collection-cache-keys": ["c/1/42", "sc/1/1233"],
      });

      assert.doesNotThrow(() => collection.getChildStories());
    });

    it("should return all child collections at current level for a collection", () => {
      const collection = Collection.build({
        id: "42",
        automated: true,
        "collection-cache-keys": ["c/1/42", "sc/1/1233"],
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
          {
            type: "collection",
            "collection-cache-keys": ["c/1/850", "sc/1/112"],
            automated: true,
            id: "850",
            items: [{ type: "story", story: { id: "xyz1234" } }],
          },
          {
            type: "collection",
            "collection-cache-keys": ["c/1/851", "sc/1/114"],
            automated: true,
            id: "851",
            items: [{ type: "story", story: { id: "xyz1235" } }],
          },
        ],
      });

      assert.strictEqual(collection.getChildCollections().length, 2);
      assert.strictEqual(collection.getChildCollections().filter((f) => f.type === "collection").length, 2);
    });

    it("should handle get child collections when items is missing in a collection", () => {
      const collection = Collection.build({
        id: "42",
        automated: true,
        "collection-cache-keys": ["c/1/42", "sc/1/1233"],
      });

      assert.doesNotThrow(() => collection.getChildCollections());
    });
  });

  describe("caching", function () {
    it("returns cache keys for the story", function () {
      const story = Story.build({
        id: "264f46f9-e624-4718-b391-45e4bca7aeb6",
        authors: [{ id: 42 }],
      });
      assert.deepEqual(["s/1/264f46f9", "a/1/42"], story.cacheKeys(1));
    });

    it("should return all stories and collection id as cache tags for a manual collection", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42"],
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
          {
            type: "story",
            story: { id: "1e5acfe4-d8d2-40f8-a8f4-049cf1ac9fb4" },
          },
        ],
      });
      assert.deepEqual(
        ["c/1/42", "s/1/264f46f9", "s/1/1e5acfe4"],
        collection.cacheKeys(1)
      );
    });

    it("should include all nested stories and collection ids as cache tags for a manual collection", function () {
      const collection = Collection.build({
        id: "42",
        type: "collection",
        "collection-cache-keys": ["c/1/42"],
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
          {
            type: "story",
            story: { id: "1e5acfe4-d8d2-40f8-a8f4-049cf1ac9fb4" },
          },
          {
            id: "43",
            type: "collection",
            "collection-cache-keys": ["c/1/43"],
            items: [
              {
                type: "story",
                story: { id: "0c2809d8-c60b-4cf2-b5eb-9aaeec90c062" },
              },
              {
                type: "story",
                story: { id: "fd4fa2c4-5441-434a-bf76-7660bbf1a09d" },
              },
            ],
          }
        ],
      });
      assert.deepEqual(
        ["c/1/42", "s/1/264f46f9", "s/1/1e5acfe4", "c/1/43", "s/1/0c2809d8", "s/1/fd4fa2c4"],
        collection.cacheKeys(1)
      );
    });

    it("should return only collection cache keys excluding story keys as cache keys for an automated collection", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42", "sc/1/38586"],
        automated: true,
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
          {
            type: "story",
            story: { id: "1e5acfe4-d8d2-40f8-a8f4-049cf1ac9fb4" },
          },
        ],
      });
      assert.deepEqual(
        ["c/1/42", "sc/1/38586"],
        collection.cacheKeys(1)
      );
    });

    it("should include all nested collection cache keys excluding story keys as cache keys for automated collection", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42", "sc/1/38586"],
        automated: true,
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
          {
            type: "story",
            story: { id: "1e5acfe4-d8d2-40f8-a8f4-049cf1ac9fb4" },
          },
          {
            id: "43",
            type: "collection",
            automated: true,
            "collection-cache-keys": ["c/1/43", "e/1/123"],
            items: [
              {
                type: "story",
                story: { id: "0c2809d8-c60b-4cf2-b5eb-9aaeec90c062" },
              },
              {
                type: "story",
                story: { id: "fd4fa2c4-5441-434a-bf76-7660bbf1a09d" },
              },
            ],
          }
        ],
      });
      assert.deepEqual(
        ["c/1/42", "sc/1/38586", "c/1/43", "e/1/123"],
        collection.cacheKeys(1)
      );
    });

    it("should return cache keys when an automated collection has a manual collection", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42", "sc/1/38586"],
        automated: true,
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
          {
            type: "story",
            story: { id: "1e5acfe4-d8d2-40f8-a8f4-049cf1ac9fb4" },
          },
          {
            id: "43",
            type: "collection",
            automated: false,
            "collection-cache-keys": ["c/1/43"],
            items: [
              {
                type: "story",
                story: { id: "0c2809d8-c60b-4cf2-b5eb-9aaeec90c062" },
              },
              {
                type: "story",
                story: { id: "fd4fa2c4-5441-434a-bf76-7660bbf1a09d" },
              },
            ],
          }
        ],
      });
      assert.deepEqual(
        ["c/1/42", "sc/1/38586", "c/1/43", "s/1/0c2809d8", "s/1/fd4fa2c4"],
        collection.cacheKeys(1)
      );
    });

    it("should return cache keys when a manual collection has an automated collection under it", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42"],
        items: [
          {
            type: "story",
            story: { id: "264f46f9-e624-4718-b391-45e4bca7aeb6" },
          },
          {
            type: "story",
            story: { id: "1e5acfe4-d8d2-40f8-a8f4-049cf1ac9fb4" },
          },
          {
            id: "43",
            type: "collection",
            automated: true,
            "collection-cache-keys": ["c/1/43", "sc/1/38586"],
            items: [
              {
                type: "story",
                story: { id: "0c2809d8-c60b-4cf2-b5eb-9aaeec90c062" },
              },
              {
                type: "story",
                story: { id: "fd4fa2c4-5441-434a-bf76-7660bbf1a09d" },
              },
            ],
          }
        ],
      });
      assert.deepEqual(
        ["c/1/42", "s/1/264f46f9", "s/1/1e5acfe4", "c/1/43", "sc/1/38586"],
        collection.cacheKeys(1)
      );
    });

    it("should include nested collection and stories cache tags only upto depth when depth is passed", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42", "sc/1/38586"],
        automated: true,
        items: [
          {
            type: "collection",
            "collection-cache-keys": ["c/1/500", "sc/1/38587"],
            automated: true,
            id: "500",
            items: [
              {
                type: "collection",
                "collection-cache-keys": ["c/1/600", "sc/1/38588"],
                automated: true,
                id: "600",
                items: [
                  {
                    type: "collection",
                    "collection-cache-keys": ["c/1/700"],
                    automated: false,
                    id: "700",
                    items: [
                      { type: "story", story: { id: "abcdef12" }},
                      {
                        type: "collection",
                        "collection-cache-keys": ["c/1/850", "sc/1/112"],
                        automated: true,
                        id: "850",
                        items: [{ type: "story", story: { id: "xyz1234" } }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "collection",
                "collection-cache-keys": ["c/1/800"],
                automated: false,
                id: "800",
                items: [
                  {
                    type: "collection",
                    id: "900",
                    items: [
                      { type: "story", story: { id: "xyz12" } },
                      {
                        type: "collection",
                        "collection-cache-keys": ["c/1/851", "sc/1/152"],
                        automated: true,
                        id: "851",
                        items: [{ type: "story", story: { id: "xyz1245" } }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
      assert.deepEqual(
          [
            "c/1/42",
            "sc/1/38586",
            "c/1/500",
            "sc/1/38587",
            "c/1/600",
            "sc/1/38588",
            "c/1/700",
            "s/1/abcdef12",
            "c/1/800",
            "s/1/xyz12",
          ],
        collection.cacheKeys(1, 3)
      );
    });

    it("should only include base collection cache keys for an automated collection when depth is given as zero", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42", "sc/1/38586"],
        automated: true,
        items: [
          {
            type: "collection",
            "collection-cache-keys": ["c/1/500", "sc/1/38587"],
            automated: true,
            id: "500",
            items: [
              {
                type: "collection",
                "collection-cache-keys": ["c/1/600", "sc/1/38588"],
                automated: true,
                id: "600",
                items: [
                  {
                    type: "collection",
                    "collection-cache-keys": ["c/1/700"],
                    automated: false,
                    id: "700",
                    items: [
                      { type: "story", story: { id: "abcdef12" }},
                      {
                        type: "collection",
                        "collection-cache-keys": ["c/1/850", "sc/1/112"],
                        automated: true,
                        id: "850",
                        items: [{ type: "story", story: { id: "xyz1234" } }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "collection",
                "collection-cache-keys": ["c/1/800"],
                automated: false,
                id: "800",
                items: [
                  {
                    type: "collection",
                    id: "900",
                    items: [
                      { type: "story", story: { id: "xyz12" } },
                      {
                        type: "collection",
                        "collection-cache-keys": ["c/1/851", "sc/1/152"],
                        automated: true,
                        id: "851",
                        items: [{ type: "story", story: { id: "xyz1245" } }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      assert.deepEqual(["c/1/42", "sc/1/38586"], collection.cacheKeys(1, 0));
    });

    it("should only include base collection cache keys and base stories for manual collection when depth is given as zero", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42"],
        automated: false,
        items: [
          {
            type: "collection",
            "collection-cache-keys": ["c/1/500", "sc/1/38587"],
            automated: true,
            id: "500",
            items: [
              {
                type: "collection",
                "collection-cache-keys": ["c/1/600", "sc/1/38588"],
                automated: true,
                id: "600",
                items: [],
              },
              {
                type: "collection",
                "collection-cache-keys": ["c/1/800"],
                automated: false,
                id: "800",
                items: [],
              },
            ],
          },
          { type: "story", story: { id: "abcdef12" }},
        ],
      });

      assert.deepEqual(["c/1/42", "s/1/abcdef12"], collection.cacheKeys(1, 0));
    });

    it("should add all nested collection cache tags when depth is not passed", function () {
      const collection = Collection.build({
        id: "42",
        "collection-cache-keys": ["c/1/42", "sc/1/38586"],
        automated: true,
        items: [
          {
            type: "collection",
            "collection-cache-keys": ["c/1/500"],
            id: "500",
            items: [{ type: "story", story: { id: "abcdef12" } }],
          },
        ],
      });
      assert.deepEqual(
        ["c/1/42", "sc/1/38586", "c/1/500", "s/1/abcdef12"],
        collection.cacheKeys(1)
      );
    });

    it("can also find the cache key for a sorter", function () {
      assert.equal("q/1/top/home", Story.sorterToCacheKey(1, "top"));
      assert.equal("q/1/top/section-15", Story.sorterToCacheKey(1, "top", 15));
    });
  });

  describe("Author", function () {
    it("returns cache keys", function () {
      const author = Author.build({ id: 101 });
      assert.deepStrictEqual(["a/1/101"], author.cacheKeys(1));
    });

    it("returns cache keys as null if author is invalid", function () {
      const author = Author.build({});
      assert.deepStrictEqual(null, author.cacheKeys(1));
    });
  });

  describe("Custom urls", function () {
    it("returns cache keys", function () {
      const page = CustomPath.build({ id: 101 });
      assert.deepStrictEqual(["u/1/101"], page.cacheKeys(1));
    });

    it("returns cache keys as null if page is invalid", function () {
      const page = CustomPath.build({});
      assert.deepStrictEqual(null, page.cacheKeys(1));
    });
  });
});
