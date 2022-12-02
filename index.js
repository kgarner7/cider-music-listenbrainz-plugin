'use strict';

var path = require('path');
var electron = require('electron');

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}

var lzString = {exports: {}};

(function (module) {
// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.4
var LZString = (function() {

// private property
var f = String.fromCharCode;
var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
var baseReverseDic = {};

function getBaseValue(alphabet, character) {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (var i=0 ; i<alphabet.length ; i++) {
      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    }
  }
  return baseReverseDic[alphabet][character];
}

var LZString = {
  compressToBase64 : function (input) {
    if (input == null) return "";
    var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
    switch (res.length % 4) { // To produce valid Base64
    default: // When could this happen ?
    case 0 : return res;
    case 1 : return res+"===";
    case 2 : return res+"==";
    case 3 : return res+"=";
    }
  },

  decompressFromBase64 : function (input) {
    if (input == null) return "";
    if (input == "") return null;
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
  },

  compressToUTF16 : function (input) {
    if (input == null) return "";
    return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
  },

  decompressFromUTF16: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
  },

  //compress into uint8array (UCS-2 big endian format)
  compressToUint8Array: function (uncompressed) {
    var compressed = LZString.compress(uncompressed);
    var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

    for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
      var current_value = compressed.charCodeAt(i);
      buf[i*2] = current_value >>> 8;
      buf[i*2+1] = current_value % 256;
    }
    return buf;
  },

  //decompress from uint8array (UCS-2 big endian format)
  decompressFromUint8Array:function (compressed) {
    if (compressed===null || compressed===undefined){
        return LZString.decompress(compressed);
    } else {
        var buf=new Array(compressed.length/2); // 2 bytes per character
        for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
          buf[i]=compressed[i*2]*256+compressed[i*2+1];
        }

        var result = [];
        buf.forEach(function (c) {
          result.push(f(c));
        });
        return LZString.decompress(result.join(''));

    }

  },


  //compress into a string that is already URI encoded
  compressToEncodedURIComponent: function (input) {
    if (input == null) return "";
    return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
  },

  //decompress from an output of compressToEncodedURIComponent
  decompressFromEncodedURIComponent:function (input) {
    if (input == null) return "";
    if (input == "") return null;
    input = input.replace(/ /g, "+");
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
  },

  compress: function (uncompressed) {
    return LZString._compress(uncompressed, 16, function(a){return f(a);});
  },
  _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
    if (uncompressed == null) return "";
    var i, value,
        context_dictionary= {},
        context_dictionaryToCreate= {},
        context_c="",
        context_wc="",
        context_w="",
        context_enlargeIn= 2, // Compensate for the first entry which should not count
        context_dictSize= 3,
        context_numBits= 2,
        context_data=[],
        context_data_val=0,
        context_data_position=0,
        ii;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position ==bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }


        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    // Output the code for w.
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
        if (context_w.charCodeAt(0)<256) {
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<8 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<16 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position == bitsPerChar-1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }


      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    // Mark the end of the stream
    value = 2;
    for (i=0 ; i<context_numBits ; i++) {
      context_data_val = (context_data_val << 1) | (value&1);
      if (context_data_position == bitsPerChar-1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    // Flush the last char
    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar-1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      }
      else context_data_position++;
    }
    return context_data.join('');
  },

  decompress: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
  },

  _decompress: function (length, resetValue, getNextValue) {
    var dictionary = [],
        enlargeIn = 4,
        dictSize = 4,
        numBits = 3,
        entry = "",
        result = [],
        i,
        w,
        bits, resb, maxpower, power,
        c,
        data = {val:getNextValue(0), position:resetValue, index:1};

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i;
    }

    bits = 0;
    maxpower = Math.pow(2,2);
    power=1;
    while (power!=maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb>0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (bits) {
      case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 2:
        return "";
    }
    dictionary[3] = c;
    w = c;
    result.push(c);
    while (true) {
      if (data.index > length) {
        return "";
      }

      bits = 0;
      maxpower = Math.pow(2,numBits);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (c = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 2:
          return result.join('');
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[c]) {
        entry = dictionary[c];
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result.push(entry);

      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

    }
  }
};
  return LZString;
})();

