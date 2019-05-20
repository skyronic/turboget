import _ from 'lodash';
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import store from '../store';

const TICKS_IN_SEC = 1;

// When no torrents are active
const SERVER_IDLE_REFRESH = 5 * TICKS_IN_SEC;

// When any torrent is active
const SERVER_ACTIVE_REFRESH = 2 * TICKS_IN_SEC;

// When an error takes place, attempt N retries
const SERVER_ERROR_RETRIES = 6;

// perform retries N seconds apart
const SERVER_ERROR_RETRY_DELAY = 4 * TICKS_IN_SEC;

let ticks = 0;

let lastRefresh={};
function getLastRefresh(key) {
  if(lastRefresh.hasOwnProperty(key)) {
    return lastRefresh[key]
  }
  // return a very low value so the first call to this would
  return -100;
}

let errorAttempts = {};
function getErrorAttempts(key) {
  if(errorAttempts.hasOwnProperty(key)) {
    return errorAttempts[key]
  }
  // return a very low value so the first call to this would
  errorAttempts[key] = 0;
  return 0;
}

function shouldRefreshServer (server) {
  let ticksSinceLastRefresh = ticks - getLastRefresh(server.key)
  let hasError = (server.connState === "error");
  let attempts = getErrorAttempts(server.key);
  let torrentsForServer = store.getters['torrent/forServer'](server.key);
  let torrentsAreActive = _.findIndex(torrentsForServer, function (val) {
    return parseInt(val.info.left) > 0
  }) !== -1;

  if(hasError) {
    if(ticksSinceLastRefresh <= SERVER_ERROR_RETRY_DELAY) {
      // since server is in error state, we only will perform retries, skip all
      // other checks
      return [false];
    }
    // If we reach this point it will be because it's due for another retry

    // Check if we have attempts to perform retries
    if(attempts < SERVER_ERROR_RETRIES) {
      warn("Performing a retry . Attempt #" + attempts);
      errorAttempts[server.key]++;
      return [true, "Retry", 'connecting'];
    }
    else {
      warn("Out of attempts to perform retry");
      return [false];
    }
  }
  else if (!hasError && attempts > 0) {
    // this means we recovered from an error. Mark as 0 attempts and continue as normal
    info("Reseting attempts because recovered from error");
    errorAttempts[server.key] = 0;
  }

  if(ticksSinceLastRefresh > SERVER_ACTIVE_REFRESH && torrentsAreActive) {
    return [true, "Refresh for active torrents", null]
  }

  // Idle case: no torrents running
  if(ticksSinceLastRefresh > SERVER_IDLE_REFRESH && !torrentsAreActive) {
    return [true, "Refresh for idle", null];
  }

  return [false, null];
}

// Called every 1 second
function doTick() {
  let serverKeys = store.getters['server/readyKeys'];
  _.each(serverKeys, (key) => {
    let server = mget.server.fromKey(key);
    let [refreshFlag, refreshReason = "", newConnState = null] = shouldRefreshServer(server);
    if(refreshFlag) {
      // debug("Refreshing for reason - " + refreshReason);
      lastRefresh[key] = ticks;
      store.dispatch('server/refresh', {key, connState:newConnState});
    }
  })
}

export const forceServerRefresh = ({key, connState = null}) => {
  info("Forcing refresh");
  lastRefresh[key] = ticks;
  store.dispatch('server/refresh', {key, connState});
};

let intervalHandle = null;

export const initRefreshManager = () => {
  intervalHandle = setInterval(function () {
    ticks++;
    doTick();
  }, 1000 / TICKS_IN_SEC);

  // Start a single refresh right on start
  doTick();
};

export const stopRefreshManager = () => {
  clearInterval(intervalHandle);
}

