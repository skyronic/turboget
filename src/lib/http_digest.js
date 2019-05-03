// Adapted from https://github.com/bnjjj/node-request-digest


let request = require('request');
let { createHash } = require('crypto');
let _ = require('lodash');
let urlparse = require('url-parse');

module.exports = class HTTPDigest {
  constructor(username, password) {
    this.nc = 0;
    this.username = username;
    this.password = password;
    this.isReady = false;
  }

  checkSetup (method, url) {
    if(this.ready) {
      return Promise.resolve([false, false]);
    }
    else {
      return this.setup(method, url);
    }
  }

  setup(method, url) {
    return new Promise((resolve, reject) => {
      let parts = urlparse(url, true);
      let options = {};

      options.host = parts.origin;
      options.path = parts.pathname;
      options.url = url;
      options.method = method;
      this.options = options;
      return request(options, (error, res) => {
        if (error) {
          resolve([error, null]);
        }
        try {
          this._finishSetup(options, res);
          this.ready = true;
          resolve([null, false]);
        } catch (e) {
          resolve([e, null]);
        }
      });
    });
  };

  _finishSetup(options, res) {
    if (!res) {
      throw new Error('Bad request, answer is empty');
    }
    if (res.statusCode === 200) {
      throw new Error("Request succeeded, when it should not have. Is this digest?");
    }
    if (typeof res.caseless.dict['www-authenticate'] !== 'string' || res.caseless.dict['www-authenticate'] === '') {
      throw new Error('Bad request, www-authenticate field is malformed');
    }

    this.challenge = this._parseDigestResponse(res.caseless.dict['www-authenticate']);
    this.options = options;
  }

  getHeader () {
    let challenge = this.challenge;
    let options = this.options;
    let ha1 = createHash('md5');
    ha1.update([this.username, challenge.realm, this.password].join(':'));
    let ha2 = createHash('md5');
    ha2.update([options.method, options.path].join(':'));

    let {nc, cnonce} = this._generateCNONCE(challenge.qop);

    // Generate response hash
    let response = createHash('md5');
    let responseParams = [
      ha1.digest('hex'),
      challenge.nonce
    ];

    if (cnonce) {
      responseParams.push(nc);
      responseParams.push(cnonce);
    }

    responseParams.push(challenge.qop);
    responseParams.push(ha2.digest('hex'));
    response.update(responseParams.join(':'));

    // Setup response parameters
    let authParams = {
      username: this.username,
      realm: challenge.realm,
      nonce: challenge.nonce,
      uri: options.path,
      qop: challenge.qop,
      algorithm: "MD5",
      opaque: challenge.opaque,
      response: response.digest('hex')
    };

    authParams = this._omitNull(authParams);

    if (cnonce) {
      authParams.nc = nc;
      authParams.cnonce = cnonce;
    }

    return this._compileParams(authParams);
  }

  _omitNull(data) {
    // _.omit(data, (elt) => {
    //   console.log('elt ' + elt + ' et condition : ' + elt === null);
    //   return elt == null;
    // });
    let newObject = {};
    _.forEach(data, (elt, key) => {
      if (elt != null) {
        newObject[key] = elt;
      }
    });

    return newObject;
  }

  _parseDigestResponse(digestHeader) {
    let prefix = 'Digest ';
    let challenge = digestHeader.substr(digestHeader.indexOf(prefix) + prefix.length);
    let parts = challenge.split(',');
    let length = parts.length;
    let params = {};

    for (let i = 0; i < length; i++) {
      let paramSplitted = this._splitParams(parts[i]);

      if (paramSplitted && paramSplitted.length > 2) {
        params[paramSplitted[1]] = paramSplitted[2].replace(/\"/g, '');
      }
    }

    return params;
  }

  _splitParams(paramString) {
    if (!paramString) {
      return null;
    }
    return paramString.match(/^\s*?([a-zA-Z0-0]+)=("?(.*)"?|MD5|MD5-sess|token|TRUE|FALSE)\s*?$/);
  }

  //
  // ## Parse challenge digest
  //
  _generateCNONCE(qop) {
    let cnonce = false;
    let nc = false;

    if (typeof qop === 'string') {
      let cnonceHash = createHash('md5');

      cnonceHash.update(Math.random().toString(36));
      cnonce = cnonceHash.digest('hex').substr(0, 8);
      nc = this._updateNC();
    }

    return {cnonce: cnonce, nc: nc};
  }

  //
  // ## Compose authorization header
  //

  _compileParams(params) {
    let parts = [];
    for (let i in params) {
      if (typeof params[i] === 'function') {
        continue;
      }

      let param = i + '=' + (this._putDoubleQuotes(i) ? '"' : '') + params[i] + (this._putDoubleQuotes(i) ? '"' : '');
      parts.push(param);
    }

    return 'Digest ' + parts.join(',');
  }

  //
  // ## Define if we have to put double quotes or not
  //

  _putDoubleQuotes(i) {
    let excludeList = ['qop', 'nc'];

    return !_.includes(excludeList, i);
  }

  //
  // ## Update and zero pad nc
  //

  _updateNC() {
    let max = 99999999;
    let padding = new Array(8).join('0') + '';
    this.nc = (this.nc > max ? 1 : this.nc + 1);
    let nc = this.nc + '';

    return padding.substr(0, 8 - nc.length) + nc;
  }
}


/*

module.exports = class HTTPDigest {
  constructor(username, password) {
    this.nc = 0;
    this.username = username;
    this.password = password;
  }


  getHeaderForUrl (options) {
    return new Promise((resolve, reject) => {
      options.url = options.host + options.path;
      return request(options, (error, res) => {
        if (error) {
          resolve([error, null]);
        }
        try {
          let header = this._handleResponse(options, res);
          resolve([null, header]);
        } catch (e) {
          resolve([e, null]);
        }
      });
    });
  };

  _handleResponse(options, res) {
    if (!res) {
      throw new Error('Bad request, answer is empty');
    }
    if (res.statusCode === 200) {
      throw new Error ("Request succeeded, when it should not have. Is this digest?");
    }
    if (typeof res.caseless.dict['www-authenticate'] !== 'string' || res.caseless.dict['www-authenticate'] === '') {
      throw new Error('Bad request, www-authenticate field is malformed');
    }

    let challenge = this._parseDigestResponse(res.caseless.dict['www-authenticate']);
    let ha1 = createHash('md5');
    ha1.update([this.username, challenge.realm, this.password].join(':'));
    let ha2 = createHash('md5');
    ha2.update([options.method, options.path].join(':'));

    let {nc, cnonce} = this._generateCNONCE(challenge.qop);

    // Generate response hash
    let response = createHash('md5');
    let responseParams = [
      ha1.digest('hex'),
      challenge.nonce
    ];

    if (cnonce) {
      responseParams.push(nc);
      responseParams.push(cnonce);
    }

    responseParams.push(challenge.qop);
    responseParams.push(ha2.digest('hex'));
    response.update(responseParams.join(':'));

    // Setup response parameters
    let authParams = {
      username: this.username,
      realm: challenge.realm,
      nonce: challenge.nonce,
      uri: options.path,
      qop: challenge.qop,
      algorithm: "MD5",
      opaque: challenge.opaque,
      response: response.digest('hex')
    };

    authParams = this._omitNull(authParams);

    if (cnonce) {
      authParams.nc = nc;
      authParams.cnonce = cnonce;
    }

    return this._compileParams(authParams);
  }

  _omitNull(data) {
    // _.omit(data, (elt) => {
    //   console.log('elt ' + elt + ' et condition : ' + elt === null);
    //   return elt == null;
    // });
    let newObject = {};
    _.forEach(data, (elt, key) => {
      if (elt != null) {
        newObject[key] = elt;
      }
    });

    return newObject;
  }

  _parseDigestResponse(digestHeader) {
    let prefix = 'Digest ';
    let challenge = digestHeader.substr(digestHeader.indexOf(prefix) + prefix.length);
    let parts = challenge.split(',');
    let length = parts.length;
    let params = {};

    for (let i = 0; i < length; i++) {
      let paramSplitted = this._splitParams(parts[i]);

      if (paramSplitted && paramSplitted.length > 2) {
        params[paramSplitted[1]] = paramSplitted[2].replace(/\"/g, '');
      }
    }

    return params;
  }

  _splitParams(paramString) {
    if (!paramString) {
      return null;
    }
    return paramString.match(/^\s*?([a-zA-Z0-0]+)=("?(.*)"?|MD5|MD5-sess|token|TRUE|FALSE)\s*?$/);
  }

  //
  // ## Parse challenge digest
  //
  _generateCNONCE(qop) {
    let cnonce = false;
    let nc = false;

    if (typeof qop === 'string') {
      let cnonceHash = createHash('md5');

      cnonceHash.update(Math.random().toString(36));
      cnonce = cnonceHash.digest('hex').substr(0, 8);
      nc = this._updateNC();
    }

    return {cnonce: cnonce, nc: nc};
  }

  //
  // ## Compose authorization header
  //

  _compileParams(params) {
    let parts = [];
    for (let i in params) {
      if (typeof params[i] === 'function') {
        continue;
      }

      let param = i + '=' + (this._putDoubleQuotes(i) ? '"' : '') + params[i] + (this._putDoubleQuotes(i) ? '"' : '');
      parts.push(param);
    }

    return 'Digest ' + parts.join(',');
  }

  //
  // ## Define if we have to put double quotes or not
  //

  _putDoubleQuotes(i) {
    let excludeList = ['qop', 'nc'];

    return !_.includes(excludeList, i);
  }

  //
  // ## Update and zero pad nc
  //

  _updateNC() {
    let max = 99999999;
    let padding = new Array(8).join('0') + '';
    this.nc = (this.nc > max ? 1 : this.nc + 1);
    let nc = this.nc + '';

    return padding.substr(0, 8 - nc.length) + nc;
  }
}

/*
export let HTTPDigest = (function() {
  let crypto = require("crypto");
  let request = require("request");
  let _ = require("lodash");

  let HTTPDigest = function(username, password) {
    this.nc = 0;
    this.username = username;
    this.password = password;
  };

  HTTPDigest.prototype.getHeaderForUrl = async function(options) {
    return new Promise((resolve, reject) => {
      let self = this;
      options.url = options.host + options.path;
      return request(options, function(error, res) {
        if (error) {
          resolve([error, null]);
        }
        try {
          let header = self._handleResponse(options, res, callback);
          resolve([null, header]);
        } catch (e) {
          resolve([e, null]);
        }
      });
    });
  };

  //
  // ## Handle authentication
  //
  // Parse authentication headers and set response.
  //
  HTTPDigest.prototype._handleResponse = function handleResponse(
    options,
    res,
    callback
  ) {
    let challenge = this._parseDigestResponse(
      res.caseless.dict["www-authenticate"]
    );
    let ha1 = crypto.createHash("md5");
    ha1.update([this.username, challenge.realm, this.password].join(":"));
    let ha2 = crypto.createHash("md5");
    ha2.update([options.method, options.path].join(":"));

    let cnonceObj = this._generateCNONCE(challenge.qop);

    // Generate response hash
    let response = crypto.createHash("md5");
    let responseParams = [ha1.digest("hex"), challenge.nonce];

    if (cnonceObj.cnonce) {
      responseParams.push(cnonceObj.nc);
      responseParams.push(cnonceObj.cnonce);
    }

    responseParams.push(challenge.qop);
    responseParams.push(ha2.digest("hex"));
    response.update(responseParams.join(":"));

    // Setup response parameters
    let authParams = {
      username: this.username,
      realm: challenge.realm,
      nonce: challenge.nonce,
      uri: options.path,
      algorithm: "MD5",
      qop: challenge.qop,
      opaque: challenge.opaque,
      response: response.digest("hex")
    };

    authParams = this._omitNull(authParams);

    if (cnonceObj.cnonce) {
      authParams.nc = cnonceObj.nc;
      authParams.cnonce = cnonceObj.cnonce;
    }

    return this._compileParams(authParams);
  };

  //
  // ## Delete null or undefined value in an object
  //
  HTTPDigest.prototype._omitNull = function omitNull(data) {
    return _.omit(data, function(elt) {
      return elt == null;
    });
  };

  //
  // ## Parse challenge digest
  //
  HTTPDigest.prototype._parseDigestResponse = function parseDigestResponse(
    digestHeader
  ) {
    let prefix = "Digest ";
    let challenge = digestHeader.substr(
      digestHeader.indexOf(prefix) + prefix.length
    );
    let parts = challenge.split(",");
    let length = parts.length;
    let params = {};

    for (let i = 0; i < length; i++) {
      let paramSplitted = this._splitParams(parts[i]);

      if (paramSplitted.length > 2) {
        params[paramSplitted[1]] = paramSplitted[2].replace(/\"/g, "");
      }
    }

    return params;
  };

  HTTPDigest.prototype._splitParams = function splitParams(paramString) {
    return paramString.match(
      /^\s*?([a-zA-Z0-0]+)=("?(.*)"?|MD5|MD5-sess|token)\s*?$/
    );
  };

  //
  // ## Parse challenge digest
  //
  HTTPDigest.prototype._generateCNONCE = function generateCNONCE(qop) {
    let cnonce = false;
    let nc = false;

    if (typeof qop === "string") {
      let cnonceHash = crypto.createHash("md5");

      cnonceHash.update(Math.random().toString(36));
      cnonce = cnonceHash.digest("hex").substr(0, 8);
      nc = this._updateNC();
    }

    return { cnonce: cnonce, nc: nc };
  };

  //
  // ## Compose authorization header
  //
  HTTPDigest.prototype._compileParams = function compileParams(params) {
    let parts = [];
    for (let i in params) {
      if (typeof params[i] === "function") {
        continue;
      }

      let param =
        i +
        "=" +
        (this._putDoubleQuotes(i) ? '"' : "") +
        params[i] +
        (this._putDoubleQuotes(i) ? '"' : "");
      parts.push(param);
    }

    return "Digest " + parts.join(",");
  };

  //
  // ## Define if we have to put double quotes or not
  //
  HTTPDigest.prototype._putDoubleQuotes = function putDoubleQuotes(i) {
    let excludeList = ["qop", "nc"];

    return _.includes(excludeList, i) ? true : false;
  };

  //
  // ## Update and zero pad nc
  //
  HTTPDigest.prototype._updateNC = function updateNC() {
    let max = 99999999;
    this.nc++;
    if (this.nc > max) {
      this.nc = 1;
    }
    let padding = new Array(8).join("0") + "";
    let nc = this.nc + "";

    return padding.substr(0, 8 - nc.length) + nc;
  };

  // Return response handler
  return HTTPDigest;
})();

*/
