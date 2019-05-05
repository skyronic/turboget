import _ from 'lodash';
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import ds from '../lib/default_settings'


// perform migration of old settings to new as well here
function addDefaults (item) {
  item = _.extend({
    connState: "down"
  },item);
  let defaultConfig = _.cloneDeep(ds.server.items[0].config);
  item.config = _.merge(defaultConfig, item.config);

  // migrate old settings into new format
  if(item.config.download.http.auth === "basic-custom") {
    item.config.download.http.auth = "basic";
    item.config.download.http.server_creds = false;
    info("Migrated settings - basic-custom");
  } else if (item.config.download.http.auth === "basic-server") {
    item.config.download.http.auth = "basic";
    item.config.download.http.server_creds = true;
    info("Migrated settings - basic-custom");
  }

  return item;
}

export const serverModule = {
  namespaced: true,
  state: {
    items: []
  },
  actions: {
    refresh({commit, dispatch}, {key, connState = null}) {
      if(connState)
        commit("setConnState", {key, connState});
      dispatch("torrent/refreshTorrents", key, {root: true});
    }
  },
  mutations: {
    restoreFromSettings (state, {items}) {
      state.items = _.map(items, val => {
        return addDefaults({
          key: val.key,
          config: val.config
        })
      })
    },
    setConfig(state, {key, config}) {
      let server = mget.server.fromKey(key);
      server.config = config;
    },
    setConnState(state, {key, connState}) {
      let server = mget.server.fromKey(key);
      server.connState = connState;
    }
  },
  getters: {
    forSettings (state) {
      return _.map(state.items, val => {
        return {
          key: val.key,
          config: val.config
        }
      });
    },
    items (state) {
      return state.items;
    }
  }
};

