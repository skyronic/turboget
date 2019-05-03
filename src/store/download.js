import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import { getChangedKeys } from "store/store_helpers";
import {
  downloadFile,
  getDownloadsStatus,
  pauseAllDownloads, removeDownload,
  resumeAllDownloads
} from "lib/download_manager";

const removeGids = async (gids) => {
  for (let i = 0; i < gids.length; i++) {
    try {
      await removeDownload(gids[i]);
    } catch (e) {
      warn ("Failed to remove download for reason " + e.message);
    }
  }
}

export const downloadModule = {
  namespaced: true,
  state: {
    items: [

    ]
  },
  actions: {
    async downloadFile({ commit }, { fileKey, libraryKey, singleFile = true }) {
      let server = mget.server.fromFile(fileKey);
      let file = mget.file.fromKey(fileKey);
      let library = mget.library.fromKey(libraryKey);
      let torrent = mget.torrent.fromFile(fileKey);

      let gid = await downloadFile(
        torrent.info,
        file.info,
        server.config,
        library.config,
        singleFile
      );
      commit("addPendingDownloadItem", {
        gid,
        fileKey,
        libraryKey
      });
    },
    async refresh({ commit, state }) {
      let keys = _.map(state.items, "key");
      let downloadsInfo = await getDownloadsStatus(keys);
      commit("mergeItems", { items: downloadsInfo });
    },
    removeForFile({ commit, state, dispatch }, fileKey) {
      let removeKeys = _.chain(state.items)
        .filter({ file: fileKey })
        .map("key");
      _.each(removeKeys, async key => {
        // TODO: stop the download as well
        await removeDownload(key);
        commit("removeItem", key);
      });
    },
    async pauseAll({ commit, state, dispatch }) {
      await pauseAllDownloads();
      dispatch("refresh");
    },
    async resumeAll({ commit, state, dispatch }) {
      await resumeAllDownloads();
      dispatch("refresh");
    },
    async removeAll({ commit, state, dispatch, getters }) {
      let completeGids = _.chain(getters["activeItems"])
        .map(i => i.key)
        .value();
      await removeGids(completeGids);

      dispatch("refresh");
      setTimeout(() => {
        dispatch("clearComplete");
      }, 500)
    },
    clearComplete({ commit, state, dispatch, getters }) {
      let items = getters['inactiveItems'];
      _.each(items, i => {
        commit("removeItem", i.key);
      });
    }
  },
  getters: {
    readyItems: state => {
      return _.filter(state.items, { ready: true });
    },
    activeItems: state => {
      return _.filter(state.items, i => {
        if(i.ready === false)
          return false;
        return i.info.status === "active" || i.info.status === "waiting" || i.info.status === "paused";
      })
    },
    inactiveItems: state => {
      return _.filter(state.items, i => {
        if(i.ready === false)
          return false;
        return i.info.status === "complete" || i.info.status === "error" || i.info.status === 'removed';
      })
    },
    activeCount: (state, getters) => {
      return getters['activeItems'].length;
    }
  },
  mutations: {
    addPendingDownloadItem(state, { gid, fileKey, libraryKey }) {
      state.items.push({
        ready: false,
        key: gid,
        file: fileKey,
        library: libraryKey,
        info: {}
      });
    },
    mergeItems(state, { items }) {
      let [appendKeys, updateKeys, deleteKeys] = getChangedKeys(
        state.items,
        items
      );
      let findNewItemByKey = key => _.find(items, { key });

      _.each(appendKeys, val => {
        warn(
          "Trying to append key to download. Appending not allowed. Key: ", val
        );
      });
      _.each(updateKeys, val => {
        let item = mget.download.fromKey(val);
        item.info = findNewItemByKey(val).info;
        item.ready = true;
      });
      _.each(deleteKeys, val => {
        state.items = _.filter(state.items, i => i.key !== val);
      });
    },
    removeItem(state, key) {
      state.items = _.filter(state.items, i => i.key !== key);
    }
  }
};