if( module != null ) {
  module.exports = LZString;
}
}(lzString));

var lz = lzString.exports;

const PLUGIN_NAME = "listenbrainz";
let StorageType;
(function (StorageType) {
  StorageType["general"] = "General";
  StorageType["listenbrainz"] = "ListenBrainz";
  StorageType["libre"] = "LibreFM";
  StorageType["maloja"] = "Maloja";
})(StorageType || (StorageType = {}));

class StorageUtil {
  static async sleep(timeInMs) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, timeInMs);
    });
  }
  static handleLibreBackground(_event, data) {
    const originalData = StorageUtil.libreData;
    if (data.ok) {
      originalData.session = data.key;
      originalData.username = data.username;
    } else {
      originalData.enabled = false;
      originalData.session = null;
      originalData.username = null;
    }
    StorageUtil.libreData = originalData;
  }
  static alert(message) {
    bootbox.alert(`${app.getLz("term.requestError")}: ${message}`);
  }
  static emptyGeneralData() {
    return {
      debug: false,
      delay: 50,
      filterLoop: false,
      nowPlaying: false
    };
  }
  static get generalStorage() {
    const data = this.getStorage(StorageType.general);
    if (this.isGeneralData(data)) {
      return data;
    } else {
      const data = this.emptyGeneralData();
      this.generalStorage = data;
      return data;
    }
  }
  static set generalStorage(value) {
    this.setStorage(StorageType.general, value);
  }
  static emptyProviderData() {
    return {
      enabled: false,
      token: null,
      url: null,
      username: null
    };
  }
  static getBrainzData(maloja) {
    const key = maloja ? StorageType.maloja : StorageType.listenbrainz;
    const data = this.getStorage(key);
    if (this.isProviderSetting(data)) {
      return data;
    } else {
      const data = this.emptyProviderData();
      this.setBrainzData(data, maloja);
      return data;
    }
  }
  static setBrainzData(data, maloja) {
    this.setStorage(maloja ? StorageType.maloja : StorageType.listenbrainz, data);
  }
  static emptyLibreData() {
    return {
      enabled: false,
      session: null,
      username: null
    };
  }
  static get libreData() {
    const data = this.getStorage(StorageType.libre);
    if (this.isLibreFMSetting(data)) {
      return data;
    } else {
      const data = this.emptyLibreData();
      this.libreData = data;
      return data;
    }
  }
  static set libreData(value) {
    this.setStorage(StorageType.libre, value);
  }
  static isGeneralData(data) {
    if (data === undefined || data === null) return false;
    return typeof data.debug === "boolean" && typeof data.delay === "number" && typeof data.filterLoop === "boolean" && typeof data.nowPlaying === "boolean";
  }
  static isProviderSetting(data) {
    if (data === undefined || data === null) return false;
    return typeof data.enabled === "boolean" && (data.token === null || typeof data.token === "string") && (data.username === null || typeof data.username === "string") && (data.url === null || typeof data.url === "string");
  }
  static isLibreFMSetting(data) {
    if (data === undefined || data === null) return false;
    return typeof data.enabled === "boolean" && (data.session === null || typeof data.session === "string") && (data.username === null || typeof data.username === "string");
  }
  static getStorage(key, compress = false) {
    let json = localStorage.getItem(`plugin.${PLUGIN_NAME}.${this.SETTINGS_KEY}.${key.toLocaleLowerCase()}`);
    if (compress && json !== null) {
      json = lz.decompress(json);
    }
    return json ? JSON.parse(json) : null;
  }
  static setStorage(key, data, compress = false) {
    let string = JSON.stringify(data);
    if (compress) {
      string = lz.compress(string);
    }
    localStorage.setItem(`plugin.${PLUGIN_NAME}.${this.SETTINGS_KEY}.${key.toLocaleLowerCase()}`, string);
  }
}
_defineProperty(StorageUtil, "SETTINGS_KEY", "settings");

