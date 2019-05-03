// Model get
import store from "store";
import _ from "lodash";
import { info, debug, warn } from "util/log";

function findFromItems(items, key, keyName = "key") {
  let result = _.find(items, { [keyName]: key });

  if (!result) {
    warn("Unable to find item for key", keyName);
    return {};
  }

  return result;
}

let mget = {
  server: {
    fromKey(key) {
      return findFromItems(store.state.server.items, key);
    },
    fromTorrent(torrent_key) {
      let t = mget.torrent.fromKey(torrent_key);
      return mget.server.fromKey(t.server);
    },
    fromFile(file_key) {
      let t = mget.torrent.fromFile(file_key);
      return mget.server.fromKey(t.server);
    },
    fromDownload(download_key) {
      warn("Not implemented");
    }
  },
  torrent: {
    fromKey(key) {
      return findFromItems(store.state.torrent.items, key);
    },
    fromFile(file_key) {
      let f = mget.file.fromKey(file_key);
      return mget.torrent.fromKey(f.torrent);
    },
    fromDownload(download_key) {
      warn("Not implemented");
    }
  },
  file: {
    fromKey(key) {
      return findFromItems(store.state.file.items, key);
    },
    fromDownload(download_key) {
      warn("Not implemented");
    }
  },
  download: {
    fromKey(key) {
      return findFromItems(store.state.download.items, key);
    }
  },
  library: {
    fromKey(key) {
      return findFromItems(store.state.library.items, key);
    }
  }
};

export default mget;
