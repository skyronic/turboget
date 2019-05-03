import _ from 'lodash';
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import {makeRTorrentProvider} from "./rtorrent";

let cachedProviders = {};

export const makeProvider = (serverKey) => {
  if(cachedProviders.hasOwnProperty(serverKey)) {
    return cachedProviders[serverKey];
  }
  else {
    let server = mget.server.fromKey(serverKey);
    let p = new makeRTorrentProvider(server.config);
    cachedProviders[serverKey] = p;
    return p;
  }
};