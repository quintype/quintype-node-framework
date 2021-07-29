import { SERVICE_WORKER_UPDATED } from "@quintype/components";

export function registerServiceWorker({
  enableServiceWorker = false,
  serviceWorkerLocation = "/service-worker.js",
  navigator = global.navigator,
  mountAt = global.qtMountAt || "",
}) {
  if (enableServiceWorker && navigator.serviceWorker) {
    return navigator.serviceWorker.register(`${mountAt}${serviceWorkerLocation}`);
  }
  return Promise.resolve(null);
}

function updateOneSignalWorker(page, opts) {
  let { config: { "theme-attributes": pageThemeAttributes = {} } = {} } = page;
  let version = pageThemeAttributes["cache-burst"];

  registerServiceWorker({ ...opts, serviceWorkerLocation: `/OneSignalSDKWorker.js?version=${version}` }).then(() =>
    console.log("Updated OneSignal Worker")
  );
}

export function setupServiceWorkerUpdates(serviceWorkerPromise, app, store, page, opts = {}) {
  if (!serviceWorkerPromise) return Promise.resolve();

  return serviceWorkerPromise.then((registration) => {
    if (!registration) return;

    if (registration.update) {
      app.updateServiceWorker = () =>
        registration.update().then(() => store.dispatch({ type: SERVICE_WORKER_UPDATED }));

      if (global.OneSignal) {
        app.updateOneSignalWorker = () => updateOneSignalWorker(page, opts);
      }
    }

    checkForServiceWorkerUpdates(app, page);

    return registration;
  });
}

function updateServiceWorker(app) {
  if (global.OneSignal) {
    app.updateOneSignalWorker && app.updateOneSignalWorker();
  } else {
    app.updateServiceWorker && app.updateServiceWorker();
  }
}

export function checkForServiceWorkerUpdates(app, page = {}) {
  console.log(global.qtVersion);
  if (page.appVersion && app.getAppVersion && app.getAppVersion() < page.appVersion) {
    console && console.log("Updating the Service Worker");
    updateServiceWorker(app);
  } else if (global && global.qtVersion) {
    /* Check if the config is updated and update the service worker if true */
    const { qtVersion: { configVersion = 0 } = {} } = global;
    const { config: { "theme-attributes": pageThemeAttributes = {} } = {} } = page;
    if ((pageThemeAttributes["cache-burst"] || 0) > parseInt(configVersion)) {
      console.log(`Updating service worker due to config change`);
      updateServiceWorker(app);
    }
  }

  return page;
}
