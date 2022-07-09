'use strict';

var Vue$1 = Vue;

const PLUGIN_NAME = "listenbrainz";
let StorageType;

(function (StorageType) {
  StorageType["general"] = "General";
  StorageType["listenbrainz"] = "ListenBrainz";
  StorageType["libre"] = "LibreFM";
  StorageType["maloja"] = "Maloja";
})(StorageType || (StorageType = {}));

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

class StorageUtil {
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
    return typeof data.enabled === "boolean" && (data.token === undefined || typeof data.token === "string") && (data.username === undefined || typeof data.username === "string") && (data.url === undefined || typeof data.url === "string");
  }

  static isLibreFMSetting(data) {
    if (data === undefined || data === null) return false;
    return typeof data.enabled === "boolean" && (data.session === undefined || typeof data.session === "string") && (data.username === undefined || typeof data.username === "string");
  }

  static getStorage(key) {
    const json = localStorage.getItem(`plugin.${PLUGIN_NAME}.${this.SETTINGS_KEY}.${key.toLocaleLowerCase()}`);
    return json ? JSON.parse(json) : null;
  }

  static setStorage(key, data) {
    localStorage.setItem(`plugin.${PLUGIN_NAME}.${this.SETTINGS_KEY}.${key.toLocaleLowerCase()}`, JSON.stringify(data));
  }

}

_defineProperty(StorageUtil, "SETTINGS_KEY", "settings");

var Brainz = Vue$1.component(`plugin-${PLUGIN_NAME}-brainz`, {
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
            href="https://listenbrainz.org/login/musicbrainz?next=%2Fprofile%2F"
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
    const data = StorageUtil.getBrainzData(this.title === StorageType.maloja);
    return data;
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
      return this.title === StorageType.listenbrainz && !this.url;
    },

    configured() {
      return !!this.token && !!this.username && (this.title !== StorageType.maloja || !!this.url);
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
      StorageUtil.setBrainzData(data, this.title === StorageType.maloja);

      if (notify) {
        ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${this.title}`, data);
      }
    }

  }
});

var General = Vue$1.component(`plugin-${PLUGIN_NAME}-general`, {
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
  data: () => ({
    settings: StorageUtil.generalStorage
  }),

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
      ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${StorageType.general}`, this.settings);
    }

  }
});

var Libre = Vue$1.component(`plugin-${PLUGIN_NAME}-libre`, {
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
  data: () => _objectSpread2({
    token: null,
    waiting: false
  }, StorageUtil.libreData),

  mounted() {
    this.handleChange = debounce_1(this.handleChange, 300);
    const event = `plugin.${PLUGIN_NAME}.${StorageType.libre}.name`;
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
    ipcRenderer.on(`plugin.${PLUGIN_NAME}.${StorageType.libre}.name`, StorageUtil.handleLibreBackground);
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
        ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${StorageType.libre}`, data);
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
          const url = await ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${StorageType.libre}.token`);

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

// Make it think that these exports are used
Brainz.version;
General.version;
Libre.version; // Adapted from https://github.com/ChaseIngebritson/Cider-Music-Recommendation-Plugin/blob/e4f9d06ebfc6182983333dabb7d7946d744db010/src/components/musicRecommendations-vue.js

Vue$1.component(`plugin.${PLUGIN_NAME}`, {
  template: `
  <div class="content-inner settings-page">
    <b-tabs pills fill v-model="pageIndex">
      <plugin-${PLUGIN_NAME}-general />
      <plugin-${PLUGIN_NAME}-brainz title="${StorageType.listenbrainz}" placeholder="https://api.listenbrainz.org" />
      <plugin-${PLUGIN_NAME}-libre />
      <plugin-${PLUGIN_NAME}-brainz title="${StorageType.maloja}" placeholder="http://localhost:42010" />
    </b-tabs>
  </div>`,
  data: () => ({
    pageIndex: 0
  })
});

class ListenbrainzFrontend {
  constructor() {
    const menuEntry = new CiderFrontAPI.Objects.MenuEntry();
    menuEntry.id = window.uuidv4();
    menuEntry.name = "Libre.fm, ListenBrainz, Maloja";

    menuEntry.onClick = () => {
      app.appRoute(`plugin/${PLUGIN_NAME}`);
    };

    CiderFrontAPI.AddMenuEntry(menuEntry); // Delete prior configuration.

    localStorage.removeItem(`plugin.${PLUGIN_NAME}.settings`);
    ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${StorageType.general}`, StorageUtil.generalStorage);
    const LIBRE = `plugin.${PLUGIN_NAME}.${StorageType.libre}`;
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

    const LISTEN_BRAINZ = `plugin.${PLUGIN_NAME}.${StorageType.listenbrainz}`;
    ipcRenderer.once(`${LISTEN_BRAINZ}.name`, handleBrainz(false)).invoke(LISTEN_BRAINZ, StorageUtil.getBrainzData(false));
    const MALOJA = `plugin.${PLUGIN_NAME}.${StorageType.maloja}`;
    ipcRenderer.once(`${MALOJA}.name`, handleBrainz(true)).invoke(MALOJA, StorageUtil.getBrainzData(true));
  }

}

new ListenbrainzFrontend();
