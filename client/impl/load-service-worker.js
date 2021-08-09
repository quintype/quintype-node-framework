import { SERVICE_WORKER_UPDATED } from "@quintype/components";

export function registerServiceWorker({
  enableServiceWorker = false,
  serviceWorkerLocation = "/service-worker.js",
  navigator = global.navigator,
  mountAt = global.qtMountAt || "",
  version = 0,
}) {
  if (enableServiceWorker && navigator.serviceWorker) {
    const location =
      serviceWorkerLocation === "/OneSignalSDKWorker.js"
        ? `${serviceWorkerLocation}?version=${version}`
        : serviceWorkerLocation;
    return navigator.serviceWorker.register(`${mountAt}${location}`);
  }
  return Promise.resolve(null);
}

function updateOneSignalWorker(page, opts) {
  const { config: { "theme-attributes": pageThemeAttributes = {} } = {} } = page;
  const version = pageThemeAttributes["cache-burst"] || page.appVersion;

  registerServiceWorker({ ...opts, serviceWorkerLocation: "/OneSignalSDKWorker.js", version }).then(() =>
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
