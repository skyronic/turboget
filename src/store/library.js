import _ from 'lodash';
import mget from "util/mget";

export const libraryModule = {
  namespaced: true,
  state: {
    items: []
  },
  mutations: {
    restoreFromSettings (state, {items}) {
      state.items = _.map(items, val => {
        return {
          key: val.key,
          config: val.config
        }
      })
    },
    setConfig(state, {key, config}) {
      let lib = mget.library.fromKey(key);
      lib.config = config;
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
    forSelect (state) {
      return _.map(state.items, val => {
        return {
          value: val.key,
          text: val.config.name
        }
      });
    },
    items (state) {
      return state.items;
    },
    defaultLibraryReady(state) {
      return (state.items.length > 0 && state.items[0].config.configReady);
    }
  }
};

