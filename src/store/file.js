import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import { getChangedKeys } from "store/store_helpers";
import { makeProvider } from "../providers";

export const fileModule = {
  namespaced: true,
  state: {
    items: []
  },
  actions: {
    async fetchFiles({ commit, state, dispatch }, torrentKey) {
      let server = mget.server.fromTorrent(torrentKey);
      let provider = makeProvider(server.key);
      let files = await provider.getFilesForTorrent(torrentKey);

      dispatch("mergeItems", { items: files, torrentKey });
    },
    mergeItems({commit, state, dispatch}, { items, torrentKey }) {
      let [appendKeys, updateKeys, deleteKeys] = getChangedKeys(
        state.items,
        items
      );
      let findNewItemByKey = key => _.find(items, { key });

      _.each(appendKeys, val => {
        let newItem = findNewItemByKey(val);
        commit('addItem', {
          key: newItem.key,
          torrent: torrentKey,
          info: newItem.info
        });
      });
      _.each(updateKeys, key => {
        commit("updateItem", {key, info: findNewItemByKey(key).info});
      });
      // TODO: not sure if we need to go through delete keys since this seems to make
      // all not belonging to the current torrent as delete keys
      // we should delete but only when chained through the torrent
      //
      // _.each(deleteKeys, val => {
      //   warn("Detected files missing, this should generally not happen");
      //   dispatch("download/removeForFile", {fileKey: val}, {root: true})
      //   commit("removeItem", val);
      // });
    },
    removeForTorrent ({commit, state, dispatch}, torrentKey) {
      let removeKeys = _.chain(state.items).filter({torrent: torrentKey}).map('key').value();
      _.each(removeKeys, key => {
        dispatch("download/removeForFile", {fileKey: key}, {root: true})
        commit("removeItem", key);
      })
    }
  },
  mutations: {
    addItem(state, payload) {
      state.items.push(payload);
    },
    updateItem(state, {key, info}) {
      let item = mget.file.fromKey(key);
      item.info = info;
    },
    removeItem(state, key) {
      state.items = _.filter(state.items, { key });
    }
  },
  getters: {
    items(state) {
      return state.items;
    },
    filterByTorrent(state) {
      return key => {
        return _.filter(state.items, { torrent: key });
      };
    },
  }
};
