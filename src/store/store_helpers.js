import _ from 'lodash';
import mget from "util/mget";
import { info, debug, warn } from "util/log";

export const getChangedKeys = (currentItems, newItems, keyName = 'key') => {
  let currentItemKeys = _.map(currentItems, keyName);
  let newItemKeys = _.map(newItems, keyName);

  let appendKeys = _.difference(newItemKeys, currentItemKeys);
  let updateKeys = _.intersection(newItemKeys, currentItemKeys);
  let deleteKeys = _.difference(currentItemKeys, newItemKeys);

  return [appendKeys, updateKeys, deleteKeys];
};