import _ from 'lodash';
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import store from '../store';

const SERVER_IDLE_REFRESH = 2;


let ticks = 0;
let lastRefresh={};
function getLastRefresh(key) {
  if(lastRefresh.hasOwnProperty(key)) {
    return lastRefresh[key]
  }
  // return a very low value so the first call to this would
  return -100;
}

function shouldRefreshServer (server) {
  if(server.connState === "error") {
    return false;
  }

  let ticksSinceLastRefresh = ticks - getLastRefresh(server.key)

  // Torrents running

  // Idle case: no torrents running
  if(ticksSinceLastRefresh <= SERVER_IDLE_REFRESH) {
    return false;
  }

  return true;
}

// Called every 1 second
function doTick() {
  let serverKeys = store.getters['server/readyKeys'];
  _.each(serverKeys, (key) => {
    let server = mget.server.fromKey(key);
    if(shouldRefreshServer(server)) {

      store.dispatch('server/refresh', {key});
      lastRefresh[key] = ticks;
    }
  })
}

export const forceServerRefresh = ({key, connState = null}) => {

};

let intervalHandle = null;

export const initRefreshManager = () => {
  intervalHandle = setInterval(function () {
    ticks++;
    doTick();
  }, 1000);

  // Start a single refresh right on start
  doTick();
};

export const stopRefreshManager = () => {
  clearInterval(intervalHandle);
}

