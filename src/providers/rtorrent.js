import _ from "lodash";
import { warn } from "util/log";
let xmlrpc = window.require("xmlrpc");

let Serializer = require("xmlrpc/lib/serializer");
let Deserializer = require("xmlrpc/lib/deserializer");
let HttpDigest = require ("../lib/http_digest");

let urlparse = require("url-parse");
const Readable = window.require("stream").Readable;
let axios = require("axios");
let rts = require("remove-trailing-slash");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const torrent_schema = [
  // key, call param, parse int
  ["hash", "d.hash=", false],
  ["name", "d.name=", false],
  ["running_state", "d.state=", true],
  ["down_rate", "d.down.rate=", true],
  ["up_total", "d.up.total=", true],
  ["up_rate", "d.up.rate=", true],
  ["bytes_done", "d.bytes_done=", true],
  ["left", "d.left_bytes=", true],
  ["size", "d.size_bytes=", true],
  ["complete", "d.complete=", true]
];

const file_schema = [
  ["path", "f.path=", false],
  ["size", "f.size_bytes=", true],
  ["priority", "f.priority=", true],
  ["completed_chunks", "f.completed_chunks=", true],
  ["size_chunks", "f.size_chunks=", true]
];

const schemaToObject = function(schema, result_row) {
  let result_obj = {};

  _.each(schema, (val, index) => {
    if (val[2]) result_obj[val[0]] = parseInt(result_row[index]);
    else result_obj[val[0]] = result_row[index];
  });

  return result_obj;
};

const schemaToQuery = function(schema, params) {
  return _.concat(params, _.map(schema, v => v[1]));
};

export const makeRTorrentProvider = function(config) {
  let digest_builder = null;

  let call_count = 0;

  let resetDigest = function () {
    digest_builder = null
    digest_builder = new HttpDigest(config.username, config.password);
  };

  this.callMethod = function(method, params = []) {
    return new Promise(async (resolve, reject) => {
      // Reset the digest auth every 10 API calls
      // this is because the digest auth headers can expire and result in 401 errors
      //
      // This also initializes digest_builder on the first time the method is called.
      if(call_count % 10 === 0) {
        resetDigest();
      }
      call_count ++;

      let url = rts(config.url) + "/plugins/httprpc/action.php";

      let request_content = Serializer.serializeMethodCall(method, params);
      let response_content = "";

      if (config.auth === "basic") {
        let response = null;
        try {
          response = await axios.post(url, request_content, {
            auth: {
              username: config.username,
              password: config.password
            }
          });
          response_content = response.data;
        } catch (e) {
          resolve([e, null]);
          return;
        }
      } else if (config.auth === "digest") {
        let [err] = await digest_builder.checkSetup("POST", url);
        if (err) {
          warn("Could not setup digest", err);
          resolve([err, null]);
        }

        let digest_header = digest_builder.getHeader();

        let response = null;
        try {
          response = await axios.post(url, request_content, {
            headers: {
              Authorization: digest_header
            }
          });
          response_content = response.data;
        } catch (e) {
          resolve([e, null]);
          return;
        }
      }

      if (response_content === "") {
        warn("Invalid response");
        resolve([true, null]);
        return;
      }

      const s = new Readable();
      s.push(response_content);
      s.push(null);

      let d = new Deserializer();
      d.deserializeMethodResponse(s, function(err, res) {
        resolve([err, res]);
      });
    });
  }

  let callMethod = this.callMethod;


  this.fetchTorrents = async function() {
    let [error, response] = await callMethod(
      "d.multicall2",
      schemaToQuery(torrent_schema, ["", "main"])
    );

    if (error) {
      return [error, []];
    }

    // generate list of items
    return [
      false,
      _.map(response, row => {
        return {
          key: row[0],
          info: schemaToObject(torrent_schema, row)
        };
      })
    ];
  };

  this.getFilesForTorrent = async function(torrentKey) {
    let [error, response] = await callMethod(
      "f.multicall",
      schemaToQuery(file_schema, [torrentKey, ""])
    );

    if (error) {
      return [];
    }

    return _.map(response, row => {
      return {
        key: row[0],
        info: schemaToObject(file_schema, row)
      };
    });
  };

  this.addMagnetUrl = async function(magnetURL) {
    let [error, response] = await callMethod("load.start", ["", magnetURL]);

    if (error) {
      return [error];
    }

    return [false];
  };

  this.pauseTorrent = async function(torrentKey) {
    let [error, response] = await callMethod("d.stop", [torrentKey]);

    if (error) {
      return [error];
    }

    return [false];
  };
  this.resumeTorrent = async function(torrentKey) {
    let [error, response] = await callMethod("d.start", [torrentKey]);

    if (error) {
      return [error];
    }

    return [false];
  };
};
