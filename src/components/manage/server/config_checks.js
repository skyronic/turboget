import _ from 'lodash';
import { info, debug, warn } from "util/log";
import xmlrpc from 'xmlrpc';
import {createRTorrentClient} from "../../../providers/rtorrent";
const ftp = require("basic-ftp")
var Client = require('ssh2').Client;

// use node's axios and http req so we skip self signed certs on IP only seedboxes
let axios = require('axios');

const checkForDigestAuth = async (url) => {
  let resp = null;
  try {
    await axios.get(url);
  } catch(e) {
    let suspect_headers = ["www-authenticate"];
    if(e.request.getAllResponseHeaders().search("Digest") !== -1 && e.request.getAllResponseHeaders().search("realm") !== -1)
        return [true];

    // even though there was another error (404 or something, we only check for digest auth
    return [false];
  }

  return [false];
};


const checkRTorrentConnection  = (config) => {
  return new Promise((resolve, reject) => {
    let client = createRTorrentClient(config);
    client.methodCall("system.client_version", [], (err, value) => {
      if(err) {
        warn("Error connecting to XMLRPC", err)
        let statusCode = err && err.res && err.res.statusCode || -1
        resolve([true, "Failed to connect. " + " HTTP Status " + statusCode + ". Message: " + err]);
      }
      else {
        info("Got server version response", value);
        resolve([false,  "Connected to ruTorrent. Server version: "+ value]);
      }
    });
  });
};
export const checkRTorrentConfig = async (config) => {
  let [digest_error] = await checkForDigestAuth(config.url);

  if(digest_error) {
    return [digest_error, "HTTP Digest Auth currently not supported. Please see 'Digest auth' section in docs."];
  }

  return await checkRTorrentConnection(config);
};


export const checkFtpConfig = async (config) => {
  const client = new ftp.Client();
  // client.ftp.verbose = true;

  let ftpConfig = config.download.ftp;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.username,
      password: ftpConfig.password,
      port: ftpConfig.port,
      secure: ftpConfig.protocol === "ftp-ssl",
      secureOptions: {
        rejectUnauthorized: false
      }
    });

    // ensure folder exists
    await client.cd(ftpConfig.folder);
    return [false, "Connected successfully."];
  } catch (err) {
    return [true, "Failed to connect " + err];
  }
};

export const checkSftpConfig = (config) => {
  return new Promise((resolve, reject) => {
    let conn = new Client();
    let ftpConfig = config.download.ftp;
    conn.on('error', function (err) {
      resolve([true, "SFTP Error ." + err]);
    });
    conn.on('ready', function() {
      conn.sftp(function(err, sftp) {
        if(err)
        {
          resolve([true, "SFTP Error ." + err]);
          return;
        }

        sftp.readdir(ftpConfig.folder, function(err, list) {
          if(err) {
            resolve([true, "Error finding folder:" + err]);
            return;
          }
          resolve([false, "Connected successfully"]);
          conn.end();
        });
      });
    }).connect({
      host: ftpConfig.host,
      port: ftpConfig.port,
      username: ftpConfig.username,
      password: ftpConfig.password
    });
  });
};

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

export const checkHttpConfig = async (config) => {
  let httpConfig = config.download.http;
  let username = httpConfig.username;
  let password = httpConfig.password;

  // first check for digest auth
  let [digest_error] = await checkForDigestAuth(httpConfig.baseUrl);
  if(digest_error) {
    return [digest_error, "HTTP Digest Auth currently not supported. Please see 'Digest Auth' section in docs."];
  }

  if (httpConfig.auth === "basic-server") {
    username = config.username;
    password = config.password;
  }
  try {
    let res = await axios.get(httpConfig.baseUrl, {
      auth: {
        username: username,
        password: password
      }
    })
    debug("Request completed", res);
    return [false, "Connected successfully"];
  } catch (err) {
    return [true, "Error: " + err]
  }
};