const name="cider-music-listenbrainz-plugin";const version="1.0.7";const author="Kendall Garner <17521368+kgarner7@users.noreply.github.com>";const description="Cider Libre.fm/ListenBrainz/Maloja Scrobbler";const repository={type:"git",url:"git+https://github.com/kgarner7/cider-music-listenbrainz-plugin"};

const USER_AGENT = `${name}/${version} { ${repository.url} }`;
var pkg = {
  author,
  description,
  name,
  repository,
  version
};

class BaseProvider {
  static init(env, net) {
    this.env = env;
    this.net = net;
  }
  constructor(provider) {
    _defineProperty(this, "provider", void 0);
    _defineProperty(this, "settings", void 0);
    _defineProperty(this, "urlencoded", false);
    this.settings = {
      enabled: false,
      session: null,
      token: null,
      url: null,
      username: null
    };
    this.provider = provider;
    electron.ipcMain.handle(`plugin.${PLUGIN_NAME}.${this.provider}`, (_event, settings) => {
      this.update(settings);
    });
  }
  enabled() {
    return this.settings.enabled && this.settings.username !== undefined;
  }
  async getAuthToken() {
    throw new Error("This function must be overridden");
  }
  scrobbleSong(_payload, _scrobbledAt) {
    throw new Error("This function must be overridden");
  }
  updateListening(_payload) {
    throw new Error("This function must be overridden");
  }
  update(_settings) {
    throw new Error("This function must be overridden");
  }
  async authenticate() {
    try {
      let auth;
      try {
        auth = await this.timeoutPromise(this.auth());
      } catch (error) {
        auth = {
          ok: false,
          error: error.message
        };
      }
      BaseProvider.env.utils.getWindow().webContents.send(`plugin.${PLUGIN_NAME}.${this.provider}.name`, auth);
      this.settings.username = auth.ok ? auth.username : null;
      this.settings.session = auth.ok ? auth.key || null : null;
    } catch (error) {
      // We should never get here, but just in case.
      console.error("[Plugin][%s]: Error when authenticating ", error);
    }
  }
  async auth() {
    throw new Error("This function must be overridden");
  }
  getApiUrl() {
    throw new Error("This function must be overridden");
  }
  static logError(error) {
    if (!error.net) {
      console.error("[Plugin][%s]: %s (status code %d)", PLUGIN_NAME, error.msg, error.code);
    } else {
      console.error("[Plugin][%s]: ", PLUGIN_NAME, error.error);
    }
  }
  async timeoutPromise(promise, timeoutMs = BaseProvider.TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timed out after ${timeoutMs} ms`));
      }, timeoutMs);
      promise.then(res => {
        clearTimeout(timeoutId);
        resolve(res);
      }).catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }
  async sendRequest(endpoint, jsonBody, method = "POST") {
    return new Promise((resolve, reject) => {
      const request = BaseProvider.net.request({
        url: `${this.getApiUrl()}/${endpoint}`,
        method: method
      });
      if (this.provider !== StorageType.libre) {
        request.setHeader("Authorization", `Token ${this.settings.token}`);
      }
      request.setHeader("User-Agent", USER_AGENT);
      request.on("response", response => {
        let body = "";
        response.on("end", () => {
          try {
            const respJson = JSON.parse(body);

            // A response is only OK if it has HTTP code 200.
            if (response.statusCode === 200) {
              resolve(respJson);
            } else {
              reject({
                code: response.statusCode,
                net: false,
                msg: respJson.error
              });
            }
          } catch (error) {
            reject({
              error: error,
              net: true
            });
          }
        });
        response.on("data", chunk => {
          body += chunk.toString("utf-8");
        });
      });
      request.on("error", error => {
        reject({
          error,
          net: true
        });
      });

      // If we have a body (e.g., not validate-token), send that
      if (jsonBody) {
        if (this.urlencoded) {
          request.setHeader("Content-Type", "application/x-www-form-urlencoded");
          request.write(new URLSearchParams(jsonBody).toString(), "utf-8");
        } else {
          request.setHeader("Content-Type", "application/json");
          request.write(JSON.stringify(jsonBody), "utf-8");
        }
      }
      request.end();
    });
  }
}
_defineProperty(BaseProvider, "TIMEOUT_MS", 10_000);
_defineProperty(BaseProvider, "env", void 0);
_defineProperty(BaseProvider, "net", void 0);

class ListenBrainzProvider extends BaseProvider {
  constructor(provider) {
    super(provider);
  }

  /** @override */
  getApiUrl() {
    if (this.provider === StorageType.listenbrainz) {
      return this.settings.url || "https://api.listenbrainz.org";
    } else {
      if (this.settings.url !== undefined) {
        return `${this.settings.url}/apis/listenbrainz`;
      } else {
        return undefined;
      }
    }
  }

  /** @override */
  scrobbleSong(payload, scrobbledAt) {
    const submission = {
      listen_type: "single",
      payload: [_objectSpread2({
        listened_at: Math.floor(scrobbledAt.getTime() / 1000)
      }, payload)]
    };
    new Promise(async resolve => {
      for (let tries = 1; tries <= 5; tries++) {
        try {
          await this.timeoutPromise(this.sendRequest("1/submit-listens", submission));
        } catch (error) {
          const err = error;
          BaseProvider.logError(err);
          if (err.net || err.code !== 503) {
            break;
          }

          // Sleep for 10 seconds * how many tries we've made
          await StorageUtil.sleep(10_000 * tries);
        }
      }
      resolve();
    }).then(() => {}).catch(error => {
      console.error("[Plugin][%s]: ", PLUGIN_NAME, error);
    });
  }

  /** @override */
  updateListening(payload) {
    if (this.provider === StorageType.maloja) {
      // Maloja does not support now playing
      return;
    } else {
      const submission = {
        listen_type: "playing_now",
        payload: [payload]
      };
      this.timeoutPromise(this.sendRequest("/1/submit-listens", submission)).catch(BaseProvider.logError);
    }
  }

  /** @override */
  update(settings) {
    const needsAuth = this.settings.token !== settings.token || this.settings.url !== settings.url;
    this.settings = settings;
    if (needsAuth && this.settings.token && (this.provider === StorageType.listenbrainz || this.settings.url)) {
      this.settings.username = null;
      this.authenticate();
    }
  }
  async auth() {
    try {
      const data = await this.timeoutPromise(this.sendRequest("1/validate-token", undefined, "GET"));
      if (data.valid) {
        return {
          ok: true,
          username: data.user_name
        };
      } else {
        return {
          ok: false,
          error: data.message
        };
      }
    } catch (error) {
      const reqError = error;
      if (reqError.net) {
        return {
          ok: false,
          error: reqError.error.message
        };
      } else {
        return {
          ok: false,
          error: reqError.msg
        };
      }
    }
  }
}

// One minute
const CONNECTIVITY_TIMEOUT = 60_000;
function isLibreError(data) {
  return (typeof data.error === "string" || typeof data.error === "number") && typeof data.message === "string";
}
class LibreFMProvider extends BaseProvider {
  constructor() {
    super(StorageType.libre);
    _defineProperty(this, "connectTimer", void 0);
    this.urlencoded = true;
    electron.ipcMain.handle(`plugin.${PLUGIN_NAME}.${StorageType.libre}.token`, async () => {
      return this.getAuthToken();
    });
  }
  getApiUrl() {
    return "https://libre.fm";
  }
  async getAuthToken() {
    try {
      const data = await this.timeoutPromise(this.sendRequest("2.0?method=auth.getToken&format=json"));
      if (isLibreError(data)) {
        return {
          ok: false,
          msg: data.message
        };
      } else {
        const token = data.token;
        this.settings.token = token;
        if (this.connectTimer) clearInterval(this.connectTimer);
        this.connectTimer = setTimeout(() => {
          this.authenticate();
        }, CONNECTIVITY_TIMEOUT);
        return {
          ok: true,
          token,
          key: this.apiKey()
        };
      }
    } catch (error) {
      return {
        ok: false,
        msg: error.message
      };
    }
  }
  scrobbleSong(payload, scrobbledAt) {
    const submission = new URLSearchParams({
      method: "track.scrobble",
      track: payload.track_metadata.track_name,
      artist: payload.track_metadata.artist_name,
      sk: this.settings.session,
      format: "json",
      mbid: payload.track_metadata.additional_info.recording_mbid ?? "",
      timestamp: Math.floor(scrobbledAt.getTime() / 1000).toString()
    });
    this.timeoutPromise(this.sendRequest("2.0/", submission)).then(() => {}).catch(error => {
      console.error("[Plugin][%s]", PLUGIN_NAME, error);
    });
  }
  updateListening(payload) {
    const submission = new URLSearchParams({
      method: "track.updatenowplaying",
      track: payload.track_metadata.track_name,
      artist: payload.track_metadata.artist_name,
      sk: this.settings.session,
      format: "json",
      mbid: payload.track_metadata.additional_info.recording_mbid ?? ""
    });
    this.timeoutPromise(this.sendRequest("2.0/", submission.toString())).then(() => {}).catch(error => {
      console.error("[Plugin][%s]", PLUGIN_NAME, error);
    });
  }
  update(settings) {
    // If we have no session, then either we just started, or we are attempting to authenticate.
    if (!this.settings.session) {
      // Only update the username when we lack a session; if we have one, we know it is valid
      if (this.settings.username !== settings.username) {
        this.settings.username = settings.username;
      }
      this.settings.enabled = settings.enabled;
      if (settings.session) {
        this.settings.session = settings.session;
      } else if (this.settings.token) {
        this.settings.username = null;
        this.authenticate();
      }
    } else {
      if (!settings.session) {
        this.settings.enabled = false;
        this.settings.session = null;
        this.settings.token = null;
        this.settings.username = null;
      } else {
        this.settings.enabled = settings.enabled;
      }
    }
  }
  async auth() {
    if (this.connectTimer) {
      clearInterval(this.connectTimer);
      this.connectTimer = undefined;
    }
    try {
      const search = new URLSearchParams({
        format: "json",
        token: this.settings.token,
        api_key: this.apiKey(),
        method: "auth.getSession"
      });
      const data = await this.timeoutPromise(this.sendRequest(`2.0?${search.toString()}`, undefined, "GET"));
      if (isLibreError(data)) {
        this.settings.enabled = false;
        return {
          ok: false,
          error: data.message
        };
      } else {
        this.settings.session = data.session.key;
        this.settings.username = data.session.name;
        return {
          ok: true,
          key: data.session.key,
          username: data.session.name
        };
      }
    } catch (error) {
      this.settings.enabled = false;
      const reqError = error;
      if (reqError.net) {
        return {
          ok: false,
          error: reqError.error.message
        };
      } else {
        return {
          ok: false,
          error: reqError.msg
        };
      }
    }
  }
  apiKey() {
    return "Z9YwDsJm3EFauHkuLNPnTNN2DUv25SP7rxeAQxsn";
  }
}

const MAX_FRACTION_BEFORE_SCROBBLING = 0.9;

// Adapted heavily from https://github.com/ciderapp/Cider/blob/dfd3fe6271f8328e3530bc7bc89d60c2f9536b87/src/main/plugins/lastfm.ts
// In particular, getPrimaryArtist is virtually the same
class CiderListenbrainzBackend {
  constructor(env) {
    _defineProperty(this, "name", pkg.description);
    _defineProperty(this, "version", pkg.version);
    _defineProperty(this, "author", pkg.author);
    _defineProperty(this, "env", void 0);
    _defineProperty(this, "store", void 0);
    _defineProperty(this, "net", void 0);
    _defineProperty(this, "providers", void 0);
    _defineProperty(this, "settings", {
      debug: false,
      delay: 50,
      filterLoop: false,
      nowPlaying: false
    });
    _defineProperty(this, "cachedNowPlayingId", void 0);
    _defineProperty(this, "cachedId", void 0);
    _defineProperty(this, "timer", void 0);
    _defineProperty(this, "id", void 0);
    _defineProperty(this, "payload", void 0);
    _defineProperty(this, "scrobbled", false);
    _defineProperty(this, "startTime", 0);
    _defineProperty(this, "timeElapsedMs", 0);
    this.env = env;
    this.store = env.utils.getStore();
  }
  onReady(_win) {
    const {
      net
    } = require("electron");
    this.net = net;
    this.providers = {
      librefm: new LibreFMProvider(),
      listenbrainz: new ListenBrainzProvider(StorageType.listenbrainz),
      maloja: new ListenBrainzProvider(StorageType.maloja)
    };
    BaseProvider.init(this.env, this.net);

    // Handle Pause/Play Events. We want to keep track of the total time elapsed
    try {
      electron.ipcMain.on("playbackStateDidChange", (_event, data) => {
        if (!this.store.general.privateEnabled && this.enabled() && this.payload?.track_metadata && data.artistName) {
          if (data.status) {
            this.startTime = data.startTime;
            this.scrobbleSong();
          } else {
            if (this.timer) {
              clearTimeout(this.timer);
              this.timer = undefined;
            }
            this.timeElapsedMs += data.startTime - this.startTime;
          }
        }
      });

      // Handle new tracks
      electron.ipcMain.on("nowPlayingItemDidChange", async (_event, data) => {
        if (!this.store.general.privateEnabled && this.enabled() && data.artistName) {
          // Save the ID; this will be used for later checks
          this.id = data.playParams.catalogId || data.playParams.id;

          // This is available for Apple Music tracks
          if (data.isrc) {
            // Upper-case, because apparently it's sometimes not all uppercase
            const isrc = data.isrc.substring(data.isrc.length - 12).toLocaleUpperCase();
            try {
              // Attempt to lookup by ISRC first
              this.payload = await this.lookupIsrc(isrc, data.url.appleMusic);
              if (!this.payload && this.settings.debug) {
                console.info("[Plugin][%s][%s][%s]: ISRC not found", PLUGIN_NAME, isrc, data.name);
              }
            } catch (error) {
              if (this.settings.debug) {
                console.error("[Plugin][%s][%s][%s]", PLUGIN_NAME, isrc, data.name, error);
              }
              this.payload = undefined;
            }
            if (!this.payload) {
              const album = data.albumName.replace(/ - Single| - EP/g, '');

              // This forms the core of a payload for ListenBrainz
              // https://listenbrainz.readthedocs.io/en/latest/users/json.htm
              this.payload = {
                track_metadata: {
                  additional_info: {
                    duration_ms: data.durationInMillis,
                    isrc: data.isrc,
                    music_service: "music.apple.com",
                    origin_url: data.url.appleMusic,
                    tracknumber: data.trackNumber
                  },
                  artist_name: data.artistName,
                  release_name: album,
                  track_name: data.name
                }
              };
            }
          } else {
            // Local files have reduced metadata (and are currently given an id starting with ciderlocal)
            if (data.playParams.id.startsWith("ciderlocal")) {
              const album = data.albumName.replace(/ - Single| - EP/g, '');
              this.payload = {
                track_metadata: {
                  additional_info: {
                    duration_ms: data.durationInMillis,
                    music_service: "music.apple.com",
                    tracknumber: data.trackNumber
                  },
                  artist_name: data.albumName,
                  release_name: album,
                  track_name: data.name
                }
              };
            } else {
              // Otherwise, it's probably a podcast. This is unsupported
              this.payload = undefined;
              if (this.timer) {
                clearTimeout(this.timer);
                this.timer = undefined;
              }
              return;
            }
          }
          this.scrobbled = false;
          // Reset custom variables to keep track of timing
          this.startTime = data.startTime;
          this.timeElapsedMs = 0;

          // Adapted from LastFM plugin; if we do not filter loop, clear prior
          // IDs. Otherwise, they are preserved (which can detect duplicate tracks)
          if (!this.settings.filterLoop) {
            this.cachedId = undefined;
            this.cachedNowPlayingId = undefined;
          }
          if (this.settings.nowPlaying) {
            this.updateNowPlayingSong();
          }
          this.scrobbleSong();
        }
      });
      electron.ipcMain.handle(`plugin.${PLUGIN_NAME}.${StorageType.general}`, (_event, settings) => {
        this.settings = settings;
      });
    } catch (_ignored) {
      // An error should only fire if we attempt to handle a second time.
      // This seems to happen if you are prompted to log in and then press continue. In this case,
      // we should ignore the error
    }
    console.info("[Plugin][ListenBrainz]: Ready");
  }
  onRendererReady(_win) {
    this.env.utils.loadJSFrontend(path.join(this.env.dir, "index.frontend.js"));
    console.info("[Plugin][ListenBrainz]: Renderer Ready");
  }
  enabled() {
    for (const provider of Object.values(this.providers)) {
      if (provider.enabled()) {
        return true;
      }
    }
    return false;
  }
  updateNowPlayingSong() {
    if (!this.net || this.cachedNowPlayingId === this.id || !this.payload) return;
    const payload = this.payload;
    for (const provider of Object.values(this.providers)) {
      if (provider.enabled()) {
        provider.updateListening(payload);
      }
    }
  }
  scrobbleSong() {
    if (this.timer) clearTimeout(this.timer);
    if (!this.payload) return;
    const self = this;
    const payload = this.payload;

    // Calculate the amount of time to wait in a song
    const timeToWaitMs = Math.round(this.payload.track_metadata.additional_info.duration_ms * Math.min(self.settings.delay / 100, MAX_FRACTION_BEFORE_SCROBBLING));

    // The amount of time left is the time to wait minus the elapsed time
    let remainingTime = timeToWaitMs - this.timeElapsedMs;

    // If somehow the time is negative, but we haven't scrobbled, trigger a scrobble.
    if (remainingTime < 0 && !this.scrobbled) {
      remainingTime = 0;
    } else if (this.scrobbled) {
      remainingTime = -1;
    }

    // Set a timer for the remaining time.
    if (remainingTime >= 0) {
      self.timer = setTimeout(() => {
        self.timer = undefined;
        if (!self.net || self.cachedId === this.id) return;
        self.scrobbled = true;
        const scrobbleTime = new Date();
        for (const provider of Object.values(self.providers)) {
          if (provider.enabled()) {
            provider.scrobbleSong(payload, scrobbleTime);
          }
        }
      }, remainingTime);
    }
  }
  async lookupIsrc(isrc, url) {
    return new Promise((resolve, reject) => {
      try {
        const request = this.net.request(`https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`);
        request.setHeader("User-Agent", USER_AGENT);
        request.on("response", response => {
          let body = "";
          response.on("end", () => {
            try {
              const json = JSON.parse(body);
              if (json.error) {
                reject(json.error);
              } else {
                if (json.count === 1) {
                  const recording = json.recordings[0];
                  let artistNames = "";
                  const artists = [];
                  for (const artist of recording["artist-credit"]) {
                    artistNames += artist.name + (artist.joinphrase || "");
                    artists.push(artist["artist"].id);
                  }
                  resolve({
                    track_metadata: {
                      additional_info: {
                        artist_mbids: artists,
                        duration_ms: recording.length,
                        isrc: isrc,
                        music_service: "music.apple.com",
                        origin_url: url,
                        recording_mbid: recording.id
                      },
                      artist_name: artistNames,
                      track_name: recording.title
                    }
                  });
                } else {
                  resolve(undefined);
                }
              }
            } catch (error) {
              // We should never get here, but just in case.....
              reject(error);
            }
          });

          // We may have multiple data chunks
          response.on("data", chunk => {
            body += chunk.toString("utf-8");
          });
        });
        request.on("error", reject);
        request.end();
      } catch (error) {
        // We should never get here...
        reject(error);
      }
    });
  }
}

module.exports = CiderListenbrainzBackend;
