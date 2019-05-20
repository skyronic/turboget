import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import { getChangedKeys } from "store/store_helpers";
import {makeProvider} from "../providers";
import slugify from "slugify";

export const torrentModule = {
  namespaced: true,
  state: {
    items: []
  },
  actions: {
    async refreshTorrents({commit, state, dispatch, rootState}, serverKey) {
      let provider = makeProvider(serverKey);
      let [error, torrents] = await provider.fetchTorrents();
      if(error) {
        warn("Error connecting to seedbox", error);
        commit("server/setConnState", {key: serverKey, connState: "error"}, {root: true});
      }
      else {
        commit("server/setConnState", {key: serverKey, connState: "connected"}, {root: true});
        dispatch('mergeItems', {items: torrents, serverKey});
      }
    },
    mergeItems({commit, dispatch, state }, { items,serverKey }) {
      let [appendKeys, updateKeys, deleteKeys] = getChangedKeys(
        state.items,
        items
      );
      let findNewItemByKey = key => _.find(items, { key });

      _.each(appendKeys, val => {
        let newItem = findNewItemByKey(val);
        commit('addItem', {
          key: newItem.key,
          server: serverKey,
          info: newItem.info
        });
      });
      _.each(updateKeys, val => {
        commit('updateItem', {key: val, info: findNewItemByKey(val).info})
      });
      _.each(deleteKeys, val => {
        // remove all files for the torrent
        commit("ui/closeDeletedTorrent", val, {root: true});
        dispatch("file/removeForTorrent", val, {root: true});
        commit("removeItem", val);
      })
    }
  },
  mutations: {
    addItem(state, payload) {
      state.items.push(payload);
    },
    updateItem(state, {key, info}) {
      let item = mget.torrent.fromKey(key);
      item.info = info;
    },
    removeItem(state, key) {
      state.items = _.filter(state.items, function(i) { return i.key !== key });
    }
  },
  getters: {
    items(state) {
      return state.items;
    },
    forServer (state) {
      return serverKey => {
        return _.filter(state.items, val => val.server === serverKey)
      }
    }
  }
};

export const makeFolderNameForTorrent = function(torrentInfo) {
  return slugify(torrentInfo.name).substr(0, 40);
}
