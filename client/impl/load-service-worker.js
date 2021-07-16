import { SERVICE_WORKER_UPDATED } from "@quintype/components";

export function registerServiceWorker({
  enableServiceWorker = false,
  serviceWorkerLocation = "/service-worker.js",
  navigator = global.navigator,
  mountAt = global.qtMountAt || "",
}) {
  if (enableServiceWorker && navigator.serviceWorker) {
    console.log("Registering worker!!!", serviceWorkerLocation);
    return navigator.serviceWorker.register(`${mountAt}${serviceWorkerLocation}`);
  }
  return Promise.resolve(null);
}

export function setupServiceWorkerUpdates(serviceWorkerPromise, app, store, page, opts = {}) {
  if (!serviceWorkerPromise) return Promise.resolve();

  return serviceWorkerPromise.then((registration) => {
    if (!registration) return;

    if (registration.update) {
      app.updateServiceWorker = () =>
        registration.update().then(() => store.dispatch({ type: SERVICE_WORKER_UPDATED }));
      if (global.OneSignal) {
        let { config: { "theme-attributes": pageThemeAttributes = {} } = {} } = page;
        let version = pageThemeAttributes["cache-burst"];
        app.reRegisterServiceWorker = () =>
          registerServiceWorker({
            ...opts,
            serviceWorkerLocation: `/OneSignalSDKWorker.js?version=${version}`,
          }).then(() => console.log("Re-registered onesignal worker"));
      }
    }

    checkForServiceWorkerUpdates(app, page);

    return registration;
  });
}

function updateServiceWorker(app) {
  console.log(`updating service worker due to config change`);
  app.updateServiceWorker && app.updateServiceWorker();
}

function reRegisterServiceWorker(app) {
  console.log(`re-register onesignal service worker due to config change`);
  app.reRegisterServiceWorker && app.reRegisterServiceWorker();
}

export function checkForServiceWorkerUpdates(app, page = {}) {
  if (page.appVersion && app.getAppVersion && app.getAppVersion() < page.appVersion) {
    console && console.log("Updating the Service Worker");
    global.OneSignal
      ? app.reRegisterServiceWorker && app.reRegisterServiceWorker()
      : app.updateServiceWorker && app.updateServiceWorker();
  } else if (global && global.qtVersion) {
    /* Check if the config is updated and update the service worker if true */
    const { qtVersion: { configVersion = 0 } = {} } = global;
    const { config: { "theme-attributes": pageThemeAttributes = {} } = {} } = page;
    if ((pageThemeAttributes["cache-burst"] || 0) > parseInt(configVersion)) {
      global.OneSignal ? reRegisterServiceWorker(app) : updateServiceWorker(app);
    }
  }

  return page;
}
