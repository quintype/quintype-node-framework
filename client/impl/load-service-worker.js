import { SERVICE_WORKER_UPDATED } from "@quintype/components";

export function registerServiceWorker({
  enableServiceWorker = false,
  serviceWorkerLocation = "/service-worker.js",
  navigator = global.navigator,
  mountAt = global.qtMountAt || "",
}) {
  if (enableServiceWorker && navigator.serviceWorker) {
    return navigator.serviceWorker.register(
      `${mountAt}${serviceWorkerLocation}`
    );
  }
  return Promise.resolve(null);
}

export function setupServiceWorkerUpdates(
  serviceWorkerPromise,
  app,
  store,
  page
) {
  if (!serviceWorkerPromise) return Promise.resolve();

  return serviceWorkerPromise.then((registration) => {
    if (!registration) return;

    if (registration.update) {
      app.updateServiceWorker = () =>
        registration
          .update()
          .then(() => store.dispatch({ type: SERVICE_WORKER_UPDATED }));
    }

    checkForServiceWorkerUpdates(app, page);

    return registration;
  });
}

export function checkForServiceWorkerUpdates(app, page = {}) {
  if (
    page.appVersion &&
    app.getAppVersion &&
    app.getAppVersion() < page.appVersion
  ) {
    console && console.log("Updating the Service Worker");
    app.updateServiceWorker && app.updateServiceWorker();
  } else if (global && global.qtVersion) {
    /* Check if the config is updated and update the service worker if true */
    const { qtVersion: { configVersion = 0 } = {} } = global;
    const {
      config: { "theme-attributes": pageThemeAttributes = {} } = {},
    } = page;
    if ((pageThemeAttributes["cache-burst"] || 0) > parseInt(configVersion)) {
      console.log(`updating service worker due to config change`);
      app.updateServiceWorker && app.updateServiceWorker();
    }
  }

  return page;
}
