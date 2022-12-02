var ListenBrainzPlugin = (function (exports) {
  'use strict';

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

  var Vue$1 = Vue;

  const PLUGIN_NAME = "listenbrainz";
  exports.StorageType = void 0;
  (function (StorageType) {
    StorageType["general"] = "General";
    StorageType["listenbrainz"] = "ListenBrainz";
    StorageType["libre"] = "LibreFM";
    StorageType["maloja"] = "Maloja";
  })(exports.StorageType || (exports.StorageType = {}));

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  /**
   * lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright jQuery Foundation and other contributors <https://jquery.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */

  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /** Used as references for various `Number` constants. */
  var NAN = 0 / 0;

  /** `Object#toString` result references. */
  var symbolTag = '[object Symbol]';

  /** Used to match leading and trailing whitespace. */
  var reTrim = /^\s+|\s+$/g;

  /** Used to detect bad signed hexadecimal string values. */
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

  /** Used to detect binary string values. */
  var reIsBinary = /^0b[01]+$/i;

  /** Used to detect octal string values. */
  var reIsOctal = /^0o[0-7]+$/i;

  /** Built-in method references without a dependency on `root`. */
  var freeParseInt = parseInt;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max,
    nativeMin = Math.min;

  /**
   * Gets the timestamp of the number of milliseconds that have elapsed since
   * the Unix epoch (1 January 1970 00:00:00 UTC).
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Date
   * @returns {number} Returns the timestamp.
   * @example
   *
   * _.defer(function(stamp) {
   *   console.log(_.now() - stamp);
   * }, _.now());
   * // => Logs the number of milliseconds it took for the deferred invocation.
   */
  var now = function () {
    return root.Date.now();
  };

  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was
   * invoked. The debounced function comes with a `cancel` method to cancel
   * delayed `func` invocations and a `flush` method to immediately invoke them.
   * Provide `options` to indicate whether `func` should be invoked on the
   * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
   * with the last arguments provided to the debounced function. Subsequent
   * calls to the debounced function return the result of the last `func`
   * invocation.
   *
   * **Note:** If `leading` and `trailing` options are `true`, `func` is
   * invoked on the trailing edge of the timeout only if the debounced function
   * is invoked more than once during the `wait` timeout.
   *
   * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
   * until to the next tick, similar to `setTimeout` with a timeout of `0`.
   *
   * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
   * for details over the differences between `_.debounce` and `_.throttle`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to debounce.
   * @param {number} [wait=0] The number of milliseconds to delay.
   * @param {Object} [options={}] The options object.
   * @param {boolean} [options.leading=false]
   *  Specify invoking on the leading edge of the timeout.
   * @param {number} [options.maxWait]
   *  The maximum time `func` is allowed to be delayed before it's invoked.
   * @param {boolean} [options.trailing=true]
   *  Specify invoking on the trailing edge of the timeout.
   * @returns {Function} Returns the new debounced function.
   * @example
   *
   * // Avoid costly calculations while the window size is in flux.
   * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
   *
   * // Invoke `sendMail` when clicked, debouncing subsequent calls.
   * jQuery(element).on('click', _.debounce(sendMail, 300, {
   *   'leading': true,
   *   'trailing': false
   * }));
   *
   * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
   * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
   * var source = new EventSource('/stream');
   * jQuery(source).on('message', debounced);
   *
   * // Cancel the trailing debounced invocation.
   * jQuery(window).on('popstate', debounced.cancel);
   */
  function debounce(func, wait, options) {
    var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

    if (typeof func != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = toNumber(wait) || 0;
    if (isObject(options)) {
      leading = !!options.leading;
      maxing = 'maxWait' in options;
      maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
      trailing = 'trailing' in options ? !!options.trailing : trailing;
    }

    function invokeFunc(time) {
      var args = lastArgs,
        thisArg = lastThis;

      lastArgs = lastThis = undefined;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }

    function leadingEdge(time) {
      // Reset any `maxWait` timer.
      lastInvokeTime = time;
      // Start the timer for the trailing edge.
      timerId = setTimeout(timerExpired, wait);
      // Invoke the leading edge.
      return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
      var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

      return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
    }

    function shouldInvoke(time) {
      var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

      // Either this is the first call, activity has stopped and we're at the
      // trailing edge, the system time has gone backwards and we're treating
      // it as the trailing edge, or we've hit the `maxWait` limit.
      return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
        (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
    }

    function timerExpired() {
      var time = now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      // Restart the timer.
      timerId = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
      timerId = undefined;

      // Only invoke if we have `lastArgs` which means `func` has been
      // debounced at least once.
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = undefined;
      return result;
    }

    function cancel() {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = undefined;
    }

    function flush() {
      return timerId === undefined ? result : trailingEdge(now());
    }

    function debounced() {
      var time = now(),
        isInvoking = shouldInvoke(time);

      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;

      if (isInvoking) {
        if (timerId === undefined) {
          return leadingEdge(lastCallTime);
        }
        if (maxing) {
          // Handle invocations in a tight loop.
          timerId = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === undefined) {
        timerId = setTimeout(timerExpired, wait);
      }
      return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  }

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return typeof value == 'symbol' ||
      (isObjectLike(value) && objectToString.call(value) == symbolTag);
  }

  /**
   * Converts `value` to a number.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to process.
   * @returns {number} Returns the number.
   * @example
   *
   * _.toNumber(3.2);
   * // => 3.2
   *
   * _.toNumber(Number.MIN_VALUE);
   * // => 5e-324
   *
   * _.toNumber(Infinity);
   * // => Infinity
   *
   * _.toNumber('3.2');
   * // => 3.2
   */
  function toNumber(value) {
    if (typeof value == 'number') {
      return value;
    }
    if (isSymbol(value)) {
      return NAN;
    }
    if (isObject(value)) {
      var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
      value = isObject(other) ? (other + '') : other;
    }
    if (typeof value != 'string') {
      return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, '');
    var isBinary = reIsBinary.test(value);
    return (isBinary || reIsOctal.test(value))
      ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
      : (reIsBadHex.test(value) ? NAN : +value);
  }

  var debounce_1 = debounce;

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
      const data = this.getStorage(exports.StorageType.general);
      if (this.isGeneralData(data)) {
        return data;
      } else {
        const data = this.emptyGeneralData();
        this.generalStorage = data;
        return data;
      }
    }
    static set generalStorage(value) {
      this.setStorage(exports.StorageType.general, value);
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
      const key = maloja ? exports.StorageType.maloja : exports.StorageType.listenbrainz;
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
      this.setStorage(maloja ? exports.StorageType.maloja : exports.StorageType.listenbrainz, data);
    }
    static emptyLibreData() {
      return {
        enabled: false,
        session: null,
        username: null
      };
    }
    static get libreData() {
      const data = this.getStorage(exports.StorageType.libre);
      if (this.isLibreFMSetting(data)) {
        return data;
      } else {
        const data = this.emptyLibreData();
        this.libreData = data;
        return data;
      }
    }
    static set libreData(value) {
      this.setStorage(exports.StorageType.libre, value);
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

  var Brainz = Vue$1.component(`plugin.${PLUGIN_NAME}.brainz`, {
    template: `
  <b-tab>
    <template #title>
      <div>{{ title }}</div>
    </template>
    <div class="settings-option-body">
      <div class="md-option-line">
        <div class="md-option-segment">
          <a
            v-if="isBaseListenbrainz"
            href="https://listenbrainz.org/profile"
            target="_blank"
            rel="noreferrer"
          >
            {{ app.getLz('settings.option.connectivity.lastfmScrobble').replace("Last.fm", title) }} token
          </a>
          <span v-else>
            {{ app.getLz('settings.option.connectivity.lastfmScrobble').replace("Last.fm", title) }} token
          </span>
          <span v-show="configured">
            ({{ username }})
          </span>
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="text" v-model.lazy="token" />
          </label>
        </div>
      </div>
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ title }} URL
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input
              type="text"
              v-model.lazy="url"
              :placeholder="placeholder"
            />
          </label>
        </div>
      </div>
      <div v-show="configured" class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz("term.enable") }} {{ title }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="checkbox" switch v-model="enabled" />
          </label>
        </div>
      </div>
    </div>
  </b-tab>`,
    props: {
      placeholder: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      }
    },
    data: function () {
      const data = StorageUtil.getBrainzData(this.title === exports.StorageType.maloja);
      return _objectSpread2({
        app: this.$root
      }, data);
    },
    mounted() {
      this.handleChange = debounce_1(this.handleChange, 300);
      ipcRenderer.on(`plugin.${PLUGIN_NAME}.${this.title}.name`, (_event, auth) => {
        if (auth.ok) {
          this.username = auth.username;
        } else {
          this.username = null;
          StorageUtil.alert(auth.error);
        }
      });
    },
    watch: {
      enabled() {
        this.handleChange();
      },
      token() {
        this.handleChange();
      },
      url() {
        this.handleChange();
      },
      username() {
        this.handleChange(false);
      }
    },
    computed: {
      isBaseListenbrainz() {
        return this.title === exports.StorageType.listenbrainz && !this.url;
      },
      configured() {
        return !!this.token && !!this.username && (this.title !== exports.StorageType.maloja || !!this.url);
      }
    },
    methods: {
      handleChange(notify = true) {
        const data = {
          enabled: this.enabled,
          token: this.token,
          url: this.url,
          username: this.username
        };
        StorageUtil.setBrainzData(data, this.title === exports.StorageType.maloja);
        if (this.title === exports.StorageType.listenbrainz) {
          // we only emit a username if we have a token (truthy), and are using the base URL
          this.$emit("username", this.token && !this.url ? this.username : null);
        }
        if (notify) {
          ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${this.title}`, data);
        }
      }
    }
  });

  var General = Vue$1.component(`plugin.${PLUGIN_NAME}.general`, {
    name: "",
    template: `
  <b-tab>
    <template #title>
      <div>{{ $root.getLz('settings.header.general') }}</div>
    </template>
    <div class="settings-option-body">
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz('settings.option.connectivity.lastfmScrobble.delay').replace("Last.fm", "") }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="number" min="50" max="90" v-model.number.lazy="settings.delay" />
          </label>
        </div>
      </div>
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz('settings.option.connectivity.lastfmScrobble.nowPlaying').replace("Last.fm", "") }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="checkbox" switch v-model="settings.nowPlaying" />
          </label>
        </div>
      </div>
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz('settings.option.connectivity.lastfmScrobble.filterLoop').replace("(Last.fm)", "") }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="checkbox" switch v-model="settings.filterLoop" />
          </label>
        </div>
      </div>
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz('settings.header.debug') }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="checkbox" switch v-model="settings.debug" />
          </label>
        </div>
      </div>
    </div>
  </b-tab>`,
    data: function () {
      return {
        app: this.$root,
        settings: StorageUtil.generalStorage
      };
    },
    mounted() {
      this.handleChange = debounce_1(this.handleChange, 300);
    },
    watch: {
      settings: {
        deep: true,
        handler() {
          this.handleChange();
        }
      }
    },
    methods: {
      handleChange() {
        StorageUtil.generalStorage = this.settings;
        ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${exports.StorageType.general}`, this.settings);
      }
    }
  });

  var Libre = Vue$1.component(`plugin.${PLUGIN_NAME}.libre`, {
    template: `
  <b-tab>
    <template #title>
      <div>Libre.fm</div>
    </template>
    <div class="settings-option-body">
      <div class="md-option-line">
        <div class="md-option-segment">
          <span>Libre.fm</span>
          <span v-show="session !== null">
            ({{ username }})
          </span>
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <button class="md-btn" id="libreConnect" @click="connectLibre()" :disabled="waiting">
            {{ 
              app.getLz("term." + (connecting ? "disconnect": "connect")) 
            }}
          </button>
        </div>
      </div>
      <div v-show="connecting">
        <div class="md-option-line">
          <div class="md-option-segment">
            {{ app.getLz("term.enable") }} Libre.fm
          </div>
          <div class="md-option-segment md-option-segment_auto">
            <label>
              <input type="checkbox" switch v-model="enabled" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </b-tab>`,
    data: function () {
      return _objectSpread2({
        app: this.$root,
        token: null,
        waiting: false
      }, StorageUtil.libreData);
    },
    mounted() {
      this.handleChange = debounce_1(this.handleChange, 300);
      const event = `plugin.${PLUGIN_NAME}.${exports.StorageType.libre}.name`;
      ipcRenderer.off(event, StorageUtil.handleLibreBackground).on(event, (_event, auth) => {
        if (auth.ok) {
          this.session = auth.key || null;
          this.username = auth.username;
        } else {
          this.enabled = false;
          StorageUtil.alert(auth.error);
        }
      });
    },
    destroyed() {
      ipcRenderer.on(`plugin.${PLUGIN_NAME}.${exports.StorageType.libre}.name`, StorageUtil.handleLibreBackground);
    },
    watch: {
      enabled(newVal, oldVal) {
        // We ignore this change if setting enabled -> false while the user  is not authenticated.
        const shouldIgnore = !newVal && oldVal && !this.session;
        this.handleChange(!shouldIgnore);
      },
      session() {
        this.handleChange(true);
      }
    },
    computed: {
      connecting() {
        return this.token !== null || this.session !== null;
      }
    },
    methods: {
      handleChange(notify) {
        const data = {
          enabled: this.enabled,
          session: this.session,
          username: this.username
        };
        StorageUtil.libreData = data;
        if (notify) {
          ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${exports.StorageType.libre}`, data);
        }
      },
      async connectLibre() {
        if (this.connecting) {
          this.enabled = false;
          this.session = null;
          this.token = null;
          this.username = null;
          this.waiting = false;
        } else {
          this.waiting = true;
          try {
            const url = await ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${exports.StorageType.libre}.token`);
            if (url.ok) {
              const target = `https://libre.fm/api/auth/?api_key=${url.key}&token=${url.token}`;
              window.open(target);
              this.token = url.token;
            } else {
              throw new Error(url.msg);
            }
          } catch (error) {
            StorageUtil.alert(error.message);
          } finally {
            this.waiting = false;
          }
        }
      }
    }
  });

  const name="cider-music-listenbrainz-plugin";const version="1.0.7";const repository={type:"git",url:"git+https://github.com/kgarner7/cider-music-listenbrainz-plugin"};

  const USER_AGENT = `${name}/${version} { ${repository.url} }`;

  var RecItem = Vue$1.component(`plugin.${PLUGIN_NAME}.item`, {
    template: `
  <div>
    <template v-if="item.mk === null">
      <div class="artist item-navigate brainz" @click="search(item.title + ' - ' + item.by)" stye="padding: 10px 0px;">
        {{ item.title }}: {{ item.by }}
      </div>
    </template>
    <template v-else>
      <div class="brainz" :data-id="item.mk">{{ item.title }}: {{ item.by }}</div>
      <mediaitem-list-item v-if="cached[item.mk]" :item="cached[item.mk]"/>
    </template>
  </div>
  `,
    props: {
      cached: {
        type: Object,
        required: true
      },
      item: {
        type: Object,
        required: true
      }
    },
    watch: {
      item: {
        handler() {
          this.refetch();
        }
      }
    },
    async mounted() {
      this.refetch();
    },
    methods: {
      refetch() {
        const id = this.item.mk;
        if (id && !this.cached[id]) {
          this.$emit("cache", id, this.item.score);
        }
      }
    }
  });

  var RecommendationType;
  (function (RecommendationType) {
    RecommendationType["raw"] = "raw";
    RecommendationType["similar"] = "similar";
    RecommendationType["top"] = "top";
  })(RecommendationType || (RecommendationType = {}));
  var Matched;
  (function (Matched) {
    Matched["any"] = "any";
    Matched["only"] = "only";
    Matched["not"] = "not";
  })(Matched || (Matched = {}));
  let killed = false;

  // trick the compiler into thinking it is used
  RecItem.version;
  var Recommendations = Vue$1.component(`plugin.${PLUGIN_NAME}.recommendation`, {
    template: `
  <b-tab>
    <template #title>
      <div>Recommendations</div>
    </template>
    <div class="library-page">
      <div class="library-header brainz-header">
        <div class="row brainz-search-row">
          <div class="col">
            <div class="search-input-container" style="width:100%;">
              <div class="search-input--icon"></div>
              <input type="search"
                style="width:100%;"
                spellcheck="false"
                :placeholder="app.getLz('term.search') + '...'"
                class="search-input"
                v-model="query"
              >
            </div>
          </div>
          <div class="col-auto flex-center">
            <select class="md-select" v-model="persist.type">
              <optgroup label="Recommendation type">
                <option value="${RecommendationType.raw}">Raw</option>
                <option value="${RecommendationType.top}">Top artists</option>
                <option value="${RecommendationType.similar}">Similar artists</option>
              </optgroup>
            </select>
          </div>
          <div class="col-auto flex-center">
            <select class="md-select" v-model.number="persist.fetch">
              <optgroup label="Recommendations to store: ">
                <option value="25">Top 25</option>
                <option value="50">Top 50</option>
                <option value="100">Top 100</option>
                <option value="250">Top 250</option>
                <option value="-1">All</option>
              </optgroup>
            </select>
          </div>
          <div class="col-auto flex-center">
            <select class="md-select" v-model.number="persist.perPage">
              <optgroup label="Recommendations per page">
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
                <option value="250">250 / page</option>
              </optgroup>
            </select>
          </div>
          <div class="col-auto flex-center">
            <select class="md-select" v-model="persist.matched">
              <optgroup label="Songs to show">
                <option value="${Matched.any}">All</option>
                <option value="${Matched.only}">Matched songs</option>
                <option value="${Matched.not}">Unmatched songs</option>
              </optgroup>
            </select>
          </div>
          <div class="col-auto flex-center floating">
            <button
              v-if="count === null"
              @click="fetchRecommendations()"
              class="reload-btn"
              :aria-label="app.getLz('menubar.options.reload')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M500.33 0h-47.41a12 12 0 0 0-12 12.57l4 82.76A247.42 247.42 0 0 0 256 8C119.34 8 7.9 119.53 8 256.19 8.1 393.07 119.1 504 256 504a247.1 247.1 0 0 0 166.18-63.91 12 12 0 0 0 .48-17.43l-34-34a12 12 0 0 0-16.38-.55A176 176 0 1 1 402.1 157.8l-101.53-4.87a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12h200.33a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12z"/></svg>
            </button>
            <template v-else>
              <button class="col md-btn md-btn-primary md-btn-icon" @click="kill()">
                {{ app.getLz("dialog.cancel") }}
              </button>
              <button class="reload-btn" style="opacity: 0.8;pointer-events: none" :aria-label="app.getLz('menubar.options.reload')">
                <div class="spinner"></div>
              </button>
            </template>
          </div>
          <div class="col-auto flex-center" v-if="count !== null">
            {{ count }} / {{ outOf }}
          </div>
          <div class="col-auto flex-center">
            <button
              @click="nuke()"
              class="md-btn md-btn-primary"
              aria-label="Delete Recommendations"
              v-if="numPages > 0"
            >
              Delete Recommendations
            </button>
          </div>
        </div>
        <div class="row brainz-pagination">
          <button
            class="md-btn page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(1)"
          >
            <img class="md-ico-first"/>
          </button>
          <button
            class="md-btn page-btn prev"
            :disabled="currentPage === 1"
            @click="goToPrevious()"
          >
            <img class="md-ico-prev"/>
          </button>
          <button
            :class="getPageClass(page)"
            @click="goToPage(page)"
            v-for="page in pagesToShow"
          >{{ page }}</button>
          <button
            class="md-btn page-btn next"
            :disabled="currentPage === numPages"
            @click="goToNext()"
          >
            <img class="md-ico-next"/>
          </button>
          <button
            class="md-btn page-btn last"
            :disabled="currentPage === numPages"
            @click="goToEnd()"
          >
            <img class="md-ico-last"/>
          </button>
          <div class="page-btn" style="min-width: 12em;">
            <input type="number" min="1" :max="numPages" :value="currentPage" @change="changePage" />
            <span>/ {{ numPages || 1 }}</span>
          </div>
        </div>
      </div>
      <div class="well brainz-rec" v-if="numPages === 0">
        No recommendations yet. Try refreshing for some!
      </div>
      <div class="well brainz-rec" v-else>
        <template v-for="(item, index) in currentSlice">
          <plugin.${PLUGIN_NAME}.item :item="item" :cached="cached" @cache="cacheChange" />
        </template>
      </div>
    </div>
  </b-tab>
  `,
    props: {
      cached: {
        type: Object,
        required: true
      },
      username: {
        type: String,
        required: true
      }
    },
    data: function () {
      let persist = StorageUtil.getStorage("recommendation", true);
      if (!persist) {
        persist = {
          [RecommendationType.raw]: {},
          [RecommendationType.similar]: {},
          [RecommendationType.top]: {},
          background: false,
          fetch: 25,
          matched: Matched.any,
          page: {
            [RecommendationType.raw]: 1,
            [RecommendationType.similar]: 1,
            [RecommendationType.top]: 1
          },
          perPage: 25,
          type: RecommendationType.raw
        };
        StorageUtil.setStorage("recommendation", persist, true);
      }
      return {
        app: this.$root,
        count: null,
        outOf: null,
        persist,
        query: null
      };
    },
    mounted() {
      this.update = debounce_1(this.update, 300);
      killed = true;
    },
    watch: {
      "persist.fetch": {
        handler() {
          this.update();
        }
      },
      "persist.matched": {
        handler() {
          this.update();
        }
      },
      "persist.type": {
        handler() {
          this.update();
        }
      },
      [`persist.page.${RecommendationType.raw}`]: {
        handler() {
          this.update();
        }
      },
      [`persist.page.${RecommendationType.similar}`]: {
        handler() {
          this.update();
        }
      },
      [`persist.page.${RecommendationType.top}`]: {
        handler() {
          this.update();
        }
      }
    },
    computed: {
      // Pagination
      currentPage() {
        return this.persist.page[this.persist.type] ?? 1;
      },
      currentSlice() {
        const startingPage = Math.min(this.numPages, this.currentPage);
        const result = this.display.slice((startingPage - 1) * this.persist.perPage, startingPage * this.persist.perPage);
        return result;
      },
      numPages() {
        return Math.ceil(this.display.length / this.persist.perPage);
      },
      pagesToShow() {
        let start = this.currentPage - 4;
        let end = this.currentPage + 4;
        if (start < 1) {
          end += 1 - start;
          start = 1;
        }
        const endDifference = end - this.numPages;
        if (endDifference > 0) {
          end = this.numPages;
          start = Math.max(1, start - endDifference);
        }
        const array = [];
        for (let idx = start; idx <= end; idx++) {
          array.push(idx);
        }
        return array;
      },
      // display
      display() {
        let data = Object.values(this.persist[this.persist.type]);
        if (this.query && this.persist.matched !== Matched.any) {
          const expectMatch = this.persist.matched === Matched.only;
          const query = this.query.toLocaleLowerCase();
          data = data.filter(item => item.mk !== null === expectMatch && (item.title.toLocaleLowerCase().includes(query) || item.by.toLocaleLowerCase().includes(query)));
        } else if (this.query) {
          const query = this.query.toLocaleLowerCase();
          data = data.filter(item => item.title.toLocaleLowerCase().includes(query) || item.by.toLocaleLowerCase().includes(query));
        } else if (this.persist.matched !== Matched.any) {
          const expectMatch = this.persist.matched === Matched.only;
          data = data.filter(item => item.mk !== null === expectMatch);
        }
        return data;
      }
    },
    methods: {
      // Pagination
      getPageClass(idx) {
        const isCurrentPage = idx === this.currentPage || idx === this.numPages && this.currentPage > this.numPages;
        return `md-btn page-btn${isCurrentPage ? ' md-btn-primary' : ''}`;
      },
      changePage(event) {
        const value = event.target.valueAsNumber;
        if (!isNaN(value) && value >= 1 && value <= this.numPages) {
          this.persist.page[this.persist.type] = value;
        }
      },
      goToPage(page) {
        this.persist.page[this.persist.type] = page;
      },
      goToPrevious: function () {
        if (this.currentPage > 1) {
          this.persist.page[this.persist.type] -= 1;
        }
      },
      goToNext: function () {
        if (this.currentPage < this.numPages) {
          this.persist.page[this.persist.type] += 1;
        }
      },
      goToEnd: function () {
        this.persist.page[this.persist.type] = this.numPages;
      },
      // Recommendations
      async fetchRecommendations() {
        if (this.count !== null) return;
        if (killed) killed = false;
        const user = this.username;
        const type = this.persist.type;
        const count = this.persist.fetch;
        const existingCount = Object.keys(this.persist[type]).length;
        if (count !== -1 && count < existingCount) {
          this.app.confirm(`You currently have ${existingCount} recommendations, but are fetching ${count}. Only the top ${count} will be saved. Proceed?`, () => {
            this.doFetch(user, type, count).catch(error => {
              console.error(`[plugin][%s]:`, PLUGIN_NAME, error);
            });
          });
        } else {
          await this.doFetch(user, type, count);
        }
      },
      async doFetch(user, type, count) {
        this.count = 0;
        this.outOf = 0;

        // Per API docs, this is guaranteed to be sorted in decreasing order
        let recommendations = [];
        if (this.persist.fetch !== -1) {
          recommendations = (await this.fetchRecs(user, type, count)).payload.mbids;
        } else {
          for (;;) {
            const recs = await this.fetchRecs(user, type, 1000, recommendations.length);
            recommendations = recommendations.concat(recs.payload.mbids);
            if (recommendations.length >= recs.payload.total_mbid_count) {
              break;
            }
          }
        }
        this.outOf = recommendations.length;
        const recs = this.persist[this.persist.type];
        let newCount = 1;

        // Inside this loop, we modify the current mapping of recommendations. This is primarily
        // so that they can be 
        for (const rec of recommendations) {
          const existing = recs[rec.recording_mbid];
          if (killed) break;
          if (!existing) {
            const now = performance.now();
            try {
              const mbData = await fetch(`https://musicbrainz.org/ws/2/recording/${rec.recording_mbid}?fmt=json&inc=releases+artists+isrcs`, {
                headers: {
                  "User-Agent": USER_AGENT
                }
              });
              const json = await mbData.json();
              const elapsed = performance.now() - now;
              // The rate limit is 1 request/sec/ip, but let's be more cautious
              await StorageUtil.sleep(Math.ceil(1000 - elapsed));
              let artistNames = "";
              for (const artist of json["artist-credit"]) {
                artistNames += artist.name + artist.joinphrase;
              }
              const data = {
                by: artistNames,
                mk: null,
                listen: rec.latest_listened_at,
                score: rec.score,
                title: json.title
              };
              if (json.isrcs.length > 0) {
                const response = await this.app.mk.api.v3.music(`/v1/catalog/${this.app.mk.storefrontCountryCode}/songs?filter[isrc]=${json.isrcs.join(", ")}`);
                if (response.response.ok && response.data.data.length > 0) {
                  for (const item of response.data.data) {
                    if (item.meta?.redeliveryId) continue;
                    data.mk = item.id;
                    this.$set(this.cached, data.mk, item);
                    break;
                  }
                }
              }
              if (!data.mk) {
                const query = encodeURIComponent(`${json.title} - ${artistNames}`);
                const response = await this.app.mk.api.v3.music(`/v1/catalog/${this.app.mk.storefrontCountryCode}/search?term=${query}&limit=25&types=songs`);
                if (response.response.ok && response.data.results.songs?.data.length === 1) {
                  const item = response.data.results.songs.data[0];
                  data.mk = item.id;
                  this.$set(this.cached, data.mk, item);
                }
              }
              this.$set(recs, rec.recording_mbid, data);
            } catch (error) {
              console.error(`[plugin][%s]:`, PLUGIN_NAME, error);
            }
            newCount += 1;
          } else {
            existing.listen = rec.latest_listened_at;
            existing.score = rec.score;
            recs[rec.recording_mbid] = existing;
          }
          this.count += 1;

          // every 30 new songs, checkpoint
          if (newCount % 30 === 0) {
            StorageUtil.setStorage("recommendation", this.persist, true);
          }
          this.$set(this, "recs", recs);
        }

        // Sort the new object
        const newRecs = {};
        let addCount = 0;
        for (const [key, match] of Object.entries(this.persist[type]).sort((a, b) => b[1].score - a[1].score)) {
          newRecs[key] = match;
          addCount++;

          // We only support having the top X recommendations
          // This is to prevent indefinite growth
          if (addCount === recommendations.length) {
            break;
          }
        }
        this.persist[type] = newRecs;
        this.count = null;
        this.outOf = null;
        StorageUtil.setStorage("recommendation", this.persist, true);
      },
      async fetchRecs(user, type, count, offset = 0) {
        const data = await fetch(`https://api.listenbrainz.org/1/cf/recommendation/user/${user}/recording?artist_type=${type}&count=${count}&offset=${offset}`, {
          headers: {
            "User-Agent": USER_AGENT
          }
        });
        const remainingCalls = parseInt(data.headers.get("x-ratelimit-remaining"));
        if (remainingCalls === 0) {
          const resetInSec = parseInt(data.headers.get("x-ratelimit-reset-in"));
          await StorageUtil.sleep(resetInSec * 1000);
        }
        return data.json();
      },
      search(title) {
        this.app.search.term = title;
        this.app.searchQuery();
        this.app.showSearch();
      },
      update() {
        StorageUtil.setStorage("recommendation", this.persist, true);
      },
      cacheChange(id, score) {
        this.$emit("cache", id, score);
      },
      kill() {
        killed = true;
      },
      nuke() {
        const type = this.persist.type;
        this.app.confirm(`Are you sure you want to delete all '${type}' recommendations?`, result => {
          if (result) {
            this.persist[type] = {};
            StorageUtil.setStorage("recommendation", this.persist, true);
          }
        });
      }
    }
  });

  // Make it think that these exports are used
  Brainz.version;
  General.version;
  Libre.version;
  Recommendations.version;

  // Adapted from https://github.com/ChaseIngebritson/Cider-Music-Recommendation-Plugin/blob/e4f9d06ebfc6182983333dabb7d7946d744db010/src/components/musicRecommendations-vue.js
  Vue$1.component(`plugin.${PLUGIN_NAME}`, {
    template: `
  <div class="content-inner settings-page">
  <mediaitem-list-item v-if="false" :item="song"/> 
    <b-tabs pills fill v-model="pageIndex">
      <plugin.${PLUGIN_NAME}.general />
      <plugin.${PLUGIN_NAME}.recommendation
        v-if="username"
        :username="username"
        :cached="cached"
        @cache="cacheChange"
      />
      <plugin.${PLUGIN_NAME}.brainz title="${exports.StorageType.listenbrainz}" placeholder="https://api.listenbrainz.org" v-on:username="username = $event"/>
      <plugin.${PLUGIN_NAME}.libre />
      <plugin.${PLUGIN_NAME}.brainz title="${exports.StorageType.maloja}" placeholder="http://localhost:42010" />
    </b-tabs>
  </div>`,
    data: function () {
      return {
        app: this.$root,
        cached: ListenbrainzFrontend.cached,
        pageIndex: 0,
        pending: [],
        username: StorageUtil.getBrainzData(false).username
      };
    },
    mounted() {
      this.fetchAll = debounce_1(this.fetchAll, 300);
    },
    methods: {
      cacheChange(id, score) {
        this.pending.push([score, id]);
        this.fetchAll();
      },
      async fetchAll() {
        // Why all this? The goal of this is to batch requests in 25, so as to reduce the load of sending out a massive load of requests at once.
        const items = this.pending;
        this.pending = [];
        items.sort((a, b) => b[0] - a[0]);
        const GROUP_SIZE = 25;
        for (let idx = 0; idx < items.length; idx += GROUP_SIZE) {
          const group = items.slice(idx, idx + GROUP_SIZE);
          await Promise.all(group.map(this.fetchItem));
          await StorageUtil.sleep(100);
        }
      },
      async fetchItem(item) {
        const id = item[1];
        try {
          const data = await this.app.mk.api.v3.music(`/v1/catalog/us/songs/${id}`);
          this.$set(this.cached, id, data.data.data[0]);
        } catch (error) {
          console.error("[plugin][%s]:", PLUGIN_NAME, error);
        }
      }
    }
  });
  class ListenbrainzFrontend {
    constructor() {
      const menuEntry = new CiderFrontAPI.Objects.MenuEntry();
      menuEntry.id = window.uuidv4();
      menuEntry.name = "Libre.fm, ListenBrainz, Maloja";
      menuEntry.onClick = () => {
        app.appRoute(`plugin/${PLUGIN_NAME}`);
      };
      CiderFrontAPI.AddMenuEntry(menuEntry);
      CiderFrontAPI.StyleSheets.Add(`./plugins/gh_504963482/listenbrainz.less`);

      // Delete prior configuration.
      localStorage.removeItem(`plugin.${PLUGIN_NAME}.settings`);
      ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${exports.StorageType.general}`, StorageUtil.generalStorage);
      const LIBRE = `plugin.${PLUGIN_NAME}.${exports.StorageType.libre}`;
      ipcRenderer.once(`${LIBRE}.name`, (_event, auth) => {
        const settings = StorageUtil.libreData;
        if (auth.ok) {
          settings.session = auth.key;
          settings.username = auth.username;
        } else {
          settings.session = null;
          settings.username = null;
        }
        ipcRenderer.on(`${LIBRE}.name`, StorageUtil.handleLibreBackground);
        StorageUtil.libreData = settings;
      }).invoke(LIBRE, StorageUtil.libreData);
      function handleBrainz(maloja) {
        return function (_event, auth) {
          const settings = StorageUtil.getBrainzData(maloja);
          if (auth.ok) {
            settings.username = auth.username;
          } else {
            settings.username = null;
          }
          StorageUtil.setBrainzData(settings, maloja);
        };
      }
      const LISTEN_BRAINZ = `plugin.${PLUGIN_NAME}.${exports.StorageType.listenbrainz}`;
      ipcRenderer.once(`${LISTEN_BRAINZ}.name`, handleBrainz(false)).invoke(LISTEN_BRAINZ, StorageUtil.getBrainzData(false));
      const MALOJA = `plugin.${PLUGIN_NAME}.${exports.StorageType.maloja}`;
      ipcRenderer.once(`${MALOJA}.name`, handleBrainz(true)).invoke(MALOJA, StorageUtil.getBrainzData(true));
    }
  }
  _defineProperty(ListenbrainzFrontend, "cached", {});
  const BrainzFrontend = new ListenbrainzFrontend();

  exports.Brainz = Brainz;
  exports.BrainzFrontend = BrainzFrontend;
  exports.General = General;
  exports.Libre = Libre;
  exports.Recommendations = Recommendations;
  exports.StorageUtil = StorageUtil;

  return exports;

})({});
