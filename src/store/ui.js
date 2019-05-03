import _ from 'lodash';
import mget from "util/mget";

export const uiModule = {
  namespaced: true,
  state: {
    page: "server",
    activeTorrent: "",
    activeServer: "default",
    update: {
      available: false,
      url: "",
      version: ""
    }
  },
  getters: {
    activeServerName (state) {
      return mget.server.fromKey(state.activeServer).config.name;
    },
    update(state) {
      return state.update;
    }
  },
  mutations: {
    setPage(state, page) {
      state.page = page;
    },
    setTorrent (state, key) {
      state.activeTorrent = key;
    },
    // to be called when a torrent is deleted. If the active torrent page is open, then we close it.
    closeDeletedTorrent(state, key) {
      if(state.activeTorrent === key) {
        state.activeTorrent = ""
      }
    },
    hasUpdate (state, update) {
      state.update.available = true;
      state.update.url = update.url;
      state.update.version= update.version;
    }
  },
};
