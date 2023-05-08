
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
    'use strict';

    const currentVersion = '1.1.9';

    function noop$1() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function compute_slots(slots) {
        const result = {};
        for (const key in slots) {
            result[key] = true;
        }
        return result;
    }

    new Set();
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }
    function attribute_to_object(attributes) {
        const result = {};
        for (const attribute of attributes) {
            result[attribute.name] = attribute.value;
        }
        return result;
    }
    function get_custom_elements_slots(element) {
        const result = {};
        element.childNodes.forEach((node) => {
            result[node.slot || 'default'] = true;
        });
        return result;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    new Map();

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const _boolean_attributes = [
        'allowfullscreen',
        'allowpaymentrequest',
        'async',
        'autofocus',
        'autoplay',
        'checked',
        'controls',
        'default',
        'defer',
        'disabled',
        'formnovalidate',
        'hidden',
        'inert',
        'ismap',
        'loop',
        'multiple',
        'muted',
        'nomodule',
        'novalidate',
        'open',
        'playsinline',
        'readonly',
        'required',
        'reversed',
        'selected'
    ];
    /**
     * List of HTML boolean attributes (e.g. `<input disabled>`).
     * Source: https://html.spec.whatwg.org/multipage/indices.html
     */
    new Set([..._boolean_attributes]);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$9(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                const { on_mount } = this.$$;
                this.$$.on_disconnect = on_mount.map(run).filter(is_function);
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            disconnectedCallback() {
                run_all(this.$$.on_disconnect);
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop$1;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                if (!is_function(callback)) {
                    return noop$1;
                }
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set($$props) {
                if (this.$$set && !is_empty($$props)) {
                    this.$$.skip_bound = true;
                    this.$$set($$props);
                    this.$$.skip_bound = false;
                }
            }
        };
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.58.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function getAugmentedNamespace(n) {
      if (n.__esModule) return n;
      var f = n.default;
    	if (typeof f == "function") {
    		var a = function a () {
    			if (this instanceof a) {
    				var args = [null];
    				args.push.apply(args, arguments);
    				var Ctor = Function.bind.apply(f, args);
    				return new Ctor();
    			}
    			return f.apply(this, arguments);
    		};
    		a.prototype = f.prototype;
      } else a = {};
      Object.defineProperty(a, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    var lib = {};

    var endpoints = {};

    Object.defineProperty(endpoints, "__esModule", { value: true });
    endpoints.endpoints = void 0;
    endpoints.endpoints = {
        authUrl: 'Account/Login',
        fakeAuthUrl: 'Account/Test',
        dashboard: 'Dashboard',
        adminDashboard: 'Dashboard/Admin',
        permission: 'Permission',
        app: 'App',
        translation: 'Translation',
        translationKey: 'TranslationKey',
        translationReport: 'TranslationReport',
        translationImage: 'TranslationImage',
        translationKeySearchDropdown: 'translationKey/SearchDropdown',
        translationStatLeaderboard: 'translationStats/TranslatorLeaderboard',
        user: 'User',
        language: 'Language',
        userActivity: 'UserActivity',
        cache: 'Cache',
        version: 'Version',
        donation: 'Donation',
        redisCache: 'Cache/Redis',
        webhookMessages: 'WebhookMessage',
        appReviews: 'AppReview',
        translationSearch: 'Translation/Search',
        translationSearchPerLanguage: 'Translation/Graph/TranslationsPerLanguage',
        teamMember: 'TeamMember',
        steam: 'Steam',
        steamNews: 'Steam/News',
        steamBranches: 'Steam/Branches',
        licence: 'Licence',
        licenceActivate: 'Licence/Activate',
        licenceActivateForPatron: 'Licence/ActivateForPatron',
        licenceVerify: 'Licence/Verify',
        versionSendUpdateNotification: 'Version/SendUpdateNotification',
        guideDetail: 'GuideDetail',
        guideDetailSearchAdmin: 'GuideDetail/SearchAdmin',
        appNotice: 'AppNotice',
        feedbackForm: 'Feedback',
        feedbackFormQuestion: 'FeedbackQuestion',
        feedbackFormAnswer: 'FeedbackAnswer',
        badge: 'Badge',
        patreon: 'Patreon',
        quickAction: 'QuickAction',
        quickActionIndexes: 'QuickAction/Indexes',
        contact: 'Contact',
        oAuth: 'OAuth',
    };

    var headerKeys = {};

    Object.defineProperty(headerKeys, "__esModule", { value: true });
    headerKeys.UserGuidHeaderKey = headerKeys.TokenExpiryHeaderKey = headerKeys.TokenHeaderKey = void 0;
    headerKeys.TokenHeaderKey = 'Token';
    headerKeys.TokenExpiryHeaderKey = 'TokenExpiry';
    headerKeys.UserGuidHeaderKey = 'UserGuid';

    var signalREvent = {};

    (function (exports) {
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.SignalRReceiveEvent = exports.SignalRSendEvent = void 0;
    	(function (SignalRSendEvent) {
    	    SignalRSendEvent[SignalRSendEvent["JoinOAuthGroup"] = 0] = "JoinOAuthGroup";
    	    SignalRSendEvent[SignalRSendEvent["LeaveOAuthGroup"] = 1] = "LeaveOAuthGroup";
    	})(exports.SignalRSendEvent || (exports.SignalRSendEvent = {}));
    	(function (SignalRReceiveEvent) {
    	    SignalRReceiveEvent[SignalRReceiveEvent["OAuthComplete"] = 0] = "OAuthComplete";
    	})(exports.SignalRReceiveEvent || (exports.SignalRReceiveEvent = {})); 
    } (signalREvent));

    var adminApprovalStatus = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.AdminApprovalStatus = void 0;
    	(function (AdminApprovalStatus) {
    	    AdminApprovalStatus[AdminApprovalStatus["pending"] = 0] = "pending";
    	    AdminApprovalStatus[AdminApprovalStatus["inReview"] = 1] = "inReview";
    	    AdminApprovalStatus[AdminApprovalStatus["denied"] = 2] = "denied";
    	    AdminApprovalStatus[AdminApprovalStatus["approved"] = 3] = "approved";
    	    AdminApprovalStatus[AdminApprovalStatus["cancelled"] = 4] = "cancelled";
    	})(exports.AdminApprovalStatus || (exports.AdminApprovalStatus = {})); 
    } (adminApprovalStatus));

    var appRatingType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.AppRatingType = void 0;
    	(function (AppRatingType) {
    	    AppRatingType[AppRatingType["all"] = 0] = "all";
    	    AppRatingType[AppRatingType["googlePlayStore"] = 1] = "googlePlayStore";
    	    AppRatingType[AppRatingType["appleAppStore"] = 2] = "appleAppStore";
    	})(exports.AppRatingType || (exports.AppRatingType = {})); 
    } (appRatingType));

    var appType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.AppType = void 0;
    	(function (AppType) {
    	    AppType[AppType["unknown"] = 0] = "unknown";
    	    AppType[AppType["nms"] = 1] = "nms";
    	    AppType[AppType["sms"] = 2] = "sms";
    	    AppType[AppType["hyt"] = 3] = "hyt";
    	    AppType[AppType["dkm"] = 4] = "dkm";
    	})(exports.AppType || (exports.AppType = {})); 
    } (appType));

    var cacheType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.CacheType = void 0;
    	(function (CacheType) {
    	    CacheType[CacheType["patreons"] = 0] = "patreons";
    	    CacheType[CacheType["dashboard"] = 1] = "dashboard";
    	    CacheType[CacheType["dashboardLoggedIn"] = 2] = "dashboardLoggedIn";
    	    CacheType[CacheType["guideSearch"] = 3] = "guideSearch";
    	    CacheType[CacheType["donation"] = 4] = "donation";
    	    CacheType[CacheType["version"] = 5] = "version";
    	    CacheType[CacheType["guideContent"] = 6] = "guideContent";
    	    CacheType[CacheType["appReview"] = 7] = "appReview";
    	    CacheType[CacheType["steamNews"] = 8] = "steamNews";
    	    CacheType[CacheType["steamBranches"] = 9] = "steamBranches";
    	    CacheType[CacheType["emojiLeaderboard"] = 10] = "emojiLeaderboard";
    	    CacheType[CacheType["kurtBlogRss"] = 11] = "kurtBlogRss";
    	    CacheType[CacheType["kurtIsLive"] = 12] = "kurtIsLive";
    	    CacheType[CacheType["teamMembers"] = 13] = "teamMembers";
    	    CacheType[CacheType["translators"] = 14] = "translators";
    	    CacheType[CacheType["translatorLeaderboard"] = 15] = "translatorLeaderboard";
    	    CacheType[CacheType["badges"] = 16] = "badges";
    	    CacheType[CacheType["exportLang"] = 17] = "exportLang";
    	    CacheType[CacheType["translationsGraph"] = 18] = "translationsGraph";
    	    CacheType[CacheType["twitchUserImg"] = 19] = "twitchUserImg";
    	    CacheType[CacheType["twitchUserData"] = 20] = "twitchUserData";
    	    CacheType[CacheType["patreonLogin"] = 21] = "patreonLogin";
    	    CacheType[CacheType["appNotice"] = 22] = "appNotice";
    	    CacheType[CacheType["feedbackForm"] = 23] = "feedbackForm";
    	})(exports.CacheType || (exports.CacheType = {})); 
    } (cacheType));

    var coinbaseEventType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.CoinbaseEventType = void 0;
    	(function (CoinbaseEventType) {
    	    CoinbaseEventType[CoinbaseEventType["unknown"] = 0] = "unknown";
    	    CoinbaseEventType[CoinbaseEventType["chargeCreationPending"] = 1] = "chargeCreationPending";
    	    CoinbaseEventType[CoinbaseEventType["chargeCreated"] = 2] = "chargeCreated";
    	    CoinbaseEventType[CoinbaseEventType["chargeFailed"] = 3] = "chargeFailed";
    	    CoinbaseEventType[CoinbaseEventType["chargeConfirmed"] = 4] = "chargeConfirmed";
    	})(exports.CoinbaseEventType || (exports.CoinbaseEventType = {})); 
    } (coinbaseEventType));

    var dashboardItemType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.DashboardItemType = void 0;
    	(function (DashboardItemType) {
    	    DashboardItemType[DashboardItemType["numberOfApps"] = 0] = "numberOfApps";
    	    DashboardItemType[DashboardItemType["numberOfTranslationKeys"] = 1] = "numberOfTranslationKeys";
    	    DashboardItemType[DashboardItemType["numberOfTranslationKeysPerApp"] = 2] = "numberOfTranslationKeysPerApp";
    	    DashboardItemType[DashboardItemType["numberOfTranslationSubmissions"] = 3] = "numberOfTranslationSubmissions";
    	    DashboardItemType[DashboardItemType["numberOfTranslationVotes"] = 4] = "numberOfTranslationVotes";
    	    DashboardItemType[DashboardItemType["numberOfSupportedLanguages"] = 5] = "numberOfSupportedLanguages";
    	    DashboardItemType[DashboardItemType["numberOfDonations"] = 6] = "numberOfDonations";
    	    DashboardItemType[DashboardItemType["totalDonationAmount"] = 7] = "totalDonationAmount";
    	    DashboardItemType[DashboardItemType["numberOfLiveGuides"] = 8] = "numberOfLiveGuides";
    	    DashboardItemType[DashboardItemType["numberOfLiveGuidesPerApp"] = 9] = "numberOfLiveGuidesPerApp";
    	    DashboardItemType[DashboardItemType["numberOfGuidesPending"] = 10] = "numberOfGuidesPending";
    	    DashboardItemType[DashboardItemType["numberOfGuidesInReview"] = 11] = "numberOfGuidesInReview";
    	})(exports.DashboardItemType || (exports.DashboardItemType = {})); 
    } (dashboardItemType));

    var donationType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.DonationType = void 0;
    	(function (DonationType) {
    	    DonationType[DonationType["unknown"] = 0] = "unknown";
    	    DonationType[DonationType["paypal"] = 1] = "paypal";
    	    DonationType[DonationType["braveRewards"] = 2] = "braveRewards";
    	    DonationType[DonationType["buyMeACoffee"] = 3] = "buyMeACoffee";
    	    DonationType[DonationType["koFi"] = 4] = "koFi";
    	    DonationType[DonationType["patreon"] = 5] = "patreon";
    	    DonationType[DonationType["googlePay"] = 6] = "googlePay";
    	    DonationType[DonationType["applePay"] = 7] = "applePay";
    	    DonationType[DonationType["openCollective"] = 8] = "openCollective";
    	})(exports.DonationType || (exports.DonationType = {})); 
    } (donationType));

    var feedbackCategory = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.FeedbackCategory = void 0;
    	(function (FeedbackCategory) {
    	    FeedbackCategory[FeedbackCategory["isVisible"] = 0] = "isVisible";
    	    FeedbackCategory[FeedbackCategory["hidden"] = 1] = "hidden";
    	    FeedbackCategory[FeedbackCategory["featureRequest"] = 2] = "featureRequest";
    	    FeedbackCategory[FeedbackCategory["bugReport"] = 3] = "bugReport";
    	    FeedbackCategory[FeedbackCategory["offTopic"] = 4] = "offTopic";
    	})(exports.FeedbackCategory || (exports.FeedbackCategory = {})); 
    } (feedbackCategory));

    var feedbackQuestionType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.FeedbackQuestionType = void 0;
    	(function (FeedbackQuestionType) {
    	    FeedbackQuestionType[FeedbackQuestionType["plainText"] = 0] = "plainText";
    	    FeedbackQuestionType[FeedbackQuestionType["yesNo"] = 1] = "yesNo";
    	    FeedbackQuestionType[FeedbackQuestionType["yesNoUnknown"] = 2] = "yesNoUnknown";
    	    FeedbackQuestionType[FeedbackQuestionType["fiveStar"] = 3] = "fiveStar";
    	})(exports.FeedbackQuestionType || (exports.FeedbackQuestionType = {})); 
    } (feedbackQuestionType));

    var guideSectionItemType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.GuideSectionItemType = void 0;
    	(function (GuideSectionItemType) {
    	    GuideSectionItemType[GuideSectionItemType["text"] = 0] = "text";
    	    GuideSectionItemType[GuideSectionItemType["link"] = 1] = "link";
    	    GuideSectionItemType[GuideSectionItemType["image"] = 2] = "image";
    	    GuideSectionItemType[GuideSectionItemType["markdown"] = 3] = "markdown";
    	    GuideSectionItemType[GuideSectionItemType["table"] = 4] = "table";
    	})(exports.GuideSectionItemType || (exports.GuideSectionItemType = {})); 
    } (guideSectionItemType));

    var oAuthProviderType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.OAuthProviderType = void 0;
    	(function (OAuthProviderType) {
    	    OAuthProviderType[OAuthProviderType["unknown"] = 0] = "unknown";
    	    OAuthProviderType[OAuthProviderType["google"] = 1] = "google";
    	})(exports.OAuthProviderType || (exports.OAuthProviderType = {})); 
    } (oAuthProviderType));

    var permissionType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.PermissionType = void 0;
    	(function (PermissionType) {
    	    PermissionType[PermissionType["none"] = 0] = "none";
    	    PermissionType[PermissionType["usersView"] = 1] = "usersView";
    	    PermissionType[PermissionType["usersManage"] = 2] = "usersManage";
    	    PermissionType[PermissionType["userPermissionsView"] = 3] = "userPermissionsView";
    	    PermissionType[PermissionType["userPermissionsManage"] = 4] = "userPermissionsManage";
    	    PermissionType[PermissionType["appView"] = 5] = "appView";
    	    PermissionType[PermissionType["appManage"] = 6] = "appManage";
    	    PermissionType[PermissionType["translationView"] = 7] = "translationView";
    	    PermissionType[PermissionType["translationManage"] = 8] = "translationManage";
    	    PermissionType[PermissionType["translationKeyView"] = 9] = "translationKeyView";
    	    PermissionType[PermissionType["translationKeyManage"] = 10] = "translationKeyManage";
    	    PermissionType[PermissionType["hangfireDashboardView"] = 11] = "hangfireDashboardView";
    	    PermissionType[PermissionType["hangfireDashboardManage"] = 12] = "hangfireDashboardManage";
    	    PermissionType[PermissionType["languageView"] = 13] = "languageView";
    	    PermissionType[PermissionType["languageManage"] = 14] = "languageManage";
    	    PermissionType[PermissionType["cacheView"] = 15] = "cacheView";
    	    PermissionType[PermissionType["cacheManage"] = 16] = "cacheManage";
    	    PermissionType[PermissionType["guideSubmissionView"] = 17] = "guideSubmissionView";
    	    PermissionType[PermissionType["guideSubmissionManage"] = 18] = "guideSubmissionManage";
    	    PermissionType[PermissionType["versionView"] = 19] = "versionView";
    	    PermissionType[PermissionType["versionManage"] = 20] = "versionManage";
    	    PermissionType[PermissionType["donationView"] = 21] = "donationView";
    	    PermissionType[PermissionType["donationManage"] = 22] = "donationManage";
    	    PermissionType[PermissionType["steamBranchManage"] = 23] = "steamBranchManage";
    	    PermissionType[PermissionType["teamMemberView"] = 24] = "teamMemberView";
    	    PermissionType[PermissionType["teamMemberManage"] = 25] = "teamMemberManage";
    	    PermissionType[PermissionType["translationReportView"] = 26] = "translationReportView";
    	    PermissionType[PermissionType["translationReportManage"] = 27] = "translationReportManage";
    	    PermissionType[PermissionType["licenceView"] = 28] = "licenceView";
    	    PermissionType[PermissionType["licenceManage"] = 29] = "licenceManage";
    	    PermissionType[PermissionType["appNoticeView"] = 30] = "appNoticeView";
    	    PermissionType[PermissionType["appNoticeManage"] = 31] = "appNoticeManage";
    	    PermissionType[PermissionType["feedbackFormView"] = 32] = "feedbackFormView";
    	    PermissionType[PermissionType["feedbackFormManage"] = 33] = "feedbackFormManage";
    	    PermissionType[PermissionType["translationSubmissionView"] = 34] = "translationSubmissionView";
    	    PermissionType[PermissionType["databaseMaintenance"] = 35] = "databaseMaintenance";
    	})(exports.PermissionType || (exports.PermissionType = {})); 
    } (permissionType));

    var platformType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.PlatformType = void 0;
    	(function (PlatformType) {
    	    PlatformType[PlatformType["android"] = 0] = "android";
    	    PlatformType[PlatformType["iOS"] = 1] = "iOS";
    	    PlatformType[PlatformType["web"] = 2] = "web";
    	    PlatformType[PlatformType["api"] = 3] = "api";
    	    PlatformType[PlatformType["windows"] = 4] = "windows";
    	    PlatformType[PlatformType["githubWindowsInstaller"] = 5] = "githubWindowsInstaller";
    	})(exports.PlatformType || (exports.PlatformType = {})); 
    } (platformType));

    var redisCacheType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.RedisCacheType = void 0;
    	(function (RedisCacheType) {
    	    RedisCacheType[RedisCacheType["appRatingSummary"] = 0] = "appRatingSummary";
    	    RedisCacheType[RedisCacheType["appRatingGooglePlay"] = 1] = "appRatingGooglePlay";
    	    RedisCacheType[RedisCacheType["appRatingAppleAppStore"] = 2] = "appRatingAppleAppStore";
    	    RedisCacheType[RedisCacheType["patreonList"] = 3] = "patreonList";
    	    RedisCacheType[RedisCacheType["steamNews"] = 4] = "steamNews";
    	    RedisCacheType[RedisCacheType["steamBranches"] = 5] = "steamBranches";
    	    RedisCacheType[RedisCacheType["twitchAuthToken"] = 6] = "twitchAuthToken";
    	})(exports.RedisCacheType || (exports.RedisCacheType = {})); 
    } (redisCacheType));

    var requestBodyMapperType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.RequestBodyMapperType = void 0;
    	(function (RequestBodyMapperType) {
    	    RequestBodyMapperType[RequestBodyMapperType["unknown"] = 0] = "unknown";
    	    RequestBodyMapperType[RequestBodyMapperType["guide"] = 1] = "guide";
    	    RequestBodyMapperType[RequestBodyMapperType["version"] = 2] = "version";
    	})(exports.RequestBodyMapperType || (exports.RequestBodyMapperType = {})); 
    } (requestBodyMapperType));

    var signalRServerType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.SignalRServerType = void 0;
    	(function (SignalRServerType) {
    	    SignalRServerType[SignalRServerType["oAuthComplete"] = 0] = "oAuthComplete";
    	})(exports.SignalRServerType || (exports.SignalRServerType = {})); 
    } (signalRServerType));

    var sortDirection = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.SortDirection = void 0;
    	(function (SortDirection) {
    	    SortDirection[SortDirection["none"] = 0] = "none";
    	    SortDirection[SortDirection["asc"] = 1] = "asc";
    	    SortDirection[SortDirection["desc"] = 2] = "desc";
    	})(exports.SortDirection || (exports.SortDirection = {})); 
    } (sortDirection));

    var translationReportStatus = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.TranslationReportStatus = void 0;
    	(function (TranslationReportStatus) {
    	    TranslationReportStatus[TranslationReportStatus["pending"] = 0] = "pending";
    	    TranslationReportStatus[TranslationReportStatus["closed"] = 1] = "closed";
    	    TranslationReportStatus[TranslationReportStatus["resolved"] = 2] = "resolved";
    	})(exports.TranslationReportStatus || (exports.TranslationReportStatus = {})); 
    } (translationReportStatus));

    var userActivityActionType = {};

    (function (exports) {
    	/* Auto Generated */
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.UserActivityActionType = void 0;
    	(function (UserActivityActionType) {
    	    UserActivityActionType[UserActivityActionType["unknown"] = 0] = "unknown";
    	    UserActivityActionType[UserActivityActionType["create"] = 1] = "create";
    	    UserActivityActionType[UserActivityActionType["read"] = 2] = "read";
    	    UserActivityActionType[UserActivityActionType["update"] = 3] = "update";
    	    UserActivityActionType[UserActivityActionType["delete"] = 4] = "delete";
    	})(exports.UserActivityActionType || (exports.UserActivityActionType = {})); 
    } (userActivityActionType));

    var assistantAppsApiService = {};

    var baseApiService = {};

    function bind(fn, thisArg) {
      return function wrap() {
        return fn.apply(thisArg, arguments);
      };
    }

    // utils is a library of generic helper functions non-specific to axios

    const {toString} = Object.prototype;
    const {getPrototypeOf} = Object;

    const kindOf = (cache => thing => {
        const str = toString.call(thing);
        return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
    })(Object.create(null));

    const kindOfTest = (type) => {
      type = type.toLowerCase();
      return (thing) => kindOf(thing) === type
    };

    const typeOfTest = type => thing => typeof thing === type;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     *
     * @returns {boolean} True if value is an Array, otherwise false
     */
    const {isArray} = Array;

    /**
     * Determine if a value is undefined
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    const isUndefined = typeOfTest('undefined');

    /**
     * Determine if a value is a Buffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    const isArrayBuffer$1 = kindOfTest('ArrayBuffer');


    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      let result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (isArrayBuffer$1(val.buffer));
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a String, otherwise false
     */
    const isString = typeOfTest('string');

    /**
     * Determine if a value is a Function
     *
     * @param {*} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    const isFunction = typeOfTest('function');

    /**
     * Determine if a value is a Number
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Number, otherwise false
     */
    const isNumber = typeOfTest('number');

    /**
     * Determine if a value is an Object
     *
     * @param {*} thing The value to test
     *
     * @returns {boolean} True if value is an Object, otherwise false
     */
    const isObject = (thing) => thing !== null && typeof thing === 'object';

    /**
     * Determine if a value is a Boolean
     *
     * @param {*} thing The value to test
     * @returns {boolean} True if value is a Boolean, otherwise false
     */
    const isBoolean = thing => thing === true || thing === false;

    /**
     * Determine if a value is a plain Object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a plain Object, otherwise false
     */
    const isPlainObject = (val) => {
      if (kindOf(val) !== 'object') {
        return false;
      }

      const prototype = getPrototypeOf(val);
      return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
    };

    /**
     * Determine if a value is a Date
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Date, otherwise false
     */
    const isDate = kindOfTest('Date');

    /**
     * Determine if a value is a File
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a File, otherwise false
     */
    const isFile = kindOfTest('File');

    /**
     * Determine if a value is a Blob
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    const isBlob = kindOfTest('Blob');

    /**
     * Determine if a value is a FileList
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a File, otherwise false
     */
    const isFileList = kindOfTest('FileList');

    /**
     * Determine if a value is a Stream
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    const isStream = (val) => isObject(val) && isFunction(val.pipe);

    /**
     * Determine if a value is a FormData
     *
     * @param {*} thing The value to test
     *
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    const isFormData = (thing) => {
      let kind;
      return thing && (
        (typeof FormData === 'function' && thing instanceof FormData) || (
          isFunction(thing.append) && (
            (kind = kindOf(thing)) === 'formdata' ||
            // detect form-data instance
            (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]')
          )
        )
      )
    };

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    const isURLSearchParams = kindOfTest('URLSearchParams');

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     *
     * @returns {String} The String freed of excess whitespace
     */
    const trim = (str) => str.trim ?
      str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     *
     * @param {Boolean} [allOwnKeys = false]
     * @returns {any}
     */
    function forEach(obj, fn, {allOwnKeys = false} = {}) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      let i;
      let l;

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
        const len = keys.length;
        let key;

        for (i = 0; i < len; i++) {
          key = keys[i];
          fn.call(null, obj[key], key, obj);
        }
      }
    }

    function findKey(obj, key) {
      key = key.toLowerCase();
      const keys = Object.keys(obj);
      let i = keys.length;
      let _key;
      while (i-- > 0) {
        _key = keys[i];
        if (key === _key.toLowerCase()) {
          return _key;
        }
      }
      return null;
    }

    const _global = (() => {
      /*eslint no-undef:0*/
      if (typeof globalThis !== "undefined") return globalThis;
      return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : commonjsGlobal)
    })();

    const isContextDefined = (context) => !isUndefined(context) && context !== _global;

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     *
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      const {caseless} = isContextDefined(this) && this || {};
      const result = {};
      const assignValue = (val, key) => {
        const targetKey = caseless && findKey(result, key) || key;
        if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
          result[targetKey] = merge(result[targetKey], val);
        } else if (isPlainObject(val)) {
          result[targetKey] = merge({}, val);
        } else if (isArray(val)) {
          result[targetKey] = val.slice();
        } else {
          result[targetKey] = val;
        }
      };

      for (let i = 0, l = arguments.length; i < l; i++) {
        arguments[i] && forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     *
     * @param {Boolean} [allOwnKeys]
     * @returns {Object} The resulting value of object a
     */
    const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
      forEach(b, (val, key) => {
        if (thisArg && isFunction(val)) {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      }, {allOwnKeys});
      return a;
    };

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     *
     * @returns {string} content value without BOM
     */
    const stripBOM = (content) => {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    };

    /**
     * Inherit the prototype methods from one constructor into another
     * @param {function} constructor
     * @param {function} superConstructor
     * @param {object} [props]
     * @param {object} [descriptors]
     *
     * @returns {void}
     */
    const inherits = (constructor, superConstructor, props, descriptors) => {
      constructor.prototype = Object.create(superConstructor.prototype, descriptors);
      constructor.prototype.constructor = constructor;
      Object.defineProperty(constructor, 'super', {
        value: superConstructor.prototype
      });
      props && Object.assign(constructor.prototype, props);
    };

    /**
     * Resolve object with deep prototype chain to a flat object
     * @param {Object} sourceObj source object
     * @param {Object} [destObj]
     * @param {Function|Boolean} [filter]
     * @param {Function} [propFilter]
     *
     * @returns {Object}
     */
    const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
      let props;
      let i;
      let prop;
      const merged = {};

      destObj = destObj || {};
      // eslint-disable-next-line no-eq-null,eqeqeq
      if (sourceObj == null) return destObj;

      do {
        props = Object.getOwnPropertyNames(sourceObj);
        i = props.length;
        while (i-- > 0) {
          prop = props[i];
          if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
            destObj[prop] = sourceObj[prop];
            merged[prop] = true;
          }
        }
        sourceObj = filter !== false && getPrototypeOf(sourceObj);
      } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

      return destObj;
    };

    /**
     * Determines whether a string ends with the characters of a specified string
     *
     * @param {String} str
     * @param {String} searchString
     * @param {Number} [position= 0]
     *
     * @returns {boolean}
     */
    const endsWith = (str, searchString, position) => {
      str = String(str);
      if (position === undefined || position > str.length) {
        position = str.length;
      }
      position -= searchString.length;
      const lastIndex = str.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    };


    /**
     * Returns new array from array like object or null if failed
     *
     * @param {*} [thing]
     *
     * @returns {?Array}
     */
    const toArray = (thing) => {
      if (!thing) return null;
      if (isArray(thing)) return thing;
      let i = thing.length;
      if (!isNumber(i)) return null;
      const arr = new Array(i);
      while (i-- > 0) {
        arr[i] = thing[i];
      }
      return arr;
    };

    /**
     * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
     * thing passed in is an instance of Uint8Array
     *
     * @param {TypedArray}
     *
     * @returns {Array}
     */
    // eslint-disable-next-line func-names
    const isTypedArray = (TypedArray => {
      // eslint-disable-next-line func-names
      return thing => {
        return TypedArray && thing instanceof TypedArray;
      };
    })(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

    /**
     * For each entry in the object, call the function with the key and value.
     *
     * @param {Object<any, any>} obj - The object to iterate over.
     * @param {Function} fn - The function to call for each entry.
     *
     * @returns {void}
     */
    const forEachEntry = (obj, fn) => {
      const generator = obj && obj[Symbol.iterator];

      const iterator = generator.call(obj);

      let result;

      while ((result = iterator.next()) && !result.done) {
        const pair = result.value;
        fn.call(obj, pair[0], pair[1]);
      }
    };

    /**
     * It takes a regular expression and a string, and returns an array of all the matches
     *
     * @param {string} regExp - The regular expression to match against.
     * @param {string} str - The string to search.
     *
     * @returns {Array<boolean>}
     */
    const matchAll = (regExp, str) => {
      let matches;
      const arr = [];

      while ((matches = regExp.exec(str)) !== null) {
        arr.push(matches);
      }

      return arr;
    };

    /* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
    const isHTMLForm = kindOfTest('HTMLFormElement');

    const toCamelCase = str => {
      return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
        function replacer(m, p1, p2) {
          return p1.toUpperCase() + p2;
        }
      );
    };

    /* Creating a function that will check if an object has a property. */
    const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

    /**
     * Determine if a value is a RegExp object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a RegExp object, otherwise false
     */
    const isRegExp = kindOfTest('RegExp');

    const reduceDescriptors = (obj, reducer) => {
      const descriptors = Object.getOwnPropertyDescriptors(obj);
      const reducedDescriptors = {};

      forEach(descriptors, (descriptor, name) => {
        if (reducer(descriptor, name, obj) !== false) {
          reducedDescriptors[name] = descriptor;
        }
      });

      Object.defineProperties(obj, reducedDescriptors);
    };

    /**
     * Makes all methods read-only
     * @param {Object} obj
     */

    const freezeMethods = (obj) => {
      reduceDescriptors(obj, (descriptor, name) => {
        // skip restricted props in strict mode
        if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
          return false;
        }

        const value = obj[name];

        if (!isFunction(value)) return;

        descriptor.enumerable = false;

        if ('writable' in descriptor) {
          descriptor.writable = false;
          return;
        }

        if (!descriptor.set) {
          descriptor.set = () => {
            throw Error('Can not rewrite read-only method \'' + name + '\'');
          };
        }
      });
    };

    const toObjectSet = (arrayOrString, delimiter) => {
      const obj = {};

      const define = (arr) => {
        arr.forEach(value => {
          obj[value] = true;
        });
      };

      isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

      return obj;
    };

    const noop = () => {};

    const toFiniteNumber = (value, defaultValue) => {
      value = +value;
      return Number.isFinite(value) ? value : defaultValue;
    };

    const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

    const DIGIT = '0123456789';

    const ALPHABET = {
      DIGIT,
      ALPHA,
      ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
    };

    const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
      let str = '';
      const {length} = alphabet;
      while (size--) {
        str += alphabet[Math.random() * length|0];
      }

      return str;
    };

    /**
     * If the thing is a FormData object, return true, otherwise return false.
     *
     * @param {unknown} thing - The thing to check.
     *
     * @returns {boolean}
     */
    function isSpecCompliantForm(thing) {
      return !!(thing && isFunction(thing.append) && thing[Symbol.toStringTag] === 'FormData' && thing[Symbol.iterator]);
    }

    const toJSONObject = (obj) => {
      const stack = new Array(10);

      const visit = (source, i) => {

        if (isObject(source)) {
          if (stack.indexOf(source) >= 0) {
            return;
          }

          if(!('toJSON' in source)) {
            stack[i] = source;
            const target = isArray(source) ? [] : {};

            forEach(source, (value, key) => {
              const reducedValue = visit(value, i + 1);
              !isUndefined(reducedValue) && (target[key] = reducedValue);
            });

            stack[i] = undefined;

            return target;
          }
        }

        return source;
      };

      return visit(obj, 0);
    };

    const isAsyncFn = kindOfTest('AsyncFunction');

    const isThenable = (thing) =>
      thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);

    var utils = {
      isArray,
      isArrayBuffer: isArrayBuffer$1,
      isBuffer,
      isFormData,
      isArrayBufferView,
      isString,
      isNumber,
      isBoolean,
      isObject,
      isPlainObject,
      isUndefined,
      isDate,
      isFile,
      isBlob,
      isRegExp,
      isFunction,
      isStream,
      isURLSearchParams,
      isTypedArray,
      isFileList,
      forEach,
      merge,
      extend,
      trim,
      stripBOM,
      inherits,
      toFlatObject,
      kindOf,
      kindOfTest,
      endsWith,
      toArray,
      forEachEntry,
      matchAll,
      isHTMLForm,
      hasOwnProperty,
      hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
      reduceDescriptors,
      freezeMethods,
      toObjectSet,
      toCamelCase,
      noop,
      toFiniteNumber,
      findKey,
      global: _global,
      isContextDefined,
      ALPHABET,
      generateString,
      isSpecCompliantForm,
      toJSONObject,
      isAsyncFn,
      isThenable
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [config] The config.
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     *
     * @returns {Error} The created error.
     */
    function AxiosError(message, code, config, request, response) {
      Error.call(this);

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = (new Error()).stack;
      }

      this.message = message;
      this.name = 'AxiosError';
      code && (this.code = code);
      config && (this.config = config);
      request && (this.request = request);
      response && (this.response = response);
    }

    utils.inherits(AxiosError, Error, {
      toJSON: function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: utils.toJSONObject(this.config),
          code: this.code,
          status: this.response && this.response.status ? this.response.status : null
        };
      }
    });

    const prototype$1 = AxiosError.prototype;
    const descriptors = {};

    [
      'ERR_BAD_OPTION_VALUE',
      'ERR_BAD_OPTION',
      'ECONNABORTED',
      'ETIMEDOUT',
      'ERR_NETWORK',
      'ERR_FR_TOO_MANY_REDIRECTS',
      'ERR_DEPRECATED',
      'ERR_BAD_RESPONSE',
      'ERR_BAD_REQUEST',
      'ERR_CANCELED',
      'ERR_NOT_SUPPORT',
      'ERR_INVALID_URL'
    // eslint-disable-next-line func-names
    ].forEach(code => {
      descriptors[code] = {value: code};
    });

    Object.defineProperties(AxiosError, descriptors);
    Object.defineProperty(prototype$1, 'isAxiosError', {value: true});

    // eslint-disable-next-line func-names
    AxiosError.from = (error, code, config, request, response, customProps) => {
      const axiosError = Object.create(prototype$1);

      utils.toFlatObject(error, axiosError, function filter(obj) {
        return obj !== Error.prototype;
      }, prop => {
        return prop !== 'isAxiosError';
      });

      AxiosError.call(axiosError, error.message, code, config, request, response);

      axiosError.cause = error;

      axiosError.name = error.name;

      customProps && Object.assign(axiosError, customProps);

      return axiosError;
    };

    // eslint-disable-next-line strict
    var httpAdapter = null;

    /**
     * Determines if the given thing is a array or js object.
     *
     * @param {string} thing - The object or array to be visited.
     *
     * @returns {boolean}
     */
    function isVisitable(thing) {
      return utils.isPlainObject(thing) || utils.isArray(thing);
    }

    /**
     * It removes the brackets from the end of a string
     *
     * @param {string} key - The key of the parameter.
     *
     * @returns {string} the key without the brackets.
     */
    function removeBrackets(key) {
      return utils.endsWith(key, '[]') ? key.slice(0, -2) : key;
    }

    /**
     * It takes a path, a key, and a boolean, and returns a string
     *
     * @param {string} path - The path to the current key.
     * @param {string} key - The key of the current object being iterated over.
     * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
     *
     * @returns {string} The path to the current key.
     */
    function renderKey(path, key, dots) {
      if (!path) return key;
      return path.concat(key).map(function each(token, i) {
        // eslint-disable-next-line no-param-reassign
        token = removeBrackets(token);
        return !dots && i ? '[' + token + ']' : token;
      }).join(dots ? '.' : '');
    }

    /**
     * If the array is an array and none of its elements are visitable, then it's a flat array.
     *
     * @param {Array<any>} arr - The array to check
     *
     * @returns {boolean}
     */
    function isFlatArray(arr) {
      return utils.isArray(arr) && !arr.some(isVisitable);
    }

    const predicates = utils.toFlatObject(utils, {}, null, function filter(prop) {
      return /^is[A-Z]/.test(prop);
    });

    /**
     * Convert a data object to FormData
     *
     * @param {Object} obj
     * @param {?Object} [formData]
     * @param {?Object} [options]
     * @param {Function} [options.visitor]
     * @param {Boolean} [options.metaTokens = true]
     * @param {Boolean} [options.dots = false]
     * @param {?Boolean} [options.indexes = false]
     *
     * @returns {Object}
     **/

    /**
     * It converts an object into a FormData object
     *
     * @param {Object<any, any>} obj - The object to convert to form data.
     * @param {string} formData - The FormData object to append to.
     * @param {Object<string, any>} options
     *
     * @returns
     */
    function toFormData(obj, formData, options) {
      if (!utils.isObject(obj)) {
        throw new TypeError('target must be an object');
      }

      // eslint-disable-next-line no-param-reassign
      formData = formData || new (FormData)();

      // eslint-disable-next-line no-param-reassign
      options = utils.toFlatObject(options, {
        metaTokens: true,
        dots: false,
        indexes: false
      }, false, function defined(option, source) {
        // eslint-disable-next-line no-eq-null,eqeqeq
        return !utils.isUndefined(source[option]);
      });

      const metaTokens = options.metaTokens;
      // eslint-disable-next-line no-use-before-define
      const visitor = options.visitor || defaultVisitor;
      const dots = options.dots;
      const indexes = options.indexes;
      const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
      const useBlob = _Blob && utils.isSpecCompliantForm(formData);

      if (!utils.isFunction(visitor)) {
        throw new TypeError('visitor must be a function');
      }

      function convertValue(value) {
        if (value === null) return '';

        if (utils.isDate(value)) {
          return value.toISOString();
        }

        if (!useBlob && utils.isBlob(value)) {
          throw new AxiosError('Blob is not supported. Use a Buffer instead.');
        }

        if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
          return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
        }

        return value;
      }

      /**
       * Default visitor.
       *
       * @param {*} value
       * @param {String|Number} key
       * @param {Array<String|Number>} path
       * @this {FormData}
       *
       * @returns {boolean} return true to visit the each prop of the value recursively
       */
      function defaultVisitor(value, key, path) {
        let arr = value;

        if (value && !path && typeof value === 'object') {
          if (utils.endsWith(key, '{}')) {
            // eslint-disable-next-line no-param-reassign
            key = metaTokens ? key : key.slice(0, -2);
            // eslint-disable-next-line no-param-reassign
            value = JSON.stringify(value);
          } else if (
            (utils.isArray(value) && isFlatArray(value)) ||
            ((utils.isFileList(value) || utils.endsWith(key, '[]')) && (arr = utils.toArray(value))
            )) {
            // eslint-disable-next-line no-param-reassign
            key = removeBrackets(key);

            arr.forEach(function each(el, index) {
              !(utils.isUndefined(el) || el === null) && formData.append(
                // eslint-disable-next-line no-nested-ternary
                indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
                convertValue(el)
              );
            });
            return false;
          }
        }

        if (isVisitable(value)) {
          return true;
        }

        formData.append(renderKey(path, key, dots), convertValue(value));

        return false;
      }

      const stack = [];

      const exposedHelpers = Object.assign(predicates, {
        defaultVisitor,
        convertValue,
        isVisitable
      });

      function build(value, path) {
        if (utils.isUndefined(value)) return;

        if (stack.indexOf(value) !== -1) {
          throw Error('Circular reference detected in ' + path.join('.'));
        }

        stack.push(value);

        utils.forEach(value, function each(el, key) {
          const result = !(utils.isUndefined(el) || el === null) && visitor.call(
            formData, el, utils.isString(key) ? key.trim() : key, path, exposedHelpers
          );

          if (result === true) {
            build(el, path ? path.concat(key) : [key]);
          }
        });

        stack.pop();
      }

      if (!utils.isObject(obj)) {
        throw new TypeError('data must be an object');
      }

      build(obj);

      return formData;
    }

    /**
     * It encodes a string by replacing all characters that are not in the unreserved set with
     * their percent-encoded equivalents
     *
     * @param {string} str - The string to encode.
     *
     * @returns {string} The encoded string.
     */
    function encode$1(str) {
      const charMap = {
        '!': '%21',
        "'": '%27',
        '(': '%28',
        ')': '%29',
        '~': '%7E',
        '%20': '+',
        '%00': '\x00'
      };
      return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
        return charMap[match];
      });
    }

    /**
     * It takes a params object and converts it to a FormData object
     *
     * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
     * @param {Object<string, any>} options - The options object passed to the Axios constructor.
     *
     * @returns {void}
     */
    function AxiosURLSearchParams(params, options) {
      this._pairs = [];

      params && toFormData(params, this, options);
    }

    const prototype = AxiosURLSearchParams.prototype;

    prototype.append = function append(name, value) {
      this._pairs.push([name, value]);
    };

    prototype.toString = function toString(encoder) {
      const _encode = encoder ? function(value) {
        return encoder.call(this, value, encode$1);
      } : encode$1;

      return this._pairs.map(function each(pair) {
        return _encode(pair[0]) + '=' + _encode(pair[1]);
      }, '').join('&');
    };

    /**
     * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
     * URI encoded counterparts
     *
     * @param {string} val The value to be encoded.
     *
     * @returns {string} The encoded value.
     */
    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @param {?object} options
     *
     * @returns {string} The formatted url
     */
    function buildURL(url, params, options) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }
      
      const _encode = options && options.encode || encode;

      const serializeFn = options && options.serialize;

      let serializedParams;

      if (serializeFn) {
        serializedParams = serializeFn(params, options);
      } else {
        serializedParams = utils.isURLSearchParams(params) ?
          params.toString() :
          new AxiosURLSearchParams(params, options).toString(_encode);
      }

      if (serializedParams) {
        const hashmarkIndex = url.indexOf("#");

        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }
        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    }

    class InterceptorManager {
      constructor() {
        this.handlers = [];
      }

      /**
       * Add a new interceptor to the stack
       *
       * @param {Function} fulfilled The function to handle `then` for a `Promise`
       * @param {Function} rejected The function to handle `reject` for a `Promise`
       *
       * @return {Number} An ID used to remove interceptor later
       */
      use(fulfilled, rejected, options) {
        this.handlers.push({
          fulfilled,
          rejected,
          synchronous: options ? options.synchronous : false,
          runWhen: options ? options.runWhen : null
        });
        return this.handlers.length - 1;
      }

      /**
       * Remove an interceptor from the stack
       *
       * @param {Number} id The ID that was returned by `use`
       *
       * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
       */
      eject(id) {
        if (this.handlers[id]) {
          this.handlers[id] = null;
        }
      }

      /**
       * Clear all interceptors from the stack
       *
       * @returns {void}
       */
      clear() {
        if (this.handlers) {
          this.handlers = [];
        }
      }

      /**
       * Iterate over all the registered interceptors
       *
       * This method is particularly useful for skipping over any
       * interceptors that may have become `null` calling `eject`.
       *
       * @param {Function} fn The function to call for each interceptor
       *
       * @returns {void}
       */
      forEach(fn) {
        utils.forEach(this.handlers, function forEachHandler(h) {
          if (h !== null) {
            fn(h);
          }
        });
      }
    }

    var InterceptorManager$1 = InterceptorManager;

    var transitionalDefaults = {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false
    };

    var URLSearchParams$1 = typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;

    var FormData$1 = typeof FormData !== 'undefined' ? FormData : null;

    var Blob$1 = typeof Blob !== 'undefined' ? Blob : null;

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     *
     * @returns {boolean}
     */
    const isStandardBrowserEnv = (() => {
      let product;
      if (typeof navigator !== 'undefined' && (
        (product = navigator.product) === 'ReactNative' ||
        product === 'NativeScript' ||
        product === 'NS')
      ) {
        return false;
      }

      return typeof window !== 'undefined' && typeof document !== 'undefined';
    })();

    /**
     * Determine if we're running in a standard browser webWorker environment
     *
     * Although the `isStandardBrowserEnv` method indicates that
     * `allows axios to run in a web worker`, the WebWorker will still be
     * filtered out due to its judgment standard
     * `typeof window !== 'undefined' && typeof document !== 'undefined'`.
     * This leads to a problem when axios post `FormData` in webWorker
     */
     const isStandardBrowserWebWorkerEnv = (() => {
      return (
        typeof WorkerGlobalScope !== 'undefined' &&
        // eslint-disable-next-line no-undef
        self instanceof WorkerGlobalScope &&
        typeof self.importScripts === 'function'
      );
    })();


    var platform = {
      isBrowser: true,
      classes: {
        URLSearchParams: URLSearchParams$1,
        FormData: FormData$1,
        Blob: Blob$1
      },
      isStandardBrowserEnv,
      isStandardBrowserWebWorkerEnv,
      protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
    };

    function toURLEncodedForm(data, options) {
      return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
        visitor: function(value, key, path, helpers) {
          if (platform.isNode && utils.isBuffer(value)) {
            this.append(key, value.toString('base64'));
            return false;
          }

          return helpers.defaultVisitor.apply(this, arguments);
        }
      }, options));
    }

    /**
     * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
     *
     * @param {string} name - The name of the property to get.
     *
     * @returns An array of strings.
     */
    function parsePropPath(name) {
      // foo[x][y][z]
      // foo.x.y.z
      // foo-x-y-z
      // foo x y z
      return utils.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
        return match[0] === '[]' ? '' : match[1] || match[0];
      });
    }

    /**
     * Convert an array to an object.
     *
     * @param {Array<any>} arr - The array to convert to an object.
     *
     * @returns An object with the same keys and values as the array.
     */
    function arrayToObject(arr) {
      const obj = {};
      const keys = Object.keys(arr);
      let i;
      const len = keys.length;
      let key;
      for (i = 0; i < len; i++) {
        key = keys[i];
        obj[key] = arr[key];
      }
      return obj;
    }

    /**
     * It takes a FormData object and returns a JavaScript object
     *
     * @param {string} formData The FormData object to convert to JSON.
     *
     * @returns {Object<string, any> | null} The converted object.
     */
    function formDataToJSON(formData) {
      function buildPath(path, value, target, index) {
        let name = path[index++];
        const isNumericKey = Number.isFinite(+name);
        const isLast = index >= path.length;
        name = !name && utils.isArray(target) ? target.length : name;

        if (isLast) {
          if (utils.hasOwnProp(target, name)) {
            target[name] = [target[name], value];
          } else {
            target[name] = value;
          }

          return !isNumericKey;
        }

        if (!target[name] || !utils.isObject(target[name])) {
          target[name] = [];
        }

        const result = buildPath(path, value, target[name], index);

        if (result && utils.isArray(target[name])) {
          target[name] = arrayToObject(target[name]);
        }

        return !isNumericKey;
      }

      if (utils.isFormData(formData) && utils.isFunction(formData.entries)) {
        const obj = {};

        utils.forEachEntry(formData, (name, value) => {
          buildPath(parsePropPath(name), value, obj, 0);
        });

        return obj;
      }

      return null;
    }

    const DEFAULT_CONTENT_TYPE = {
      'Content-Type': undefined
    };

    /**
     * It takes a string, tries to parse it, and if it fails, it returns the stringified version
     * of the input
     *
     * @param {any} rawValue - The value to be stringified.
     * @param {Function} parser - A function that parses a string into a JavaScript object.
     * @param {Function} encoder - A function that takes a value and returns a string.
     *
     * @returns {string} A stringified version of the rawValue.
     */
    function stringifySafely(rawValue, parser, encoder) {
      if (utils.isString(rawValue)) {
        try {
          (parser || JSON.parse)(rawValue);
          return utils.trim(rawValue);
        } catch (e) {
          if (e.name !== 'SyntaxError') {
            throw e;
          }
        }
      }

      return (encoder || JSON.stringify)(rawValue);
    }

    const defaults$1 = {

      transitional: transitionalDefaults,

      adapter: ['xhr', 'http'],

      transformRequest: [function transformRequest(data, headers) {
        const contentType = headers.getContentType() || '';
        const hasJSONContentType = contentType.indexOf('application/json') > -1;
        const isObjectPayload = utils.isObject(data);

        if (isObjectPayload && utils.isHTMLForm(data)) {
          data = new FormData(data);
        }

        const isFormData = utils.isFormData(data);

        if (isFormData) {
          if (!hasJSONContentType) {
            return data;
          }
          return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
        }

        if (utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
          return data.toString();
        }

        let isFileList;

        if (isObjectPayload) {
          if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
            return toURLEncodedForm(data, this.formSerializer).toString();
          }

          if ((isFileList = utils.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
            const _FormData = this.env && this.env.FormData;

            return toFormData(
              isFileList ? {'files[]': data} : data,
              _FormData && new _FormData(),
              this.formSerializer
            );
          }
        }

        if (isObjectPayload || hasJSONContentType ) {
          headers.setContentType('application/json', false);
          return stringifySafely(data);
        }

        return data;
      }],

      transformResponse: [function transformResponse(data) {
        const transitional = this.transitional || defaults$1.transitional;
        const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
        const JSONRequested = this.responseType === 'json';

        if (data && utils.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
          const silentJSONParsing = transitional && transitional.silentJSONParsing;
          const strictJSONParsing = !silentJSONParsing && JSONRequested;

          try {
            return JSON.parse(data);
          } catch (e) {
            if (strictJSONParsing) {
              if (e.name === 'SyntaxError') {
                throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
              }
              throw e;
            }
          }
        }

        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      env: {
        FormData: platform.classes.FormData,
        Blob: platform.classes.Blob
      },

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      },

      headers: {
        common: {
          'Accept': 'application/json, text/plain, */*'
        }
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults$1.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults$1.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults$1$1 = defaults$1;

    // RawAxiosHeaders whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    const ignoreDuplicateOf = utils.toObjectSet([
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ]);

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} rawHeaders Headers needing to be parsed
     *
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = rawHeaders => {
      const parsed = {};
      let key;
      let val;
      let i;

      rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
        i = line.indexOf(':');
        key = line.substring(0, i).trim().toLowerCase();
        val = line.substring(i + 1).trim();

        if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
          return;
        }

        if (key === 'set-cookie') {
          if (parsed[key]) {
            parsed[key].push(val);
          } else {
            parsed[key] = [val];
          }
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      });

      return parsed;
    };

    const $internals = Symbol('internals');

    function normalizeHeader(header) {
      return header && String(header).trim().toLowerCase();
    }

    function normalizeValue(value) {
      if (value === false || value == null) {
        return value;
      }

      return utils.isArray(value) ? value.map(normalizeValue) : String(value);
    }

    function parseTokens(str) {
      const tokens = Object.create(null);
      const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
      let match;

      while ((match = tokensRE.exec(str))) {
        tokens[match[1]] = match[2];
      }

      return tokens;
    }

    const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

    function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
      if (utils.isFunction(filter)) {
        return filter.call(this, value, header);
      }

      if (isHeaderNameFilter) {
        value = header;
      }

      if (!utils.isString(value)) return;

      if (utils.isString(filter)) {
        return value.indexOf(filter) !== -1;
      }

      if (utils.isRegExp(filter)) {
        return filter.test(value);
      }
    }

    function formatHeader(header) {
      return header.trim()
        .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
          return char.toUpperCase() + str;
        });
    }

    function buildAccessors(obj, header) {
      const accessorName = utils.toCamelCase(' ' + header);

      ['get', 'set', 'has'].forEach(methodName => {
        Object.defineProperty(obj, methodName + accessorName, {
          value: function(arg1, arg2, arg3) {
            return this[methodName].call(this, header, arg1, arg2, arg3);
          },
          configurable: true
        });
      });
    }

    class AxiosHeaders {
      constructor(headers) {
        headers && this.set(headers);
      }

      set(header, valueOrRewrite, rewrite) {
        const self = this;

        function setHeader(_value, _header, _rewrite) {
          const lHeader = normalizeHeader(_header);

          if (!lHeader) {
            throw new Error('header name must be a non-empty string');
          }

          const key = utils.findKey(self, lHeader);

          if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
            self[key || _header] = normalizeValue(_value);
          }
        }

        const setHeaders = (headers, _rewrite) =>
          utils.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

        if (utils.isPlainObject(header) || header instanceof this.constructor) {
          setHeaders(header, valueOrRewrite);
        } else if(utils.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
          setHeaders(parseHeaders(header), valueOrRewrite);
        } else {
          header != null && setHeader(valueOrRewrite, header, rewrite);
        }

        return this;
      }

      get(header, parser) {
        header = normalizeHeader(header);

        if (header) {
          const key = utils.findKey(this, header);

          if (key) {
            const value = this[key];

            if (!parser) {
              return value;
            }

            if (parser === true) {
              return parseTokens(value);
            }

            if (utils.isFunction(parser)) {
              return parser.call(this, value, key);
            }

            if (utils.isRegExp(parser)) {
              return parser.exec(value);
            }

            throw new TypeError('parser must be boolean|regexp|function');
          }
        }
      }

      has(header, matcher) {
        header = normalizeHeader(header);

        if (header) {
          const key = utils.findKey(this, header);

          return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
        }

        return false;
      }

      delete(header, matcher) {
        const self = this;
        let deleted = false;

        function deleteHeader(_header) {
          _header = normalizeHeader(_header);

          if (_header) {
            const key = utils.findKey(self, _header);

            if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
              delete self[key];

              deleted = true;
            }
          }
        }

        if (utils.isArray(header)) {
          header.forEach(deleteHeader);
        } else {
          deleteHeader(header);
        }

        return deleted;
      }

      clear(matcher) {
        const keys = Object.keys(this);
        let i = keys.length;
        let deleted = false;

        while (i--) {
          const key = keys[i];
          if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
            delete this[key];
            deleted = true;
          }
        }

        return deleted;
      }

      normalize(format) {
        const self = this;
        const headers = {};

        utils.forEach(this, (value, header) => {
          const key = utils.findKey(headers, header);

          if (key) {
            self[key] = normalizeValue(value);
            delete self[header];
            return;
          }

          const normalized = format ? formatHeader(header) : String(header).trim();

          if (normalized !== header) {
            delete self[header];
          }

          self[normalized] = normalizeValue(value);

          headers[normalized] = true;
        });

        return this;
      }

      concat(...targets) {
        return this.constructor.concat(this, ...targets);
      }

      toJSON(asStrings) {
        const obj = Object.create(null);

        utils.forEach(this, (value, header) => {
          value != null && value !== false && (obj[header] = asStrings && utils.isArray(value) ? value.join(', ') : value);
        });

        return obj;
      }

      [Symbol.iterator]() {
        return Object.entries(this.toJSON())[Symbol.iterator]();
      }

      toString() {
        return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
      }

      get [Symbol.toStringTag]() {
        return 'AxiosHeaders';
      }

      static from(thing) {
        return thing instanceof this ? thing : new this(thing);
      }

      static concat(first, ...targets) {
        const computed = new this(first);

        targets.forEach((target) => computed.set(target));

        return computed;
      }

      static accessor(header) {
        const internals = this[$internals] = (this[$internals] = {
          accessors: {}
        });

        const accessors = internals.accessors;
        const prototype = this.prototype;

        function defineAccessor(_header) {
          const lHeader = normalizeHeader(_header);

          if (!accessors[lHeader]) {
            buildAccessors(prototype, _header);
            accessors[lHeader] = true;
          }
        }

        utils.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

        return this;
      }
    }

    AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

    utils.freezeMethods(AxiosHeaders.prototype);
    utils.freezeMethods(AxiosHeaders);

    var AxiosHeaders$1 = AxiosHeaders;

    /**
     * Transform the data for a request or a response
     *
     * @param {Array|Function} fns A single function or Array of functions
     * @param {?Object} response The response object
     *
     * @returns {*} The resulting transformed data
     */
    function transformData(fns, response) {
      const config = this || defaults$1$1;
      const context = response || config;
      const headers = AxiosHeaders$1.from(context.headers);
      let data = context.data;

      utils.forEach(fns, function transform(fn) {
        data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
      });

      headers.normalize();

      return data;
    }

    function isCancel(value) {
      return !!(value && value.__CANCEL__);
    }

    /**
     * A `CanceledError` is an object that is thrown when an operation is canceled.
     *
     * @param {string=} message The message.
     * @param {Object=} config The config.
     * @param {Object=} request The request.
     *
     * @returns {CanceledError} The created error.
     */
    function CanceledError(message, config, request) {
      // eslint-disable-next-line no-eq-null,eqeqeq
      AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
      this.name = 'CanceledError';
    }

    utils.inherits(CanceledError, AxiosError, {
      __CANCEL__: true
    });

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     *
     * @returns {object} The response.
     */
    function settle(resolve, reject, response) {
      const validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(new AxiosError(
          'Request failed with status code ' + response.status,
          [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
          response.config,
          response.request,
          response
        ));
      }
    }

    var cookies = platform.isStandardBrowserEnv ?

    // Standard browser envs support document.cookie
      (function standardBrowserEnv() {
        return {
          write: function write(name, value, expires, path, domain, secure) {
            const cookie = [];
            cookie.push(name + '=' + encodeURIComponent(value));

            if (utils.isNumber(expires)) {
              cookie.push('expires=' + new Date(expires).toGMTString());
            }

            if (utils.isString(path)) {
              cookie.push('path=' + path);
            }

            if (utils.isString(domain)) {
              cookie.push('domain=' + domain);
            }

            if (secure === true) {
              cookie.push('secure');
            }

            document.cookie = cookie.join('; ');
          },

          read: function read(name) {
            const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
            return (match ? decodeURIComponent(match[3]) : null);
          },

          remove: function remove(name) {
            this.write(name, '', Date.now() - 86400000);
          }
        };
      })() :

    // Non standard browser env (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return {
          write: function write() {},
          read: function read() { return null; },
          remove: function remove() {}
        };
      })();

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     *
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
    }

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     *
     * @returns {string} The combined URL
     */
    function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    }

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     *
     * @returns {string} The combined full path
     */
    function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    }

    var isURLSameOrigin = platform.isStandardBrowserEnv ?

    // Standard browser envs have full support of the APIs needed to test
    // whether the request URL is of the same origin as current location.
      (function standardBrowserEnv() {
        const msie = /(msie|trident)/i.test(navigator.userAgent);
        const urlParsingNode = document.createElement('a');
        let originURL;

        /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
        function resolveURL(url) {
          let href = url;

          if (msie) {
            // IE needs attribute set twice to normalize properties
            urlParsingNode.setAttribute('href', href);
            href = urlParsingNode.href;
          }

          urlParsingNode.setAttribute('href', href);

          // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
              urlParsingNode.pathname :
              '/' + urlParsingNode.pathname
          };
        }

        originURL = resolveURL(window.location.href);

        /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
        return function isURLSameOrigin(requestURL) {
          const parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
          return (parsed.protocol === originURL.protocol &&
              parsed.host === originURL.host);
        };
      })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
          return true;
        };
      })();

    function parseProtocol(url) {
      const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
      return match && match[1] || '';
    }

    /**
     * Calculate data maxRate
     * @param {Number} [samplesCount= 10]
     * @param {Number} [min= 1000]
     * @returns {Function}
     */
    function speedometer(samplesCount, min) {
      samplesCount = samplesCount || 10;
      const bytes = new Array(samplesCount);
      const timestamps = new Array(samplesCount);
      let head = 0;
      let tail = 0;
      let firstSampleTS;

      min = min !== undefined ? min : 1000;

      return function push(chunkLength) {
        const now = Date.now();

        const startedAt = timestamps[tail];

        if (!firstSampleTS) {
          firstSampleTS = now;
        }

        bytes[head] = chunkLength;
        timestamps[head] = now;

        let i = tail;
        let bytesCount = 0;

        while (i !== head) {
          bytesCount += bytes[i++];
          i = i % samplesCount;
        }

        head = (head + 1) % samplesCount;

        if (head === tail) {
          tail = (tail + 1) % samplesCount;
        }

        if (now - firstSampleTS < min) {
          return;
        }

        const passed = startedAt && now - startedAt;

        return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
      };
    }

    function progressEventReducer(listener, isDownloadStream) {
      let bytesNotified = 0;
      const _speedometer = speedometer(50, 250);

      return e => {
        const loaded = e.loaded;
        const total = e.lengthComputable ? e.total : undefined;
        const progressBytes = loaded - bytesNotified;
        const rate = _speedometer(progressBytes);
        const inRange = loaded <= total;

        bytesNotified = loaded;

        const data = {
          loaded,
          total,
          progress: total ? (loaded / total) : undefined,
          bytes: progressBytes,
          rate: rate ? rate : undefined,
          estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
          event: e
        };

        data[isDownloadStream ? 'download' : 'upload'] = true;

        listener(data);
      };
    }

    const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

    var xhrAdapter = isXHRAdapterSupported && function (config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        let requestData = config.data;
        const requestHeaders = AxiosHeaders$1.from(config.headers).normalize();
        const responseType = config.responseType;
        let onCanceled;
        function done() {
          if (config.cancelToken) {
            config.cancelToken.unsubscribe(onCanceled);
          }

          if (config.signal) {
            config.signal.removeEventListener('abort', onCanceled);
          }
        }

        if (utils.isFormData(requestData)) {
          if (platform.isStandardBrowserEnv || platform.isStandardBrowserWebWorkerEnv) {
            requestHeaders.setContentType(false); // Let the browser set it
          } else {
            requestHeaders.setContentType('multipart/form-data;', false); // mobile/desktop app frameworks
          }
        }

        let request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          const username = config.auth.username || '';
          const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.set('Authorization', 'Basic ' + btoa(username + ':' + password));
        }

        const fullPath = buildFullPath(config.baseURL, config.url);

        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        function onloadend() {
          if (!request) {
            return;
          }
          // Prepare the response
          const responseHeaders = AxiosHeaders$1.from(
            'getAllResponseHeaders' in request && request.getAllResponseHeaders()
          );
          const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
            request.responseText : request.response;
          const response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config,
            request
          };

          settle(function _resolve(value) {
            resolve(value);
            done();
          }, function _reject(err) {
            reject(err);
            done();
          }, response);

          // Clean up request
          request = null;
        }

        if ('onloadend' in request) {
          // Use onloadend if available
          request.onloadend = onloadend;
        } else {
          // Listen for ready state to emulate onloadend
          request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
              return;
            }

            // The request errored out and we didn't get a response, this will be
            // handled by onerror instead
            // With one exception: request that using file: protocol, most browsers
            // will return status as 0 even though it's a successful request
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
              return;
            }
            // readystate handler is calling before onerror or ontimeout handlers,
            // so we should call onloadend on the next 'tick'
            setTimeout(onloadend);
          };
        }

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          let timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
          const transitional = config.transitional || transitionalDefaults;
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(new AxiosError(
            timeoutErrorMessage,
            transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
            config,
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (platform.isStandardBrowserEnv) {
          // Add xsrf header
          const xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath))
            && config.xsrfCookieName && cookies.read(config.xsrfCookieName);

          if (xsrfValue) {
            requestHeaders.set(config.xsrfHeaderName, xsrfValue);
          }
        }

        // Remove Content-Type if data is undefined
        requestData === undefined && requestHeaders.setContentType(null);

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
            request.setRequestHeader(key, val);
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (responseType && responseType !== 'json') {
          request.responseType = config.responseType;
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', progressEventReducer(config.onDownloadProgress, true));
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', progressEventReducer(config.onUploadProgress));
        }

        if (config.cancelToken || config.signal) {
          // Handle cancellation
          // eslint-disable-next-line func-names
          onCanceled = cancel => {
            if (!request) {
              return;
            }
            reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
            request.abort();
            request = null;
          };

          config.cancelToken && config.cancelToken.subscribe(onCanceled);
          if (config.signal) {
            config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
          }
        }

        const protocol = parseProtocol(fullPath);

        if (protocol && platform.protocols.indexOf(protocol) === -1) {
          reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
          return;
        }


        // Send the request
        request.send(requestData || null);
      });
    };

    const knownAdapters = {
      http: httpAdapter,
      xhr: xhrAdapter
    };

    utils.forEach(knownAdapters, (fn, value) => {
      if(fn) {
        try {
          Object.defineProperty(fn, 'name', {value});
        } catch (e) {
          // eslint-disable-next-line no-empty
        }
        Object.defineProperty(fn, 'adapterName', {value});
      }
    });

    var adapters = {
      getAdapter: (adapters) => {
        adapters = utils.isArray(adapters) ? adapters : [adapters];

        const {length} = adapters;
        let nameOrAdapter;
        let adapter;

        for (let i = 0; i < length; i++) {
          nameOrAdapter = adapters[i];
          if((adapter = utils.isString(nameOrAdapter) ? knownAdapters[nameOrAdapter.toLowerCase()] : nameOrAdapter)) {
            break;
          }
        }

        if (!adapter) {
          if (adapter === false) {
            throw new AxiosError(
              `Adapter ${nameOrAdapter} is not supported by the environment`,
              'ERR_NOT_SUPPORT'
            );
          }

          throw new Error(
            utils.hasOwnProp(knownAdapters, nameOrAdapter) ?
              `Adapter '${nameOrAdapter}' is not available in the build` :
              `Unknown adapter '${nameOrAdapter}'`
          );
        }

        if (!utils.isFunction(adapter)) {
          throw new TypeError('adapter is not a function');
        }

        return adapter;
      },
      adapters: knownAdapters
    };

    /**
     * Throws a `CanceledError` if cancellation has been requested.
     *
     * @param {Object} config The config that is to be used for the request
     *
     * @returns {void}
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }

      if (config.signal && config.signal.aborted) {
        throw new CanceledError(null, config);
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      config.headers = AxiosHeaders$1.from(config.headers);

      // Transform request data
      config.data = transformData.call(
        config,
        config.transformRequest
      );

      if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
        config.headers.setContentType('application/x-www-form-urlencoded', false);
      }

      const adapter = adapters.getAdapter(config.adapter || defaults$1$1.adapter);

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData.call(
          config,
          config.transformResponse,
          response
        );

        response.headers = AxiosHeaders$1.from(response.headers);

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
            reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
          }
        }

        return Promise.reject(reason);
      });
    }

    const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? thing.toJSON() : thing;

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     *
     * @returns {Object} New object resulting from merging config2 to config1
     */
    function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      const config = {};

      function getMergedValue(target, source, caseless) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge.call({caseless}, target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      // eslint-disable-next-line consistent-return
      function mergeDeepProperties(a, b, caseless) {
        if (!utils.isUndefined(b)) {
          return getMergedValue(a, b, caseless);
        } else if (!utils.isUndefined(a)) {
          return getMergedValue(undefined, a, caseless);
        }
      }

      // eslint-disable-next-line consistent-return
      function valueFromConfig2(a, b) {
        if (!utils.isUndefined(b)) {
          return getMergedValue(undefined, b);
        }
      }

      // eslint-disable-next-line consistent-return
      function defaultToConfig2(a, b) {
        if (!utils.isUndefined(b)) {
          return getMergedValue(undefined, b);
        } else if (!utils.isUndefined(a)) {
          return getMergedValue(undefined, a);
        }
      }

      // eslint-disable-next-line consistent-return
      function mergeDirectKeys(a, b, prop) {
        if (prop in config2) {
          return getMergedValue(a, b);
        } else if (prop in config1) {
          return getMergedValue(undefined, a);
        }
      }

      const mergeMap = {
        url: valueFromConfig2,
        method: valueFromConfig2,
        data: valueFromConfig2,
        baseURL: defaultToConfig2,
        transformRequest: defaultToConfig2,
        transformResponse: defaultToConfig2,
        paramsSerializer: defaultToConfig2,
        timeout: defaultToConfig2,
        timeoutMessage: defaultToConfig2,
        withCredentials: defaultToConfig2,
        adapter: defaultToConfig2,
        responseType: defaultToConfig2,
        xsrfCookieName: defaultToConfig2,
        xsrfHeaderName: defaultToConfig2,
        onUploadProgress: defaultToConfig2,
        onDownloadProgress: defaultToConfig2,
        decompress: defaultToConfig2,
        maxContentLength: defaultToConfig2,
        maxBodyLength: defaultToConfig2,
        beforeRedirect: defaultToConfig2,
        transport: defaultToConfig2,
        httpAgent: defaultToConfig2,
        httpsAgent: defaultToConfig2,
        cancelToken: defaultToConfig2,
        socketPath: defaultToConfig2,
        responseEncoding: defaultToConfig2,
        validateStatus: mergeDirectKeys,
        headers: (a, b) => mergeDeepProperties(headersToObject(a), headersToObject(b), true)
      };

      utils.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
        const merge = mergeMap[prop] || mergeDeepProperties;
        const configValue = merge(config1[prop], config2[prop], prop);
        (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
      });

      return config;
    }

    const VERSION$1 = "1.4.0";

    const validators$1 = {};

    // eslint-disable-next-line func-names
    ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
      validators$1[type] = function validator(thing) {
        return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
      };
    });

    const deprecatedWarnings = {};

    /**
     * Transitional option validator
     *
     * @param {function|boolean?} validator - set to false if the transitional option has been removed
     * @param {string?} version - deprecated version / removed since version
     * @param {string?} message - some message with additional info
     *
     * @returns {function}
     */
    validators$1.transitional = function transitional(validator, version, message) {
      function formatMessage(opt, desc) {
        return '[Axios v' + VERSION$1 + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
      }

      // eslint-disable-next-line func-names
      return (value, opt, opts) => {
        if (validator === false) {
          throw new AxiosError(
            formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
            AxiosError.ERR_DEPRECATED
          );
        }

        if (version && !deprecatedWarnings[opt]) {
          deprecatedWarnings[opt] = true;
          // eslint-disable-next-line no-console
          console.warn(
            formatMessage(
              opt,
              ' has been deprecated since v' + version + ' and will be removed in the near future'
            )
          );
        }

        return validator ? validator(value, opt, opts) : true;
      };
    };

    /**
     * Assert object's properties type
     *
     * @param {object} options
     * @param {object} schema
     * @param {boolean?} allowUnknown
     *
     * @returns {object}
     */

    function assertOptions(options, schema, allowUnknown) {
      if (typeof options !== 'object') {
        throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
      }
      const keys = Object.keys(options);
      let i = keys.length;
      while (i-- > 0) {
        const opt = keys[i];
        const validator = schema[opt];
        if (validator) {
          const value = options[opt];
          const result = value === undefined || validator(value, opt, options);
          if (result !== true) {
            throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
          }
          continue;
        }
        if (allowUnknown !== true) {
          throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
        }
      }
    }

    var validator = {
      assertOptions,
      validators: validators$1
    };

    const validators = validator.validators;

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     *
     * @return {Axios} A new instance of Axios
     */
    class Axios {
      constructor(instanceConfig) {
        this.defaults = instanceConfig;
        this.interceptors = {
          request: new InterceptorManager$1(),
          response: new InterceptorManager$1()
        };
      }

      /**
       * Dispatch a request
       *
       * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
       * @param {?Object} config
       *
       * @returns {Promise} The Promise to be fulfilled
       */
      request(configOrUrl, config) {
        /*eslint no-param-reassign:0*/
        // Allow for axios('example/url'[, config]) a la fetch API
        if (typeof configOrUrl === 'string') {
          config = config || {};
          config.url = configOrUrl;
        } else {
          config = configOrUrl || {};
        }

        config = mergeConfig(this.defaults, config);

        const {transitional, paramsSerializer, headers} = config;

        if (transitional !== undefined) {
          validator.assertOptions(transitional, {
            silentJSONParsing: validators.transitional(validators.boolean),
            forcedJSONParsing: validators.transitional(validators.boolean),
            clarifyTimeoutError: validators.transitional(validators.boolean)
          }, false);
        }

        if (paramsSerializer != null) {
          if (utils.isFunction(paramsSerializer)) {
            config.paramsSerializer = {
              serialize: paramsSerializer
            };
          } else {
            validator.assertOptions(paramsSerializer, {
              encode: validators.function,
              serialize: validators.function
            }, true);
          }
        }

        // Set config.method
        config.method = (config.method || this.defaults.method || 'get').toLowerCase();

        let contextHeaders;

        // Flatten headers
        contextHeaders = headers && utils.merge(
          headers.common,
          headers[config.method]
        );

        contextHeaders && utils.forEach(
          ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
          (method) => {
            delete headers[method];
          }
        );

        config.headers = AxiosHeaders$1.concat(contextHeaders, headers);

        // filter out skipped interceptors
        const requestInterceptorChain = [];
        let synchronousRequestInterceptors = true;
        this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
          if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
            return;
          }

          synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

          requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
        });

        const responseInterceptorChain = [];
        this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
          responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
        });

        let promise;
        let i = 0;
        let len;

        if (!synchronousRequestInterceptors) {
          const chain = [dispatchRequest.bind(this), undefined];
          chain.unshift.apply(chain, requestInterceptorChain);
          chain.push.apply(chain, responseInterceptorChain);
          len = chain.length;

          promise = Promise.resolve(config);

          while (i < len) {
            promise = promise.then(chain[i++], chain[i++]);
          }

          return promise;
        }

        len = requestInterceptorChain.length;

        let newConfig = config;

        i = 0;

        while (i < len) {
          const onFulfilled = requestInterceptorChain[i++];
          const onRejected = requestInterceptorChain[i++];
          try {
            newConfig = onFulfilled(newConfig);
          } catch (error) {
            onRejected.call(this, error);
            break;
          }
        }

        try {
          promise = dispatchRequest.call(this, newConfig);
        } catch (error) {
          return Promise.reject(error);
        }

        i = 0;
        len = responseInterceptorChain.length;

        while (i < len) {
          promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
        }

        return promise;
      }

      getUri(config) {
        config = mergeConfig(this.defaults, config);
        const fullPath = buildFullPath(config.baseURL, config.url);
        return buildURL(fullPath, config.params, config.paramsSerializer);
      }
    }

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method,
          url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/

      function generateHTTPMethod(isForm) {
        return function httpMethod(url, data, config) {
          return this.request(mergeConfig(config || {}, {
            method,
            headers: isForm ? {
              'Content-Type': 'multipart/form-data'
            } : {},
            url,
            data
          }));
        };
      }

      Axios.prototype[method] = generateHTTPMethod();

      Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
    });

    var Axios$1 = Axios;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @param {Function} executor The executor function.
     *
     * @returns {CancelToken}
     */
    class CancelToken {
      constructor(executor) {
        if (typeof executor !== 'function') {
          throw new TypeError('executor must be a function.');
        }

        let resolvePromise;

        this.promise = new Promise(function promiseExecutor(resolve) {
          resolvePromise = resolve;
        });

        const token = this;

        // eslint-disable-next-line func-names
        this.promise.then(cancel => {
          if (!token._listeners) return;

          let i = token._listeners.length;

          while (i-- > 0) {
            token._listeners[i](cancel);
          }
          token._listeners = null;
        });

        // eslint-disable-next-line func-names
        this.promise.then = onfulfilled => {
          let _resolve;
          // eslint-disable-next-line func-names
          const promise = new Promise(resolve => {
            token.subscribe(resolve);
            _resolve = resolve;
          }).then(onfulfilled);

          promise.cancel = function reject() {
            token.unsubscribe(_resolve);
          };

          return promise;
        };

        executor(function cancel(message, config, request) {
          if (token.reason) {
            // Cancellation has already been requested
            return;
          }

          token.reason = new CanceledError(message, config, request);
          resolvePromise(token.reason);
        });
      }

      /**
       * Throws a `CanceledError` if cancellation has been requested.
       */
      throwIfRequested() {
        if (this.reason) {
          throw this.reason;
        }
      }

      /**
       * Subscribe to the cancel signal
       */

      subscribe(listener) {
        if (this.reason) {
          listener(this.reason);
          return;
        }

        if (this._listeners) {
          this._listeners.push(listener);
        } else {
          this._listeners = [listener];
        }
      }

      /**
       * Unsubscribe from the cancel signal
       */

      unsubscribe(listener) {
        if (!this._listeners) {
          return;
        }
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }

      /**
       * Returns an object that contains a new `CancelToken` and a function that, when called,
       * cancels the `CancelToken`.
       */
      static source() {
        let cancel;
        const token = new CancelToken(function executor(c) {
          cancel = c;
        });
        return {
          token,
          cancel
        };
      }
    }

    var CancelToken$1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     *
     * @returns {Function}
     */
    function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    }

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     *
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    function isAxiosError(payload) {
      return utils.isObject(payload) && (payload.isAxiosError === true);
    }

    const HttpStatusCode = {
      Continue: 100,
      SwitchingProtocols: 101,
      Processing: 102,
      EarlyHints: 103,
      Ok: 200,
      Created: 201,
      Accepted: 202,
      NonAuthoritativeInformation: 203,
      NoContent: 204,
      ResetContent: 205,
      PartialContent: 206,
      MultiStatus: 207,
      AlreadyReported: 208,
      ImUsed: 226,
      MultipleChoices: 300,
      MovedPermanently: 301,
      Found: 302,
      SeeOther: 303,
      NotModified: 304,
      UseProxy: 305,
      Unused: 306,
      TemporaryRedirect: 307,
      PermanentRedirect: 308,
      BadRequest: 400,
      Unauthorized: 401,
      PaymentRequired: 402,
      Forbidden: 403,
      NotFound: 404,
      MethodNotAllowed: 405,
      NotAcceptable: 406,
      ProxyAuthenticationRequired: 407,
      RequestTimeout: 408,
      Conflict: 409,
      Gone: 410,
      LengthRequired: 411,
      PreconditionFailed: 412,
      PayloadTooLarge: 413,
      UriTooLong: 414,
      UnsupportedMediaType: 415,
      RangeNotSatisfiable: 416,
      ExpectationFailed: 417,
      ImATeapot: 418,
      MisdirectedRequest: 421,
      UnprocessableEntity: 422,
      Locked: 423,
      FailedDependency: 424,
      TooEarly: 425,
      UpgradeRequired: 426,
      PreconditionRequired: 428,
      TooManyRequests: 429,
      RequestHeaderFieldsTooLarge: 431,
      UnavailableForLegalReasons: 451,
      InternalServerError: 500,
      NotImplemented: 501,
      BadGateway: 502,
      ServiceUnavailable: 503,
      GatewayTimeout: 504,
      HttpVersionNotSupported: 505,
      VariantAlsoNegotiates: 506,
      InsufficientStorage: 507,
      LoopDetected: 508,
      NotExtended: 510,
      NetworkAuthenticationRequired: 511,
    };

    Object.entries(HttpStatusCode).forEach(([key, value]) => {
      HttpStatusCode[value] = key;
    });

    var HttpStatusCode$1 = HttpStatusCode;

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     *
     * @returns {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      const context = new Axios$1(defaultConfig);
      const instance = bind(Axios$1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios$1.prototype, context, {allOwnKeys: true});

      // Copy context to instance
      utils.extend(instance, context, null, {allOwnKeys: true});

      // Factory for creating new instances
      instance.create = function create(instanceConfig) {
        return createInstance(mergeConfig(defaultConfig, instanceConfig));
      };

      return instance;
    }

    // Create the default instance to be exported
    const axios = createInstance(defaults$1$1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios$1;

    // Expose Cancel & CancelToken
    axios.CanceledError = CanceledError;
    axios.CancelToken = CancelToken$1;
    axios.isCancel = isCancel;
    axios.VERSION = VERSION$1;
    axios.toFormData = toFormData;

    // Expose AxiosError class
    axios.AxiosError = AxiosError;

    // alias for CanceledError for backward compatibility
    axios.Cancel = axios.CanceledError;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };

    axios.spread = spread;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError;

    // Expose mergeConfig
    axios.mergeConfig = mergeConfig;

    axios.AxiosHeaders = AxiosHeaders$1;

    axios.formToJSON = thing => formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);

    axios.HttpStatusCode = HttpStatusCode$1;

    axios.default = axios;

    var axios_1$1 = axios;

    var typescriptHacks = {};

    Object.defineProperty(typescriptHacks, "__esModule", { value: true });
    typescriptHacks.anyObject = void 0;
    typescriptHacks.anyObject = {};

    var __awaiter$7 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(baseApiService, "__esModule", { value: true });
    baseApiService.BaseApiService = void 0;
    const axios_1 = __importDefault(axios_1$1);
    const typescriptHacks_1$6 = typescriptHacks;
    class BaseApiService {
        constructor(newBaseUrl) {
            this._baseUrl = 'https://api.assistantapps.com';
            this.addAccessTokenToHeaders = () => typescriptHacks_1$6.anyObject;
            this.formDataWithAccessTokenHeaders = () => typescriptHacks_1$6.anyObject;
            this._baseUrl = newBaseUrl;
        }
        get(url, manipulateHeaders, manipulateResponse) {
            var _a, _b;
            return __awaiter$7(this, void 0, void 0, function* () {
                //
                let options = typescriptHacks_1$6.anyObject;
                if (manipulateHeaders != null) {
                    options = Object.assign(Object.assign({}, options), manipulateHeaders());
                }
                try {
                    const result = yield axios_1.default.get(`${this._baseUrl}/${url}`, options);
                    if (manipulateResponse != null) {
                        return manipulateResponse(result);
                    }
                    return {
                        isSuccess: true,
                        value: result.data,
                        errorMessage: ''
                    };
                }
                catch (ex) {
                    console.log('data', JSON.stringify((_b = (_a = ex === null || ex === void 0 ? void 0 : ex.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : typescriptHacks_1$6.anyObject));
                    return {
                        isSuccess: false,
                        value: typescriptHacks_1$6.anyObject,
                        errorMessage: ex.message
                    };
                }
            });
        }
        post(url, data, manipulateHeaders, customMapper) {
            var _a, _b;
            return __awaiter$7(this, void 0, void 0, function* () {
                //
                let options = typescriptHacks_1$6.anyObject;
                if (manipulateHeaders != null) {
                    options = Object.assign(Object.assign({}, options), manipulateHeaders());
                }
                try {
                    const result = yield axios_1.default.post(`${this._baseUrl}/${url}`, data, options);
                    if (customMapper != null)
                        return customMapper(result);
                    return {
                        isSuccess: true,
                        value: result.data,
                        errorMessage: ''
                    };
                }
                catch (ex) {
                    console.log('data', JSON.stringify((_b = (_a = ex === null || ex === void 0 ? void 0 : ex.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : typescriptHacks_1$6.anyObject));
                    return {
                        isSuccess: false,
                        value: typescriptHacks_1$6.anyObject,
                        errorMessage: ex.message
                    };
                }
            });
        }
        put(url, data, manipulateHeaders, customMapper) {
            var _a, _b;
            return __awaiter$7(this, void 0, void 0, function* () {
                //
                let options = typescriptHacks_1$6.anyObject;
                if (manipulateHeaders != null) {
                    options = Object.assign(Object.assign({}, options), manipulateHeaders());
                }
                try {
                    const result = yield axios_1.default.put(`${this._baseUrl}/${url}`, data, options);
                    if (customMapper != null)
                        return customMapper(result);
                    return {
                        isSuccess: true,
                        value: result.data,
                        errorMessage: ''
                    };
                }
                catch (ex) {
                    console.log('data', JSON.stringify((_b = (_a = ex === null || ex === void 0 ? void 0 : ex.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : typescriptHacks_1$6.anyObject));
                    return {
                        isSuccess: false,
                        value: typescriptHacks_1$6.anyObject,
                        errorMessage: ex.message
                    };
                }
            });
        }
        delete(url, manipulateHeaders) {
            var _a, _b;
            return __awaiter$7(this, void 0, void 0, function* () {
                //
                let options = typescriptHacks_1$6.anyObject;
                if (manipulateHeaders != null) {
                    options = Object.assign(Object.assign({}, options), manipulateHeaders());
                }
                try {
                    const result = yield axios_1.default.delete(`${this._baseUrl}/${url}`, options);
                    return {
                        isSuccess: true,
                        errorMessage: ''
                    };
                }
                catch (ex) {
                    console.log('data', JSON.stringify((_b = (_a = ex === null || ex === void 0 ? void 0 : ex.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : typescriptHacks_1$6.anyObject));
                    return {
                        isSuccess: false,
                        errorMessage: ex.message
                    };
                }
            });
        }
    }
    baseApiService.BaseApiService = BaseApiService;

    var account_controller = {};

    var dateHelper = {};

    var dayjs_min = {exports: {}};

    (function (module, exports) {
    	!function(t,e){module.exports=e();}(commonjsGlobal,(function(){var t=1e3,e=6e4,n=36e5,r="millisecond",i="second",s="minute",u="hour",a="day",o="week",f="month",h="quarter",c="year",d="date",l="Invalid Date",$=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,y=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,M={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),ordinal:function(t){var e=["th","st","nd","rd"],n=t%100;return "["+t+(e[(n-20)%10]||e[n]||e[0])+"]"}},m=function(t,e,n){var r=String(t);return !r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},v={s:m,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return (e<=0?"+":"-")+m(r,2,"0")+":"+m(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return -t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,f),s=n-i<0,u=e.clone().add(r+(s?-1:1),f);return +(-(r+(n-i)/(s?i-u:u-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(t){return {M:f,y:c,w:o,d:a,D:d,h:u,m:s,s:i,ms:r,Q:h}[t]||String(t||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},g="en",D={};D[g]=M;var p=function(t){return t instanceof _},S=function t(e,n,r){var i;if(!e)return g;if("string"==typeof e){var s=e.toLowerCase();D[s]&&(i=s),n&&(D[s]=n,i=s);var u=e.split("-");if(!i&&u.length>1)return t(u[0])}else {var a=e.name;D[a]=e,i=a;}return !r&&i&&(g=i),i||!r&&g},w=function(t,e){if(p(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new _(n)},O=v;O.l=S,O.i=p,O.w=function(t,e){return w(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var _=function(){function M(t){this.$L=S(t.locale,null,!0),this.parse(t);}var m=M.prototype;return m.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(O.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match($);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.$x=t.x||{},this.init();},m.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds();},m.$utils=function(){return O},m.isValid=function(){return !(this.$d.toString()===l)},m.isSame=function(t,e){var n=w(t);return this.startOf(e)<=n&&n<=this.endOf(e)},m.isAfter=function(t,e){return w(t)<this.startOf(e)},m.isBefore=function(t,e){return this.endOf(e)<w(t)},m.$g=function(t,e,n){return O.u(t)?this[e]:this.set(n,t)},m.unix=function(){return Math.floor(this.valueOf()/1e3)},m.valueOf=function(){return this.$d.getTime()},m.startOf=function(t,e){var n=this,r=!!O.u(e)||e,h=O.p(t),l=function(t,e){var i=O.w(n.$u?Date.UTC(n.$y,e,t):new Date(n.$y,e,t),n);return r?i:i.endOf(a)},$=function(t,e){return O.w(n.toDate()[t].apply(n.toDate("s"),(r?[0,0,0,0]:[23,59,59,999]).slice(e)),n)},y=this.$W,M=this.$M,m=this.$D,v="set"+(this.$u?"UTC":"");switch(h){case c:return r?l(1,0):l(31,11);case f:return r?l(1,M):l(0,M+1);case o:var g=this.$locale().weekStart||0,D=(y<g?y+7:y)-g;return l(r?m-D:m+(6-D),M);case a:case d:return $(v+"Hours",0);case u:return $(v+"Minutes",1);case s:return $(v+"Seconds",2);case i:return $(v+"Milliseconds",3);default:return this.clone()}},m.endOf=function(t){return this.startOf(t,!1)},m.$set=function(t,e){var n,o=O.p(t),h="set"+(this.$u?"UTC":""),l=(n={},n[a]=h+"Date",n[d]=h+"Date",n[f]=h+"Month",n[c]=h+"FullYear",n[u]=h+"Hours",n[s]=h+"Minutes",n[i]=h+"Seconds",n[r]=h+"Milliseconds",n)[o],$=o===a?this.$D+(e-this.$W):e;if(o===f||o===c){var y=this.clone().set(d,1);y.$d[l]($),y.init(),this.$d=y.set(d,Math.min(this.$D,y.daysInMonth())).$d;}else l&&this.$d[l]($);return this.init(),this},m.set=function(t,e){return this.clone().$set(t,e)},m.get=function(t){return this[O.p(t)]()},m.add=function(r,h){var d,l=this;r=Number(r);var $=O.p(h),y=function(t){var e=w(l);return O.w(e.date(e.date()+Math.round(t*r)),l)};if($===f)return this.set(f,this.$M+r);if($===c)return this.set(c,this.$y+r);if($===a)return y(1);if($===o)return y(7);var M=(d={},d[s]=e,d[u]=n,d[i]=t,d)[$]||1,m=this.$d.getTime()+r*M;return O.w(m,this)},m.subtract=function(t,e){return this.add(-1*t,e)},m.format=function(t){var e=this,n=this.$locale();if(!this.isValid())return n.invalidDate||l;var r=t||"YYYY-MM-DDTHH:mm:ssZ",i=O.z(this),s=this.$H,u=this.$m,a=this.$M,o=n.weekdays,f=n.months,h=function(t,n,i,s){return t&&(t[n]||t(e,r))||i[n].slice(0,s)},c=function(t){return O.s(s%12||12,t,"0")},d=n.meridiem||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r},$={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:O.s(a+1,2,"0"),MMM:h(n.monthsShort,a,f,3),MMMM:h(f,a),D:this.$D,DD:O.s(this.$D,2,"0"),d:String(this.$W),dd:h(n.weekdaysMin,this.$W,o,2),ddd:h(n.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:O.s(s,2,"0"),h:c(1),hh:c(2),a:d(s,u,!0),A:d(s,u,!1),m:String(u),mm:O.s(u,2,"0"),s:String(this.$s),ss:O.s(this.$s,2,"0"),SSS:O.s(this.$ms,3,"0"),Z:i};return r.replace(y,(function(t,e){return e||$[t]||i.replace(":","")}))},m.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},m.diff=function(r,d,l){var $,y=O.p(d),M=w(r),m=(M.utcOffset()-this.utcOffset())*e,v=this-M,g=O.m(this,M);return g=($={},$[c]=g/12,$[f]=g,$[h]=g/3,$[o]=(v-m)/6048e5,$[a]=(v-m)/864e5,$[u]=v/n,$[s]=v/e,$[i]=v/t,$)[y]||v,l?g:O.a(g)},m.daysInMonth=function(){return this.endOf(f).$D},m.$locale=function(){return D[this.$L]},m.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=S(t,e,!0);return r&&(n.$L=r),n},m.clone=function(){return O.w(this.$d,this)},m.toDate=function(){return new Date(this.valueOf())},m.toJSON=function(){return this.isValid()?this.toISOString():null},m.toISOString=function(){return this.$d.toISOString()},m.toString=function(){return this.$d.toUTCString()},M}(),T=_.prototype;return w.prototype=T,[["$ms",r],["$s",i],["$m",s],["$H",u],["$W",a],["$M",f],["$y",c],["$D",d]].forEach((function(t){T[t[1]]=function(e){return this.$g(e,t[0],t[1])};})),w.extend=function(t,e){return t.$i||(t(e,_,w),t.$i=!0),w},w.locale=S,w.isDayjs=p,w.unix=function(t){return w(1e3*t)},w.en=D[g],w.Ls=D,w.p={},w})); 
    } (dayjs_min));

    var dayjs_minExports = dayjs_min.exports;
    var dayjs = /*@__PURE__*/getDefaultExportFromCjs(dayjs_minExports);

    (function (exports) {
    	var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    	    return (mod && mod.__esModule) ? mod : { "default": mod };
    	};
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.isBefore = exports.addSeconds = exports.formatForDateLocal = exports.formatDate = void 0;
    	const dayjs_1 = __importDefault(dayjs_minExports);
    	const formatDate = (date, format = 'DD MMM YY hh:mm') => {
    	    try {
    	        return (0, dayjs_1.default)(date).format(format);
    	    }
    	    catch (_a) {
    	        return '';
    	    }
    	};
    	exports.formatDate = formatDate;
    	const formatForDateLocal = (value) => (0, exports.formatDate)(value, 'YYYY-MM-DDTHH:mm');
    	exports.formatForDateLocal = formatForDateLocal;
    	const addSeconds = (date, seconds) => {
    	    try {
    	        return (0, dayjs_1.default)(date).add(seconds, 'seconds').toDate();
    	    }
    	    catch (_a) {
    	        return date;
    	    }
    	};
    	exports.addSeconds = addSeconds;
    	const isBefore = (date, secondDate) => {
    	    try {
    	        return (0, dayjs_1.default)(date).isBefore(secondDate);
    	    }
    	    catch (_a) {
    	        return false;
    	    }
    	};
    	exports.isBefore = isBefore; 
    } (dateHelper));

    var __awaiter$6 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(account_controller, "__esModule", { value: true });
    account_controller.accountController = void 0;
    const endpoints_1$r = endpoints;
    const header_keys_1 = headerKeys;
    const dateHelper_1 = dateHelper;
    const typescriptHacks_1$5 = typescriptHacks;
    const authHandler = (response, userVm, userAccFunc) => {
        const token = response.headers.get(header_keys_1.TokenHeaderKey);
        const tokenExpiry = response.headers.get(header_keys_1.TokenExpiryHeaderKey);
        const userGuid = response.headers.get(header_keys_1.UserGuidHeaderKey);
        userAccFunc({
            userGuid: userGuid,
            username: userVm.username,
            profilePic: userVm.profileUrl,
            token: token,
            tokenExpiry: tokenExpiry,
            tokenExpiryDate: (0, dateHelper_1.addSeconds)(new Date(), tokenExpiry),
        });
        return response.status == 200;
    };
    const accountController = (service) => ({
        loginWithGoogleAuth: (userVm, userAccFunc) => __awaiter$6(void 0, void 0, void 0, function* () {
            const isSuccess = yield service.post(endpoints_1$r.endpoints.authUrl, userVm, () => typescriptHacks_1$5.anyObject, (response) => authHandler(response, userVm, userAccFunc));
            return {
                isSuccess,
                errorMessage: '',
            };
        }),
        getFakeToken: (userAccFunc) => __awaiter$6(void 0, void 0, void 0, function* () {
            const fakeUserVm = {
                username: 'fake account',
                profileUrl: 'profile.png',
            };
            const isSuccess = yield service.post(endpoints_1$r.endpoints.fakeAuthUrl, typescriptHacks_1$5.anyObject, () => typescriptHacks_1$5.anyObject, (response) => authHandler(response, fakeUserVm, userAccFunc));
            return {
                isSuccess,
                errorMessage: '',
            };
        })
    });
    account_controller.accountController = accountController;

    var app_controller = {};

    Object.defineProperty(app_controller, "__esModule", { value: true });
    app_controller.appController = void 0;
    const endpoints_1$q = endpoints;
    const apiPath$m = endpoints_1$q.endpoints.app;
    const appController = (service) => ({
        create: (item) => {
            return service.post(apiPath$m, item, service.addAccessTokenToHeaders);
        },
        readAll: () => {
            return service.get(apiPath$m);
        },
        readAllForAdmin: (search) => {
            return service.get(`${apiPath$m}/Admin`, service.addAccessTokenToHeaders);
        },
        update: (item) => {
            return service.put(apiPath$m, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$m}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    app_controller.appController = appController;

    var appNotice_controller = {};

    Object.defineProperty(appNotice_controller, "__esModule", { value: true });
    appNotice_controller.appNoticeController = void 0;
    const endpoints_1$p = endpoints;
    const apiPath$l = endpoints_1$p.endpoints.appNotice;
    const appNoticeController = (service) => ({
        create: (item) => {
            return service.post(apiPath$l, item, service.addAccessTokenToHeaders);
        },
        readAll: (appGuid, langCode) => {
            return service.get(`${apiPath$l}/${appGuid}/${langCode}`);
        },
        readAllForAdmin: (search) => {
            return service.get(`${apiPath$l}/Admin`, service.addAccessTokenToHeaders);
        },
        update: (item) => {
            return service.put(apiPath$l, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$l}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    appNotice_controller.appNoticeController = appNoticeController;

    var appReview_controller = {};

    Object.defineProperty(appReview_controller, "__esModule", { value: true });
    appReview_controller.appReviewController = void 0;
    const endpoints_1$o = endpoints;
    const apiPath$k = endpoints_1$o.endpoints.appReviews;
    const appReviewController = (service) => ({
        readForApp: (appType) => {
            return service.get(`${apiPath$k}/${appType}`);
        }
    });
    appReview_controller.appReviewController = appReviewController;

    var badge_controller = {};

    Object.defineProperty(badge_controller, "__esModule", { value: true });
    badge_controller.badgeController = void 0;
    const endpoints_1$n = endpoints;
    const apiPath$j = endpoints_1$n.endpoints.badge;
    const badgeController = (service) => ({
        reviews: (appType, platform) => {
            return service.get(`${apiPath$j}/${appType}/${platform}`);
        },
        version: (appGuid) => {
            return service.get(`${apiPath$j}/${appGuid}`);
        }
    });
    badge_controller.badgeController = badgeController;

    var cache_controller = {};

    Object.defineProperty(cache_controller, "__esModule", { value: true });
    cache_controller.cacheController = void 0;
    const endpoints_1$m = endpoints;
    const cache = endpoints_1$m.endpoints.cache;
    const redisCache = endpoints_1$m.endpoints.redisCache;
    const cacheController = (service) => ({
        readAllCache: () => {
            return service.get(cache, service.addAccessTokenToHeaders);
        },
        delCache: (cacheKey) => {
            const url = `${cache}/${encodeURIComponent(cacheKey)}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        },
        delAllCache: () => {
            return service.delete(cache, service.addAccessTokenToHeaders);
        },
        //
        readAllRedisCache: () => {
            return service.get(redisCache, service.addAccessTokenToHeaders);
        },
        delRedisCache: (cacheKey) => {
            const url = `${redisCache}/${cacheKey}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        },
        delAllRedisCache: () => {
            return service.delete(redisCache, service.addAccessTokenToHeaders);
        },
    });
    cache_controller.cacheController = cacheController;

    var contact_controller = {};

    Object.defineProperty(contact_controller, "__esModule", { value: true });
    contact_controller.contactController = void 0;
    const endpoints_1$l = endpoints;
    const contactController = (service) => ({
        formSubmission: (form) => {
            return service.post(endpoints_1$l.endpoints.contact, form, service.addAccessTokenToHeaders);
        },
    });
    contact_controller.contactController = contactController;

    var dashboard_controller = {};

    Object.defineProperty(dashboard_controller, "__esModule", { value: true });
    dashboard_controller.dashboardController = void 0;
    const endpoints_1$k = endpoints;
    const dashboardController = (service) => ({
        dashboard: () => {
            return service.get(endpoints_1$k.endpoints.dashboard);
        },
        adminDashboard: () => {
            return service.get(endpoints_1$k.endpoints.dashboard, service.addAccessTokenToHeaders);
        },
    });
    dashboard_controller.dashboardController = dashboardController;

    var donation_controller = {};

    var __awaiter$5 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(donation_controller, "__esModule", { value: true });
    donation_controller.donationController = void 0;
    const endpoints_1$j = endpoints;
    const apiPath$i = endpoints_1$j.endpoints.donation;
    const donationController = (service) => ({
        create: (item) => {
            return service.post(apiPath$i, item, service.addAccessTokenToHeaders);
        },
        readAll: (page) => __awaiter$5(void 0, void 0, void 0, function* () {
            let url = apiPath$i;
            if (page != null) {
                url += `?page=${apiPath$i}`;
            }
            const apiResult = yield service.get(url);
            return apiResult.value;
        }),
        readAllForAdmin: (search) => __awaiter$5(void 0, void 0, void 0, function* () {
            var _a, _b;
            const apiResult = yield service.post(`${apiPath$i}/Search`, {
                page: (_a = search === null || search === void 0 ? void 0 : search.page) !== null && _a !== void 0 ? _a : 1,
                searchText: (_b = search === null || search === void 0 ? void 0 : search.searchText) !== null && _b !== void 0 ? _b : '',
            }, service.addAccessTokenToHeaders);
            return apiResult.value;
        }),
        update: (item) => {
            return service.put(apiPath$i, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$i}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    donation_controller.donationController = donationController;

    var feedbackForm_controller = {};

    Object.defineProperty(feedbackForm_controller, "__esModule", { value: true });
    feedbackForm_controller.feedbackFormController = void 0;
    const endpoints_1$i = endpoints;
    const apiPath$h = endpoints_1$i.endpoints.feedbackForm;
    const feedbackFormController = (service) => ({
        create: (item) => {
            return service.post(apiPath$h, item, service.addAccessTokenToHeaders);
        },
        readLatest: (appGuid) => {
            return service.get(`${apiPath$h}/${appGuid}`);
        },
        readAllForAdmin: () => {
            return service.get(`${apiPath$h}/Admin`, service.addAccessTokenToHeaders);
        },
        update: (item) => {
            return service.put(apiPath$h, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$h}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    feedbackForm_controller.feedbackFormController = feedbackFormController;

    var feedbackFormAnswer_controller = {};

    Object.defineProperty(feedbackFormAnswer_controller, "__esModule", { value: true });
    feedbackFormAnswer_controller.feedbackFormAnswerController = void 0;
    const endpoints_1$h = endpoints;
    const apiPath$g = endpoints_1$h.endpoints.feedbackFormAnswer;
    const feedbackFormAnswerController = (service) => ({
        create: (item) => {
            return service.post(apiPath$g, item, service.addAccessTokenToHeaders);
        },
        readForFeedback: (guid) => {
            return service.get(`${apiPath$g}/${guid}`, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            return service.delete(`${apiPath$g}/${guid}`, service.addAccessTokenToHeaders);
        },
    });
    feedbackFormAnswer_controller.feedbackFormAnswerController = feedbackFormAnswerController;

    var feedbackFormQuestion_controller = {};

    Object.defineProperty(feedbackFormQuestion_controller, "__esModule", { value: true });
    feedbackFormQuestion_controller.feedbackFormQuestionController = void 0;
    const endpoints_1$g = endpoints;
    const apiPath$f = endpoints_1$g.endpoints.feedbackFormQuestion;
    const feedbackFormQuestionController = (service) => ({
        create: (item) => {
            return service.post(apiPath$f, item, service.addAccessTokenToHeaders);
        },
        readForFeedback: (feedbackGuid) => {
            return service.get(`${apiPath$f}/${feedbackGuid}`, service.addAccessTokenToHeaders);
        },
        update: (item) => {
            return service.put(apiPath$f, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            return service.delete(`${apiPath$f}/${guid}`, service.addAccessTokenToHeaders);
        }
    });
    feedbackFormQuestion_controller.feedbackFormQuestionController = feedbackFormQuestionController;

    var language_controller = {};

    Object.defineProperty(language_controller, "__esModule", { value: true });
    language_controller.languageController = void 0;
    const endpoints_1$f = endpoints;
    const apiPath$e = endpoints_1$f.endpoints.language;
    const languageController = (service) => ({
        create: (item) => {
            return service.post(apiPath$e, item, service.addAccessTokenToHeaders);
        },
        readAll: () => {
            return service.get(apiPath$e);
        },
        update: (item) => {
            return service.put(apiPath$e, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$e}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    language_controller.languageController = languageController;

    var licence_controller = {};

    Object.defineProperty(licence_controller, "__esModule", { value: true });
    licence_controller.licenceController = void 0;
    const endpoints_1$e = endpoints;
    const apiPath$d = endpoints_1$e.endpoints.licence;
    const licenceController = (service) => ({
        create: (item) => {
            return service.post(apiPath$d, item, service.addAccessTokenToHeaders);
        },
        readAll: () => {
            return service.get(apiPath$d, service.addAccessTokenToHeaders);
        },
        activate: (appGuid, licence) => {
            const url = `${endpoints_1$e.endpoints.licenceActivate}/${appGuid}/${licence}`;
            return service.get(url);
        },
        activateForPatron: (appGuid, licence) => {
            const url = `${endpoints_1$e.endpoints.licenceActivateForPatron}/${appGuid}/${licence}`;
            return service.get(url);
        },
        verify: (appGuid, hash) => {
            const url = `${endpoints_1$e.endpoints.licenceVerify}/${appGuid}/${hash}`;
            return service.get(url);
        },
        update: (item) => {
            return service.put(apiPath$d, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$d}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    licence_controller.licenceController = licenceController;

    var oauth_controller = {};

    Object.defineProperty(oauth_controller, "__esModule", { value: true });
    oauth_controller.oAuthController = void 0;
    const endpoints_1$d = endpoints;
    const apiPath$c = endpoints_1$d.endpoints.oAuth;
    const oAuthController = (service) => ({
        patreon: (code, state) => {
            return service.get(`${apiPath$c}/Patreon?code=${code}&state=${state}`);
        },
    });
    oauth_controller.oAuthController = oAuthController;

    var patreon_controller = {};

    Object.defineProperty(patreon_controller, "__esModule", { value: true });
    patreon_controller.patreonController = void 0;
    const endpoints_1$c = endpoints;
    const apiPath$b = endpoints_1$c.endpoints.patreon;
    const patreonController = (service) => ({
        readAll: () => {
            return service.get(apiPath$b, service.addAccessTokenToHeaders);
        },
    });
    patreon_controller.patreonController = patreonController;

    var permission_controller = {};

    Object.defineProperty(permission_controller, "__esModule", { value: true });
    permission_controller.permissionController = void 0;
    const endpoints_1$b = endpoints;
    const permissionType_1 = permissionType;
    const typescriptHacks_1$4 = typescriptHacks;
    const apiPath$a = endpoints_1$b.endpoints.permission;
    const permissionController = (service) => ({
        readCurrentUsersPermissions: () => {
            return service.get(apiPath$a, service.addAccessTokenToHeaders);
        },
        readPermissionsForUserGuid: (userGuid) => {
            return service.get(`${apiPath$a}/${userGuid}`);
        },
        addForUser: (userGuid, permissionType) => {
            return service.post(`${apiPath$a}/${userGuid}/${permissionType_1.PermissionType[permissionType].toString()}`, typescriptHacks_1$4.anyObject, service.addAccessTokenToHeaders);
        },
        delPermissionForUser: (userGuid, permissionType) => {
            const url = `${apiPath$a}/${userGuid}/${permissionType_1.PermissionType[permissionType].toString()}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    permission_controller.permissionController = permissionController;

    var quickAction_controller = {};

    Object.defineProperty(quickAction_controller, "__esModule", { value: true });
    quickAction_controller.quickActionController = void 0;
    const endpoints_1$a = endpoints;
    const typescriptHacks_1$3 = typescriptHacks;
    const apiPath$9 = endpoints_1$a.endpoints.quickActionIndexes;
    const quickActionController = (service) => ({
        readIndexes: () => {
            return service.get(apiPath$9, service.addAccessTokenToHeaders);
        },
        regenerateIndexes: () => {
            return service.post(apiPath$9, typescriptHacks_1$3.anyObject, service.addAccessTokenToHeaders);
        },
    });
    quickAction_controller.quickActionController = quickActionController;

    var steam_controller = {};

    var __awaiter$4 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(steam_controller, "__esModule", { value: true });
    steam_controller.steamController = void 0;
    const endpoints_1$9 = endpoints;
    const appType_1 = appType;
    const steamController = (service) => {
        const _appTypes = [appType_1.AppType.nms, appType_1.AppType.sms];
        const readBranch = (appType) => __awaiter$4(void 0, void 0, void 0, function* () {
            const branchesResult = yield service.get(`${endpoints_1$9.endpoints.steamBranches}/${appType}`);
            return Object.assign(Object.assign({}, branchesResult), { value: {
                    appType: appType_1.AppType[appType],
                    branches: branchesResult.value,
                } });
        });
        return ({
            readNews: (appType) => {
                return service.get(`${endpoints_1$9.endpoints.steamNews}/${appType}`);
            },
            readBranch,
            readAllBranches: () => __awaiter$4(void 0, void 0, void 0, function* () {
                const result = [];
                for (const appType of _appTypes) {
                    const localBranch = yield readBranch(appType.toString());
                    if (localBranch.isSuccess) {
                        result.push(localBranch.value);
                    }
                }
                return {
                    isSuccess: true,
                    value: result,
                    errorMessage: '',
                };
            }),
            updateBranch: (appType, item) => {
                return service.put(`${endpoints_1$9.endpoints.steamBranches}/${appType}`, {
                    newData: item.branches
                }, service.addAccessTokenToHeaders);
            },
        });
    };
    steam_controller.steamController = steamController;

    var teamMember_controller = {};

    Object.defineProperty(teamMember_controller, "__esModule", { value: true });
    teamMember_controller.teamMemberController = void 0;
    const endpoints_1$8 = endpoints;
    const apiPath$8 = endpoints_1$8.endpoints.teamMember;
    const teamMemberController = (service) => ({
        create: (item) => {
            return service.post(apiPath$8, item, service.addAccessTokenToHeaders);
        },
        readAll: () => {
            return service.get(apiPath$8);
        },
        update: (item) => {
            return service.put(apiPath$8, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$8}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    teamMember_controller.teamMemberController = teamMemberController;

    var translationImage_controller = {};

    Object.defineProperty(translationImage_controller, "__esModule", { value: true });
    translationImage_controller.translationImageController = void 0;
    const endpoints_1$7 = endpoints;
    const apiPath$7 = endpoints_1$7.endpoints.translationImage;
    const translationImageController = (service) => ({
        add: (guid, formData) => {
            return service.post(`${apiPath$7}/${guid}`, formData, service.formDataWithAccessTokenHeaders);
        },
        readAll: (guid) => {
            return service.get(`${apiPath$7}/${guid}`, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$7}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    translationImage_controller.translationImageController = translationImageController;

    var translationKey_controller = {};

    Object.defineProperty(translationKey_controller, "__esModule", { value: true });
    translationKey_controller.translationKeyController = void 0;
    const endpoints_1$6 = endpoints;
    const apiPath$6 = endpoints_1$6.endpoints.translationKey;
    const translationKeyController = (service) => ({
        create: (item) => {
            return service.post(apiPath$6, item, service.addAccessTokenToHeaders);
        },
        createSearch: (search) => {
            return service.post(endpoints_1$6.endpoints.translationKeySearchDropdown, search, service.addAccessTokenToHeaders);
        },
        createSearchDropdown: (search) => {
            return service.post(endpoints_1$6.endpoints.translationKeySearchDropdown, search, service.addAccessTokenToHeaders);
        },
        read: (guid) => {
            return service.get(`${apiPath$6}/${guid}`, service.addAccessTokenToHeaders);
        },
        readAll: () => {
            return service.get(`${apiPath$6}/Admin`, service.addAccessTokenToHeaders);
        },
        update: (item) => {
            return service.put(apiPath$6, item, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$6}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    translationKey_controller.translationKeyController = translationKeyController;

    var translationReport_controller = {};

    Object.defineProperty(translationReport_controller, "__esModule", { value: true });
    translationReport_controller.translationReportController = void 0;
    const endpoints_1$5 = endpoints;
    const typescriptHacks_1$2 = typescriptHacks;
    const apiPath$5 = endpoints_1$5.endpoints.translationReport;
    const translationReportController = (service) => ({
        create: (item) => {
            return service.post(apiPath$5, item, service.addAccessTokenToHeaders);
        },
        readAll: () => {
            return service.get(apiPath$5, service.addAccessTokenToHeaders);
        },
        resolve: (guid) => {
            return service.put(`${apiPath$5}/${guid}`, typescriptHacks_1$2.anyObject, service.addAccessTokenToHeaders);
        },
        close: (guid) => {
            const url = `${apiPath$5}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    translationReport_controller.translationReportController = translationReportController;

    var translationStat_controller = {};

    var __awaiter$3 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(translationStat_controller, "__esModule", { value: true });
    translationStat_controller.translationStatController = void 0;
    const endpoints_1$4 = endpoints;
    const apiPath$4 = endpoints_1$4.endpoints.translationStatLeaderboard;
    const translationStatController = (service) => ({
        readAll: (search) => __awaiter$3(void 0, void 0, void 0, function* () {
            const apiResult = yield service.post(apiPath$4, search, service.addAccessTokenToHeaders);
            return Object.assign(Object.assign({}, apiResult.value), { isSuccess: true });
        }),
    });
    translationStat_controller.translationStatController = translationStatController;

    var user_controller = {};

    var __awaiter$2 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(user_controller, "__esModule", { value: true });
    user_controller.userController = void 0;
    const endpoints_1$3 = endpoints;
    const typescriptHacks_1$1 = typescriptHacks;
    const apiPath$3 = endpoints_1$3.endpoints.user;
    const userController = (service) => ({
        readAll: () => {
            return service.get(apiPath$3, service.addAccessTokenToHeaders);
        },
        readAllAdmin: (item) => __awaiter$2(void 0, void 0, void 0, function* () {
            const apiResult = yield service.post(apiPath$3, item, service.addAccessTokenToHeaders);
            return apiResult.value;
        }),
        update: (item) => {
            return service.put(apiPath$3, item, service.addAccessTokenToHeaders);
        },
        markAsAdmin: (guid) => {
            return service.put(`${apiPath$3}/${guid}`, typescriptHacks_1$1.anyObject, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath$3}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    user_controller.userController = userController;

    var userActivity_controller = {};

    Object.defineProperty(userActivity_controller, "__esModule", { value: true });
    userActivity_controller.userActivityController = void 0;
    const endpoints_1$2 = endpoints;
    const apiPath$2 = endpoints_1$2.endpoints.userActivity;
    const userActivityController = (service) => ({
        readAll: () => {
            return service.get(apiPath$2, service.addAccessTokenToHeaders);
        },
    });
    userActivity_controller.userActivityController = userActivityController;

    var version_controller = {};

    Object.defineProperty(version_controller, "__esModule", { value: true });
    version_controller.versionController = void 0;
    const endpoints_1$1 = endpoints;
    const typescriptHacks_1 = typescriptHacks;
    const apiPath$1 = endpoints_1$1.endpoints.version;
    const versionController = (service) => ({
        create: (item) => {
            return service.post(apiPath$1, item, service.addAccessTokenToHeaders);
        },
        createSearch: (item) => {
            return service.post(`${apiPath$1}/Search`, item, service.addAccessTokenToHeaders);
        },
        createNotification: (winGuid) => {
            return service.post(`${endpoints_1$1.endpoints.versionSendUpdateNotification}/${winGuid}`, typescriptHacks_1.anyObject, service.addAccessTokenToHeaders);
        },
        readLatest: (appGuid) => {
            return service.get(`${apiPath$1}/${appGuid}`);
        },
        readAllForAdmin: () => {
            return service.get(`${apiPath$1}/Admin`, service.addAccessTokenToHeaders);
        },
        readAllHistory: (appGuid, langGuid, platforms, page) => {
            let url = `${apiPath$1}/${appGuid}/${langGuid}`;
            if (platforms != null) {
                let queryParamStr = '';
                for (const platform of platforms) {
                    if (queryParamStr.length > 1) {
                        queryParamStr += '&';
                    }
                    else {
                        queryParamStr += '?';
                    }
                    queryParamStr += `platforms=${platform}`;
                }
                url += queryParamStr;
            }
            if (page != null) {
                if (url.includes('?')) {
                    url += `?page=${page}`;
                }
                else {
                    url += `&page=${page}`;
                }
            }
            return service.get(url, service.addAccessTokenToHeaders);
        },
        update: (item) => {
            return service.put(apiPath$1, item, service.addAccessTokenToHeaders);
        },
        del: (appGuid) => {
            return service.delete(`${apiPath$1}/${appGuid}`, service.addAccessTokenToHeaders);
        }
    });
    version_controller.versionController = versionController;

    var headerHelper = {};

    (function (exports) {
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.formDataWithAccessTokenHeaders = exports.addAccessTokenToHeaders = void 0;
    	const addAccessTokenToHeaders = (headerProps) => {
    	    var _a;
    	    const accessToken = (_a = headerProps.authToken) !== null && _a !== void 0 ? _a : '';
    	    if (accessToken.length < 1) {
    	        console.warn('Expected access token to not be empty but it is');
    	    }
    	    return ({
    	        headers: {
    	            authorization: `Bearer ${accessToken}`,
    	        }
    	    });
    	};
    	exports.addAccessTokenToHeaders = addAccessTokenToHeaders;
    	const formDataWithAccessTokenHeaders = (headerProps) => {
    	    const onlyAccessToken = (0, exports.addAccessTokenToHeaders)(headerProps);
    	    return (Object.assign(Object.assign({}, onlyAccessToken), { headers: Object.assign(Object.assign({}, onlyAccessToken.headers), { 'Content-Type': 'multipart/form-data' }) }));
    	};
    	exports.formDataWithAccessTokenHeaders = formDataWithAccessTokenHeaders; 
    } (headerHelper));

    var translation_controller = {};

    var __awaiter$1 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(translation_controller, "__esModule", { value: true });
    translation_controller.translationController = void 0;
    const endpoints_1 = endpoints;
    const apiPath = endpoints_1.endpoints.translation;
    const translationController = (service) => ({
        create: (item) => {
            return service.post(apiPath, item, service.addAccessTokenToHeaders);
        },
        createSearch: (search) => __awaiter$1(void 0, void 0, void 0, function* () {
            const apiResult = yield service.post(endpoints_1.endpoints.translationSearch, search, service.addAccessTokenToHeaders);
            return apiResult.value;
        }),
        createSearchPerLanguage: (search) => {
            return service.post(endpoints_1.endpoints.translationSearchPerLanguage, search, service.addAccessTokenToHeaders);
        },
        read: (transKeyGuid) => {
            return service.get(`${apiPath}/${transKeyGuid}`, service.addAccessTokenToHeaders);
        },
        readForLang: (transGuid, langGuid) => {
            return service.get(`${apiPath}/${transGuid}/${langGuid}`, service.addAccessTokenToHeaders);
        },
        del: (guid) => {
            const url = `${apiPath}/${guid}`;
            return service.delete(url, service.addAccessTokenToHeaders);
        }
    });
    translation_controller.translationController = translationController;

    Object.defineProperty(assistantAppsApiService, "__esModule", { value: true });
    assistantAppsApiService.AssistantAppsApiService = void 0;
    const baseApiService_1 = baseApiService;
    const account_controller_1 = account_controller;
    const app_controller_1 = app_controller;
    const appNotice_controller_1 = appNotice_controller;
    const appReview_controller_1 = appReview_controller;
    const badge_controller_1 = badge_controller;
    const cache_controller_1 = cache_controller;
    const contact_controller_1 = contact_controller;
    const dashboard_controller_1 = dashboard_controller;
    const donation_controller_1 = donation_controller;
    const feedbackForm_controller_1 = feedbackForm_controller;
    const feedbackFormAnswer_controller_1 = feedbackFormAnswer_controller;
    const feedbackFormQuestion_controller_1 = feedbackFormQuestion_controller;
    const language_controller_1 = language_controller;
    const licence_controller_1 = licence_controller;
    const oauth_controller_1 = oauth_controller;
    const patreon_controller_1 = patreon_controller;
    const permission_controller_1 = permission_controller;
    const quickAction_controller_1 = quickAction_controller;
    const steam_controller_1 = steam_controller;
    const teamMember_controller_1 = teamMember_controller;
    const translationImage_controller_1 = translationImage_controller;
    const translationKey_controller_1 = translationKey_controller;
    const translationReport_controller_1 = translationReport_controller;
    const translationStat_controller_1 = translationStat_controller;
    const user_controller_1 = user_controller;
    const userActivity_controller_1 = userActivity_controller;
    const version_controller_1 = version_controller;
    const headerHelper_1 = headerHelper;
    const translation_controller_1 = translation_controller;
    class AssistantAppsApiService extends baseApiService_1.BaseApiService {
        constructor(state) {
            var _a, _b;
            const apiUrl = (_a = state === null || state === void 0 ? void 0 : state.url) !== null && _a !== void 0 ? _a : 'https://api.assistantapps.com';
            super(apiUrl);
            this._state = {
                url: '',
                authToken: '',
            };
            this.addAccessTokenToHeaders = () => (0, headerHelper_1.addAccessTokenToHeaders)({ authToken: this._state.authToken });
            this.formDataWithAccessTokenHeaders = () => (0, headerHelper_1.formDataWithAccessTokenHeaders)({ authToken: this._state.authToken });
            this.account = (0, account_controller_1.accountController)(this);
            this.app = (0, app_controller_1.appController)(this);
            this.appNotice = (0, appNotice_controller_1.appNoticeController)(this);
            this.appReview = (0, appReview_controller_1.appReviewController)(this);
            this.badge = (0, badge_controller_1.badgeController)(this);
            this.cache = (0, cache_controller_1.cacheController)(this);
            this.contact = (0, contact_controller_1.contactController)(this);
            this.dashboard = (0, dashboard_controller_1.dashboardController)(this);
            this.donation = (0, donation_controller_1.donationController)(this);
            this.language = (0, language_controller_1.languageController)(this);
            this.licence = (0, licence_controller_1.licenceController)(this);
            this.feedbackForm = (0, feedbackForm_controller_1.feedbackFormController)(this);
            this.feedbackFormAnswer = (0, feedbackFormAnswer_controller_1.feedbackFormAnswerController)(this);
            this.feedbackFormQuestion = (0, feedbackFormQuestion_controller_1.feedbackFormQuestionController)(this);
            this.oAuth = (0, oauth_controller_1.oAuthController)(this);
            this.patreon = (0, patreon_controller_1.patreonController)(this);
            this.permission = (0, permission_controller_1.permissionController)(this);
            this.quickAction = (0, quickAction_controller_1.quickActionController)(this);
            this.steam = (0, steam_controller_1.steamController)(this);
            this.teamMember = (0, teamMember_controller_1.teamMemberController)(this);
            this.translation = (0, translation_controller_1.translationController)(this);
            this.translationImage = (0, translationImage_controller_1.translationImageController)(this);
            this.translationKey = (0, translationKey_controller_1.translationKeyController)(this);
            this.translationReport = (0, translationReport_controller_1.translationReportController)(this);
            this.translationStat = (0, translationStat_controller_1.translationStatController)(this);
            this.user = (0, user_controller_1.userController)(this);
            this.userActivity = (0, userActivity_controller_1.userActivityController)(this);
            this.version = (0, version_controller_1.versionController)(this);
            this._state.url = apiUrl;
            this._state.authToken = (_b = state === null || state === void 0 ? void 0 : state.authToken) !== null && _b !== void 0 ? _b : '';
        }
    }
    assistantAppsApiService.AssistantAppsApiService = AssistantAppsApiService;

    var assistantAppsOAuthClient = {};

    var baseHubClient = {};

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** Error thrown when an HTTP request fails. */
    class HttpError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.HttpError}.
         *
         * @param {string} errorMessage A descriptive error message.
         * @param {number} statusCode The HTTP status code represented by this error.
         */
        constructor(errorMessage, statusCode) {
            const trueProto = new.target.prototype;
            super(`${errorMessage}: Status code '${statusCode}'`);
            this.statusCode = statusCode;
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when a timeout elapses. */
    class TimeoutError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.TimeoutError}.
         *
         * @param {string} errorMessage A descriptive error message.
         */
        constructor(errorMessage = "A timeout occurred.") {
            const trueProto = new.target.prototype;
            super(errorMessage);
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when an action is aborted. */
    class AbortError extends Error {
        /** Constructs a new instance of {@link AbortError}.
         *
         * @param {string} errorMessage A descriptive error message.
         */
        constructor(errorMessage = "An abort occurred.") {
            const trueProto = new.target.prototype;
            super(errorMessage);
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when the selected transport is unsupported by the browser. */
    /** @private */
    class UnsupportedTransportError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.UnsupportedTransportError}.
         *
         * @param {string} message A descriptive error message.
         * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
         */
        constructor(message, transport) {
            const trueProto = new.target.prototype;
            super(message);
            this.transport = transport;
            this.errorType = 'UnsupportedTransportError';
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when the selected transport is disabled by the browser. */
    /** @private */
    class DisabledTransportError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.DisabledTransportError}.
         *
         * @param {string} message A descriptive error message.
         * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
         */
        constructor(message, transport) {
            const trueProto = new.target.prototype;
            super(message);
            this.transport = transport;
            this.errorType = 'DisabledTransportError';
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when the selected transport cannot be started. */
    /** @private */
    class FailedToStartTransportError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.FailedToStartTransportError}.
         *
         * @param {string} message A descriptive error message.
         * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
         */
        constructor(message, transport) {
            const trueProto = new.target.prototype;
            super(message);
            this.transport = transport;
            this.errorType = 'FailedToStartTransportError';
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when the negotiation with the server failed to complete. */
    /** @private */
    class FailedToNegotiateWithServerError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.FailedToNegotiateWithServerError}.
         *
         * @param {string} message A descriptive error message.
         */
        constructor(message) {
            const trueProto = new.target.prototype;
            super(message);
            this.errorType = 'FailedToNegotiateWithServerError';
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when multiple errors have occurred. */
    /** @private */
    class AggregateErrors extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.AggregateErrors}.
         *
         * @param {string} message A descriptive error message.
         * @param {Error[]} innerErrors The collection of errors this error is aggregating.
         */
        constructor(message, innerErrors) {
            const trueProto = new.target.prototype;
            super(message);
            this.innerErrors = innerErrors;
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** Represents an HTTP response. */
    class HttpResponse {
        constructor(statusCode, statusText, content) {
            this.statusCode = statusCode;
            this.statusText = statusText;
            this.content = content;
        }
    }
    /** Abstraction over an HTTP client.
     *
     * This class provides an abstraction over an HTTP client so that a different implementation can be provided on different platforms.
     */
    class HttpClient {
        get(url, options) {
            return this.send({
                ...options,
                method: "GET",
                url,
            });
        }
        post(url, options) {
            return this.send({
                ...options,
                method: "POST",
                url,
            });
        }
        delete(url, options) {
            return this.send({
                ...options,
                method: "DELETE",
                url,
            });
        }
        /** Gets all cookies that apply to the specified URL.
         *
         * @param url The URL that the cookies are valid for.
         * @returns {string} A string containing all the key-value cookie pairs for the specified URL.
         */
        // @ts-ignore
        getCookieString(url) {
            return "";
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // These values are designed to match the ASP.NET Log Levels since that's the pattern we're emulating here.
    /** Indicates the severity of a log message.
     *
     * Log Levels are ordered in increasing severity. So `Debug` is more severe than `Trace`, etc.
     */
    var LogLevel;
    (function (LogLevel) {
        /** Log level for very low severity diagnostic messages. */
        LogLevel[LogLevel["Trace"] = 0] = "Trace";
        /** Log level for low severity diagnostic messages. */
        LogLevel[LogLevel["Debug"] = 1] = "Debug";
        /** Log level for informational diagnostic messages. */
        LogLevel[LogLevel["Information"] = 2] = "Information";
        /** Log level for diagnostic messages that indicate a non-fatal problem. */
        LogLevel[LogLevel["Warning"] = 3] = "Warning";
        /** Log level for diagnostic messages that indicate a failure in the current operation. */
        LogLevel[LogLevel["Error"] = 4] = "Error";
        /** Log level for diagnostic messages that indicate a failure that will terminate the entire application. */
        LogLevel[LogLevel["Critical"] = 5] = "Critical";
        /** The highest possible log level. Used when configuring logging to indicate that no log messages should be emitted. */
        LogLevel[LogLevel["None"] = 6] = "None";
    })(LogLevel || (LogLevel = {}));

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** A logger that does nothing when log messages are sent to it. */
    class NullLogger {
        constructor() { }
        /** @inheritDoc */
        // eslint-disable-next-line
        log(_logLevel, _message) {
        }
    }
    /** The singleton instance of the {@link @microsoft/signalr.NullLogger}. */
    NullLogger.instance = new NullLogger();

    // Licensed to the .NET Foundation under one or more agreements.
    // Version token that will be replaced by the prepack command
    /** The version of the SignalR client. */
    const VERSION = "7.0.5";
    /** @private */
    class Arg {
        static isRequired(val, name) {
            if (val === null || val === undefined) {
                throw new Error(`The '${name}' argument is required.`);
            }
        }
        static isNotEmpty(val, name) {
            if (!val || val.match(/^\s*$/)) {
                throw new Error(`The '${name}' argument should not be empty.`);
            }
        }
        static isIn(val, values, name) {
            // TypeScript enums have keys for **both** the name and the value of each enum member on the type itself.
            if (!(val in values)) {
                throw new Error(`Unknown ${name} value: ${val}.`);
            }
        }
    }
    /** @private */
    class Platform {
        // react-native has a window but no document so we should check both
        static get isBrowser() {
            return typeof window === "object" && typeof window.document === "object";
        }
        // WebWorkers don't have a window object so the isBrowser check would fail
        static get isWebWorker() {
            return typeof self === "object" && "importScripts" in self;
        }
        // react-native has a window but no document
        static get isReactNative() {
            return typeof window === "object" && typeof window.document === "undefined";
        }
        // Node apps shouldn't have a window object, but WebWorkers don't either
        // so we need to check for both WebWorker and window
        static get isNode() {
            return !this.isBrowser && !this.isWebWorker && !this.isReactNative;
        }
    }
    /** @private */
    function getDataDetail(data, includeContent) {
        let detail = "";
        if (isArrayBuffer(data)) {
            detail = `Binary data of length ${data.byteLength}`;
            if (includeContent) {
                detail += `. Content: '${formatArrayBuffer(data)}'`;
            }
        }
        else if (typeof data === "string") {
            detail = `String data of length ${data.length}`;
            if (includeContent) {
                detail += `. Content: '${data}'`;
            }
        }
        return detail;
    }
    /** @private */
    function formatArrayBuffer(data) {
        const view = new Uint8Array(data);
        // Uint8Array.map only supports returning another Uint8Array?
        let str = "";
        view.forEach((num) => {
            const pad = num < 16 ? "0" : "";
            str += `0x${pad}${num.toString(16)} `;
        });
        // Trim of trailing space.
        return str.substr(0, str.length - 1);
    }
    // Also in signalr-protocol-msgpack/Utils.ts
    /** @private */
    function isArrayBuffer(val) {
        return val && typeof ArrayBuffer !== "undefined" &&
            (val instanceof ArrayBuffer ||
                // Sometimes we get an ArrayBuffer that doesn't satisfy instanceof
                (val.constructor && val.constructor.name === "ArrayBuffer"));
    }
    /** @private */
    async function sendMessage(logger, transportName, httpClient, url, content, options) {
        const headers = {};
        const [name, value] = getUserAgentHeader();
        headers[name] = value;
        logger.log(LogLevel.Trace, `(${transportName} transport) sending data. ${getDataDetail(content, options.logMessageContent)}.`);
        const responseType = isArrayBuffer(content) ? "arraybuffer" : "text";
        const response = await httpClient.post(url, {
            content,
            headers: { ...headers, ...options.headers },
            responseType,
            timeout: options.timeout,
            withCredentials: options.withCredentials,
        });
        logger.log(LogLevel.Trace, `(${transportName} transport) request complete. Response status: ${response.statusCode}.`);
    }
    /** @private */
    function createLogger(logger) {
        if (logger === undefined) {
            return new ConsoleLogger(LogLevel.Information);
        }
        if (logger === null) {
            return NullLogger.instance;
        }
        if (logger.log !== undefined) {
            return logger;
        }
        return new ConsoleLogger(logger);
    }
    /** @private */
    class SubjectSubscription {
        constructor(subject, observer) {
            this._subject = subject;
            this._observer = observer;
        }
        dispose() {
            const index = this._subject.observers.indexOf(this._observer);
            if (index > -1) {
                this._subject.observers.splice(index, 1);
            }
            if (this._subject.observers.length === 0 && this._subject.cancelCallback) {
                this._subject.cancelCallback().catch((_) => { });
            }
        }
    }
    /** @private */
    class ConsoleLogger {
        constructor(minimumLogLevel) {
            this._minLevel = minimumLogLevel;
            this.out = console;
        }
        log(logLevel, message) {
            if (logLevel >= this._minLevel) {
                const msg = `[${new Date().toISOString()}] ${LogLevel[logLevel]}: ${message}`;
                switch (logLevel) {
                    case LogLevel.Critical:
                    case LogLevel.Error:
                        this.out.error(msg);
                        break;
                    case LogLevel.Warning:
                        this.out.warn(msg);
                        break;
                    case LogLevel.Information:
                        this.out.info(msg);
                        break;
                    default:
                        // console.debug only goes to attached debuggers in Node, so we use console.log for Trace and Debug
                        this.out.log(msg);
                        break;
                }
            }
        }
    }
    /** @private */
    function getUserAgentHeader() {
        let userAgentHeaderName = "X-SignalR-User-Agent";
        if (Platform.isNode) {
            userAgentHeaderName = "User-Agent";
        }
        return [userAgentHeaderName, constructUserAgent(VERSION, getOsName(), getRuntime(), getRuntimeVersion())];
    }
    /** @private */
    function constructUserAgent(version, os, runtime, runtimeVersion) {
        // Microsoft SignalR/[Version] ([Detailed Version]; [Operating System]; [Runtime]; [Runtime Version])
        let userAgent = "Microsoft SignalR/";
        const majorAndMinor = version.split(".");
        userAgent += `${majorAndMinor[0]}.${majorAndMinor[1]}`;
        userAgent += ` (${version}; `;
        if (os && os !== "") {
            userAgent += `${os}; `;
        }
        else {
            userAgent += "Unknown OS; ";
        }
        userAgent += `${runtime}`;
        if (runtimeVersion) {
            userAgent += `; ${runtimeVersion}`;
        }
        else {
            userAgent += "; Unknown Runtime Version";
        }
        userAgent += ")";
        return userAgent;
    }
    // eslint-disable-next-line spaced-comment
     function getOsName() {
        if (Platform.isNode) {
            switch (process.platform) {
                case "win32":
                    return "Windows NT";
                case "darwin":
                    return "macOS";
                case "linux":
                    return "Linux";
                default:
                    return process.platform;
            }
        }
        else {
            return "";
        }
    }
    // eslint-disable-next-line spaced-comment
     function getRuntimeVersion() {
        if (Platform.isNode) {
            return process.versions.node;
        }
        return undefined;
    }
    function getRuntime() {
        if (Platform.isNode) {
            return "NodeJS";
        }
        else {
            return "Browser";
        }
    }
    /** @private */
    function getErrorString(e) {
        if (e.stack) {
            return e.stack;
        }
        else if (e.message) {
            return e.message;
        }
        return `${e}`;
    }
    /** @private */
    function getGlobalThis() {
        // globalThis is semi-new and not available in Node until v12
        if (typeof globalThis !== "undefined") {
            return globalThis;
        }
        if (typeof self !== "undefined") {
            return self;
        }
        if (typeof window !== "undefined") {
            return window;
        }
        if (typeof global !== "undefined") {
            return global;
        }
        throw new Error("could not find global");
    }

    // Licensed to the .NET Foundation under one or more agreements.
    class FetchHttpClient extends HttpClient {
        constructor(logger) {
            super();
            this._logger = logger;
            if (typeof fetch === "undefined") {
                // In order to ignore the dynamic require in webpack builds we need to do this magic
                // @ts-ignore: TS doesn't know about these names
                const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
                // Cookies aren't automatically handled in Node so we need to add a CookieJar to preserve cookies across requests
                this._jar = new (requireFunc("tough-cookie")).CookieJar();
                this._fetchType = requireFunc("node-fetch");
                // node-fetch doesn't have a nice API for getting and setting cookies
                // fetch-cookie will wrap a fetch implementation with a default CookieJar or a provided one
                this._fetchType = requireFunc("fetch-cookie")(this._fetchType, this._jar);
            }
            else {
                this._fetchType = fetch.bind(getGlobalThis());
            }
            if (typeof AbortController === "undefined") {
                // In order to ignore the dynamic require in webpack builds we need to do this magic
                // @ts-ignore: TS doesn't know about these names
                const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
                // Node needs EventListener methods on AbortController which our custom polyfill doesn't provide
                this._abortControllerType = requireFunc("abort-controller");
            }
            else {
                this._abortControllerType = AbortController;
            }
        }
        /** @inheritDoc */
        async send(request) {
            // Check that abort was not signaled before calling send
            if (request.abortSignal && request.abortSignal.aborted) {
                throw new AbortError();
            }
            if (!request.method) {
                throw new Error("No method defined.");
            }
            if (!request.url) {
                throw new Error("No url defined.");
            }
            const abortController = new this._abortControllerType();
            let error;
            // Hook our abortSignal into the abort controller
            if (request.abortSignal) {
                request.abortSignal.onabort = () => {
                    abortController.abort();
                    error = new AbortError();
                };
            }
            // If a timeout has been passed in, setup a timeout to call abort
            // Type needs to be any to fit window.setTimeout and NodeJS.setTimeout
            let timeoutId = null;
            if (request.timeout) {
                const msTimeout = request.timeout;
                timeoutId = setTimeout(() => {
                    abortController.abort();
                    this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
                    error = new TimeoutError();
                }, msTimeout);
            }
            if (request.content === "") {
                request.content = undefined;
            }
            if (request.content) {
                // Explicitly setting the Content-Type header for React Native on Android platform.
                request.headers = request.headers || {};
                if (isArrayBuffer(request.content)) {
                    request.headers["Content-Type"] = "application/octet-stream";
                }
                else {
                    request.headers["Content-Type"] = "text/plain;charset=UTF-8";
                }
            }
            let response;
            try {
                response = await this._fetchType(request.url, {
                    body: request.content,
                    cache: "no-cache",
                    credentials: request.withCredentials === true ? "include" : "same-origin",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        ...request.headers,
                    },
                    method: request.method,
                    mode: "cors",
                    redirect: "follow",
                    signal: abortController.signal,
                });
            }
            catch (e) {
                if (error) {
                    throw error;
                }
                this._logger.log(LogLevel.Warning, `Error from HTTP request. ${e}.`);
                throw e;
            }
            finally {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (request.abortSignal) {
                    request.abortSignal.onabort = null;
                }
            }
            if (!response.ok) {
                const errorMessage = await deserializeContent(response, "text");
                throw new HttpError(errorMessage || response.statusText, response.status);
            }
            const content = deserializeContent(response, request.responseType);
            const payload = await content;
            return new HttpResponse(response.status, response.statusText, payload);
        }
        getCookieString(url) {
            let cookies = "";
            if (Platform.isNode && this._jar) {
                // @ts-ignore: unused variable
                this._jar.getCookies(url, (e, c) => cookies = c.join("; "));
            }
            return cookies;
        }
    }
    function deserializeContent(response, responseType) {
        let content;
        switch (responseType) {
            case "arraybuffer":
                content = response.arrayBuffer();
                break;
            case "text":
                content = response.text();
                break;
            case "blob":
            case "document":
            case "json":
                throw new Error(`${responseType} is not supported.`);
            default:
                content = response.text();
                break;
        }
        return content;
    }

    // Licensed to the .NET Foundation under one or more agreements.
    class XhrHttpClient extends HttpClient {
        constructor(logger) {
            super();
            this._logger = logger;
        }
        /** @inheritDoc */
        send(request) {
            // Check that abort was not signaled before calling send
            if (request.abortSignal && request.abortSignal.aborted) {
                return Promise.reject(new AbortError());
            }
            if (!request.method) {
                return Promise.reject(new Error("No method defined."));
            }
            if (!request.url) {
                return Promise.reject(new Error("No url defined."));
            }
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(request.method, request.url, true);
                xhr.withCredentials = request.withCredentials === undefined ? true : request.withCredentials;
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                if (request.content === "") {
                    request.content = undefined;
                }
                if (request.content) {
                    // Explicitly setting the Content-Type header for React Native on Android platform.
                    if (isArrayBuffer(request.content)) {
                        xhr.setRequestHeader("Content-Type", "application/octet-stream");
                    }
                    else {
                        xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
                    }
                }
                const headers = request.headers;
                if (headers) {
                    Object.keys(headers)
                        .forEach((header) => {
                        xhr.setRequestHeader(header, headers[header]);
                    });
                }
                if (request.responseType) {
                    xhr.responseType = request.responseType;
                }
                if (request.abortSignal) {
                    request.abortSignal.onabort = () => {
                        xhr.abort();
                        reject(new AbortError());
                    };
                }
                if (request.timeout) {
                    xhr.timeout = request.timeout;
                }
                xhr.onload = () => {
                    if (request.abortSignal) {
                        request.abortSignal.onabort = null;
                    }
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(new HttpResponse(xhr.status, xhr.statusText, xhr.response || xhr.responseText));
                    }
                    else {
                        reject(new HttpError(xhr.response || xhr.responseText || xhr.statusText, xhr.status));
                    }
                };
                xhr.onerror = () => {
                    this._logger.log(LogLevel.Warning, `Error from HTTP request. ${xhr.status}: ${xhr.statusText}.`);
                    reject(new HttpError(xhr.statusText, xhr.status));
                };
                xhr.ontimeout = () => {
                    this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
                    reject(new TimeoutError());
                };
                xhr.send(request.content);
            });
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    /** Default implementation of {@link @microsoft/signalr.HttpClient}. */
    class DefaultHttpClient extends HttpClient {
        /** Creates a new instance of the {@link @microsoft/signalr.DefaultHttpClient}, using the provided {@link @microsoft/signalr.ILogger} to log messages. */
        constructor(logger) {
            super();
            if (typeof fetch !== "undefined" || Platform.isNode) {
                this._httpClient = new FetchHttpClient(logger);
            }
            else if (typeof XMLHttpRequest !== "undefined") {
                this._httpClient = new XhrHttpClient(logger);
            }
            else {
                throw new Error("No usable HttpClient found.");
            }
        }
        /** @inheritDoc */
        send(request) {
            // Check that abort was not signaled before calling send
            if (request.abortSignal && request.abortSignal.aborted) {
                return Promise.reject(new AbortError());
            }
            if (!request.method) {
                return Promise.reject(new Error("No method defined."));
            }
            if (!request.url) {
                return Promise.reject(new Error("No url defined."));
            }
            return this._httpClient.send(request);
        }
        getCookieString(url) {
            return this._httpClient.getCookieString(url);
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // Not exported from index
    /** @private */
    class TextMessageFormat {
        static write(output) {
            return `${output}${TextMessageFormat.RecordSeparator}`;
        }
        static parse(input) {
            if (input[input.length - 1] !== TextMessageFormat.RecordSeparator) {
                throw new Error("Message is incomplete.");
            }
            const messages = input.split(TextMessageFormat.RecordSeparator);
            messages.pop();
            return messages;
        }
    }
    TextMessageFormat.RecordSeparatorCode = 0x1e;
    TextMessageFormat.RecordSeparator = String.fromCharCode(TextMessageFormat.RecordSeparatorCode);

    // Licensed to the .NET Foundation under one or more agreements.
    /** @private */
    class HandshakeProtocol {
        // Handshake request is always JSON
        writeHandshakeRequest(handshakeRequest) {
            return TextMessageFormat.write(JSON.stringify(handshakeRequest));
        }
        parseHandshakeResponse(data) {
            let messageData;
            let remainingData;
            if (isArrayBuffer(data)) {
                // Format is binary but still need to read JSON text from handshake response
                const binaryData = new Uint8Array(data);
                const separatorIndex = binaryData.indexOf(TextMessageFormat.RecordSeparatorCode);
                if (separatorIndex === -1) {
                    throw new Error("Message is incomplete.");
                }
                // content before separator is handshake response
                // optional content after is additional messages
                const responseLength = separatorIndex + 1;
                messageData = String.fromCharCode.apply(null, Array.prototype.slice.call(binaryData.slice(0, responseLength)));
                remainingData = (binaryData.byteLength > responseLength) ? binaryData.slice(responseLength).buffer : null;
            }
            else {
                const textData = data;
                const separatorIndex = textData.indexOf(TextMessageFormat.RecordSeparator);
                if (separatorIndex === -1) {
                    throw new Error("Message is incomplete.");
                }
                // content before separator is handshake response
                // optional content after is additional messages
                const responseLength = separatorIndex + 1;
                messageData = textData.substring(0, responseLength);
                remainingData = (textData.length > responseLength) ? textData.substring(responseLength) : null;
            }
            // At this point we should have just the single handshake message
            const messages = TextMessageFormat.parse(messageData);
            const response = JSON.parse(messages[0]);
            if (response.type) {
                throw new Error("Expected a handshake response from the server.");
            }
            const responseMessage = response;
            // multiple messages could have arrived with handshake
            // return additional data to be parsed as usual, or null if all parsed
            return [remainingData, responseMessage];
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** Defines the type of a Hub Message. */
    var MessageType;
    (function (MessageType) {
        /** Indicates the message is an Invocation message and implements the {@link @microsoft/signalr.InvocationMessage} interface. */
        MessageType[MessageType["Invocation"] = 1] = "Invocation";
        /** Indicates the message is a StreamItem message and implements the {@link @microsoft/signalr.StreamItemMessage} interface. */
        MessageType[MessageType["StreamItem"] = 2] = "StreamItem";
        /** Indicates the message is a Completion message and implements the {@link @microsoft/signalr.CompletionMessage} interface. */
        MessageType[MessageType["Completion"] = 3] = "Completion";
        /** Indicates the message is a Stream Invocation message and implements the {@link @microsoft/signalr.StreamInvocationMessage} interface. */
        MessageType[MessageType["StreamInvocation"] = 4] = "StreamInvocation";
        /** Indicates the message is a Cancel Invocation message and implements the {@link @microsoft/signalr.CancelInvocationMessage} interface. */
        MessageType[MessageType["CancelInvocation"] = 5] = "CancelInvocation";
        /** Indicates the message is a Ping message and implements the {@link @microsoft/signalr.PingMessage} interface. */
        MessageType[MessageType["Ping"] = 6] = "Ping";
        /** Indicates the message is a Close message and implements the {@link @microsoft/signalr.CloseMessage} interface. */
        MessageType[MessageType["Close"] = 7] = "Close";
    })(MessageType || (MessageType = {}));

    // Licensed to the .NET Foundation under one or more agreements.
    /** Stream implementation to stream items to the server. */
    class Subject {
        constructor() {
            this.observers = [];
        }
        next(item) {
            for (const observer of this.observers) {
                observer.next(item);
            }
        }
        error(err) {
            for (const observer of this.observers) {
                if (observer.error) {
                    observer.error(err);
                }
            }
        }
        complete() {
            for (const observer of this.observers) {
                if (observer.complete) {
                    observer.complete();
                }
            }
        }
        subscribe(observer) {
            this.observers.push(observer);
            return new SubjectSubscription(this, observer);
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    const DEFAULT_TIMEOUT_IN_MS = 30 * 1000;
    const DEFAULT_PING_INTERVAL_IN_MS = 15 * 1000;
    /** Describes the current state of the {@link HubConnection} to the server. */
    var HubConnectionState;
    (function (HubConnectionState) {
        /** The hub connection is disconnected. */
        HubConnectionState["Disconnected"] = "Disconnected";
        /** The hub connection is connecting. */
        HubConnectionState["Connecting"] = "Connecting";
        /** The hub connection is connected. */
        HubConnectionState["Connected"] = "Connected";
        /** The hub connection is disconnecting. */
        HubConnectionState["Disconnecting"] = "Disconnecting";
        /** The hub connection is reconnecting. */
        HubConnectionState["Reconnecting"] = "Reconnecting";
    })(HubConnectionState || (HubConnectionState = {}));
    /** Represents a connection to a SignalR Hub. */
    class HubConnection {
        constructor(connection, logger, protocol, reconnectPolicy) {
            this._nextKeepAlive = 0;
            this._freezeEventListener = () => {
                this._logger.log(LogLevel.Warning, "The page is being frozen, this will likely lead to the connection being closed and messages being lost. For more information see the docs at https://docs.microsoft.com/aspnet/core/signalr/javascript-client#bsleep");
            };
            Arg.isRequired(connection, "connection");
            Arg.isRequired(logger, "logger");
            Arg.isRequired(protocol, "protocol");
            this.serverTimeoutInMilliseconds = DEFAULT_TIMEOUT_IN_MS;
            this.keepAliveIntervalInMilliseconds = DEFAULT_PING_INTERVAL_IN_MS;
            this._logger = logger;
            this._protocol = protocol;
            this.connection = connection;
            this._reconnectPolicy = reconnectPolicy;
            this._handshakeProtocol = new HandshakeProtocol();
            this.connection.onreceive = (data) => this._processIncomingData(data);
            this.connection.onclose = (error) => this._connectionClosed(error);
            this._callbacks = {};
            this._methods = {};
            this._closedCallbacks = [];
            this._reconnectingCallbacks = [];
            this._reconnectedCallbacks = [];
            this._invocationId = 0;
            this._receivedHandshakeResponse = false;
            this._connectionState = HubConnectionState.Disconnected;
            this._connectionStarted = false;
            this._cachedPingMessage = this._protocol.writeMessage({ type: MessageType.Ping });
        }
        /** @internal */
        // Using a public static factory method means we can have a private constructor and an _internal_
        // create method that can be used by HubConnectionBuilder. An "internal" constructor would just
        // be stripped away and the '.d.ts' file would have no constructor, which is interpreted as a
        // public parameter-less constructor.
        static create(connection, logger, protocol, reconnectPolicy) {
            return new HubConnection(connection, logger, protocol, reconnectPolicy);
        }
        /** Indicates the state of the {@link HubConnection} to the server. */
        get state() {
            return this._connectionState;
        }
        /** Represents the connection id of the {@link HubConnection} on the server. The connection id will be null when the connection is either
         *  in the disconnected state or if the negotiation step was skipped.
         */
        get connectionId() {
            return this.connection ? (this.connection.connectionId || null) : null;
        }
        /** Indicates the url of the {@link HubConnection} to the server. */
        get baseUrl() {
            return this.connection.baseUrl || "";
        }
        /**
         * Sets a new url for the HubConnection. Note that the url can only be changed when the connection is in either the Disconnected or
         * Reconnecting states.
         * @param {string} url The url to connect to.
         */
        set baseUrl(url) {
            if (this._connectionState !== HubConnectionState.Disconnected && this._connectionState !== HubConnectionState.Reconnecting) {
                throw new Error("The HubConnection must be in the Disconnected or Reconnecting state to change the url.");
            }
            if (!url) {
                throw new Error("The HubConnection url must be a valid url.");
            }
            this.connection.baseUrl = url;
        }
        /** Starts the connection.
         *
         * @returns {Promise<void>} A Promise that resolves when the connection has been successfully established, or rejects with an error.
         */
        start() {
            this._startPromise = this._startWithStateTransitions();
            return this._startPromise;
        }
        async _startWithStateTransitions() {
            if (this._connectionState !== HubConnectionState.Disconnected) {
                return Promise.reject(new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."));
            }
            this._connectionState = HubConnectionState.Connecting;
            this._logger.log(LogLevel.Debug, "Starting HubConnection.");
            try {
                await this._startInternal();
                if (Platform.isBrowser) {
                    // Log when the browser freezes the tab so users know why their connection unexpectedly stopped working
                    window.document.addEventListener("freeze", this._freezeEventListener);
                }
                this._connectionState = HubConnectionState.Connected;
                this._connectionStarted = true;
                this._logger.log(LogLevel.Debug, "HubConnection connected successfully.");
            }
            catch (e) {
                this._connectionState = HubConnectionState.Disconnected;
                this._logger.log(LogLevel.Debug, `HubConnection failed to start successfully because of error '${e}'.`);
                return Promise.reject(e);
            }
        }
        async _startInternal() {
            this._stopDuringStartError = undefined;
            this._receivedHandshakeResponse = false;
            // Set up the promise before any connection is (re)started otherwise it could race with received messages
            const handshakePromise = new Promise((resolve, reject) => {
                this._handshakeResolver = resolve;
                this._handshakeRejecter = reject;
            });
            await this.connection.start(this._protocol.transferFormat);
            try {
                const handshakeRequest = {
                    protocol: this._protocol.name,
                    version: this._protocol.version,
                };
                this._logger.log(LogLevel.Debug, "Sending handshake request.");
                await this._sendMessage(this._handshakeProtocol.writeHandshakeRequest(handshakeRequest));
                this._logger.log(LogLevel.Information, `Using HubProtocol '${this._protocol.name}'.`);
                // defensively cleanup timeout in case we receive a message from the server before we finish start
                this._cleanupTimeout();
                this._resetTimeoutPeriod();
                this._resetKeepAliveInterval();
                await handshakePromise;
                // It's important to check the stopDuringStartError instead of just relying on the handshakePromise
                // being rejected on close, because this continuation can run after both the handshake completed successfully
                // and the connection was closed.
                if (this._stopDuringStartError) {
                    // It's important to throw instead of returning a rejected promise, because we don't want to allow any state
                    // transitions to occur between now and the calling code observing the exceptions. Returning a rejected promise
                    // will cause the calling continuation to get scheduled to run later.
                    // eslint-disable-next-line @typescript-eslint/no-throw-literal
                    throw this._stopDuringStartError;
                }
                if (!this.connection.features.inherentKeepAlive) {
                    await this._sendMessage(this._cachedPingMessage);
                }
            }
            catch (e) {
                this._logger.log(LogLevel.Debug, `Hub handshake failed with error '${e}' during start(). Stopping HubConnection.`);
                this._cleanupTimeout();
                this._cleanupPingTimer();
                // HttpConnection.stop() should not complete until after the onclose callback is invoked.
                // This will transition the HubConnection to the disconnected state before HttpConnection.stop() completes.
                await this.connection.stop(e);
                throw e;
            }
        }
        /** Stops the connection.
         *
         * @returns {Promise<void>} A Promise that resolves when the connection has been successfully terminated, or rejects with an error.
         */
        async stop() {
            // Capture the start promise before the connection might be restarted in an onclose callback.
            const startPromise = this._startPromise;
            this._stopPromise = this._stopInternal();
            await this._stopPromise;
            try {
                // Awaiting undefined continues immediately
                await startPromise;
            }
            catch (e) {
                // This exception is returned to the user as a rejected Promise from the start method.
            }
        }
        _stopInternal(error) {
            if (this._connectionState === HubConnectionState.Disconnected) {
                this._logger.log(LogLevel.Debug, `Call to HubConnection.stop(${error}) ignored because it is already in the disconnected state.`);
                return Promise.resolve();
            }
            if (this._connectionState === HubConnectionState.Disconnecting) {
                this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
                return this._stopPromise;
            }
            this._connectionState = HubConnectionState.Disconnecting;
            this._logger.log(LogLevel.Debug, "Stopping HubConnection.");
            if (this._reconnectDelayHandle) {
                // We're in a reconnect delay which means the underlying connection is currently already stopped.
                // Just clear the handle to stop the reconnect loop (which no one is waiting on thankfully) and
                // fire the onclose callbacks.
                this._logger.log(LogLevel.Debug, "Connection stopped during reconnect delay. Done reconnecting.");
                clearTimeout(this._reconnectDelayHandle);
                this._reconnectDelayHandle = undefined;
                this._completeClose();
                return Promise.resolve();
            }
            this._cleanupTimeout();
            this._cleanupPingTimer();
            this._stopDuringStartError = error || new AbortError("The connection was stopped before the hub handshake could complete.");
            // HttpConnection.stop() should not complete until after either HttpConnection.start() fails
            // or the onclose callback is invoked. The onclose callback will transition the HubConnection
            // to the disconnected state if need be before HttpConnection.stop() completes.
            return this.connection.stop(error);
        }
        /** Invokes a streaming hub method on the server using the specified name and arguments.
         *
         * @typeparam T The type of the items returned by the server.
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {IStreamResult<T>} An object that yields results from the server as they are received.
         */
        stream(methodName, ...args) {
            const [streams, streamIds] = this._replaceStreamingParams(args);
            const invocationDescriptor = this._createStreamInvocation(methodName, args, streamIds);
            // eslint-disable-next-line prefer-const
            let promiseQueue;
            const subject = new Subject();
            subject.cancelCallback = () => {
                const cancelInvocation = this._createCancelInvocation(invocationDescriptor.invocationId);
                delete this._callbacks[invocationDescriptor.invocationId];
                return promiseQueue.then(() => {
                    return this._sendWithProtocol(cancelInvocation);
                });
            };
            this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
                if (error) {
                    subject.error(error);
                    return;
                }
                else if (invocationEvent) {
                    // invocationEvent will not be null when an error is not passed to the callback
                    if (invocationEvent.type === MessageType.Completion) {
                        if (invocationEvent.error) {
                            subject.error(new Error(invocationEvent.error));
                        }
                        else {
                            subject.complete();
                        }
                    }
                    else {
                        subject.next((invocationEvent.item));
                    }
                }
            };
            promiseQueue = this._sendWithProtocol(invocationDescriptor)
                .catch((e) => {
                subject.error(e);
                delete this._callbacks[invocationDescriptor.invocationId];
            });
            this._launchStreams(streams, promiseQueue);
            return subject;
        }
        _sendMessage(message) {
            this._resetKeepAliveInterval();
            return this.connection.send(message);
        }
        /**
         * Sends a js object to the server.
         * @param message The js object to serialize and send.
         */
        _sendWithProtocol(message) {
            return this._sendMessage(this._protocol.writeMessage(message));
        }
        /** Invokes a hub method on the server using the specified name and arguments. Does not wait for a response from the receiver.
         *
         * The Promise returned by this method resolves when the client has sent the invocation to the server. The server may still
         * be processing the invocation.
         *
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {Promise<void>} A Promise that resolves when the invocation has been successfully sent, or rejects with an error.
         */
        send(methodName, ...args) {
            const [streams, streamIds] = this._replaceStreamingParams(args);
            const sendPromise = this._sendWithProtocol(this._createInvocation(methodName, args, true, streamIds));
            this._launchStreams(streams, sendPromise);
            return sendPromise;
        }
        /** Invokes a hub method on the server using the specified name and arguments.
         *
         * The Promise returned by this method resolves when the server indicates it has finished invoking the method. When the promise
         * resolves, the server has finished invoking the method. If the server method returns a result, it is produced as the result of
         * resolving the Promise.
         *
         * @typeparam T The expected return type.
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {Promise<T>} A Promise that resolves with the result of the server method (if any), or rejects with an error.
         */
        invoke(methodName, ...args) {
            const [streams, streamIds] = this._replaceStreamingParams(args);
            const invocationDescriptor = this._createInvocation(methodName, args, false, streamIds);
            const p = new Promise((resolve, reject) => {
                // invocationId will always have a value for a non-blocking invocation
                this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    else if (invocationEvent) {
                        // invocationEvent will not be null when an error is not passed to the callback
                        if (invocationEvent.type === MessageType.Completion) {
                            if (invocationEvent.error) {
                                reject(new Error(invocationEvent.error));
                            }
                            else {
                                resolve(invocationEvent.result);
                            }
                        }
                        else {
                            reject(new Error(`Unexpected message type: ${invocationEvent.type}`));
                        }
                    }
                };
                const promiseQueue = this._sendWithProtocol(invocationDescriptor)
                    .catch((e) => {
                    reject(e);
                    // invocationId will always have a value for a non-blocking invocation
                    delete this._callbacks[invocationDescriptor.invocationId];
                });
                this._launchStreams(streams, promiseQueue);
            });
            return p;
        }
        on(methodName, newMethod) {
            if (!methodName || !newMethod) {
                return;
            }
            methodName = methodName.toLowerCase();
            if (!this._methods[methodName]) {
                this._methods[methodName] = [];
            }
            // Preventing adding the same handler multiple times.
            if (this._methods[methodName].indexOf(newMethod) !== -1) {
                return;
            }
            this._methods[methodName].push(newMethod);
        }
        off(methodName, method) {
            if (!methodName) {
                return;
            }
            methodName = methodName.toLowerCase();
            const handlers = this._methods[methodName];
            if (!handlers) {
                return;
            }
            if (method) {
                const removeIdx = handlers.indexOf(method);
                if (removeIdx !== -1) {
                    handlers.splice(removeIdx, 1);
                    if (handlers.length === 0) {
                        delete this._methods[methodName];
                    }
                }
            }
            else {
                delete this._methods[methodName];
            }
        }
        /** Registers a handler that will be invoked when the connection is closed.
         *
         * @param {Function} callback The handler that will be invoked when the connection is closed. Optionally receives a single argument containing the error that caused the connection to close (if any).
         */
        onclose(callback) {
            if (callback) {
                this._closedCallbacks.push(callback);
            }
        }
        /** Registers a handler that will be invoked when the connection starts reconnecting.
         *
         * @param {Function} callback The handler that will be invoked when the connection starts reconnecting. Optionally receives a single argument containing the error that caused the connection to start reconnecting (if any).
         */
        onreconnecting(callback) {
            if (callback) {
                this._reconnectingCallbacks.push(callback);
            }
        }
        /** Registers a handler that will be invoked when the connection successfully reconnects.
         *
         * @param {Function} callback The handler that will be invoked when the connection successfully reconnects.
         */
        onreconnected(callback) {
            if (callback) {
                this._reconnectedCallbacks.push(callback);
            }
        }
        _processIncomingData(data) {
            this._cleanupTimeout();
            if (!this._receivedHandshakeResponse) {
                data = this._processHandshakeResponse(data);
                this._receivedHandshakeResponse = true;
            }
            // Data may have all been read when processing handshake response
            if (data) {
                // Parse the messages
                const messages = this._protocol.parseMessages(data, this._logger);
                for (const message of messages) {
                    switch (message.type) {
                        case MessageType.Invocation:
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises
                            this._invokeClientMethod(message);
                            break;
                        case MessageType.StreamItem:
                        case MessageType.Completion: {
                            const callback = this._callbacks[message.invocationId];
                            if (callback) {
                                if (message.type === MessageType.Completion) {
                                    delete this._callbacks[message.invocationId];
                                }
                                try {
                                    callback(message);
                                }
                                catch (e) {
                                    this._logger.log(LogLevel.Error, `Stream callback threw error: ${getErrorString(e)}`);
                                }
                            }
                            break;
                        }
                        case MessageType.Ping:
                            // Don't care about pings
                            break;
                        case MessageType.Close: {
                            this._logger.log(LogLevel.Information, "Close message received from server.");
                            const error = message.error ? new Error("Server returned an error on close: " + message.error) : undefined;
                            if (message.allowReconnect === true) {
                                // It feels wrong not to await connection.stop() here, but processIncomingData is called as part of an onreceive callback which is not async,
                                // this is already the behavior for serverTimeout(), and HttpConnection.Stop() should catch and log all possible exceptions.
                                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                                this.connection.stop(error);
                            }
                            else {
                                // We cannot await stopInternal() here, but subsequent calls to stop() will await this if stopInternal() is still ongoing.
                                this._stopPromise = this._stopInternal(error);
                            }
                            break;
                        }
                        default:
                            this._logger.log(LogLevel.Warning, `Invalid message type: ${message.type}.`);
                            break;
                    }
                }
            }
            this._resetTimeoutPeriod();
        }
        _processHandshakeResponse(data) {
            let responseMessage;
            let remainingData;
            try {
                [remainingData, responseMessage] = this._handshakeProtocol.parseHandshakeResponse(data);
            }
            catch (e) {
                const message = "Error parsing handshake response: " + e;
                this._logger.log(LogLevel.Error, message);
                const error = new Error(message);
                this._handshakeRejecter(error);
                throw error;
            }
            if (responseMessage.error) {
                const message = "Server returned handshake error: " + responseMessage.error;
                this._logger.log(LogLevel.Error, message);
                const error = new Error(message);
                this._handshakeRejecter(error);
                throw error;
            }
            else {
                this._logger.log(LogLevel.Debug, "Server handshake complete.");
            }
            this._handshakeResolver();
            return remainingData;
        }
        _resetKeepAliveInterval() {
            if (this.connection.features.inherentKeepAlive) {
                return;
            }
            // Set the time we want the next keep alive to be sent
            // Timer will be setup on next message receive
            this._nextKeepAlive = new Date().getTime() + this.keepAliveIntervalInMilliseconds;
            this._cleanupPingTimer();
        }
        _resetTimeoutPeriod() {
            if (!this.connection.features || !this.connection.features.inherentKeepAlive) {
                // Set the timeout timer
                this._timeoutHandle = setTimeout(() => this.serverTimeout(), this.serverTimeoutInMilliseconds);
                // Set keepAlive timer if there isn't one
                if (this._pingServerHandle === undefined) {
                    let nextPing = this._nextKeepAlive - new Date().getTime();
                    if (nextPing < 0) {
                        nextPing = 0;
                    }
                    // The timer needs to be set from a networking callback to avoid Chrome timer throttling from causing timers to run once a minute
                    this._pingServerHandle = setTimeout(async () => {
                        if (this._connectionState === HubConnectionState.Connected) {
                            try {
                                await this._sendMessage(this._cachedPingMessage);
                            }
                            catch {
                                // We don't care about the error. It should be seen elsewhere in the client.
                                // The connection is probably in a bad or closed state now, cleanup the timer so it stops triggering
                                this._cleanupPingTimer();
                            }
                        }
                    }, nextPing);
                }
            }
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        serverTimeout() {
            // The server hasn't talked to us in a while. It doesn't like us anymore ... :(
            // Terminate the connection, but we don't need to wait on the promise. This could trigger reconnecting.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.connection.stop(new Error("Server timeout elapsed without receiving a message from the server."));
        }
        async _invokeClientMethod(invocationMessage) {
            const methodName = invocationMessage.target.toLowerCase();
            const methods = this._methods[methodName];
            if (!methods) {
                this._logger.log(LogLevel.Warning, `No client method with the name '${methodName}' found.`);
                // No handlers provided by client but the server is expecting a response still, so we send an error
                if (invocationMessage.invocationId) {
                    this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
                    await this._sendWithProtocol(this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null));
                }
                return;
            }
            // Avoid issues with handlers removing themselves thus modifying the list while iterating through it
            const methodsCopy = methods.slice();
            // Server expects a response
            const expectsResponse = invocationMessage.invocationId ? true : false;
            // We preserve the last result or exception but still call all handlers
            let res;
            let exception;
            let completionMessage;
            for (const m of methodsCopy) {
                try {
                    const prevRes = res;
                    res = await m.apply(this, invocationMessage.arguments);
                    if (expectsResponse && res && prevRes) {
                        this._logger.log(LogLevel.Error, `Multiple results provided for '${methodName}'. Sending error to server.`);
                        completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `Client provided multiple results.`, null);
                    }
                    // Ignore exception if we got a result after, the exception will be logged
                    exception = undefined;
                }
                catch (e) {
                    exception = e;
                    this._logger.log(LogLevel.Error, `A callback for the method '${methodName}' threw error '${e}'.`);
                }
            }
            if (completionMessage) {
                await this._sendWithProtocol(completionMessage);
            }
            else if (expectsResponse) {
                // If there is an exception that means either no result was given or a handler after a result threw
                if (exception) {
                    completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `${exception}`, null);
                }
                else if (res !== undefined) {
                    completionMessage = this._createCompletionMessage(invocationMessage.invocationId, null, res);
                }
                else {
                    this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
                    // Client didn't provide a result or throw from a handler, server expects a response so we send an error
                    completionMessage = this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null);
                }
                await this._sendWithProtocol(completionMessage);
            }
            else {
                if (res) {
                    this._logger.log(LogLevel.Error, `Result given for '${methodName}' method but server is not expecting a result.`);
                }
            }
        }
        _connectionClosed(error) {
            this._logger.log(LogLevel.Debug, `HubConnection.connectionClosed(${error}) called while in state ${this._connectionState}.`);
            // Triggering this.handshakeRejecter is insufficient because it could already be resolved without the continuation having run yet.
            this._stopDuringStartError = this._stopDuringStartError || error || new AbortError("The underlying connection was closed before the hub handshake could complete.");
            // If the handshake is in progress, start will be waiting for the handshake promise, so we complete it.
            // If it has already completed, this should just noop.
            if (this._handshakeResolver) {
                this._handshakeResolver();
            }
            this._cancelCallbacksWithError(error || new Error("Invocation canceled due to the underlying connection being closed."));
            this._cleanupTimeout();
            this._cleanupPingTimer();
            if (this._connectionState === HubConnectionState.Disconnecting) {
                this._completeClose(error);
            }
            else if (this._connectionState === HubConnectionState.Connected && this._reconnectPolicy) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this._reconnect(error);
            }
            else if (this._connectionState === HubConnectionState.Connected) {
                this._completeClose(error);
            }
            // If none of the above if conditions were true were called the HubConnection must be in either:
            // 1. The Connecting state in which case the handshakeResolver will complete it and stopDuringStartError will fail it.
            // 2. The Reconnecting state in which case the handshakeResolver will complete it and stopDuringStartError will fail the current reconnect attempt
            //    and potentially continue the reconnect() loop.
            // 3. The Disconnected state in which case we're already done.
        }
        _completeClose(error) {
            if (this._connectionStarted) {
                this._connectionState = HubConnectionState.Disconnected;
                this._connectionStarted = false;
                if (Platform.isBrowser) {
                    window.document.removeEventListener("freeze", this._freezeEventListener);
                }
                try {
                    this._closedCallbacks.forEach((c) => c.apply(this, [error]));
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `An onclose callback called with error '${error}' threw error '${e}'.`);
                }
            }
        }
        async _reconnect(error) {
            const reconnectStartTime = Date.now();
            let previousReconnectAttempts = 0;
            let retryError = error !== undefined ? error : new Error("Attempting to reconnect due to a unknown error.");
            let nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts++, 0, retryError);
            if (nextRetryDelay === null) {
                this._logger.log(LogLevel.Debug, "Connection not reconnecting because the IRetryPolicy returned null on the first reconnect attempt.");
                this._completeClose(error);
                return;
            }
            this._connectionState = HubConnectionState.Reconnecting;
            if (error) {
                this._logger.log(LogLevel.Information, `Connection reconnecting because of error '${error}'.`);
            }
            else {
                this._logger.log(LogLevel.Information, "Connection reconnecting.");
            }
            if (this._reconnectingCallbacks.length !== 0) {
                try {
                    this._reconnectingCallbacks.forEach((c) => c.apply(this, [error]));
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `An onreconnecting callback called with error '${error}' threw error '${e}'.`);
                }
                // Exit early if an onreconnecting callback called connection.stop().
                if (this._connectionState !== HubConnectionState.Reconnecting) {
                    this._logger.log(LogLevel.Debug, "Connection left the reconnecting state in onreconnecting callback. Done reconnecting.");
                    return;
                }
            }
            while (nextRetryDelay !== null) {
                this._logger.log(LogLevel.Information, `Reconnect attempt number ${previousReconnectAttempts} will start in ${nextRetryDelay} ms.`);
                await new Promise((resolve) => {
                    this._reconnectDelayHandle = setTimeout(resolve, nextRetryDelay);
                });
                this._reconnectDelayHandle = undefined;
                if (this._connectionState !== HubConnectionState.Reconnecting) {
                    this._logger.log(LogLevel.Debug, "Connection left the reconnecting state during reconnect delay. Done reconnecting.");
                    return;
                }
                try {
                    await this._startInternal();
                    this._connectionState = HubConnectionState.Connected;
                    this._logger.log(LogLevel.Information, "HubConnection reconnected successfully.");
                    if (this._reconnectedCallbacks.length !== 0) {
                        try {
                            this._reconnectedCallbacks.forEach((c) => c.apply(this, [this.connection.connectionId]));
                        }
                        catch (e) {
                            this._logger.log(LogLevel.Error, `An onreconnected callback called with connectionId '${this.connection.connectionId}; threw error '${e}'.`);
                        }
                    }
                    return;
                }
                catch (e) {
                    this._logger.log(LogLevel.Information, `Reconnect attempt failed because of error '${e}'.`);
                    if (this._connectionState !== HubConnectionState.Reconnecting) {
                        this._logger.log(LogLevel.Debug, `Connection moved to the '${this._connectionState}' from the reconnecting state during reconnect attempt. Done reconnecting.`);
                        // The TypeScript compiler thinks that connectionState must be Connected here. The TypeScript compiler is wrong.
                        if (this._connectionState === HubConnectionState.Disconnecting) {
                            this._completeClose();
                        }
                        return;
                    }
                    retryError = e instanceof Error ? e : new Error(e.toString());
                    nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts++, Date.now() - reconnectStartTime, retryError);
                }
            }
            this._logger.log(LogLevel.Information, `Reconnect retries have been exhausted after ${Date.now() - reconnectStartTime} ms and ${previousReconnectAttempts} failed attempts. Connection disconnecting.`);
            this._completeClose();
        }
        _getNextRetryDelay(previousRetryCount, elapsedMilliseconds, retryReason) {
            try {
                return this._reconnectPolicy.nextRetryDelayInMilliseconds({
                    elapsedMilliseconds,
                    previousRetryCount,
                    retryReason,
                });
            }
            catch (e) {
                this._logger.log(LogLevel.Error, `IRetryPolicy.nextRetryDelayInMilliseconds(${previousRetryCount}, ${elapsedMilliseconds}) threw error '${e}'.`);
                return null;
            }
        }
        _cancelCallbacksWithError(error) {
            const callbacks = this._callbacks;
            this._callbacks = {};
            Object.keys(callbacks)
                .forEach((key) => {
                const callback = callbacks[key];
                try {
                    callback(null, error);
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `Stream 'error' callback called with '${error}' threw error: ${getErrorString(e)}`);
                }
            });
        }
        _cleanupPingTimer() {
            if (this._pingServerHandle) {
                clearTimeout(this._pingServerHandle);
                this._pingServerHandle = undefined;
            }
        }
        _cleanupTimeout() {
            if (this._timeoutHandle) {
                clearTimeout(this._timeoutHandle);
            }
        }
        _createInvocation(methodName, args, nonblocking, streamIds) {
            if (nonblocking) {
                if (streamIds.length !== 0) {
                    return {
                        arguments: args,
                        streamIds,
                        target: methodName,
                        type: MessageType.Invocation,
                    };
                }
                else {
                    return {
                        arguments: args,
                        target: methodName,
                        type: MessageType.Invocation,
                    };
                }
            }
            else {
                const invocationId = this._invocationId;
                this._invocationId++;
                if (streamIds.length !== 0) {
                    return {
                        arguments: args,
                        invocationId: invocationId.toString(),
                        streamIds,
                        target: methodName,
                        type: MessageType.Invocation,
                    };
                }
                else {
                    return {
                        arguments: args,
                        invocationId: invocationId.toString(),
                        target: methodName,
                        type: MessageType.Invocation,
                    };
                }
            }
        }
        _launchStreams(streams, promiseQueue) {
            if (streams.length === 0) {
                return;
            }
            // Synchronize stream data so they arrive in-order on the server
            if (!promiseQueue) {
                promiseQueue = Promise.resolve();
            }
            // We want to iterate over the keys, since the keys are the stream ids
            // eslint-disable-next-line guard-for-in
            for (const streamId in streams) {
                streams[streamId].subscribe({
                    complete: () => {
                        promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId)));
                    },
                    error: (err) => {
                        let message;
                        if (err instanceof Error) {
                            message = err.message;
                        }
                        else if (err && err.toString) {
                            message = err.toString();
                        }
                        else {
                            message = "Unknown error";
                        }
                        promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId, message)));
                    },
                    next: (item) => {
                        promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createStreamItemMessage(streamId, item)));
                    },
                });
            }
        }
        _replaceStreamingParams(args) {
            const streams = [];
            const streamIds = [];
            for (let i = 0; i < args.length; i++) {
                const argument = args[i];
                if (this._isObservable(argument)) {
                    const streamId = this._invocationId;
                    this._invocationId++;
                    // Store the stream for later use
                    streams[streamId] = argument;
                    streamIds.push(streamId.toString());
                    // remove stream from args
                    args.splice(i, 1);
                }
            }
            return [streams, streamIds];
        }
        _isObservable(arg) {
            // This allows other stream implementations to just work (like rxjs)
            return arg && arg.subscribe && typeof arg.subscribe === "function";
        }
        _createStreamInvocation(methodName, args, streamIds) {
            const invocationId = this._invocationId;
            this._invocationId++;
            if (streamIds.length !== 0) {
                return {
                    arguments: args,
                    invocationId: invocationId.toString(),
                    streamIds,
                    target: methodName,
                    type: MessageType.StreamInvocation,
                };
            }
            else {
                return {
                    arguments: args,
                    invocationId: invocationId.toString(),
                    target: methodName,
                    type: MessageType.StreamInvocation,
                };
            }
        }
        _createCancelInvocation(id) {
            return {
                invocationId: id,
                type: MessageType.CancelInvocation,
            };
        }
        _createStreamItemMessage(id, item) {
            return {
                invocationId: id,
                item,
                type: MessageType.StreamItem,
            };
        }
        _createCompletionMessage(id, error, result) {
            if (error) {
                return {
                    error,
                    invocationId: id,
                    type: MessageType.Completion,
                };
            }
            return {
                invocationId: id,
                result,
                type: MessageType.Completion,
            };
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // 0, 2, 10, 30 second delays before reconnect attempts.
    const DEFAULT_RETRY_DELAYS_IN_MILLISECONDS = [0, 2000, 10000, 30000, null];
    /** @private */
    class DefaultReconnectPolicy {
        constructor(retryDelays) {
            this._retryDelays = retryDelays !== undefined ? [...retryDelays, null] : DEFAULT_RETRY_DELAYS_IN_MILLISECONDS;
        }
        nextRetryDelayInMilliseconds(retryContext) {
            return this._retryDelays[retryContext.previousRetryCount];
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    class HeaderNames {
    }
    HeaderNames.Authorization = "Authorization";
    HeaderNames.Cookie = "Cookie";

    // Licensed to the .NET Foundation under one or more agreements.
    /** @private */
    class AccessTokenHttpClient extends HttpClient {
        constructor(innerClient, accessTokenFactory) {
            super();
            this._innerClient = innerClient;
            this._accessTokenFactory = accessTokenFactory;
        }
        async send(request) {
            let allowRetry = true;
            if (this._accessTokenFactory && (!this._accessToken || (request.url && request.url.indexOf("/negotiate?") > 0))) {
                // don't retry if the request is a negotiate or if we just got a potentially new token from the access token factory
                allowRetry = false;
                this._accessToken = await this._accessTokenFactory();
            }
            this._setAuthorizationHeader(request);
            const response = await this._innerClient.send(request);
            if (allowRetry && response.statusCode === 401 && this._accessTokenFactory) {
                this._accessToken = await this._accessTokenFactory();
                this._setAuthorizationHeader(request);
                return await this._innerClient.send(request);
            }
            return response;
        }
        _setAuthorizationHeader(request) {
            if (!request.headers) {
                request.headers = {};
            }
            if (this._accessToken) {
                request.headers[HeaderNames.Authorization] = `Bearer ${this._accessToken}`;
            }
            // don't remove the header if there isn't an access token factory, the user manually added the header in this case
            else if (this._accessTokenFactory) {
                if (request.headers[HeaderNames.Authorization]) {
                    delete request.headers[HeaderNames.Authorization];
                }
            }
        }
        getCookieString(url) {
            return this._innerClient.getCookieString(url);
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // This will be treated as a bit flag in the future, so we keep it using power-of-two values.
    /** Specifies a specific HTTP transport type. */
    var HttpTransportType;
    (function (HttpTransportType) {
        /** Specifies no transport preference. */
        HttpTransportType[HttpTransportType["None"] = 0] = "None";
        /** Specifies the WebSockets transport. */
        HttpTransportType[HttpTransportType["WebSockets"] = 1] = "WebSockets";
        /** Specifies the Server-Sent Events transport. */
        HttpTransportType[HttpTransportType["ServerSentEvents"] = 2] = "ServerSentEvents";
        /** Specifies the Long Polling transport. */
        HttpTransportType[HttpTransportType["LongPolling"] = 4] = "LongPolling";
    })(HttpTransportType || (HttpTransportType = {}));
    /** Specifies the transfer format for a connection. */
    var TransferFormat;
    (function (TransferFormat) {
        /** Specifies that only text data will be transmitted over the connection. */
        TransferFormat[TransferFormat["Text"] = 1] = "Text";
        /** Specifies that binary data will be transmitted over the connection. */
        TransferFormat[TransferFormat["Binary"] = 2] = "Binary";
    })(TransferFormat || (TransferFormat = {}));

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // Rough polyfill of https://developer.mozilla.org/en-US/docs/Web/API/AbortController
    // We don't actually ever use the API being polyfilled, we always use the polyfill because
    // it's a very new API right now.
    // Not exported from index.
    /** @private */
    let AbortController$1 = class AbortController {
        constructor() {
            this._isAborted = false;
            this.onabort = null;
        }
        abort() {
            if (!this._isAborted) {
                this._isAborted = true;
                if (this.onabort) {
                    this.onabort();
                }
            }
        }
        get signal() {
            return this;
        }
        get aborted() {
            return this._isAborted;
        }
    };

    // Licensed to the .NET Foundation under one or more agreements.
    // Not exported from 'index', this type is internal.
    /** @private */
    class LongPollingTransport {
        constructor(httpClient, logger, options) {
            this._httpClient = httpClient;
            this._logger = logger;
            this._pollAbort = new AbortController$1();
            this._options = options;
            this._running = false;
            this.onreceive = null;
            this.onclose = null;
        }
        // This is an internal type, not exported from 'index' so this is really just internal.
        get pollAborted() {
            return this._pollAbort.aborted;
        }
        async connect(url, transferFormat) {
            Arg.isRequired(url, "url");
            Arg.isRequired(transferFormat, "transferFormat");
            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
            this._url = url;
            this._logger.log(LogLevel.Trace, "(LongPolling transport) Connecting.");
            // Allow binary format on Node and Browsers that support binary content (indicated by the presence of responseType property)
            if (transferFormat === TransferFormat.Binary &&
                (typeof XMLHttpRequest !== "undefined" && typeof new XMLHttpRequest().responseType !== "string")) {
                throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");
            }
            const [name, value] = getUserAgentHeader();
            const headers = { [name]: value, ...this._options.headers };
            const pollOptions = {
                abortSignal: this._pollAbort.signal,
                headers,
                timeout: 100000,
                withCredentials: this._options.withCredentials,
            };
            if (transferFormat === TransferFormat.Binary) {
                pollOptions.responseType = "arraybuffer";
            }
            // Make initial long polling request
            // Server uses first long polling request to finish initializing connection and it returns without data
            const pollUrl = `${url}&_=${Date.now()}`;
            this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
            const response = await this._httpClient.get(pollUrl, pollOptions);
            if (response.statusCode !== 200) {
                this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
                // Mark running as false so that the poll immediately ends and runs the close logic
                this._closeError = new HttpError(response.statusText || "", response.statusCode);
                this._running = false;
            }
            else {
                this._running = true;
            }
            this._receiving = this._poll(this._url, pollOptions);
        }
        async _poll(url, pollOptions) {
            try {
                while (this._running) {
                    try {
                        const pollUrl = `${url}&_=${Date.now()}`;
                        this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
                        const response = await this._httpClient.get(pollUrl, pollOptions);
                        if (response.statusCode === 204) {
                            this._logger.log(LogLevel.Information, "(LongPolling transport) Poll terminated by server.");
                            this._running = false;
                        }
                        else if (response.statusCode !== 200) {
                            this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
                            // Unexpected status code
                            this._closeError = new HttpError(response.statusText || "", response.statusCode);
                            this._running = false;
                        }
                        else {
                            // Process the response
                            if (response.content) {
                                this._logger.log(LogLevel.Trace, `(LongPolling transport) data received. ${getDataDetail(response.content, this._options.logMessageContent)}.`);
                                if (this.onreceive) {
                                    this.onreceive(response.content);
                                }
                            }
                            else {
                                // This is another way timeout manifest.
                                this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                            }
                        }
                    }
                    catch (e) {
                        if (!this._running) {
                            // Log but disregard errors that occur after stopping
                            this._logger.log(LogLevel.Trace, `(LongPolling transport) Poll errored after shutdown: ${e.message}`);
                        }
                        else {
                            if (e instanceof TimeoutError) {
                                // Ignore timeouts and reissue the poll.
                                this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                            }
                            else {
                                // Close the connection with the error as the result.
                                this._closeError = e;
                                this._running = false;
                            }
                        }
                    }
                }
            }
            finally {
                this._logger.log(LogLevel.Trace, "(LongPolling transport) Polling complete.");
                // We will reach here with pollAborted==false when the server returned a response causing the transport to stop.
                // If pollAborted==true then client initiated the stop and the stop method will raise the close event after DELETE is sent.
                if (!this.pollAborted) {
                    this._raiseOnClose();
                }
            }
        }
        async send(data) {
            if (!this._running) {
                return Promise.reject(new Error("Cannot send until the transport is connected"));
            }
            return sendMessage(this._logger, "LongPolling", this._httpClient, this._url, data, this._options);
        }
        async stop() {
            this._logger.log(LogLevel.Trace, "(LongPolling transport) Stopping polling.");
            // Tell receiving loop to stop, abort any current request, and then wait for it to finish
            this._running = false;
            this._pollAbort.abort();
            try {
                await this._receiving;
                // Send DELETE to clean up long polling on the server
                this._logger.log(LogLevel.Trace, `(LongPolling transport) sending DELETE request to ${this._url}.`);
                const headers = {};
                const [name, value] = getUserAgentHeader();
                headers[name] = value;
                const deleteOptions = {
                    headers: { ...headers, ...this._options.headers },
                    timeout: this._options.timeout,
                    withCredentials: this._options.withCredentials,
                };
                await this._httpClient.delete(this._url, deleteOptions);
                this._logger.log(LogLevel.Trace, "(LongPolling transport) DELETE request sent.");
            }
            finally {
                this._logger.log(LogLevel.Trace, "(LongPolling transport) Stop finished.");
                // Raise close event here instead of in polling
                // It needs to happen after the DELETE request is sent
                this._raiseOnClose();
            }
        }
        _raiseOnClose() {
            if (this.onclose) {
                let logMessage = "(LongPolling transport) Firing onclose event.";
                if (this._closeError) {
                    logMessage += " Error: " + this._closeError;
                }
                this._logger.log(LogLevel.Trace, logMessage);
                this.onclose(this._closeError);
            }
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    /** @private */
    class ServerSentEventsTransport {
        constructor(httpClient, accessToken, logger, options) {
            this._httpClient = httpClient;
            this._accessToken = accessToken;
            this._logger = logger;
            this._options = options;
            this.onreceive = null;
            this.onclose = null;
        }
        async connect(url, transferFormat) {
            Arg.isRequired(url, "url");
            Arg.isRequired(transferFormat, "transferFormat");
            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
            this._logger.log(LogLevel.Trace, "(SSE transport) Connecting.");
            // set url before accessTokenFactory because this._url is only for send and we set the auth header instead of the query string for send
            this._url = url;
            if (this._accessToken) {
                url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(this._accessToken)}`;
            }
            return new Promise((resolve, reject) => {
                let opened = false;
                if (transferFormat !== TransferFormat.Text) {
                    reject(new Error("The Server-Sent Events transport only supports the 'Text' transfer format"));
                    return;
                }
                let eventSource;
                if (Platform.isBrowser || Platform.isWebWorker) {
                    eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials });
                }
                else {
                    // Non-browser passes cookies via the dictionary
                    const cookies = this._httpClient.getCookieString(url);
                    const headers = {};
                    headers.Cookie = cookies;
                    const [name, value] = getUserAgentHeader();
                    headers[name] = value;
                    eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials, headers: { ...headers, ...this._options.headers } });
                }
                try {
                    eventSource.onmessage = (e) => {
                        if (this.onreceive) {
                            try {
                                this._logger.log(LogLevel.Trace, `(SSE transport) data received. ${getDataDetail(e.data, this._options.logMessageContent)}.`);
                                this.onreceive(e.data);
                            }
                            catch (error) {
                                this._close(error);
                                return;
                            }
                        }
                    };
                    // @ts-ignore: not using event on purpose
                    eventSource.onerror = (e) => {
                        // EventSource doesn't give any useful information about server side closes.
                        if (opened) {
                            this._close();
                        }
                        else {
                            reject(new Error("EventSource failed to connect. The connection could not be found on the server,"
                                + " either the connection ID is not present on the server, or a proxy is refusing/buffering the connection."
                                + " If you have multiple servers check that sticky sessions are enabled."));
                        }
                    };
                    eventSource.onopen = () => {
                        this._logger.log(LogLevel.Information, `SSE connected to ${this._url}`);
                        this._eventSource = eventSource;
                        opened = true;
                        resolve();
                    };
                }
                catch (e) {
                    reject(e);
                    return;
                }
            });
        }
        async send(data) {
            if (!this._eventSource) {
                return Promise.reject(new Error("Cannot send until the transport is connected"));
            }
            return sendMessage(this._logger, "SSE", this._httpClient, this._url, data, this._options);
        }
        stop() {
            this._close();
            return Promise.resolve();
        }
        _close(e) {
            if (this._eventSource) {
                this._eventSource.close();
                this._eventSource = undefined;
                if (this.onclose) {
                    this.onclose(e);
                }
            }
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    /** @private */
    class WebSocketTransport {
        constructor(httpClient, accessTokenFactory, logger, logMessageContent, webSocketConstructor, headers) {
            this._logger = logger;
            this._accessTokenFactory = accessTokenFactory;
            this._logMessageContent = logMessageContent;
            this._webSocketConstructor = webSocketConstructor;
            this._httpClient = httpClient;
            this.onreceive = null;
            this.onclose = null;
            this._headers = headers;
        }
        async connect(url, transferFormat) {
            Arg.isRequired(url, "url");
            Arg.isRequired(transferFormat, "transferFormat");
            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
            this._logger.log(LogLevel.Trace, "(WebSockets transport) Connecting.");
            let token;
            if (this._accessTokenFactory) {
                token = await this._accessTokenFactory();
            }
            return new Promise((resolve, reject) => {
                url = url.replace(/^http/, "ws");
                let webSocket;
                const cookies = this._httpClient.getCookieString(url);
                let opened = false;
                if (Platform.isNode || Platform.isReactNative) {
                    const headers = {};
                    const [name, value] = getUserAgentHeader();
                    headers[name] = value;
                    if (token) {
                        headers[HeaderNames.Authorization] = `Bearer ${token}`;
                    }
                    if (cookies) {
                        headers[HeaderNames.Cookie] = cookies;
                    }
                    // Only pass headers when in non-browser environments
                    webSocket = new this._webSocketConstructor(url, undefined, {
                        headers: { ...headers, ...this._headers },
                    });
                }
                else {
                    if (token) {
                        url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(token)}`;
                    }
                }
                if (!webSocket) {
                    // Chrome is not happy with passing 'undefined' as protocol
                    webSocket = new this._webSocketConstructor(url);
                }
                if (transferFormat === TransferFormat.Binary) {
                    webSocket.binaryType = "arraybuffer";
                }
                webSocket.onopen = (_event) => {
                    this._logger.log(LogLevel.Information, `WebSocket connected to ${url}.`);
                    this._webSocket = webSocket;
                    opened = true;
                    resolve();
                };
                webSocket.onerror = (event) => {
                    let error = null;
                    // ErrorEvent is a browser only type we need to check if the type exists before using it
                    if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                        error = event.error;
                    }
                    else {
                        error = "There was an error with the transport";
                    }
                    this._logger.log(LogLevel.Information, `(WebSockets transport) ${error}.`);
                };
                webSocket.onmessage = (message) => {
                    this._logger.log(LogLevel.Trace, `(WebSockets transport) data received. ${getDataDetail(message.data, this._logMessageContent)}.`);
                    if (this.onreceive) {
                        try {
                            this.onreceive(message.data);
                        }
                        catch (error) {
                            this._close(error);
                            return;
                        }
                    }
                };
                webSocket.onclose = (event) => {
                    // Don't call close handler if connection was never established
                    // We'll reject the connect call instead
                    if (opened) {
                        this._close(event);
                    }
                    else {
                        let error = null;
                        // ErrorEvent is a browser only type we need to check if the type exists before using it
                        if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                            error = event.error;
                        }
                        else {
                            error = "WebSocket failed to connect. The connection could not be found on the server,"
                                + " either the endpoint may not be a SignalR endpoint,"
                                + " the connection ID is not present on the server, or there is a proxy blocking WebSockets."
                                + " If you have multiple servers check that sticky sessions are enabled.";
                        }
                        reject(new Error(error));
                    }
                };
            });
        }
        send(data) {
            if (this._webSocket && this._webSocket.readyState === this._webSocketConstructor.OPEN) {
                this._logger.log(LogLevel.Trace, `(WebSockets transport) sending data. ${getDataDetail(data, this._logMessageContent)}.`);
                this._webSocket.send(data);
                return Promise.resolve();
            }
            return Promise.reject("WebSocket is not in the OPEN state");
        }
        stop() {
            if (this._webSocket) {
                // Manually invoke onclose callback inline so we know the HttpConnection was closed properly before returning
                // This also solves an issue where websocket.onclose could take 18+ seconds to trigger during network disconnects
                this._close(undefined);
            }
            return Promise.resolve();
        }
        _close(event) {
            // webSocket will be null if the transport did not start successfully
            if (this._webSocket) {
                // Clear websocket handlers because we are considering the socket closed now
                this._webSocket.onclose = () => { };
                this._webSocket.onmessage = () => { };
                this._webSocket.onerror = () => { };
                this._webSocket.close();
                this._webSocket = undefined;
            }
            this._logger.log(LogLevel.Trace, "(WebSockets transport) socket closed.");
            if (this.onclose) {
                if (this._isCloseEvent(event) && (event.wasClean === false || event.code !== 1000)) {
                    this.onclose(new Error(`WebSocket closed with status code: ${event.code} (${event.reason || "no reason given"}).`));
                }
                else if (event instanceof Error) {
                    this.onclose(event);
                }
                else {
                    this.onclose();
                }
            }
        }
        _isCloseEvent(event) {
            return event && typeof event.wasClean === "boolean" && typeof event.code === "number";
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    const MAX_REDIRECTS = 100;
    /** @private */
    class HttpConnection {
        constructor(url, options = {}) {
            this._stopPromiseResolver = () => { };
            this.features = {};
            this._negotiateVersion = 1;
            Arg.isRequired(url, "url");
            this._logger = createLogger(options.logger);
            this.baseUrl = this._resolveUrl(url);
            options = options || {};
            options.logMessageContent = options.logMessageContent === undefined ? false : options.logMessageContent;
            if (typeof options.withCredentials === "boolean" || options.withCredentials === undefined) {
                options.withCredentials = options.withCredentials === undefined ? true : options.withCredentials;
            }
            else {
                throw new Error("withCredentials option was not a 'boolean' or 'undefined' value");
            }
            options.timeout = options.timeout === undefined ? 100 * 1000 : options.timeout;
            let webSocketModule = null;
            let eventSourceModule = null;
            if (Platform.isNode && typeof require !== "undefined") {
                // In order to ignore the dynamic require in webpack builds we need to do this magic
                // @ts-ignore: TS doesn't know about these names
                const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
                webSocketModule = requireFunc("ws");
                eventSourceModule = requireFunc("eventsource");
            }
            if (!Platform.isNode && typeof WebSocket !== "undefined" && !options.WebSocket) {
                options.WebSocket = WebSocket;
            }
            else if (Platform.isNode && !options.WebSocket) {
                if (webSocketModule) {
                    options.WebSocket = webSocketModule;
                }
            }
            if (!Platform.isNode && typeof EventSource !== "undefined" && !options.EventSource) {
                options.EventSource = EventSource;
            }
            else if (Platform.isNode && !options.EventSource) {
                if (typeof eventSourceModule !== "undefined") {
                    options.EventSource = eventSourceModule;
                }
            }
            this._httpClient = new AccessTokenHttpClient(options.httpClient || new DefaultHttpClient(this._logger), options.accessTokenFactory);
            this._connectionState = "Disconnected" /* Disconnected */;
            this._connectionStarted = false;
            this._options = options;
            this.onreceive = null;
            this.onclose = null;
        }
        async start(transferFormat) {
            transferFormat = transferFormat || TransferFormat.Binary;
            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
            this._logger.log(LogLevel.Debug, `Starting connection with transfer format '${TransferFormat[transferFormat]}'.`);
            if (this._connectionState !== "Disconnected" /* Disconnected */) {
                return Promise.reject(new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."));
            }
            this._connectionState = "Connecting" /* Connecting */;
            this._startInternalPromise = this._startInternal(transferFormat);
            await this._startInternalPromise;
            // The TypeScript compiler thinks that connectionState must be Connecting here. The TypeScript compiler is wrong.
            if (this._connectionState === "Disconnecting" /* Disconnecting */) {
                // stop() was called and transitioned the client into the Disconnecting state.
                const message = "Failed to start the HttpConnection before stop() was called.";
                this._logger.log(LogLevel.Error, message);
                // We cannot await stopPromise inside startInternal since stopInternal awaits the startInternalPromise.
                await this._stopPromise;
                return Promise.reject(new AbortError(message));
            }
            else if (this._connectionState !== "Connected" /* Connected */) {
                // stop() was called and transitioned the client into the Disconnecting state.
                const message = "HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";
                this._logger.log(LogLevel.Error, message);
                return Promise.reject(new AbortError(message));
            }
            this._connectionStarted = true;
        }
        send(data) {
            if (this._connectionState !== "Connected" /* Connected */) {
                return Promise.reject(new Error("Cannot send data if the connection is not in the 'Connected' State."));
            }
            if (!this._sendQueue) {
                this._sendQueue = new TransportSendQueue(this.transport);
            }
            // Transport will not be null if state is connected
            return this._sendQueue.send(data);
        }
        async stop(error) {
            if (this._connectionState === "Disconnected" /* Disconnected */) {
                this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnected state.`);
                return Promise.resolve();
            }
            if (this._connectionState === "Disconnecting" /* Disconnecting */) {
                this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
                return this._stopPromise;
            }
            this._connectionState = "Disconnecting" /* Disconnecting */;
            this._stopPromise = new Promise((resolve) => {
                // Don't complete stop() until stopConnection() completes.
                this._stopPromiseResolver = resolve;
            });
            // stopInternal should never throw so just observe it.
            await this._stopInternal(error);
            await this._stopPromise;
        }
        async _stopInternal(error) {
            // Set error as soon as possible otherwise there is a race between
            // the transport closing and providing an error and the error from a close message
            // We would prefer the close message error.
            this._stopError = error;
            try {
                await this._startInternalPromise;
            }
            catch (e) {
                // This exception is returned to the user as a rejected Promise from the start method.
            }
            // The transport's onclose will trigger stopConnection which will run our onclose event.
            // The transport should always be set if currently connected. If it wasn't set, it's likely because
            // stop was called during start() and start() failed.
            if (this.transport) {
                try {
                    await this.transport.stop();
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `HttpConnection.transport.stop() threw error '${e}'.`);
                    this._stopConnection();
                }
                this.transport = undefined;
            }
            else {
                this._logger.log(LogLevel.Debug, "HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.");
            }
        }
        async _startInternal(transferFormat) {
            // Store the original base url and the access token factory since they may change
            // as part of negotiating
            let url = this.baseUrl;
            this._accessTokenFactory = this._options.accessTokenFactory;
            this._httpClient._accessTokenFactory = this._accessTokenFactory;
            try {
                if (this._options.skipNegotiation) {
                    if (this._options.transport === HttpTransportType.WebSockets) {
                        // No need to add a connection ID in this case
                        this.transport = this._constructTransport(HttpTransportType.WebSockets);
                        // We should just call connect directly in this case.
                        // No fallback or negotiate in this case.
                        await this._startTransport(url, transferFormat);
                    }
                    else {
                        throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");
                    }
                }
                else {
                    let negotiateResponse = null;
                    let redirects = 0;
                    do {
                        negotiateResponse = await this._getNegotiationResponse(url);
                        // the user tries to stop the connection when it is being started
                        if (this._connectionState === "Disconnecting" /* Disconnecting */ || this._connectionState === "Disconnected" /* Disconnected */) {
                            throw new AbortError("The connection was stopped during negotiation.");
                        }
                        if (negotiateResponse.error) {
                            throw new Error(negotiateResponse.error);
                        }
                        if (negotiateResponse.ProtocolVersion) {
                            throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");
                        }
                        if (negotiateResponse.url) {
                            url = negotiateResponse.url;
                        }
                        if (negotiateResponse.accessToken) {
                            // Replace the current access token factory with one that uses
                            // the returned access token
                            const accessToken = negotiateResponse.accessToken;
                            this._accessTokenFactory = () => accessToken;
                            // set the factory to undefined so the AccessTokenHttpClient won't retry with the same token, since we know it won't change until a connection restart
                            this._httpClient._accessToken = accessToken;
                            this._httpClient._accessTokenFactory = undefined;
                        }
                        redirects++;
                    } while (negotiateResponse.url && redirects < MAX_REDIRECTS);
                    if (redirects === MAX_REDIRECTS && negotiateResponse.url) {
                        throw new Error("Negotiate redirection limit exceeded.");
                    }
                    await this._createTransport(url, this._options.transport, negotiateResponse, transferFormat);
                }
                if (this.transport instanceof LongPollingTransport) {
                    this.features.inherentKeepAlive = true;
                }
                if (this._connectionState === "Connecting" /* Connecting */) {
                    // Ensure the connection transitions to the connected state prior to completing this.startInternalPromise.
                    // start() will handle the case when stop was called and startInternal exits still in the disconnecting state.
                    this._logger.log(LogLevel.Debug, "The HttpConnection connected successfully.");
                    this._connectionState = "Connected" /* Connected */;
                }
                // stop() is waiting on us via this.startInternalPromise so keep this.transport around so it can clean up.
                // This is the only case startInternal can exit in neither the connected nor disconnected state because stopConnection()
                // will transition to the disconnected state. start() will wait for the transition using the stopPromise.
            }
            catch (e) {
                this._logger.log(LogLevel.Error, "Failed to start the connection: " + e);
                this._connectionState = "Disconnected" /* Disconnected */;
                this.transport = undefined;
                // if start fails, any active calls to stop assume that start will complete the stop promise
                this._stopPromiseResolver();
                return Promise.reject(e);
            }
        }
        async _getNegotiationResponse(url) {
            const headers = {};
            const [name, value] = getUserAgentHeader();
            headers[name] = value;
            const negotiateUrl = this._resolveNegotiateUrl(url);
            this._logger.log(LogLevel.Debug, `Sending negotiation request: ${negotiateUrl}.`);
            try {
                const response = await this._httpClient.post(negotiateUrl, {
                    content: "",
                    headers: { ...headers, ...this._options.headers },
                    timeout: this._options.timeout,
                    withCredentials: this._options.withCredentials,
                });
                if (response.statusCode !== 200) {
                    return Promise.reject(new Error(`Unexpected status code returned from negotiate '${response.statusCode}'`));
                }
                const negotiateResponse = JSON.parse(response.content);
                if (!negotiateResponse.negotiateVersion || negotiateResponse.negotiateVersion < 1) {
                    // Negotiate version 0 doesn't use connectionToken
                    // So we set it equal to connectionId so all our logic can use connectionToken without being aware of the negotiate version
                    negotiateResponse.connectionToken = negotiateResponse.connectionId;
                }
                return negotiateResponse;
            }
            catch (e) {
                let errorMessage = "Failed to complete negotiation with the server: " + e;
                if (e instanceof HttpError) {
                    if (e.statusCode === 404) {
                        errorMessage = errorMessage + " Either this is not a SignalR endpoint or there is a proxy blocking the connection.";
                    }
                }
                this._logger.log(LogLevel.Error, errorMessage);
                return Promise.reject(new FailedToNegotiateWithServerError(errorMessage));
            }
        }
        _createConnectUrl(url, connectionToken) {
            if (!connectionToken) {
                return url;
            }
            return url + (url.indexOf("?") === -1 ? "?" : "&") + `id=${connectionToken}`;
        }
        async _createTransport(url, requestedTransport, negotiateResponse, requestedTransferFormat) {
            let connectUrl = this._createConnectUrl(url, negotiateResponse.connectionToken);
            if (this._isITransport(requestedTransport)) {
                this._logger.log(LogLevel.Debug, "Connection was provided an instance of ITransport, using that directly.");
                this.transport = requestedTransport;
                await this._startTransport(connectUrl, requestedTransferFormat);
                this.connectionId = negotiateResponse.connectionId;
                return;
            }
            const transportExceptions = [];
            const transports = negotiateResponse.availableTransports || [];
            let negotiate = negotiateResponse;
            for (const endpoint of transports) {
                const transportOrError = this._resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat);
                if (transportOrError instanceof Error) {
                    // Store the error and continue, we don't want to cause a re-negotiate in these cases
                    transportExceptions.push(`${endpoint.transport} failed:`);
                    transportExceptions.push(transportOrError);
                }
                else if (this._isITransport(transportOrError)) {
                    this.transport = transportOrError;
                    if (!negotiate) {
                        try {
                            negotiate = await this._getNegotiationResponse(url);
                        }
                        catch (ex) {
                            return Promise.reject(ex);
                        }
                        connectUrl = this._createConnectUrl(url, negotiate.connectionToken);
                    }
                    try {
                        await this._startTransport(connectUrl, requestedTransferFormat);
                        this.connectionId = negotiate.connectionId;
                        return;
                    }
                    catch (ex) {
                        this._logger.log(LogLevel.Error, `Failed to start the transport '${endpoint.transport}': ${ex}`);
                        negotiate = undefined;
                        transportExceptions.push(new FailedToStartTransportError(`${endpoint.transport} failed: ${ex}`, HttpTransportType[endpoint.transport]));
                        if (this._connectionState !== "Connecting" /* Connecting */) {
                            const message = "Failed to select transport before stop() was called.";
                            this._logger.log(LogLevel.Debug, message);
                            return Promise.reject(new AbortError(message));
                        }
                    }
                }
            }
            if (transportExceptions.length > 0) {
                return Promise.reject(new AggregateErrors(`Unable to connect to the server with any of the available transports. ${transportExceptions.join(" ")}`, transportExceptions));
            }
            return Promise.reject(new Error("None of the transports supported by the client are supported by the server."));
        }
        _constructTransport(transport) {
            switch (transport) {
                case HttpTransportType.WebSockets:
                    if (!this._options.WebSocket) {
                        throw new Error("'WebSocket' is not supported in your environment.");
                    }
                    return new WebSocketTransport(this._httpClient, this._accessTokenFactory, this._logger, this._options.logMessageContent, this._options.WebSocket, this._options.headers || {});
                case HttpTransportType.ServerSentEvents:
                    if (!this._options.EventSource) {
                        throw new Error("'EventSource' is not supported in your environment.");
                    }
                    return new ServerSentEventsTransport(this._httpClient, this._httpClient._accessToken, this._logger, this._options);
                case HttpTransportType.LongPolling:
                    return new LongPollingTransport(this._httpClient, this._logger, this._options);
                default:
                    throw new Error(`Unknown transport: ${transport}.`);
            }
        }
        _startTransport(url, transferFormat) {
            this.transport.onreceive = this.onreceive;
            this.transport.onclose = (e) => this._stopConnection(e);
            return this.transport.connect(url, transferFormat);
        }
        _resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat) {
            const transport = HttpTransportType[endpoint.transport];
            if (transport === null || transport === undefined) {
                this._logger.log(LogLevel.Debug, `Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
                return new Error(`Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
            }
            else {
                if (transportMatches(requestedTransport, transport)) {
                    const transferFormats = endpoint.transferFormats.map((s) => TransferFormat[s]);
                    if (transferFormats.indexOf(requestedTransferFormat) >= 0) {
                        if ((transport === HttpTransportType.WebSockets && !this._options.WebSocket) ||
                            (transport === HttpTransportType.ServerSentEvents && !this._options.EventSource)) {
                            this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it is not supported in your environment.'`);
                            return new UnsupportedTransportError(`'${HttpTransportType[transport]}' is not supported in your environment.`, transport);
                        }
                        else {
                            this._logger.log(LogLevel.Debug, `Selecting transport '${HttpTransportType[transport]}'.`);
                            try {
                                return this._constructTransport(transport);
                            }
                            catch (ex) {
                                return ex;
                            }
                        }
                    }
                    else {
                        this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it does not support the requested transfer format '${TransferFormat[requestedTransferFormat]}'.`);
                        return new Error(`'${HttpTransportType[transport]}' does not support ${TransferFormat[requestedTransferFormat]}.`);
                    }
                }
                else {
                    this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it was disabled by the client.`);
                    return new DisabledTransportError(`'${HttpTransportType[transport]}' is disabled by the client.`, transport);
                }
            }
        }
        _isITransport(transport) {
            return transport && typeof (transport) === "object" && "connect" in transport;
        }
        _stopConnection(error) {
            this._logger.log(LogLevel.Debug, `HttpConnection.stopConnection(${error}) called while in state ${this._connectionState}.`);
            this.transport = undefined;
            // If we have a stopError, it takes precedence over the error from the transport
            error = this._stopError || error;
            this._stopError = undefined;
            if (this._connectionState === "Disconnected" /* Disconnected */) {
                this._logger.log(LogLevel.Debug, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is already in the disconnected state.`);
                return;
            }
            if (this._connectionState === "Connecting" /* Connecting */) {
                this._logger.log(LogLevel.Warning, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is still in the connecting state.`);
                throw new Error(`HttpConnection.stopConnection(${error}) was called while the connection is still in the connecting state.`);
            }
            if (this._connectionState === "Disconnecting" /* Disconnecting */) {
                // A call to stop() induced this call to stopConnection and needs to be completed.
                // Any stop() awaiters will be scheduled to continue after the onclose callback fires.
                this._stopPromiseResolver();
            }
            if (error) {
                this._logger.log(LogLevel.Error, `Connection disconnected with error '${error}'.`);
            }
            else {
                this._logger.log(LogLevel.Information, "Connection disconnected.");
            }
            if (this._sendQueue) {
                this._sendQueue.stop().catch((e) => {
                    this._logger.log(LogLevel.Error, `TransportSendQueue.stop() threw error '${e}'.`);
                });
                this._sendQueue = undefined;
            }
            this.connectionId = undefined;
            this._connectionState = "Disconnected" /* Disconnected */;
            if (this._connectionStarted) {
                this._connectionStarted = false;
                try {
                    if (this.onclose) {
                        this.onclose(error);
                    }
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `HttpConnection.onclose(${error}) threw error '${e}'.`);
                }
            }
        }
        _resolveUrl(url) {
            // startsWith is not supported in IE
            if (url.lastIndexOf("https://", 0) === 0 || url.lastIndexOf("http://", 0) === 0) {
                return url;
            }
            if (!Platform.isBrowser) {
                throw new Error(`Cannot resolve '${url}'.`);
            }
            // Setting the url to the href propery of an anchor tag handles normalization
            // for us. There are 3 main cases.
            // 1. Relative path normalization e.g "b" -> "http://localhost:5000/a/b"
            // 2. Absolute path normalization e.g "/a/b" -> "http://localhost:5000/a/b"
            // 3. Networkpath reference normalization e.g "//localhost:5000/a/b" -> "http://localhost:5000/a/b"
            const aTag = window.document.createElement("a");
            aTag.href = url;
            this._logger.log(LogLevel.Information, `Normalizing '${url}' to '${aTag.href}'.`);
            return aTag.href;
        }
        _resolveNegotiateUrl(url) {
            const index = url.indexOf("?");
            let negotiateUrl = url.substring(0, index === -1 ? url.length : index);
            if (negotiateUrl[negotiateUrl.length - 1] !== "/") {
                negotiateUrl += "/";
            }
            negotiateUrl += "negotiate";
            negotiateUrl += index === -1 ? "" : url.substring(index);
            if (negotiateUrl.indexOf("negotiateVersion") === -1) {
                negotiateUrl += index === -1 ? "?" : "&";
                negotiateUrl += "negotiateVersion=" + this._negotiateVersion;
            }
            return negotiateUrl;
        }
    }
    function transportMatches(requestedTransport, actualTransport) {
        return !requestedTransport || ((actualTransport & requestedTransport) !== 0);
    }
    /** @private */
    class TransportSendQueue {
        constructor(_transport) {
            this._transport = _transport;
            this._buffer = [];
            this._executing = true;
            this._sendBufferedData = new PromiseSource();
            this._transportResult = new PromiseSource();
            this._sendLoopPromise = this._sendLoop();
        }
        send(data) {
            this._bufferData(data);
            if (!this._transportResult) {
                this._transportResult = new PromiseSource();
            }
            return this._transportResult.promise;
        }
        stop() {
            this._executing = false;
            this._sendBufferedData.resolve();
            return this._sendLoopPromise;
        }
        _bufferData(data) {
            if (this._buffer.length && typeof (this._buffer[0]) !== typeof (data)) {
                throw new Error(`Expected data to be of type ${typeof (this._buffer)} but was of type ${typeof (data)}`);
            }
            this._buffer.push(data);
            this._sendBufferedData.resolve();
        }
        async _sendLoop() {
            while (true) {
                await this._sendBufferedData.promise;
                if (!this._executing) {
                    if (this._transportResult) {
                        this._transportResult.reject("Connection stopped.");
                    }
                    break;
                }
                this._sendBufferedData = new PromiseSource();
                const transportResult = this._transportResult;
                this._transportResult = undefined;
                const data = typeof (this._buffer[0]) === "string" ?
                    this._buffer.join("") :
                    TransportSendQueue._concatBuffers(this._buffer);
                this._buffer.length = 0;
                try {
                    await this._transport.send(data);
                    transportResult.resolve();
                }
                catch (error) {
                    transportResult.reject(error);
                }
            }
        }
        static _concatBuffers(arrayBuffers) {
            const totalLength = arrayBuffers.map((b) => b.byteLength).reduce((a, b) => a + b);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const item of arrayBuffers) {
                result.set(new Uint8Array(item), offset);
                offset += item.byteLength;
            }
            return result.buffer;
        }
    }
    class PromiseSource {
        constructor() {
            this.promise = new Promise((resolve, reject) => [this._resolver, this._rejecter] = [resolve, reject]);
        }
        resolve() {
            this._resolver();
        }
        reject(reason) {
            this._rejecter(reason);
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    const JSON_HUB_PROTOCOL_NAME = "json";
    /** Implements the JSON Hub Protocol. */
    class JsonHubProtocol {
        constructor() {
            /** @inheritDoc */
            this.name = JSON_HUB_PROTOCOL_NAME;
            /** @inheritDoc */
            this.version = 1;
            /** @inheritDoc */
            this.transferFormat = TransferFormat.Text;
        }
        /** Creates an array of {@link @microsoft/signalr.HubMessage} objects from the specified serialized representation.
         *
         * @param {string} input A string containing the serialized representation.
         * @param {ILogger} logger A logger that will be used to log messages that occur during parsing.
         */
        parseMessages(input, logger) {
            // The interface does allow "ArrayBuffer" to be passed in, but this implementation does not. So let's throw a useful error.
            if (typeof input !== "string") {
                throw new Error("Invalid input for JSON hub protocol. Expected a string.");
            }
            if (!input) {
                return [];
            }
            if (logger === null) {
                logger = NullLogger.instance;
            }
            // Parse the messages
            const messages = TextMessageFormat.parse(input);
            const hubMessages = [];
            for (const message of messages) {
                const parsedMessage = JSON.parse(message);
                if (typeof parsedMessage.type !== "number") {
                    throw new Error("Invalid payload.");
                }
                switch (parsedMessage.type) {
                    case MessageType.Invocation:
                        this._isInvocationMessage(parsedMessage);
                        break;
                    case MessageType.StreamItem:
                        this._isStreamItemMessage(parsedMessage);
                        break;
                    case MessageType.Completion:
                        this._isCompletionMessage(parsedMessage);
                        break;
                    case MessageType.Ping:
                        // Single value, no need to validate
                        break;
                    case MessageType.Close:
                        // All optional values, no need to validate
                        break;
                    default:
                        // Future protocol changes can add message types, old clients can ignore them
                        logger.log(LogLevel.Information, "Unknown message type '" + parsedMessage.type + "' ignored.");
                        continue;
                }
                hubMessages.push(parsedMessage);
            }
            return hubMessages;
        }
        /** Writes the specified {@link @microsoft/signalr.HubMessage} to a string and returns it.
         *
         * @param {HubMessage} message The message to write.
         * @returns {string} A string containing the serialized representation of the message.
         */
        writeMessage(message) {
            return TextMessageFormat.write(JSON.stringify(message));
        }
        _isInvocationMessage(message) {
            this._assertNotEmptyString(message.target, "Invalid payload for Invocation message.");
            if (message.invocationId !== undefined) {
                this._assertNotEmptyString(message.invocationId, "Invalid payload for Invocation message.");
            }
        }
        _isStreamItemMessage(message) {
            this._assertNotEmptyString(message.invocationId, "Invalid payload for StreamItem message.");
            if (message.item === undefined) {
                throw new Error("Invalid payload for StreamItem message.");
            }
        }
        _isCompletionMessage(message) {
            if (message.result && message.error) {
                throw new Error("Invalid payload for Completion message.");
            }
            if (!message.result && message.error) {
                this._assertNotEmptyString(message.error, "Invalid payload for Completion message.");
            }
            this._assertNotEmptyString(message.invocationId, "Invalid payload for Completion message.");
        }
        _assertNotEmptyString(value, errorMessage) {
            if (typeof value !== "string" || value === "") {
                throw new Error(errorMessage);
            }
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    const LogLevelNameMapping = {
        trace: LogLevel.Trace,
        debug: LogLevel.Debug,
        info: LogLevel.Information,
        information: LogLevel.Information,
        warn: LogLevel.Warning,
        warning: LogLevel.Warning,
        error: LogLevel.Error,
        critical: LogLevel.Critical,
        none: LogLevel.None,
    };
    function parseLogLevel(name) {
        // Case-insensitive matching via lower-casing
        // Yes, I know case-folding is a complicated problem in Unicode, but we only support
        // the ASCII strings defined in LogLevelNameMapping anyway, so it's fine -anurse.
        const mapping = LogLevelNameMapping[name.toLowerCase()];
        if (typeof mapping !== "undefined") {
            return mapping;
        }
        else {
            throw new Error(`Unknown log level: ${name}`);
        }
    }
    /** A builder for configuring {@link @microsoft/signalr.HubConnection} instances. */
    class HubConnectionBuilder {
        configureLogging(logging) {
            Arg.isRequired(logging, "logging");
            if (isLogger(logging)) {
                this.logger = logging;
            }
            else if (typeof logging === "string") {
                const logLevel = parseLogLevel(logging);
                this.logger = new ConsoleLogger(logLevel);
            }
            else {
                this.logger = new ConsoleLogger(logging);
            }
            return this;
        }
        withUrl(url, transportTypeOrOptions) {
            Arg.isRequired(url, "url");
            Arg.isNotEmpty(url, "url");
            this.url = url;
            // Flow-typing knows where it's at. Since HttpTransportType is a number and IHttpConnectionOptions is guaranteed
            // to be an object, we know (as does TypeScript) this comparison is all we need to figure out which overload was called.
            if (typeof transportTypeOrOptions === "object") {
                this.httpConnectionOptions = { ...this.httpConnectionOptions, ...transportTypeOrOptions };
            }
            else {
                this.httpConnectionOptions = {
                    ...this.httpConnectionOptions,
                    transport: transportTypeOrOptions,
                };
            }
            return this;
        }
        /** Configures the {@link @microsoft/signalr.HubConnection} to use the specified Hub Protocol.
         *
         * @param {IHubProtocol} protocol The {@link @microsoft/signalr.IHubProtocol} implementation to use.
         */
        withHubProtocol(protocol) {
            Arg.isRequired(protocol, "protocol");
            this.protocol = protocol;
            return this;
        }
        withAutomaticReconnect(retryDelaysOrReconnectPolicy) {
            if (this.reconnectPolicy) {
                throw new Error("A reconnectPolicy has already been set.");
            }
            if (!retryDelaysOrReconnectPolicy) {
                this.reconnectPolicy = new DefaultReconnectPolicy();
            }
            else if (Array.isArray(retryDelaysOrReconnectPolicy)) {
                this.reconnectPolicy = new DefaultReconnectPolicy(retryDelaysOrReconnectPolicy);
            }
            else {
                this.reconnectPolicy = retryDelaysOrReconnectPolicy;
            }
            return this;
        }
        /** Creates a {@link @microsoft/signalr.HubConnection} from the configuration options specified in this builder.
         *
         * @returns {HubConnection} The configured {@link @microsoft/signalr.HubConnection}.
         */
        build() {
            // If httpConnectionOptions has a logger, use it. Otherwise, override it with the one
            // provided to configureLogger
            const httpConnectionOptions = this.httpConnectionOptions || {};
            // If it's 'null', the user **explicitly** asked for null, don't mess with it.
            if (httpConnectionOptions.logger === undefined) {
                // If our logger is undefined or null, that's OK, the HttpConnection constructor will handle it.
                httpConnectionOptions.logger = this.logger;
            }
            // Now create the connection
            if (!this.url) {
                throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");
            }
            const connection = new HttpConnection(this.url, httpConnectionOptions);
            return HubConnection.create(connection, this.logger || NullLogger.instance, this.protocol || new JsonHubProtocol(), this.reconnectPolicy);
        }
    }
    function isLogger(logger) {
        return logger.log !== undefined;
    }

    // Licensed to the .NET Foundation under one or more agreements.

    var esm = /*#__PURE__*/Object.freeze({
        __proto__: null,
        AbortError: AbortError,
        DefaultHttpClient: DefaultHttpClient,
        HttpClient: HttpClient,
        HttpError: HttpError,
        HttpResponse: HttpResponse,
        get HttpTransportType () { return HttpTransportType; },
        HubConnection: HubConnection,
        HubConnectionBuilder: HubConnectionBuilder,
        get HubConnectionState () { return HubConnectionState; },
        JsonHubProtocol: JsonHubProtocol,
        get LogLevel () { return LogLevel; },
        get MessageType () { return MessageType; },
        NullLogger: NullLogger,
        Subject: Subject,
        TimeoutError: TimeoutError,
        get TransferFormat () { return TransferFormat; },
        VERSION: VERSION
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(esm);

    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    Object.defineProperty(baseHubClient, "__esModule", { value: true });
    baseHubClient.BaseHubClient = void 0;
    const signalr_1 = require$$0;
    const signalREvent_1$1 = signalREvent;
    class BaseHubClient {
        constructor(state) {
            var _a, _b;
            this._state = {
                url: '',
                hubPath: '',
            };
            this.isConnected = () => {
                return this._connection.state === signalr_1.HubConnectionState.Connected;
            };
            this.addListener = (channel, callBack) => {
                this.logMessage(`Listener created for: ${signalREvent_1$1.SignalRReceiveEvent[channel].toString()}`);
                this._connection.on(signalREvent_1$1.SignalRReceiveEvent[channel].toString(), (args) => callBack(args));
            };
            this.removeListener = (channel, callBack) => {
                this.logMessage(`Listener removed for: ${signalREvent_1$1.SignalRReceiveEvent[channel].toString()}`);
                this._connection.off(signalREvent_1$1.SignalRReceiveEvent[channel].toString(), (args) => callBack(args));
            };
            this.sendPayload = (channel, payload) => __awaiter(this, void 0, void 0, function* () {
                if (this.isConnected()) {
                    try {
                        const channelString = signalREvent_1$1.SignalRSendEvent[channel].toString();
                        yield this._connection.send(channelString, payload);
                        this.logMessage('Message sent!', `channel: ${channelString}`, payload);
                    }
                    catch (e) {
                        console.error('sendPayload error', e);
                    }
                }
                else {
                    console.warn('No connection, cannot send payload!');
                }
            });
            this.logMessage = (message, ...optionalParams) => {
                console.log(message, optionalParams);
            };
            const apiUrl = (_a = state === null || state === void 0 ? void 0 : state.url) !== null && _a !== void 0 ? _a : 'https://api.assistantapps.com';
            this._state.url = apiUrl;
            this._state.hubPath = (_b = state === null || state === void 0 ? void 0 : state.hubPath) !== null && _b !== void 0 ? _b : '/hubs/OAuth';
            this._connection = new signalr_1.HubConnectionBuilder()
                .withUrl(`${this._state.url}${this._state.hubPath}`)
                .withAutomaticReconnect()
                .build();
            this._connection.start().then(() => this.logMessage('signalR connection'));
        }
    }
    baseHubClient.BaseHubClient = BaseHubClient;

    Object.defineProperty(assistantAppsOAuthClient, "__esModule", { value: true });
    assistantAppsOAuthClient.AssistantAppsOAuthClient = void 0;
    const signalREvent_1 = signalREvent;
    const baseHubClient_1 = baseHubClient;
    class AssistantAppsOAuthClient extends baseHubClient_1.BaseHubClient {
        constructor() {
            super(...arguments);
            this.listenToOAuth = (callBack) => {
                this.addListener(signalREvent_1.SignalRReceiveEvent.OAuthComplete, callBack);
            };
            this.removeListenToOAuth = (callBack) => {
                this.removeListener(signalREvent_1.SignalRReceiveEvent.OAuthComplete, callBack);
            };
            this.joinGroup = (channelId) => {
                this.sendPayload(signalREvent_1.SignalRSendEvent.JoinOAuthGroup, channelId);
            };
            this.leaveGroup = (channelId) => {
                this.sendPayload(signalREvent_1.SignalRSendEvent.LeaveOAuthGroup, channelId);
            };
        }
    }
    assistantAppsOAuthClient.AssistantAppsOAuthClient = AssistantAppsOAuthClient;

    (function (exports) {
    	Object.defineProperty(exports, "__esModule", { value: true });
    	exports.translationKeyController = exports.translationImageController = exports.translationController = exports.teamMemberController = exports.steamController = exports.quickActionController = exports.permissionController = exports.patreonController = exports.oAuthController = exports.licenceController = exports.languageController = exports.feedbackFormQuestionController = exports.feedbackFormAnswerController = exports.feedbackFormController = exports.donationController = exports.dashboardController = exports.contactController = exports.cacheController = exports.badgeController = exports.appReviewController = exports.appNoticeController = exports.appController = exports.accountController = exports.BaseApiService = exports.AssistantAppsApiService = exports.UserActivityActionType = exports.TranslationReportStatus = exports.SortDirection = exports.SignalRServerType = exports.RequestBodyMapperType = exports.RedisCacheType = exports.PlatformType = exports.PermissionType = exports.OAuthProviderType = exports.GuideSectionItemType = exports.FeedbackQuestionType = exports.FeedbackCategory = exports.DonationType = exports.DashboardItemType = exports.CoinbaseEventType = exports.CacheType = exports.AppType = exports.AppRatingType = exports.AdminApprovalStatus = exports.SignalRSendEvent = exports.SignalRReceiveEvent = exports.UserGuidHeaderKey = exports.TokenHeaderKey = exports.TokenExpiryHeaderKey = exports.endpoints = void 0;
    	exports.AssistantAppsOAuthClient = exports.versionController = exports.userActivityController = exports.userController = exports.translationStatController = exports.translationReportController = void 0;
    	var endpoints_1 = endpoints;
    	Object.defineProperty(exports, "endpoints", { enumerable: true, get: function () { return endpoints_1.endpoints; } });
    	var header_keys_1 = headerKeys;
    	Object.defineProperty(exports, "TokenExpiryHeaderKey", { enumerable: true, get: function () { return header_keys_1.TokenExpiryHeaderKey; } });
    	Object.defineProperty(exports, "TokenHeaderKey", { enumerable: true, get: function () { return header_keys_1.TokenHeaderKey; } });
    	Object.defineProperty(exports, "UserGuidHeaderKey", { enumerable: true, get: function () { return header_keys_1.UserGuidHeaderKey; } });
    	var signalREvent_1 = signalREvent;
    	Object.defineProperty(exports, "SignalRReceiveEvent", { enumerable: true, get: function () { return signalREvent_1.SignalRReceiveEvent; } });
    	Object.defineProperty(exports, "SignalRSendEvent", { enumerable: true, get: function () { return signalREvent_1.SignalRSendEvent; } });
    	//
    	var adminApprovalStatus_1 = adminApprovalStatus;
    	Object.defineProperty(exports, "AdminApprovalStatus", { enumerable: true, get: function () { return adminApprovalStatus_1.AdminApprovalStatus; } });
    	var appRatingType_1 = appRatingType;
    	Object.defineProperty(exports, "AppRatingType", { enumerable: true, get: function () { return appRatingType_1.AppRatingType; } });
    	var appType_1 = appType;
    	Object.defineProperty(exports, "AppType", { enumerable: true, get: function () { return appType_1.AppType; } });
    	var cacheType_1 = cacheType;
    	Object.defineProperty(exports, "CacheType", { enumerable: true, get: function () { return cacheType_1.CacheType; } });
    	var coinbaseEventType_1 = coinbaseEventType;
    	Object.defineProperty(exports, "CoinbaseEventType", { enumerable: true, get: function () { return coinbaseEventType_1.CoinbaseEventType; } });
    	var dashboardItemType_1 = dashboardItemType;
    	Object.defineProperty(exports, "DashboardItemType", { enumerable: true, get: function () { return dashboardItemType_1.DashboardItemType; } });
    	var donationType_1 = donationType;
    	Object.defineProperty(exports, "DonationType", { enumerable: true, get: function () { return donationType_1.DonationType; } });
    	var feedbackCategory_1 = feedbackCategory;
    	Object.defineProperty(exports, "FeedbackCategory", { enumerable: true, get: function () { return feedbackCategory_1.FeedbackCategory; } });
    	var feedbackQuestionType_1 = feedbackQuestionType;
    	Object.defineProperty(exports, "FeedbackQuestionType", { enumerable: true, get: function () { return feedbackQuestionType_1.FeedbackQuestionType; } });
    	var guideSectionItemType_1 = guideSectionItemType;
    	Object.defineProperty(exports, "GuideSectionItemType", { enumerable: true, get: function () { return guideSectionItemType_1.GuideSectionItemType; } });
    	var oAuthProviderType_1 = oAuthProviderType;
    	Object.defineProperty(exports, "OAuthProviderType", { enumerable: true, get: function () { return oAuthProviderType_1.OAuthProviderType; } });
    	var permissionType_1 = permissionType;
    	Object.defineProperty(exports, "PermissionType", { enumerable: true, get: function () { return permissionType_1.PermissionType; } });
    	var platformType_1 = platformType;
    	Object.defineProperty(exports, "PlatformType", { enumerable: true, get: function () { return platformType_1.PlatformType; } });
    	var redisCacheType_1 = redisCacheType;
    	Object.defineProperty(exports, "RedisCacheType", { enumerable: true, get: function () { return redisCacheType_1.RedisCacheType; } });
    	var requestBodyMapperType_1 = requestBodyMapperType;
    	Object.defineProperty(exports, "RequestBodyMapperType", { enumerable: true, get: function () { return requestBodyMapperType_1.RequestBodyMapperType; } });
    	var signalRServerType_1 = signalRServerType;
    	Object.defineProperty(exports, "SignalRServerType", { enumerable: true, get: function () { return signalRServerType_1.SignalRServerType; } });
    	var sortDirection_1 = sortDirection;
    	Object.defineProperty(exports, "SortDirection", { enumerable: true, get: function () { return sortDirection_1.SortDirection; } });
    	var translationReportStatus_1 = translationReportStatus;
    	Object.defineProperty(exports, "TranslationReportStatus", { enumerable: true, get: function () { return translationReportStatus_1.TranslationReportStatus; } });
    	var userActivityActionType_1 = userActivityActionType;
    	Object.defineProperty(exports, "UserActivityActionType", { enumerable: true, get: function () { return userActivityActionType_1.UserActivityActionType; } });
    	//
    	var assistantAppsApiService_1 = assistantAppsApiService;
    	Object.defineProperty(exports, "AssistantAppsApiService", { enumerable: true, get: function () { return assistantAppsApiService_1.AssistantAppsApiService; } });
    	var baseApiService_1 = baseApiService;
    	Object.defineProperty(exports, "BaseApiService", { enumerable: true, get: function () { return baseApiService_1.BaseApiService; } });
    	var account_controller_1 = account_controller;
    	Object.defineProperty(exports, "accountController", { enumerable: true, get: function () { return account_controller_1.accountController; } });
    	var app_controller_1 = app_controller;
    	Object.defineProperty(exports, "appController", { enumerable: true, get: function () { return app_controller_1.appController; } });
    	var appNotice_controller_1 = appNotice_controller;
    	Object.defineProperty(exports, "appNoticeController", { enumerable: true, get: function () { return appNotice_controller_1.appNoticeController; } });
    	var appReview_controller_1 = appReview_controller;
    	Object.defineProperty(exports, "appReviewController", { enumerable: true, get: function () { return appReview_controller_1.appReviewController; } });
    	var badge_controller_1 = badge_controller;
    	Object.defineProperty(exports, "badgeController", { enumerable: true, get: function () { return badge_controller_1.badgeController; } });
    	var cache_controller_1 = cache_controller;
    	Object.defineProperty(exports, "cacheController", { enumerable: true, get: function () { return cache_controller_1.cacheController; } });
    	var contact_controller_1 = contact_controller;
    	Object.defineProperty(exports, "contactController", { enumerable: true, get: function () { return contact_controller_1.contactController; } });
    	var dashboard_controller_1 = dashboard_controller;
    	Object.defineProperty(exports, "dashboardController", { enumerable: true, get: function () { return dashboard_controller_1.dashboardController; } });
    	var donation_controller_1 = donation_controller;
    	Object.defineProperty(exports, "donationController", { enumerable: true, get: function () { return donation_controller_1.donationController; } });
    	var feedbackForm_controller_1 = feedbackForm_controller;
    	Object.defineProperty(exports, "feedbackFormController", { enumerable: true, get: function () { return feedbackForm_controller_1.feedbackFormController; } });
    	var feedbackFormAnswer_controller_1 = feedbackFormAnswer_controller;
    	Object.defineProperty(exports, "feedbackFormAnswerController", { enumerable: true, get: function () { return feedbackFormAnswer_controller_1.feedbackFormAnswerController; } });
    	var feedbackFormQuestion_controller_1 = feedbackFormQuestion_controller;
    	Object.defineProperty(exports, "feedbackFormQuestionController", { enumerable: true, get: function () { return feedbackFormQuestion_controller_1.feedbackFormQuestionController; } });
    	var language_controller_1 = language_controller;
    	Object.defineProperty(exports, "languageController", { enumerable: true, get: function () { return language_controller_1.languageController; } });
    	var licence_controller_1 = licence_controller;
    	Object.defineProperty(exports, "licenceController", { enumerable: true, get: function () { return licence_controller_1.licenceController; } });
    	var oauth_controller_1 = oauth_controller;
    	Object.defineProperty(exports, "oAuthController", { enumerable: true, get: function () { return oauth_controller_1.oAuthController; } });
    	var patreon_controller_1 = patreon_controller;
    	Object.defineProperty(exports, "patreonController", { enumerable: true, get: function () { return patreon_controller_1.patreonController; } });
    	var permission_controller_1 = permission_controller;
    	Object.defineProperty(exports, "permissionController", { enumerable: true, get: function () { return permission_controller_1.permissionController; } });
    	var quickAction_controller_1 = quickAction_controller;
    	Object.defineProperty(exports, "quickActionController", { enumerable: true, get: function () { return quickAction_controller_1.quickActionController; } });
    	var steam_controller_1 = steam_controller;
    	Object.defineProperty(exports, "steamController", { enumerable: true, get: function () { return steam_controller_1.steamController; } });
    	var teamMember_controller_1 = teamMember_controller;
    	Object.defineProperty(exports, "teamMemberController", { enumerable: true, get: function () { return teamMember_controller_1.teamMemberController; } });
    	var translation_controller_1 = translation_controller;
    	Object.defineProperty(exports, "translationController", { enumerable: true, get: function () { return translation_controller_1.translationController; } });
    	var translationImage_controller_1 = translationImage_controller;
    	Object.defineProperty(exports, "translationImageController", { enumerable: true, get: function () { return translationImage_controller_1.translationImageController; } });
    	var translationKey_controller_1 = translationKey_controller;
    	Object.defineProperty(exports, "translationKeyController", { enumerable: true, get: function () { return translationKey_controller_1.translationKeyController; } });
    	var translationReport_controller_1 = translationReport_controller;
    	Object.defineProperty(exports, "translationReportController", { enumerable: true, get: function () { return translationReport_controller_1.translationReportController; } });
    	var translationStat_controller_1 = translationStat_controller;
    	Object.defineProperty(exports, "translationStatController", { enumerable: true, get: function () { return translationStat_controller_1.translationStatController; } });
    	var user_controller_1 = user_controller;
    	Object.defineProperty(exports, "userController", { enumerable: true, get: function () { return user_controller_1.userController; } });
    	var userActivity_controller_1 = userActivity_controller;
    	Object.defineProperty(exports, "userActivityController", { enumerable: true, get: function () { return userActivity_controller_1.userActivityController; } });
    	var version_controller_1 = version_controller;
    	Object.defineProperty(exports, "versionController", { enumerable: true, get: function () { return version_controller_1.versionController; } });
    	//
    	var assistantAppsOAuthClient_1 = assistantAppsOAuthClient;
    	Object.defineProperty(exports, "AssistantAppsOAuthClient", { enumerable: true, get: function () { return assistantAppsOAuthClient_1.AssistantAppsOAuthClient; } }); 
    } (lib));

    const getAssistantAppsUrl = () => {
        var _a;
        return (_a = window.config) === null || _a === void 0 ? void 0 : _a.assistantAppsApiUrl;
    };
    const getAssistantAppsService = () => {
        return new lib.AssistantAppsApiService({
            url: getAssistantAppsUrl(),
        });
    };
    const getAssistantAppsImgRoot = () => {
        var _a, _b;
        return (_b = (_a = window === null || window === void 0 ? void 0 : window.config) === null || _a === void 0 ? void 0 : _a.assistantAppsImgRoot) !== null && _b !== void 0 ? _b : '';
    };

    var NetworkState;
    (function (NetworkState) {
        NetworkState[NetworkState["Loading"] = 0] = "Loading";
        NetworkState[NetworkState["Success"] = 1] = "Success";
        NetworkState[NetworkState["Error"] = 2] = "Error";
    })(NetworkState || (NetworkState = {}));

    const anyObject = {};

    const useApiCall = async (apiCall) => {
        const appListResult = await apiCall();
        if (appListResult.isSuccess == false || appListResult.value == null) {
            return [
                NetworkState.Error,
                anyObject,
            ];
        }
        return [
            NetworkState.Success,
            appListResult.value,
        ];
    };

    const init$8 = async () => {
        const aaApi = getAssistantAppsService();
        const [localNetworkState, localItemList] = await useApiCall(aaApi.app.readAll);
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, []];
        }
        const localApps = localItemList.filter((app) => app.isVisible);
        localApps.sort((a, b) => a.sortOrder - b.sortOrder);
        return [localNetworkState, localApps];
    };

    /* src\module\apps\appList.svelte generated by Svelte v3.58.0 */
    const file$m = "src\\module\\apps\\appList.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (16:2) {#if $$slots.loading != null}
    function create_if_block_1$8(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$m, 15, 31, 533);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$8.name,
    		type: "if",
    		source: "(16:2) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (17:2) {#if $$slots.error != null}
    function create_if_block$b(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$m, 16, 29, 607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(17:2) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#each items as item}
    function create_each_block$9(ctx) {
    	let assistant_apps_app_tile;
    	let assistant_apps_app_tile_name_value;
    	let assistant_apps_app_tile_gamename_value;
    	let assistant_apps_app_tile_logourl_value;

    	const block = {
    		c: function create() {
    			assistant_apps_app_tile = element("assistant-apps-app-tile");
    			set_custom_element_data(assistant_apps_app_tile, "name", assistant_apps_app_tile_name_value = /*item*/ ctx[3].name);
    			set_custom_element_data(assistant_apps_app_tile, "gamename", assistant_apps_app_tile_gamename_value = /*item*/ ctx[3].gameName);
    			set_custom_element_data(assistant_apps_app_tile, "logourl", assistant_apps_app_tile_logourl_value = /*item*/ ctx[3].logoUrl);
    			add_location(assistant_apps_app_tile, file$m, 19, 6, 751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_app_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && assistant_apps_app_tile_name_value !== (assistant_apps_app_tile_name_value = /*item*/ ctx[3].name)) {
    				set_custom_element_data(assistant_apps_app_tile, "name", assistant_apps_app_tile_name_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_app_tile_gamename_value !== (assistant_apps_app_tile_gamename_value = /*item*/ ctx[3].gameName)) {
    				set_custom_element_data(assistant_apps_app_tile, "gamename", assistant_apps_app_tile_gamename_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_app_tile_logourl_value !== (assistant_apps_app_tile_logourl_value = /*item*/ ctx[3].logoUrl)) {
    				set_custom_element_data(assistant_apps_app_tile, "logourl", assistant_apps_app_tile_logourl_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_app_tile);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(19:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let assistant_apps_loading;
    	let t0;
    	let t1;
    	let div;
    	let if_block0 = /*$$slots*/ ctx[2].loading != null && create_if_block_1$8(ctx);
    	let if_block1 = /*$$slots*/ ctx[2].error != null && create_if_block$b(ctx);
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_loading = element("assistant-apps-loading");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop$1;
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container apps-container noselect");
    			add_location(div, file$m, 17, 2, 650);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$m, 14, 0, 448);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_loading, anchor);
    			if (if_block0) if_block0.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t0);
    			if (if_block1) if_block1.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$$slots*/ ctx[2].loading != null) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$8(ctx);
    					if_block0.c();
    					if_block0.m(assistant_apps_loading, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$$slots*/ ctx[2].error != null) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$b(ctx);
    					if_block1.c();
    					if_block1.m(assistant_apps_loading, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*networkState*/ 1) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_loading);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-apps-list', slots, []);
    	const $$slots = compute_slots(slots);
    	let networkState = NetworkState.Loading;
    	let items = [];

    	onMount(async () => {
    		const [localNetworkState, localItemList] = await init$8();
    		$$invalidate(1, items = [...localItemList]);
    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-apps-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		init: init$8,
    		networkState,
    		items
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, items, $$slots];
    }

    class AppList extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{--aa-grid-columns:2;display:flex;flex-wrap:wrap;margin-bottom:3em;justify-content:center;column-gap:1em;row-gap:1em}.grid-container>*{width:calc(100% / var(--aa-grid-columns, 3) - 0.33em * var(--aa-grid-columns, 3))}@media only screen and (max-width: 1300px){.grid-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.grid-container{--aa-grid-columns:1}}.apps-container{--aa-grid-columns:3}@media only screen and (max-width: 1300px){.apps-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.apps-container{--aa-grid-columns:1}}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$m,
    			create_fragment$m,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-apps-list", AppList);

    /* src\module\apps\appTile.svelte generated by Svelte v3.58.0 */

    const file$l = "src\\module\\apps\\appTile.svelte";

    function create_fragment$l(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h2;
    	let span0;
    	let t1_value = /*name*/ ctx[0].replaceAll(/*gamename*/ ctx[1], "").trim() + "";
    	let t1;
    	let br;
    	let span1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			span0 = element("span");
    			t1 = text(t1_value);
    			br = element("br");
    			span1 = element("span");
    			t2 = text(/*gamename*/ ctx[1]);
    			this.c = noop$1;
    			if (!src_url_equal(img.src, img_src_value = /*logourl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			attr_dev(img, "class", "app-img noselect");
    			add_location(img, file$l, 14, 2, 414);
    			add_location(span0, file$l, 17, 6, 531);
    			add_location(br, file$l, 17, 57, 582);
    			attr_dev(span1, "class", "highlight");
    			add_location(span1, file$l, 17, 63, 588);
    			attr_dev(h2, "class", "app-name");
    			add_location(h2, file$l, 16, 4, 502);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$l, 15, 2, 475);
    			attr_dev(div1, "class", "aa-app");
    			add_location(div1, file$l, 13, 0, 390);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, span0);
    			append_dev(span0, t1);
    			append_dev(h2, br);
    			append_dev(h2, span1);
    			append_dev(span1, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*logourl*/ 4 && !src_url_equal(img.src, img_src_value = /*logourl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(img, "alt", /*name*/ ctx[0]);
    			}

    			if (dirty & /*name, gamename*/ 3 && t1_value !== (t1_value = /*name*/ ctx[0].replaceAll(/*gamename*/ ctx[1], "").trim() + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*gamename*/ 2) set_data_dev(t2, /*gamename*/ ctx[1]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-app-tile', slots, []);
    	let { name = "" } = $$props;
    	let { gamename = "" } = $$props;
    	let { logourl = "" } = $$props;
    	const writable_props = ['name', 'gamename', 'logourl'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-app-tile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('gamename' in $$props) $$invalidate(1, gamename = $$props.gamename);
    		if ('logourl' in $$props) $$invalidate(2, logourl = $$props.logourl);
    	};

    	$$self.$capture_state = () => ({ name, gamename, logourl });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('gamename' in $$props) $$invalidate(1, gamename = $$props.gamename);
    		if ('logourl' in $$props) $$invalidate(2, logourl = $$props.logourl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, gamename, logourl];
    }

    class AppTile extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.aa-app{display:flex;height:var(--assistantapps-apps-tile-height, 75px);background-color:var(--assistantapps-apps-background-colour, rgba(108, 117, 125, 0.4745098039));border-radius:5px;text-decoration:none;overflow:hidden}.aa-app img.app-img{height:var(--assistantapps-apps-tile-height, 75px);width:var(--assistantapps-apps-tile-height, 75px);object-fit:cover;margin:0}.aa-app .content{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-apps-text-colour, white);padding-left:1em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-app .content .app-name{margin:0;max-width:100%;line-height:110%;overflow-wrap:break-word;white-space:pre-wrap;word-wrap:break-word}.aa-app .content .app-name .highlight{color:var(--assistantapps-apps-text-highlight-colour, #91ccff)}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$l,
    			create_fragment$l,
    			safe_not_equal,
    			{ name: 0, gamename: 1, logourl: 2 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["name", "gamename", "logourl"];
    	}

    	get name() {
    		return this.$$.ctx[0];
    	}

    	set name(name) {
    		this.$$set({ name });
    		flush();
    	}

    	get gamename() {
    		return this.$$.ctx[1];
    	}

    	set gamename(gamename) {
    		this.$$set({ gamename });
    		flush();
    	}

    	get logourl() {
    		return this.$$.ctx[2];
    	}

    	set logourl(logourl) {
    		this.$$set({ logourl });
    		flush();
    	}
    }

    customElements.define("assistant-apps-app-tile", AppTile);

    const init$7 = async () => {
        const aaApi = getAssistantAppsService();
        const fetchAppsState = await fetchApps$2(aaApi);
        const fetchLanguagesState = await fetchLanguages(aaApi);
        if (fetchAppsState[0] == NetworkState.Error ||
            fetchLanguagesState[0] == NetworkState.Error) {
            return {
                networkState: NetworkState.Error,
                appLookup: [],
                selectedAppGuid: '',
                langLookup: [],
                selectedLangCode: '',
            };
        }
        return {
            networkState: NetworkState.Success,
            appLookup: fetchAppsState[1],
            selectedAppGuid: fetchAppsState[2],
            langLookup: fetchLanguagesState[1],
            selectedLangCode: fetchLanguagesState[2],
        };
    };
    const fetchApps$2 = async (aaApi) => {
        const [localNetworkState, localItemList] = await useApiCall(aaApi.app.readAll);
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, [], ''];
        }
        const localItems = localItemList.filter((app) => app.isVisible);
        localItems.sort((a, b) => a.sortOrder - b.sortOrder);
        const appLookup = localItems.map((a) => ({
            name: a.name,
            value: a.guid,
            iconUrl: a.iconUrl,
        }));
        const selectedAppGuid = localItems[0].guid;
        return [NetworkState.Success, appLookup, selectedAppGuid];
    };
    const fetchLanguages = async (aaApi) => {
        const [localNetworkState, localItemList] = await useApiCall(aaApi.language.readAll);
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, [], ''];
        }
        const localItems = localItemList.filter((app) => app.isVisible);
        localItems.sort((a, b) => a.sortOrder - b.sortOrder);
        const enLangHack = {
            guid: "hack",
            name: "English",
            languageCode: "en",
            countryCode: "gb",
            sortOrder: 0,
            isVisible: true,
        };
        const langLookup = [enLangHack, ...localItems].map((a) => ({
            name: a.name,
            value: a.languageCode,
            iconUrl: `${getAssistantAppsImgRoot()}/assets/img/countryCode/${a.countryCode.toLocaleUpperCase()}.svg`,
        }));
        const selectedLangCode = enLangHack.languageCode;
        return [NetworkState.Success, langLookup, selectedLangCode];
    };

    /* src\module\appsNotices\appsNoticeListSearch.svelte generated by Svelte v3.58.0 */
    const file$k = "src\\module\\appsNotices\\appsNoticeListSearch.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (22:2) {#if appLookup.length > 0}
    function create_if_block_4(ctx) {
    	let previous_key = /*selectedAppGuid*/ ctx[1];
    	let key_block_anchor;
    	let key_block = create_key_block_3$1(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedAppGuid*/ 2 && safe_not_equal(previous_key, previous_key = /*selectedAppGuid*/ ctx[1])) {
    				key_block.d(1);
    				key_block = create_key_block_3$1(ctx);
    				key_block.c();
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(22:2) {#if appLookup.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (29:10) {#each appLookup as opt}
    function create_each_block_1$2(ctx) {
    	let assistant_apps_dropdown_option;
    	let assistant_apps_dropdown_option_name_value;
    	let assistant_apps_dropdown_option_value_value;
    	let assistant_apps_dropdown_option_iconurl_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*opt*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown_option = element("assistant-apps-dropdown-option");
    			set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value = /*opt*/ ctx[8].name);
    			set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value = /*opt*/ ctx[8].value);
    			set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[8].iconUrl);
    			add_location(assistant_apps_dropdown_option, file$k, 30, 12, 1006);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown_option, anchor);

    			if (!mounted) {
    				dispose = listen_dev(assistant_apps_dropdown_option, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_name_value !== (assistant_apps_dropdown_option_name_value = /*opt*/ ctx[8].name)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value);
    			}

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_value_value !== (assistant_apps_dropdown_option_value_value = /*opt*/ ctx[8].value)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value);
    			}

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_iconurl_value !== (assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[8].iconUrl)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_dropdown_option);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(29:10) {#each appLookup as opt}",
    		ctx
    	});

    	return block;
    }

    // (23:4) {#key selectedAppGuid}
    function create_key_block_3$1(ctx) {
    	let assistant_apps_dropdown;
    	let div;
    	let each_value_1 = /*appLookup*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown = element("assistant-apps-dropdown");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "slot", "options");
    			add_location(div, file$k, 27, 8, 866);
    			set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedAppGuid*/ ctx[1]);
    			set_custom_element_data(assistant_apps_dropdown, "options", /*appLookup*/ ctx[0]);
    			add_location(assistant_apps_dropdown, file$k, 23, 6, 753);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown, anchor);
    			append_dev(assistant_apps_dropdown, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*appLookup, selectedAppGuid*/ 3) {
    				each_value_1 = /*appLookup*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*selectedAppGuid*/ 2) {
    				set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedAppGuid*/ ctx[1]);
    			}

    			if (dirty & /*appLookup*/ 1) {
    				set_custom_element_data(assistant_apps_dropdown, "options", /*appLookup*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_dropdown);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_3$1.name,
    		type: "key",
    		source: "(23:4) {#key selectedAppGuid}",
    		ctx
    	});

    	return block;
    }

    // (44:2) {#if langLookup.length > 0}
    function create_if_block_3$1(ctx) {
    	let previous_key = /*selectedLangCode*/ ctx[3];
    	let key_block_anchor;
    	let key_block = create_key_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedLangCode*/ 8 && safe_not_equal(previous_key, previous_key = /*selectedLangCode*/ ctx[3])) {
    				key_block.d(1);
    				key_block = create_key_block_2$1(ctx);
    				key_block.c();
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(44:2) {#if langLookup.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (51:10) {#each langLookup as opt}
    function create_each_block$8(ctx) {
    	let assistant_apps_dropdown_option;
    	let assistant_apps_dropdown_option_name_value;
    	let assistant_apps_dropdown_option_value_value;
    	let assistant_apps_dropdown_option_iconurl_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*opt*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown_option = element("assistant-apps-dropdown-option");
    			set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value = /*opt*/ ctx[8].name);
    			set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value = /*opt*/ ctx[8].value);
    			set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[8].iconUrl);
    			add_location(assistant_apps_dropdown_option, file$k, 52, 12, 1665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown_option, anchor);

    			if (!mounted) {
    				dispose = listen_dev(assistant_apps_dropdown_option, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*langLookup*/ 4 && assistant_apps_dropdown_option_name_value !== (assistant_apps_dropdown_option_name_value = /*opt*/ ctx[8].name)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value);
    			}

    			if (dirty & /*langLookup*/ 4 && assistant_apps_dropdown_option_value_value !== (assistant_apps_dropdown_option_value_value = /*opt*/ ctx[8].value)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value);
    			}

    			if (dirty & /*langLookup*/ 4 && assistant_apps_dropdown_option_iconurl_value !== (assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[8].iconUrl)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_dropdown_option);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(51:10) {#each langLookup as opt}",
    		ctx
    	});

    	return block;
    }

    // (45:4) {#key selectedLangCode}
    function create_key_block_2$1(ctx) {
    	let assistant_apps_dropdown;
    	let div;
    	let each_value = /*langLookup*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown = element("assistant-apps-dropdown");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "slot", "options");
    			add_location(div, file$k, 49, 8, 1524);
    			set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedLangCode*/ ctx[3]);
    			set_custom_element_data(assistant_apps_dropdown, "options", /*langLookup*/ ctx[2]);
    			add_location(assistant_apps_dropdown, file$k, 45, 6, 1409);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown, anchor);
    			append_dev(assistant_apps_dropdown, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*langLookup, selectedLangCode*/ 12) {
    				each_value = /*langLookup*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selectedLangCode*/ 8) {
    				set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedLangCode*/ ctx[3]);
    			}

    			if (dirty & /*langLookup*/ 4) {
    				set_custom_element_data(assistant_apps_dropdown, "options", /*langLookup*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_dropdown);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_2$1.name,
    		type: "key",
    		source: "(45:4) {#key selectedLangCode}",
    		ctx
    	});

    	return block;
    }

    // (68:4) {#if $$slots.loading != null}
    function create_if_block_2$4(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$k, 67, 33, 2094);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(68:4) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (69:4) {#if $$slots.error != null}
    function create_if_block_1$7(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$k, 68, 31, 2170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(69:4) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (73:10) {#if selectedAppGuid.length > 0 && selectedLangCode.length > 0}
    function create_if_block$a(ctx) {
    	let assistant_apps_app_notice_list;

    	const block = {
    		c: function create() {
    			assistant_apps_app_notice_list = element("assistant-apps-app-notice-list");
    			set_custom_element_data(assistant_apps_app_notice_list, "appguid", /*selectedAppGuid*/ ctx[1]);
    			set_custom_element_data(assistant_apps_app_notice_list, "langcode", /*selectedLangCode*/ ctx[3]);
    			add_location(assistant_apps_app_notice_list, file$k, 73, 12, 2386);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_app_notice_list, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedAppGuid*/ 2) {
    				set_custom_element_data(assistant_apps_app_notice_list, "appguid", /*selectedAppGuid*/ ctx[1]);
    			}

    			if (dirty & /*selectedLangCode*/ 8) {
    				set_custom_element_data(assistant_apps_app_notice_list, "langcode", /*selectedLangCode*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_app_notice_list);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(73:10) {#if selectedAppGuid.length > 0 && selectedLangCode.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (72:8) {#key selectedLangCode}
    function create_key_block_1$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*selectedAppGuid*/ ctx[1].length > 0 && /*selectedLangCode*/ ctx[3].length > 0 && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*selectedAppGuid*/ ctx[1].length > 0 && /*selectedLangCode*/ ctx[3].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_1$1.name,
    		type: "key",
    		source: "(72:8) {#key selectedLangCode}",
    		ctx
    	});

    	return block;
    }

    // (71:6) {#key selectedAppGuid}
    function create_key_block$1(ctx) {
    	let previous_key = /*selectedLangCode*/ ctx[3];
    	let key_block_anchor;
    	let key_block = create_key_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedLangCode*/ 8 && safe_not_equal(previous_key, previous_key = /*selectedLangCode*/ ctx[3])) {
    				key_block.d(1);
    				key_block = create_key_block_1$1(ctx);
    				key_block.c();
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block$1.name,
    		type: "key",
    		source: "(71:6) {#key selectedAppGuid}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let div1;
    	let t0;
    	let t1;
    	let assistant_apps_loading;
    	let t2;
    	let t3;
    	let div0;
    	let previous_key = /*selectedAppGuid*/ ctx[1];
    	let if_block0 = /*appLookup*/ ctx[0].length > 0 && create_if_block_4(ctx);
    	let if_block1 = /*langLookup*/ ctx[2].length > 0 && create_if_block_3$1(ctx);
    	let if_block2 = /*$$slots*/ ctx[5].loading != null && create_if_block_2$4(ctx);
    	let if_block3 = /*$$slots*/ ctx[5].error != null && create_if_block_1$7(ctx);
    	let key_block = create_key_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			assistant_apps_loading = element("assistant-apps-loading");
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			div0 = element("div");
    			key_block.c();
    			this.c = noop$1;
    			attr_dev(div0, "slot", "loaded");
    			add_location(div0, file$k, 69, 4, 2215);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[4]);
    			add_location(assistant_apps_loading, file$k, 66, 2, 2007);
    			add_location(div1, file$k, 20, 0, 682);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, assistant_apps_loading);
    			if (if_block2) if_block2.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t2);
    			if (if_block3) if_block3.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t3);
    			append_dev(assistant_apps_loading, div0);
    			key_block.m(div0, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*appLookup*/ ctx[0].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*langLookup*/ ctx[2].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3$1(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$$slots*/ ctx[5].loading != null) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_2$4(ctx);
    					if_block2.c();
    					if_block2.m(assistant_apps_loading, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$$slots*/ ctx[5].error != null) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_1$7(ctx);
    					if_block3.c();
    					if_block3.m(assistant_apps_loading, t3);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*selectedAppGuid*/ 2 && safe_not_equal(previous_key, previous_key = /*selectedAppGuid*/ ctx[1])) {
    				key_block.d(1);
    				key_block = create_key_block$1(ctx);
    				key_block.c();
    				key_block.m(div0, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}

    			if (dirty & /*networkState*/ 16) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[4]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-app-notice-list-search', slots, []);
    	const $$slots = compute_slots(slots);
    	let appLookup = [];
    	let selectedAppGuid = "";
    	let langLookup = [];
    	let selectedLangCode = "";
    	let networkState = NetworkState.Loading;

    	onMount(async () => {
    		const initState = await init$7();
    		$$invalidate(4, networkState = initState.networkState);
    		$$invalidate(0, appLookup = initState.appLookup);
    		$$invalidate(1, selectedAppGuid = initState.selectedAppGuid);
    		$$invalidate(2, langLookup = initState.langLookup);
    		$$invalidate(3, selectedLangCode = initState.selectedLangCode);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-app-notice-list-search> was created with unknown prop '${key}'`);
    	});

    	const click_handler = opt => {
    		$$invalidate(1, selectedAppGuid = opt.value);
    	};

    	const click_handler_1 = opt => {
    		$$invalidate(3, selectedLangCode = opt.value);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		init: init$7,
    		NetworkState,
    		appLookup,
    		selectedAppGuid,
    		langLookup,
    		selectedLangCode,
    		networkState
    	});

    	$$self.$inject_state = $$props => {
    		if ('appLookup' in $$props) $$invalidate(0, appLookup = $$props.appLookup);
    		if ('selectedAppGuid' in $$props) $$invalidate(1, selectedAppGuid = $$props.selectedAppGuid);
    		if ('langLookup' in $$props) $$invalidate(2, langLookup = $$props.langLookup);
    		if ('selectedLangCode' in $$props) $$invalidate(3, selectedLangCode = $$props.selectedLangCode);
    		if ('networkState' in $$props) $$invalidate(4, networkState = $$props.networkState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		appLookup,
    		selectedAppGuid,
    		langLookup,
    		selectedLangCode,
    		networkState,
    		$$slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class AppsNoticeListSearch extends SvelteElement {
    	constructor(options) {
    		super();

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$k,
    			create_fragment$k,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-app-notice-list-search", AppsNoticeListSearch);

    const init$6 = async (appguid, langcode) => {
        const aaApi = getAssistantAppsService();
        const [localNetworkState, localItemList] = await useApiCall(() => aaApi.appNotice.readAll(appguid, langcode));
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, []];
        }
        const localItems = localItemList.filter((app) => app.isVisible);
        localItems.sort((a, b) => a.sortOrder - b.sortOrder);
        return [localNetworkState, localItems];
    };

    /* src\module\appsNotices\appsNoticeList.svelte generated by Svelte v3.58.0 */
    const file$j = "src\\module\\appsNotices\\appsNoticeList.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (18:2) {#if $$slots.loading != null}
    function create_if_block_2$3(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$j, 17, 31, 616);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(18:2) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (19:2) {#if $$slots.error != null}
    function create_if_block_1$6(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$j, 18, 29, 690);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(19:2) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {:else}
    function create_else_block$3(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "No Notices to display";
    			add_location(h3, file$j, 29, 6, 1049);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(29:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:4) {#if items.length > 0}
    function create_if_block$9(ctx) {
    	let each_1_anchor;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(21:4) {#if items.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (22:6) {#each items as item}
    function create_each_block$7(ctx) {
    	let assistant_apps_app_notice_tile;
    	let assistant_apps_app_notice_tile_name_value;
    	let assistant_apps_app_notice_tile_subtitle_value;
    	let assistant_apps_app_notice_tile_iconurl_value;

    	const block = {
    		c: function create() {
    			assistant_apps_app_notice_tile = element("assistant-apps-app-notice-tile");
    			set_custom_element_data(assistant_apps_app_notice_tile, "name", assistant_apps_app_notice_tile_name_value = /*item*/ ctx[5].name);
    			set_custom_element_data(assistant_apps_app_notice_tile, "subtitle", assistant_apps_app_notice_tile_subtitle_value = /*item*/ ctx[5].subtitle);
    			set_custom_element_data(assistant_apps_app_notice_tile, "iconurl", assistant_apps_app_notice_tile_iconurl_value = /*item*/ ctx[5].iconUrl);
    			add_location(assistant_apps_app_notice_tile, file$j, 22, 8, 872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_app_notice_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && assistant_apps_app_notice_tile_name_value !== (assistant_apps_app_notice_tile_name_value = /*item*/ ctx[5].name)) {
    				set_custom_element_data(assistant_apps_app_notice_tile, "name", assistant_apps_app_notice_tile_name_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_app_notice_tile_subtitle_value !== (assistant_apps_app_notice_tile_subtitle_value = /*item*/ ctx[5].subtitle)) {
    				set_custom_element_data(assistant_apps_app_notice_tile, "subtitle", assistant_apps_app_notice_tile_subtitle_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_app_notice_tile_iconurl_value !== (assistant_apps_app_notice_tile_iconurl_value = /*item*/ ctx[5].iconUrl)) {
    				set_custom_element_data(assistant_apps_app_notice_tile, "iconurl", assistant_apps_app_notice_tile_iconurl_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_app_notice_tile);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(22:6) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let assistant_apps_loading;
    	let t0;
    	let t1;
    	let div;
    	let if_block0 = /*$$slots*/ ctx[2].loading != null && create_if_block_2$3(ctx);
    	let if_block1 = /*$$slots*/ ctx[2].error != null && create_if_block_1$6(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*items*/ ctx[1].length > 0) return create_if_block$9;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block2 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			assistant_apps_loading = element("assistant-apps-loading");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div = element("div");
    			if_block2.c();
    			this.c = noop$1;
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container app-notice-container noselect");
    			add_location(div, file$j, 19, 2, 733);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$j, 16, 0, 531);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_loading, anchor);
    			if (if_block0) if_block0.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t0);
    			if (if_block1) if_block1.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div);
    			if_block2.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$$slots*/ ctx[2].loading != null) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$3(ctx);
    					if_block0.c();
    					if_block0.m(assistant_apps_loading, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$$slots*/ ctx[2].error != null) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1$6(ctx);
    					if_block1.c();
    					if_block1.m(assistant_apps_loading, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div, null);
    				}
    			}

    			if (dirty & /*networkState*/ 1) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_loading);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-app-notice-list', slots, []);
    	const $$slots = compute_slots(slots);
    	let { appguid = "" } = $$props;
    	let { langcode = "" } = $$props;
    	let networkState = NetworkState.Loading;
    	let items = [];

    	onMount(async () => {
    		const [localNetworkState, localItemList] = await init$6(appguid, langcode);
    		$$invalidate(1, items = [...localItemList]);
    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = ['appguid', 'langcode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-app-notice-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('appguid' in $$props) $$invalidate(3, appguid = $$props.appguid);
    		if ('langcode' in $$props) $$invalidate(4, langcode = $$props.langcode);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		init: init$6,
    		appguid,
    		langcode,
    		networkState,
    		items
    	});

    	$$self.$inject_state = $$props => {
    		if ('appguid' in $$props) $$invalidate(3, appguid = $$props.appguid);
    		if ('langcode' in $$props) $$invalidate(4, langcode = $$props.langcode);
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, items, $$slots, appguid, langcode];
    }

    class AppsNoticeList extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{--aa-grid-columns:2;display:flex;flex-wrap:wrap;margin-bottom:3em;justify-content:center;column-gap:1em;row-gap:1em}.grid-container>*{width:calc(100% / var(--aa-grid-columns, 3) - 0.33em * var(--aa-grid-columns, 3))}@media only screen and (max-width: 1300px){.grid-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.grid-container{--aa-grid-columns:1}}.app-notice-container{--aa-grid-columns:3}@media only screen and (max-width: 1300px){.app-notice-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.app-notice-container{--aa-grid-columns:1}}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$j,
    			create_fragment$j,
    			safe_not_equal,
    			{ appguid: 3, langcode: 4 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["appguid", "langcode"];
    	}

    	get appguid() {
    		return this.$$.ctx[3];
    	}

    	set appguid(appguid) {
    		this.$$set({ appguid });
    		flush();
    	}

    	get langcode() {
    		return this.$$.ctx[4];
    	}

    	set langcode(langcode) {
    		this.$$set({ langcode });
    		flush();
    	}
    }

    customElements.define("assistant-apps-app-notice-list", AppsNoticeList);

    /* src\module\appsNotices\appsNoticeTile.svelte generated by Svelte v3.58.0 */

    const file$i = "src\\module\\appsNotices\\appsNoticeTile.svelte";

    function create_fragment$i(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h2;
    	let span0;
    	let t1;
    	let br;
    	let span1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			span0 = element("span");
    			t1 = text(/*name*/ ctx[0]);
    			br = element("br");
    			span1 = element("span");
    			t2 = text(/*subtitle*/ ctx[1]);
    			this.c = noop$1;
    			if (!src_url_equal(img.src, img_src_value = /*iconurl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			attr_dev(img, "class", "app-img noselect");
    			add_location(img, file$i, 16, 2, 498);
    			add_location(span0, file$i, 19, 6, 615);
    			add_location(br, file$i, 19, 25, 634);
    			add_location(span1, file$i, 19, 31, 640);
    			attr_dev(h2, "class", "app-name");
    			add_location(h2, file$i, 18, 4, 586);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$i, 17, 2, 559);
    			attr_dev(div1, "class", "aa-app");
    			add_location(div1, file$i, 15, 0, 474);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, span0);
    			append_dev(span0, t1);
    			append_dev(h2, br);
    			append_dev(h2, span1);
    			append_dev(span1, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*iconurl*/ 4 && !src_url_equal(img.src, img_src_value = /*iconurl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(img, "alt", /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    			if (dirty & /*subtitle*/ 2) set_data_dev(t2, /*subtitle*/ ctx[1]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-app-notice-tile', slots, []);
    	let { name = "" } = $$props;
    	let { subtitle = "" } = $$props;
    	let { iconurl = "" } = $$props;
    	const writable_props = ['name', 'subtitle', 'iconurl'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-app-notice-tile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('subtitle' in $$props) $$invalidate(1, subtitle = $$props.subtitle);
    		if ('iconurl' in $$props) $$invalidate(2, iconurl = $$props.iconurl);
    	};

    	$$self.$capture_state = () => ({ name, subtitle, iconurl });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('subtitle' in $$props) $$invalidate(1, subtitle = $$props.subtitle);
    		if ('iconurl' in $$props) $$invalidate(2, iconurl = $$props.iconurl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, subtitle, iconurl];
    }

    class AppsNoticeTile extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.aa-app{display:flex;height:var(--assistantapps-app-notice-tile-height, 75px);background-color:var(--assistantapps-app-notice-background-colour, rgba(108, 117, 125, 0.4745098039));border-radius:5px;text-decoration:none;overflow:hidden}.aa-app img.app-img{height:var(--assistantapps-app-notice-tile-height, 75px);width:var(--assistantapps-app-notice-tile-height, 75px);object-fit:cover;margin:0}.aa-app .content{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-app-notice-text-colour, white);padding-left:1em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-app .content .app-name{margin:0;max-width:100%;line-height:110%;overflow-wrap:break-word;white-space:pre-wrap;word-wrap:break-word}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$i,
    			create_fragment$i,
    			safe_not_equal,
    			{ name: 0, subtitle: 1, iconurl: 2 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["name", "subtitle", "iconurl"];
    	}

    	get name() {
    		return this.$$.ctx[0];
    	}

    	set name(name) {
    		this.$$set({ name });
    		flush();
    	}

    	get subtitle() {
    		return this.$$.ctx[1];
    	}

    	set subtitle(subtitle) {
    		this.$$set({ subtitle });
    		flush();
    	}

    	get iconurl() {
    		return this.$$.ctx[2];
    	}

    	set iconurl(iconurl) {
    		this.$$set({ iconurl });
    		flush();
    	}
    }

    customElements.define("assistant-apps-app-notice-tile", AppsNoticeTile);

    const init$5 = async () => {
        const aaApi = getAssistantAppsService();
        const fetchAppsState = await fetchApps$1(aaApi);
        const setPlatformsState = await setPlatforms();
        if (fetchAppsState[0] == NetworkState.Error) {
            return {
                networkState: NetworkState.Error,
                appLookup: [],
                selectedAppGuid: '',
                selectedAppType: '',
                platLookup: [],
                selectedPlatType: '',
            };
        }
        return {
            networkState: NetworkState.Success,
            appLookup: fetchAppsState[1],
            selectedAppGuid: fetchAppsState[2],
            selectedAppType: fetchAppsState[3],
            platLookup: setPlatformsState[0],
            selectedPlatType: setPlatformsState[1],
        };
    };
    const fetchApps$1 = async (aaApi) => {
        const [localNetworkState, localItemList] = await useApiCall(aaApi.app.readAll);
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, [], '', ''];
        }
        const localItems = localItemList.filter((app) => app.isVisible);
        localItems.sort((a, b) => a.sortOrder - b.sortOrder);
        const appLookup = localItems.map((a) => ({
            name: a.name,
            value: a.guid,
            iconUrl: a.iconUrl,
        }));
        const selectedAppGuid = localItems[0].guid;
        const selectedAppType = "1";
        return [NetworkState.Success, appLookup, selectedAppGuid, selectedAppType];
    };
    const setPlatforms = async () => {
        const imgRoot = getAssistantAppsImgRoot();
        const localPlatLookup = [
            {
                name: "Google Play",
                value: "1",
                iconUrl: `${imgRoot}/assets/img/platform/android.png`,
            },
            {
                name: "Apple App Store",
                value: "2",
                iconUrl: `${imgRoot}/assets/img/platform/iOS.png`,
            },
        ];
        const platLookup = [...localPlatLookup];
        const selectedPlatType = platLookup[0].value;
        return [platLookup, selectedPlatType];
    };

    /* src\module\badge\badgeSelector.svelte generated by Svelte v3.58.0 */
    const file$h = "src\\module\\badge\\badgeSelector.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (24:4) {#if appLookup.length > 0}
    function create_if_block_3(ctx) {
    	let previous_key = /*selectedAppGuid*/ ctx[1];
    	let key_block_anchor;
    	let key_block = create_key_block_4(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedAppGuid*/ 2 && safe_not_equal(previous_key, previous_key = /*selectedAppGuid*/ ctx[1])) {
    				key_block.d(1);
    				key_block = create_key_block_4(ctx);
    				key_block.c();
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(24:4) {#if appLookup.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (31:20) {#each appLookup as opt}
    function create_each_block_1$1(ctx) {
    	let assistant_apps_dropdown_option;
    	let assistant_apps_dropdown_option_name_value;
    	let assistant_apps_dropdown_option_value_value;
    	let assistant_apps_dropdown_option_iconurl_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*opt*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown_option = element("assistant-apps-dropdown-option");
    			set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value = /*opt*/ ctx[9].name);
    			set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value = /*opt*/ ctx[9].value);
    			set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[9].iconUrl);
    			add_location(assistant_apps_dropdown_option, file$h, 32, 24, 1136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown_option, anchor);

    			if (!mounted) {
    				dispose = listen_dev(assistant_apps_dropdown_option, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_name_value !== (assistant_apps_dropdown_option_name_value = /*opt*/ ctx[9].name)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value);
    			}

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_value_value !== (assistant_apps_dropdown_option_value_value = /*opt*/ ctx[9].value)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value);
    			}

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_iconurl_value !== (assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[9].iconUrl)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_dropdown_option);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(31:20) {#each appLookup as opt}",
    		ctx
    	});

    	return block;
    }

    // (25:8) {#key selectedAppGuid}
    function create_key_block_4(ctx) {
    	let assistant_apps_dropdown;
    	let div;
    	let each_value_1 = /*appLookup*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown = element("assistant-apps-dropdown");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "slot", "options");
    			add_location(div, file$h, 29, 16, 962);
    			set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedAppGuid*/ ctx[1]);
    			set_custom_element_data(assistant_apps_dropdown, "options", /*appLookup*/ ctx[0]);
    			add_location(assistant_apps_dropdown, file$h, 25, 12, 819);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown, anchor);
    			append_dev(assistant_apps_dropdown, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*appLookup, selectedAppType, selectedAppGuid*/ 7) {
    				each_value_1 = /*appLookup*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*selectedAppGuid*/ 2) {
    				set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedAppGuid*/ ctx[1]);
    			}

    			if (dirty & /*appLookup*/ 1) {
    				set_custom_element_data(assistant_apps_dropdown, "options", /*appLookup*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_dropdown);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_4.name,
    		type: "key",
    		source: "(25:8) {#key selectedAppGuid}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#if platLookup.length > 0}
    function create_if_block_2$2(ctx) {
    	let previous_key = /*selectedPlatType*/ ctx[4];
    	let key_block_anchor;
    	let key_block = create_key_block_3(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedPlatType*/ 16 && safe_not_equal(previous_key, previous_key = /*selectedPlatType*/ ctx[4])) {
    				key_block.d(1);
    				key_block = create_key_block_3(ctx);
    				key_block.c();
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(47:4) {#if platLookup.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (54:20) {#each platLookup as opt}
    function create_each_block$6(ctx) {
    	let assistant_apps_dropdown_option;
    	let assistant_apps_dropdown_option_name_value;
    	let assistant_apps_dropdown_option_value_value;
    	let assistant_apps_dropdown_option_iconurl_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*opt*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown_option = element("assistant-apps-dropdown-option");
    			set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value = /*opt*/ ctx[9].name);
    			set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value = /*opt*/ ctx[9].value);
    			set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[9].iconUrl);
    			add_location(assistant_apps_dropdown_option, file$h, 55, 24, 2061);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown_option, anchor);

    			if (!mounted) {
    				dispose = listen_dev(assistant_apps_dropdown_option, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*platLookup*/ 8 && assistant_apps_dropdown_option_name_value !== (assistant_apps_dropdown_option_name_value = /*opt*/ ctx[9].name)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value);
    			}

    			if (dirty & /*platLookup*/ 8 && assistant_apps_dropdown_option_value_value !== (assistant_apps_dropdown_option_value_value = /*opt*/ ctx[9].value)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value);
    			}

    			if (dirty & /*platLookup*/ 8 && assistant_apps_dropdown_option_iconurl_value !== (assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[9].iconUrl)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_dropdown_option);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(54:20) {#each platLookup as opt}",
    		ctx
    	});

    	return block;
    }

    // (48:8) {#key selectedPlatType}
    function create_key_block_3(ctx) {
    	let assistant_apps_dropdown;
    	let div;
    	let each_value = /*platLookup*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown = element("assistant-apps-dropdown");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "slot", "options");
    			add_location(div, file$h, 52, 16, 1886);
    			set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedPlatType*/ ctx[4]);
    			set_custom_element_data(assistant_apps_dropdown, "options", /*platLookup*/ ctx[3]);
    			add_location(assistant_apps_dropdown, file$h, 48, 12, 1741);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown, anchor);
    			append_dev(assistant_apps_dropdown, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*platLookup, selectedPlatType*/ 24) {
    				each_value = /*platLookup*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selectedPlatType*/ 16) {
    				set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedPlatType*/ ctx[4]);
    			}

    			if (dirty & /*platLookup*/ 8) {
    				set_custom_element_data(assistant_apps_dropdown, "options", /*platLookup*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_dropdown);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_3.name,
    		type: "key",
    		source: "(48:8) {#key selectedPlatType}",
    		ctx
    	});

    	return block;
    }

    // (71:8) {#if $$slots.loading != null}
    function create_if_block_1$5(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$h, 70, 37, 2624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(71:8) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (72:8) {#if $$slots.error != null}
    function create_if_block$8(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$h, 71, 35, 2704);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(72:8) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (75:16) {#key selectedPlatType}
    function create_key_block_2(ctx) {
    	let assistant_apps_review_badge;

    	const block = {
    		c: function create() {
    			assistant_apps_review_badge = element("assistant-apps-review-badge");
    			set_custom_element_data(assistant_apps_review_badge, "apptype", /*selectedAppType*/ ctx[2]);
    			set_custom_element_data(assistant_apps_review_badge, "platform", /*selectedPlatType*/ ctx[4]);
    			add_location(assistant_apps_review_badge, file$h, 75, 20, 2871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_review_badge, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedAppType*/ 4) {
    				set_custom_element_data(assistant_apps_review_badge, "apptype", /*selectedAppType*/ ctx[2]);
    			}

    			if (dirty & /*selectedPlatType*/ 16) {
    				set_custom_element_data(assistant_apps_review_badge, "platform", /*selectedPlatType*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_review_badge);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_2.name,
    		type: "key",
    		source: "(75:16) {#key selectedPlatType}",
    		ctx
    	});

    	return block;
    }

    // (74:12) {#key selectedAppType}
    function create_key_block_1(ctx) {
    	let previous_key = /*selectedPlatType*/ ctx[4];
    	let key_block_anchor;
    	let key_block = create_key_block_2(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedPlatType*/ 16 && safe_not_equal(previous_key, previous_key = /*selectedPlatType*/ ctx[4])) {
    				key_block.d(1);
    				key_block = create_key_block_2(ctx);
    				key_block.c();
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_1.name,
    		type: "key",
    		source: "(74:12) {#key selectedAppType}",
    		ctx
    	});

    	return block;
    }

    // (83:12) {#key selectedAppGuid}
    function create_key_block(ctx) {
    	let assistant_apps_version_badge;

    	const block = {
    		c: function create() {
    			assistant_apps_version_badge = element("assistant-apps-version-badge");
    			set_custom_element_data(assistant_apps_version_badge, "appguid", /*selectedAppGuid*/ ctx[1]);
    			add_location(assistant_apps_version_badge, file$h, 83, 16, 3145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_version_badge, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedAppGuid*/ 2) {
    				set_custom_element_data(assistant_apps_version_badge, "appguid", /*selectedAppGuid*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_version_badge);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(83:12) {#key selectedAppGuid}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div1;
    	let t0;
    	let t1;
    	let assistant_apps_loading;
    	let t2;
    	let t3;
    	let div0;
    	let previous_key = /*selectedAppType*/ ctx[2];
    	let t4;
    	let br;
    	let t5;
    	let previous_key_1 = /*selectedAppGuid*/ ctx[1];
    	let if_block0 = /*appLookup*/ ctx[0].length > 0 && create_if_block_3(ctx);
    	let if_block1 = /*platLookup*/ ctx[3].length > 0 && create_if_block_2$2(ctx);
    	let if_block2 = /*$$slots*/ ctx[6].loading != null && create_if_block_1$5(ctx);
    	let if_block3 = /*$$slots*/ ctx[6].error != null && create_if_block$8(ctx);
    	let key_block0 = create_key_block_1(ctx);
    	let key_block1 = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			assistant_apps_loading = element("assistant-apps-loading");
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			div0 = element("div");
    			key_block0.c();
    			t4 = space();
    			br = element("br");
    			t5 = space();
    			key_block1.c();
    			this.c = noop$1;
    			add_location(br, file$h, 81, 12, 3085);
    			attr_dev(div0, "slot", "loaded");
    			add_location(div0, file$h, 72, 8, 2753);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[5]);
    			add_location(assistant_apps_loading, file$h, 69, 4, 2533);
    			add_location(div1, file$h, 22, 0, 736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, assistant_apps_loading);
    			if (if_block2) if_block2.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t2);
    			if (if_block3) if_block3.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t3);
    			append_dev(assistant_apps_loading, div0);
    			key_block0.m(div0, null);
    			append_dev(div0, t4);
    			append_dev(div0, br);
    			append_dev(div0, t5);
    			key_block1.m(div0, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*appLookup*/ ctx[0].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*platLookup*/ ctx[3].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$$slots*/ ctx[6].loading != null) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_1$5(ctx);
    					if_block2.c();
    					if_block2.m(assistant_apps_loading, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$$slots*/ ctx[6].error != null) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block$8(ctx);
    					if_block3.c();
    					if_block3.m(assistant_apps_loading, t3);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*selectedAppType*/ 4 && safe_not_equal(previous_key, previous_key = /*selectedAppType*/ ctx[2])) {
    				key_block0.d(1);
    				key_block0 = create_key_block_1(ctx);
    				key_block0.c();
    				key_block0.m(div0, t4);
    			} else {
    				key_block0.p(ctx, dirty);
    			}

    			if (dirty & /*selectedAppGuid*/ 2 && safe_not_equal(previous_key_1, previous_key_1 = /*selectedAppGuid*/ ctx[1])) {
    				key_block1.d(1);
    				key_block1 = create_key_block(ctx);
    				key_block1.c();
    				key_block1.m(div0, null);
    			} else {
    				key_block1.p(ctx, dirty);
    			}

    			if (dirty & /*networkState*/ 32) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[5]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			key_block0.d(detaching);
    			key_block1.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-badge-selector', slots, []);
    	const $$slots = compute_slots(slots);
    	let appLookup = [];
    	let selectedAppGuid = "";
    	let selectedAppType = "";
    	let platLookup = [];
    	let selectedPlatType = "";
    	let networkState = NetworkState.Loading;

    	onMount(async () => {
    		const initState = await init$5();
    		$$invalidate(5, networkState = initState.networkState);
    		$$invalidate(0, appLookup = initState.appLookup);
    		$$invalidate(1, selectedAppGuid = initState.selectedAppGuid);
    		$$invalidate(2, selectedAppType = initState.selectedAppType);
    		$$invalidate(3, platLookup = initState.platLookup);
    		$$invalidate(4, selectedPlatType = initState.selectedPlatType);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-badge-selector> was created with unknown prop '${key}'`);
    	});

    	const click_handler = opt => {
    		$$invalidate(2, selectedAppType = opt.value);
    		$$invalidate(1, selectedAppGuid = opt.value);
    	};

    	const click_handler_1 = opt => {
    		$$invalidate(4, selectedPlatType = opt.value);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		init: init$5,
    		appLookup,
    		selectedAppGuid,
    		selectedAppType,
    		platLookup,
    		selectedPlatType,
    		networkState
    	});

    	$$self.$inject_state = $$props => {
    		if ('appLookup' in $$props) $$invalidate(0, appLookup = $$props.appLookup);
    		if ('selectedAppGuid' in $$props) $$invalidate(1, selectedAppGuid = $$props.selectedAppGuid);
    		if ('selectedAppType' in $$props) $$invalidate(2, selectedAppType = $$props.selectedAppType);
    		if ('platLookup' in $$props) $$invalidate(3, platLookup = $$props.platLookup);
    		if ('selectedPlatType' in $$props) $$invalidate(4, selectedPlatType = $$props.selectedPlatType);
    		if ('networkState' in $$props) $$invalidate(5, networkState = $$props.networkState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		appLookup,
    		selectedAppGuid,
    		selectedAppType,
    		platLookup,
    		selectedPlatType,
    		networkState,
    		$$slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class BadgeSelector extends SvelteElement {
    	constructor(options) {
    		super();

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$h,
    			create_fragment$h,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-badge-selector", BadgeSelector);

    /* src\module\badge\reviewBadge.svelte generated by Svelte v3.58.0 */

    const file$g = "src\\module\\badge\\reviewBadge.svelte";

    function create_fragment$g(ctx) {
    	let object;
    	let img;
    	let img_src_value;
    	let object_data_value;

    	const block = {
    		c: function create() {
    			object = element("object");
    			img = element("img");
    			this.c = noop$1;
    			if (!src_url_equal(img.src, img_src_value = /*fallbackimg*/ ctx[2] ?? `${getAssistantAppsImgRoot()}/assets/img/fallback.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "review-badge");
    			add_location(img, file$g, 13, 2, 407);
    			attr_dev(object, "title", "review-badge");
    			attr_dev(object, "data", object_data_value = `${getAssistantAppsUrl()}/badge/review/${/*apptype*/ ctx[0]}/${/*platform*/ ctx[1]}.svg`);
    			attr_dev(object, "type", "image/jpeg");
    			add_location(object, file$g, 8, 0, 271);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, object, anchor);
    			append_dev(object, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fallbackimg*/ 4 && !src_url_equal(img.src, img_src_value = /*fallbackimg*/ ctx[2] ?? `${getAssistantAppsImgRoot()}/assets/img/fallback.png`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*apptype, platform*/ 3 && object_data_value !== (object_data_value = `${getAssistantAppsUrl()}/badge/review/${/*apptype*/ ctx[0]}/${/*platform*/ ctx[1]}.svg`)) {
    				attr_dev(object, "data", object_data_value);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(object);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-review-badge', slots, []);
    	let { apptype = "" } = $$props;
    	let { platform = "" } = $$props;
    	let { fallbackimg = "" } = $$props;
    	const writable_props = ['apptype', 'platform', 'fallbackimg'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-review-badge> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('apptype' in $$props) $$invalidate(0, apptype = $$props.apptype);
    		if ('platform' in $$props) $$invalidate(1, platform = $$props.platform);
    		if ('fallbackimg' in $$props) $$invalidate(2, fallbackimg = $$props.fallbackimg);
    	};

    	$$self.$capture_state = () => ({
    		getAssistantAppsImgRoot,
    		getAssistantAppsUrl,
    		apptype,
    		platform,
    		fallbackimg
    	});

    	$$self.$inject_state = $$props => {
    		if ('apptype' in $$props) $$invalidate(0, apptype = $$props.apptype);
    		if ('platform' in $$props) $$invalidate(1, platform = $$props.platform);
    		if ('fallbackimg' in $$props) $$invalidate(2, fallbackimg = $$props.fallbackimg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [apptype, platform, fallbackimg];
    }

    class ReviewBadge extends SvelteElement {
    	constructor(options) {
    		super();

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$g,
    			create_fragment$g,
    			safe_not_equal,
    			{ apptype: 0, platform: 1, fallbackimg: 2 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["apptype", "platform", "fallbackimg"];
    	}

    	get apptype() {
    		return this.$$.ctx[0];
    	}

    	set apptype(apptype) {
    		this.$$set({ apptype });
    		flush();
    	}

    	get platform() {
    		return this.$$.ctx[1];
    	}

    	set platform(platform) {
    		this.$$set({ platform });
    		flush();
    	}

    	get fallbackimg() {
    		return this.$$.ctx[2];
    	}

    	set fallbackimg(fallbackimg) {
    		this.$$set({ fallbackimg });
    		flush();
    	}
    }

    customElements.define("assistant-apps-review-badge", ReviewBadge);

    /* src\module\badge\versionBadge.svelte generated by Svelte v3.58.0 */

    const file$f = "src\\module\\badge\\versionBadge.svelte";

    function create_fragment$f(ctx) {
    	let object;
    	let img;
    	let img_src_value;
    	let object_data_value;

    	const block = {
    		c: function create() {
    			object = element("object");
    			img = element("img");
    			this.c = noop$1;
    			if (!src_url_equal(img.src, img_src_value = /*fallbackimg*/ ctx[1] ?? `${getAssistantAppsImgRoot()}/assets/img/fallback.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "version-badge");
    			add_location(img, file$f, 12, 2, 370);
    			attr_dev(object, "title", "review-badge");
    			attr_dev(object, "data", object_data_value = `${getAssistantAppsUrl()}/badge/version/${/*appguid*/ ctx[0]}.svg`);
    			attr_dev(object, "type", "image/jpeg");
    			add_location(object, file$f, 7, 0, 245);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, object, anchor);
    			append_dev(object, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fallbackimg*/ 2 && !src_url_equal(img.src, img_src_value = /*fallbackimg*/ ctx[1] ?? `${getAssistantAppsImgRoot()}/assets/img/fallback.png`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*appguid*/ 1 && object_data_value !== (object_data_value = `${getAssistantAppsUrl()}/badge/version/${/*appguid*/ ctx[0]}.svg`)) {
    				attr_dev(object, "data", object_data_value);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(object);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-version-badge', slots, []);
    	let { appguid = "" } = $$props;
    	let { fallbackimg = "" } = $$props;
    	const writable_props = ['appguid', 'fallbackimg'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-version-badge> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('appguid' in $$props) $$invalidate(0, appguid = $$props.appguid);
    		if ('fallbackimg' in $$props) $$invalidate(1, fallbackimg = $$props.fallbackimg);
    	};

    	$$self.$capture_state = () => ({
    		getAssistantAppsImgRoot,
    		getAssistantAppsUrl,
    		appguid,
    		fallbackimg
    	});

    	$$self.$inject_state = $$props => {
    		if ('appguid' in $$props) $$invalidate(0, appguid = $$props.appguid);
    		if ('fallbackimg' in $$props) $$invalidate(1, fallbackimg = $$props.fallbackimg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [appguid, fallbackimg];
    }

    class VersionBadge extends SvelteElement {
    	constructor(options) {
    		super();

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$f,
    			create_fragment$f,
    			safe_not_equal,
    			{ appguid: 0, fallbackimg: 1 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["appguid", "fallbackimg"];
    	}

    	get appguid() {
    		return this.$$.ctx[0];
    	}

    	set appguid(appguid) {
    		this.$$set({ appguid });
    		flush();
    	}

    	get fallbackimg() {
    		return this.$$.ctx[1];
    	}

    	set fallbackimg(fallbackimg) {
    		this.$$set({ fallbackimg });
    		flush();
    	}
    }

    customElements.define("assistant-apps-version-badge", VersionBadge);

    const donationOptions = [
        {
            title: 'Patreon',
            url: 'https://www.patreon.com/AssistantApps',
            image: 'Patreon.png',
        },
        {
            title: 'Github Sponsors',
            url: 'https://github.com/sponsors/AssistantNMS',
            image: 'GithubSponsors.png',
        },
        {
            title: 'PayPal',
            url: 'https://paypal.me/KurtLourens',
            image: 'Paypal.png',
        },
        {
            title: 'Buy me a Coffee',
            url: 'https://www.buymeacoffee.com/kurt',
            image: 'BuyMeACoffee.png',
        },
        {
            title: 'Open Collective',
            url: 'https://opencollective.com/assistantnms',
            image: 'OpenCollective.png',
        },
        {
            title: 'Ko-fi',
            url: 'https://ko-fi.com/AssistantNMS',
            image: 'KoFi.png',
        },
        {
            title: 'Brave',
            url: 'https://brave.com/nms136',
            image: 'BraveRewards.png',
        },
    ];

    /* src\module\donationOptions\donationOptions.svelte generated by Svelte v3.58.0 */
    const file$e = "src\\module\\donationOptions\\donationOptions.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (8:2) {#each donationOptions as donationOption}
    function create_each_block$5(ctx) {
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let h2;
    	let t1_value = /*donationOption*/ ctx[0].title + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = `${getAssistantAppsImgRoot()}/assets/img/donation/${/*donationOption*/ ctx[0].image}`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*donationOption*/ ctx[0].title);
    			attr_dev(img, "class", "donation-img noselect");
    			add_location(img, file$e, 15, 6, 523);
    			attr_dev(h2, "class", "app-name");
    			add_location(h2, file$e, 23, 8, 763);
    			attr_dev(div, "class", "content");
    			add_location(div, file$e, 22, 6, 732);
    			attr_dev(a, "href", /*donationOption*/ ctx[0].url);
    			attr_dev(a, "class", "aa-donation-option");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noreferrer noopener");
    			attr_dev(a, "title", /*donationOption*/ ctx[0].title);
    			add_location(a, file$e, 8, 4, 347);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    			append_dev(a, t0);
    			append_dev(a, div);
    			append_dev(div, h2);
    			append_dev(h2, t1);
    			append_dev(a, t2);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(8:2) {#each donationOptions as donationOption}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div;
    	let each_value = donationOptions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop$1;
    			attr_dev(div, "class", "grid-container donation-options-container");
    			add_location(div, file$e, 6, 0, 241);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*donationOptions, getAssistantAppsImgRoot*/ 0) {
    				each_value = donationOptions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-donation-option-list', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-donation-option-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ donationOptions, getAssistantAppsImgRoot });
    	return [];
    }

    class DonationOptions extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{--aa-grid-columns:2;display:flex;flex-wrap:wrap;margin-bottom:3em;justify-content:center;column-gap:1em;row-gap:1em}.grid-container>*{width:calc(100% / var(--aa-grid-columns, 3) - 0.33em * var(--aa-grid-columns, 3))}@media only screen and (max-width: 1300px){.grid-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.grid-container{--aa-grid-columns:1}}.donation-options-container{--aa-grid-columns:3}@media only screen and (max-width: 1300px){.donation-options-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.donation-options-container{--aa-grid-columns:1}}.aa-donation-option{display:flex;height:var(--assistantapps-donation-tile-height, 75px);background-color:var(--assistantapps-donation-background-colour, rgba(108, 117, 125, 0.4745098039));border-radius:5px;text-decoration:none;overflow:hidden}.aa-donation-option img.donation-img{height:calc(var(--assistantapps-donation-tile-height, 75px) - 20px);width:calc(var(--assistantapps-donation-tile-height, 75px) - 20px);object-fit:cover;margin:0;padding:10px}.aa-donation-option .content{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-donation-text-colour, white);padding-left:1em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-donation-option .content .app-name{margin:0;max-width:100%;line-height:110%;overflow-wrap:break-word;white-space:pre-wrap;word-wrap:break-word}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$e,
    			create_fragment$e,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-donation-option-list", DonationOptions);

    const init$4 = async () => {
        const aaApi = getAssistantAppsService();
        const [localNetworkState, localItemList] = await useApiCall(aaApi.donation.readAll);
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, []];
        }
        return [localNetworkState, localItemList];
    };

    /* src\module\donators\donatorsList.svelte generated by Svelte v3.58.0 */
    const file$d = "src\\module\\donators\\donatorsList.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (17:2) {#if $$slots.loading != null}
    function create_if_block_1$4(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$d, 16, 31, 621);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(17:2) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (18:2) {#if $$slots.error != null}
    function create_if_block$7(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$d, 17, 29, 695);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(18:2) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (20:4) {#each items as item}
    function create_each_block$4(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let h2;
    	let t1_value = /*item*/ ctx[3].username + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			if (!src_url_equal(img.src, img_src_value = `${getAssistantAppsImgRoot()}/assets/img/donation/${/*item*/ ctx[3].type}.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[3].type.toString());
    			attr_dev(img, "class", "donation-img noselect");
    			add_location(img, file$d, 21, 8, 869);
    			attr_dev(h2, "class", "app-name");
    			add_location(h2, file$d, 29, 10, 1118);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$d, 28, 8, 1085);
    			attr_dev(div1, "class", "aa-donation");
    			add_location(div1, file$d, 20, 6, 834);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && !src_url_equal(img.src, img_src_value = `${getAssistantAppsImgRoot()}/assets/img/donation/${/*item*/ ctx[3].type}.png`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*items*/ 2 && img_alt_value !== (img_alt_value = /*item*/ ctx[3].type.toString())) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*items*/ 2 && t1_value !== (t1_value = /*item*/ ctx[3].username + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(20:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let assistant_apps_loading;
    	let t0;
    	let t1;
    	let div2;
    	let t2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t3;
    	let div0;
    	let h2;
    	let if_block0 = /*$$slots*/ ctx[2].loading != null && create_if_block_1$4(ctx);
    	let if_block1 = /*$$slots*/ ctx[2].error != null && create_if_block$7(ctx);
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_loading = element("assistant-apps-loading");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			img = element("img");
    			t3 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Many more supporters";
    			this.c = noop$1;
    			if (!src_url_equal(img.src, img_src_value = `${getAssistantAppsImgRoot()}/assets/img/donation/GithubSponsors.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "other");
    			attr_dev(img, "class", "donation-img noselect");
    			add_location(img, file$d, 34, 6, 1241);
    			attr_dev(h2, "class", "app-name");
    			add_location(h2, file$d, 40, 8, 1439);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$d, 39, 6, 1408);
    			attr_dev(div1, "class", "aa-donation");
    			add_location(div1, file$d, 33, 4, 1208);
    			attr_dev(div2, "slot", "loaded");
    			attr_dev(div2, "class", "grid-container donation-container");
    			add_location(div2, file$d, 18, 2, 738);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$d, 15, 0, 536);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_loading, anchor);
    			if (if_block0) if_block0.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t0);
    			if (if_block1) if_block1.m(assistant_apps_loading, null);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$$slots*/ ctx[2].loading != null) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$4(ctx);
    					if_block0.c();
    					if_block0.m(assistant_apps_loading, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$$slots*/ ctx[2].error != null) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$7(ctx);
    					if_block1.c();
    					if_block1.m(assistant_apps_loading, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*items, getAssistantAppsImgRoot*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*networkState*/ 1) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_loading);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-donators-list', slots, []);
    	const $$slots = compute_slots(slots);
    	let networkState = NetworkState.Loading;
    	let items = [];

    	onMount(async () => {
    		const [localNetworkState, localItemList] = await init$4();
    		$$invalidate(1, items = [...localItemList]);
    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-donators-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		getAssistantAppsImgRoot,
    		init: init$4,
    		networkState,
    		items
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, items, $$slots];
    }

    class DonatorsList extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{--aa-grid-columns:2;display:flex;flex-wrap:wrap;margin-bottom:3em;justify-content:center;column-gap:1em;row-gap:1em}.grid-container>*{width:calc(100% / var(--aa-grid-columns, 3) - 0.33em * var(--aa-grid-columns, 3))}@media only screen and (max-width: 1300px){.grid-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.grid-container{--aa-grid-columns:1}}.donation-container{--aa-grid-columns:3}@media only screen and (max-width: 1300px){.donation-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.donation-container{--aa-grid-columns:1}}.aa-donation{display:flex;height:var(--assistantapps-donation-tile-height, 75px);background-color:var(--assistantapps-donation-background-colour, rgba(108, 117, 125, 0.4745098039));border-radius:5px;text-decoration:none;overflow:hidden}.aa-donation img.donation-img{height:calc(var(--assistantapps-donation-tile-height, 75px) - 20px);width:calc(var(--assistantapps-donation-tile-height, 75px) - 20px);object-fit:cover;margin:0;padding:10px}.aa-donation .content{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-donation-text-colour, white);padding-left:1em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-donation .content .app-name{margin:0;max-width:100%;line-height:110%;overflow-wrap:break-word;white-space:pre-wrap;word-wrap:break-word}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$d,
    			create_fragment$d,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-donators-list", DonatorsList);

    const init$3 = async () => {
        const aaApi = getAssistantAppsService();
        const [localNetworkState, localItemList] = await useApiCall(aaApi.patreon.readAll);
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, []];
        }
        const items = [
            ...localItemList.map((p) => (Object.assign(Object.assign({}, p), { url: undefined }))),
            {
                name: "Join Patreon",
                imageUrl: "https://cdn.assistantapps.com/patreon.png",
                thumbnailUrl: "https://cdn.assistantapps.com/patreon.png",
                url: "https://patreon.com/AssistantApps",
            },
        ];
        return [localNetworkState, items];
    };

    /* src\module\patreon\patreonList.svelte generated by Svelte v3.58.0 */
    const file$c = "src\\module\\patreon\\patreonList.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (19:4) {#each items as patron}
    function create_each_block$3(ctx) {
    	let assistant_apps_patron_tile;
    	let assistant_apps_patron_tile_url_value;
    	let assistant_apps_patron_tile_name_value;
    	let assistant_apps_patron_tile_imageurl_value;

    	const block = {
    		c: function create() {
    			assistant_apps_patron_tile = element("assistant-apps-patron-tile");
    			set_custom_element_data(assistant_apps_patron_tile, "url", assistant_apps_patron_tile_url_value = /*patron*/ ctx[2].url ?? "https://assistantapps.com");
    			set_custom_element_data(assistant_apps_patron_tile, "name", assistant_apps_patron_tile_name_value = /*patron*/ ctx[2].name);
    			set_custom_element_data(assistant_apps_patron_tile, "imageurl", assistant_apps_patron_tile_imageurl_value = /*patron*/ ctx[2].imageUrl);
    			add_location(assistant_apps_patron_tile, file$c, 19, 6, 697);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_patron_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && assistant_apps_patron_tile_url_value !== (assistant_apps_patron_tile_url_value = /*patron*/ ctx[2].url ?? "https://assistantapps.com")) {
    				set_custom_element_data(assistant_apps_patron_tile, "url", assistant_apps_patron_tile_url_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_patron_tile_name_value !== (assistant_apps_patron_tile_name_value = /*patron*/ ctx[2].name)) {
    				set_custom_element_data(assistant_apps_patron_tile, "name", assistant_apps_patron_tile_name_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_patron_tile_imageurl_value !== (assistant_apps_patron_tile_imageurl_value = /*patron*/ ctx[2].imageUrl)) {
    				set_custom_element_data(assistant_apps_patron_tile, "imageurl", assistant_apps_patron_tile_imageurl_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_patron_tile);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(19:4) {#each items as patron}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let assistant_apps_loading;
    	let slot0;
    	let t0;
    	let slot1;
    	let t1;
    	let div;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_loading = element("assistant-apps-loading");
    			slot0 = element("slot");
    			t0 = space();
    			slot1 = element("slot");
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop$1;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$c, 15, 2, 511);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$c, 16, 2, 553);
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container patreon-container noselect");
    			add_location(div, file$c, 17, 2, 591);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$c, 14, 0, 455);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_loading, anchor);
    			append_dev(assistant_apps_loading, slot0);
    			append_dev(assistant_apps_loading, t0);
    			append_dev(assistant_apps_loading, slot1);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*networkState*/ 1) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_loading);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-patreon-list', slots, []);
    	let networkState = NetworkState.Loading;
    	let items = [];

    	onMount(async () => {
    		const [localNetworkState, localItemList] = await init$3();
    		$$invalidate(1, items = [...localItemList]);
    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-patreon-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		init: init$3,
    		networkState,
    		items
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, items];
    }

    class PatreonList extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{--aa-grid-columns:2;display:flex;flex-wrap:wrap;margin-bottom:3em;justify-content:center;column-gap:1em;row-gap:1em}.grid-container>*{width:calc(100% / var(--aa-grid-columns, 3) - 0.33em * var(--aa-grid-columns, 3))}@media only screen and (max-width: 1300px){.grid-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.grid-container{--aa-grid-columns:1}}.patreon-container{--aa-grid-columns:3}@media only screen and (max-width: 1300px){.patreon-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.patreon-container{--aa-grid-columns:1}}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$c,
    			create_fragment$c,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-patreon-list", PatreonList);

    /* src\module\patreon\patronTile.svelte generated by Svelte v3.58.0 */

    const file$b = "src\\module\\patreon\\patronTile.svelte";

    // (13:0) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(/*name*/ ctx[1]);
    			if (!src_url_equal(img.src, img_src_value = /*imageurl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[1]);
    			attr_dev(img, "class", "patron-img noselect");
    			add_location(img, file$b, 14, 4, 400);
    			attr_dev(h2, "class", "patron-name");
    			add_location(h2, file$b, 15, 4, 467);
    			attr_dev(div, "class", "patron");
    			add_location(div, file$b, 13, 2, 374);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h2);
    			append_dev(h2, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageurl*/ 4 && !src_url_equal(img.src, img_src_value = /*imageurl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 2) {
    				attr_dev(img, "alt", /*name*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 2) set_data_dev(t1, /*name*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(13:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:0) {#if url != null}
    function create_if_block$6(ctx) {
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t1;

    	const block = {
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(/*name*/ ctx[1]);
    			if (!src_url_equal(img.src, img_src_value = /*imageurl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[1]);
    			attr_dev(img, "class", "patron-img noselect");
    			add_location(img, file$b, 9, 4, 251);
    			attr_dev(h2, "class", "patron-name");
    			add_location(h2, file$b, 10, 4, 318);
    			attr_dev(a, "href", /*url*/ ctx[0]);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			attr_dev(a, "class", "patron");
    			add_location(a, file$b, 8, 2, 174);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    			append_dev(a, t0);
    			append_dev(a, h2);
    			append_dev(h2, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageurl*/ 4 && !src_url_equal(img.src, img_src_value = /*imageurl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 2) {
    				attr_dev(img, "alt", /*name*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 2) set_data_dev(t1, /*name*/ ctx[1]);

    			if (dirty & /*url*/ 1) {
    				attr_dev(a, "href", /*url*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(8:0) {#if url != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*url*/ ctx[0] != null) return create_if_block$6;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    			this.c = noop$1;
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-patron-tile', slots, []);
    	let { url } = $$props;
    	let { name = "" } = $$props;
    	let { imageurl = "" } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (url === undefined && !('url' in $$props || $$self.$$.bound[$$self.$$.props['url']])) {
    			console.warn("<assistant-apps-patron-tile> was created without expected prop 'url'");
    		}
    	});

    	const writable_props = ['url', 'name', 'imageurl'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-patron-tile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('url' in $$props) $$invalidate(0, url = $$props.url);
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('imageurl' in $$props) $$invalidate(2, imageurl = $$props.imageurl);
    	};

    	$$self.$capture_state = () => ({ url, name, imageurl });

    	$$self.$inject_state = $$props => {
    		if ('url' in $$props) $$invalidate(0, url = $$props.url);
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('imageurl' in $$props) $$invalidate(2, imageurl = $$props.imageurl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [url, name, imageurl];
    }

    class PatronTile extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.patron{display:flex;background-color:var(--assistantapps-patron-background-colour, #6c757d);border-radius:5px;text-decoration:none;overflow:hidden}.patron img.patron-img{height:100px;width:100px;object-fit:cover;margin:0}.patron .patron-name{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-patron-text-colour, white);padding-left:0.5em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$b,
    			create_fragment$b,
    			safe_not_equal,
    			{ url: 0, name: 1, imageurl: 2 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["url", "name", "imageurl"];
    	}

    	get url() {
    		return this.$$.ctx[0];
    	}

    	set url(url) {
    		this.$$set({ url });
    		flush();
    	}

    	get name() {
    		return this.$$.ctx[1];
    	}

    	set name(name) {
    		this.$$set({ name });
    		flush();
    	}

    	get imageurl() {
    		return this.$$.ctx[2];
    	}

    	set imageurl(imageurl) {
    		this.$$set({ imageurl });
    		flush();
    	}
    }

    customElements.define("assistant-apps-patron-tile", PatronTile);

    const init$2 = async () => {
        const aaApi = getAssistantAppsService();
        const [localNetworkState, localItemList] = await useApiCall(aaApi.teamMember.readAll);
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, []];
        }
        return [localNetworkState, localItemList];
    };

    /* src\module\team\teamList.svelte generated by Svelte v3.58.0 */
    const file$a = "src\\module\\team\\teamList.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (19:4) {#each items as teamMember}
    function create_each_block$2(ctx) {
    	let assistant_apps_team_tile;
    	let assistant_apps_team_tile_name_value;
    	let assistant_apps_team_tile_role_value;
    	let assistant_apps_team_tile_imageurl_value;
    	let assistant_apps_team_tile_linkname_value;
    	let assistant_apps_team_tile_linkurl_value;

    	const block = {
    		c: function create() {
    			assistant_apps_team_tile = element("assistant-apps-team-tile");
    			set_custom_element_data(assistant_apps_team_tile, "name", assistant_apps_team_tile_name_value = /*teamMember*/ ctx[2].name);
    			set_custom_element_data(assistant_apps_team_tile, "role", assistant_apps_team_tile_role_value = /*teamMember*/ ctx[2].role);
    			set_custom_element_data(assistant_apps_team_tile, "imageurl", assistant_apps_team_tile_imageurl_value = /*teamMember*/ ctx[2].imageUrl);
    			set_custom_element_data(assistant_apps_team_tile, "linkname", assistant_apps_team_tile_linkname_value = /*teamMember*/ ctx[2].linkName);
    			set_custom_element_data(assistant_apps_team_tile, "linkurl", assistant_apps_team_tile_linkurl_value = /*teamMember*/ ctx[2].linkUrl);
    			add_location(assistant_apps_team_tile, file$a, 19, 6, 685);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_team_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && assistant_apps_team_tile_name_value !== (assistant_apps_team_tile_name_value = /*teamMember*/ ctx[2].name)) {
    				set_custom_element_data(assistant_apps_team_tile, "name", assistant_apps_team_tile_name_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_team_tile_role_value !== (assistant_apps_team_tile_role_value = /*teamMember*/ ctx[2].role)) {
    				set_custom_element_data(assistant_apps_team_tile, "role", assistant_apps_team_tile_role_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_team_tile_imageurl_value !== (assistant_apps_team_tile_imageurl_value = /*teamMember*/ ctx[2].imageUrl)) {
    				set_custom_element_data(assistant_apps_team_tile, "imageurl", assistant_apps_team_tile_imageurl_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_team_tile_linkname_value !== (assistant_apps_team_tile_linkname_value = /*teamMember*/ ctx[2].linkName)) {
    				set_custom_element_data(assistant_apps_team_tile, "linkname", assistant_apps_team_tile_linkname_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_team_tile_linkurl_value !== (assistant_apps_team_tile_linkurl_value = /*teamMember*/ ctx[2].linkUrl)) {
    				set_custom_element_data(assistant_apps_team_tile, "linkurl", assistant_apps_team_tile_linkurl_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_team_tile);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(19:4) {#each items as teamMember}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let assistant_apps_loading;
    	let slot0;
    	let t0;
    	let slot1;
    	let t1;
    	let div;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_loading = element("assistant-apps-loading");
    			slot0 = element("slot");
    			t0 = space();
    			slot1 = element("slot");
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop$1;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$a, 15, 2, 505);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$a, 16, 2, 547);
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "team-members-container noselect");
    			add_location(div, file$a, 17, 2, 585);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$a, 14, 0, 449);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_loading, anchor);
    			append_dev(assistant_apps_loading, slot0);
    			append_dev(assistant_apps_loading, t0);
    			append_dev(assistant_apps_loading, slot1);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*networkState*/ 1) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_loading);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-team-list', slots, []);
    	let networkState = NetworkState.Loading;
    	let items = [];

    	onMount(async () => {
    		const [localNetworkState, localItemList] = await init$2();
    		$$invalidate(1, items = [...localItemList]);
    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-team-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		init: init$2,
    		networkState,
    		items
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, items];
    }

    class TeamList extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}assistant-apps-team-tile{display:block;margin-bottom:1em;border-bottom:1px solid var(--assistantapps-team-member-background-colour, rgba(255, 255, 255, 0.1))}assistant-apps-team-tile:last-child{border-bottom:none}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$a,
    			create_fragment$a,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-team-list", TeamList);

    /* src\module\team\teamTile.svelte generated by Svelte v3.58.0 */

    const file$9 = "src\\module\\team\\teamTile.svelte";

    // (15:4) {#if linkurl != null && linkname != null}
    function create_if_block$5(ctx) {
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*linkname*/ ctx[3]);
    			attr_dev(a, "href", /*linkurl*/ ctx[4]);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			add_location(a, file$9, 15, 6, 488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*linkname*/ 8) set_data_dev(t, /*linkname*/ ctx[3]);

    			if (dirty & /*linkurl*/ 16) {
    				attr_dev(a, "href", /*linkurl*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(15:4) {#if linkurl != null && linkname != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h3;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let if_block = /*linkurl*/ ctx[4] != null && /*linkname*/ ctx[3] != null && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*role*/ ctx[1]);
    			t4 = space();
    			if (if_block) if_block.c();
    			this.c = noop$1;
    			if (!src_url_equal(img.src, img_src_value = /*imageurl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			attr_dev(img, "class", "team-member-img noselect");
    			add_location(img, file$9, 10, 2, 239);
    			attr_dev(h3, "class", "team-member-name");
    			add_location(h3, file$9, 12, 4, 349);
    			attr_dev(p, "class", "team-member-role");
    			add_location(p, file$9, 13, 4, 395);
    			attr_dev(div0, "class", "team-member-contents");
    			add_location(div0, file$9, 11, 2, 309);
    			attr_dev(div1, "class", "team-member");
    			add_location(div1, file$9, 9, 0, 210);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
    			append_dev(div0, t4);
    			if (if_block) if_block.m(div0, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imageurl*/ 4 && !src_url_equal(img.src, img_src_value = /*imageurl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(img, "alt", /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    			if (dirty & /*role*/ 2) set_data_dev(t3, /*role*/ ctx[1]);

    			if (/*linkurl*/ ctx[4] != null && /*linkname*/ ctx[3] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-team-tile', slots, []);
    	let { name = "" } = $$props;
    	let { role = "" } = $$props;
    	let { imageurl = "" } = $$props;
    	let { linkname = "" } = $$props;
    	let { linkurl = "" } = $$props;
    	const writable_props = ['name', 'role', 'imageurl', 'linkname', 'linkurl'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-team-tile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('role' in $$props) $$invalidate(1, role = $$props.role);
    		if ('imageurl' in $$props) $$invalidate(2, imageurl = $$props.imageurl);
    		if ('linkname' in $$props) $$invalidate(3, linkname = $$props.linkname);
    		if ('linkurl' in $$props) $$invalidate(4, linkurl = $$props.linkurl);
    	};

    	$$self.$capture_state = () => ({ name, role, imageurl, linkname, linkurl });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('role' in $$props) $$invalidate(1, role = $$props.role);
    		if ('imageurl' in $$props) $$invalidate(2, imageurl = $$props.imageurl);
    		if ('linkname' in $$props) $$invalidate(3, linkname = $$props.linkname);
    		if ('linkurl' in $$props) $$invalidate(4, linkurl = $$props.linkurl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, role, imageurl, linkname, linkurl];
    }

    class TeamTile extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.team-member{display:flex;padding-bottom:1em}.team-member img.team-member-img{width:var(--assistantapps-team-member-tile-size, 75px);height:var(--assistantapps-team-member-tile-size, 75px);border-radius:5px}.team-member .team-member-contents{display:flex;flex-direction:column;justify-content:center;padding-left:1em}.team-member .team-member-name,.team-member .team-member-role{margin:0;padding:0;color:var(--assistantapps-team-member-text-colour, #f0f0f0)}.team-member a{margin:0;padding:0;color:var(--assistantapps-team-member-link-text-colour, #0000ee)}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$9,
    			create_fragment$9,
    			safe_not_equal,
    			{
    				name: 0,
    				role: 1,
    				imageurl: 2,
    				linkname: 3,
    				linkurl: 4
    			},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["name", "role", "imageurl", "linkname", "linkurl"];
    	}

    	get name() {
    		return this.$$.ctx[0];
    	}

    	set name(name) {
    		this.$$set({ name });
    		flush();
    	}

    	get role() {
    		return this.$$.ctx[1];
    	}

    	set role(role) {
    		this.$$set({ role });
    		flush();
    	}

    	get imageurl() {
    		return this.$$.ctx[2];
    	}

    	set imageurl(imageurl) {
    		this.$$set({ imageurl });
    		flush();
    	}

    	get linkname() {
    		return this.$$.ctx[3];
    	}

    	set linkname(linkname) {
    		this.$$set({ linkname });
    		flush();
    	}

    	get linkurl() {
    		return this.$$.ctx[4];
    	}

    	set linkurl(linkurl) {
    		this.$$set({ linkurl });
    		flush();
    	}
    }

    customElements.define("assistant-apps-team-tile", TeamTile);

    const init$1 = async () => {
        const aaApi = getAssistantAppsService();
        const [localNetworkState, localItemList] = await useApiCall(() => aaApi.translationStat.readAll({ apps: [], languages: [] }));
        if (localNetworkState == NetworkState.Error ||
            localItemList == null ||
            localItemList.length < 1) {
            return [localNetworkState, []];
        }
        return [localNetworkState, localItemList];
    };

    /* src\module\translatorLeaderboard\leaderboardList.svelte generated by Svelte v3.58.0 */
    const file$8 = "src\\module\\translatorLeaderboard\\leaderboardList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (19:4) {#each items as leaderBoardItem}
    function create_each_block$1(ctx) {
    	let assistant_apps_translation_leaderboard_tile;
    	let assistant_apps_translation_leaderboard_tile_username_value;
    	let assistant_apps_translation_leaderboard_tile_profileimageurl_value;
    	let assistant_apps_translation_leaderboard_tile_numtranslations_value;
    	let assistant_apps_translation_leaderboard_tile_numvotesgiven_value;
    	let assistant_apps_translation_leaderboard_tile_numvotesreceived_value;
    	let assistant_apps_translation_leaderboard_tile_total_value;

    	const block = {
    		c: function create() {
    			assistant_apps_translation_leaderboard_tile = element("assistant-apps-translation-leaderboard-tile");
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "username", assistant_apps_translation_leaderboard_tile_username_value = /*leaderBoardItem*/ ctx[2].username);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "profileimageurl", assistant_apps_translation_leaderboard_tile_profileimageurl_value = /*leaderBoardItem*/ ctx[2].profileImageUrl);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numtranslations", assistant_apps_translation_leaderboard_tile_numtranslations_value = /*leaderBoardItem*/ ctx[2].numTranslations);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesgiven", assistant_apps_translation_leaderboard_tile_numvotesgiven_value = /*leaderBoardItem*/ ctx[2].numVotesGiven);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesreceived", assistant_apps_translation_leaderboard_tile_numvotesreceived_value = /*leaderBoardItem*/ ctx[2].numVotesReceived);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "total", assistant_apps_translation_leaderboard_tile_total_value = /*leaderBoardItem*/ ctx[2].total);
    			add_location(assistant_apps_translation_leaderboard_tile, file$8, 19, 6, 725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_translation_leaderboard_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && assistant_apps_translation_leaderboard_tile_username_value !== (assistant_apps_translation_leaderboard_tile_username_value = /*leaderBoardItem*/ ctx[2].username)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "username", assistant_apps_translation_leaderboard_tile_username_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_translation_leaderboard_tile_profileimageurl_value !== (assistant_apps_translation_leaderboard_tile_profileimageurl_value = /*leaderBoardItem*/ ctx[2].profileImageUrl)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "profileimageurl", assistant_apps_translation_leaderboard_tile_profileimageurl_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_translation_leaderboard_tile_numtranslations_value !== (assistant_apps_translation_leaderboard_tile_numtranslations_value = /*leaderBoardItem*/ ctx[2].numTranslations)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numtranslations", assistant_apps_translation_leaderboard_tile_numtranslations_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_translation_leaderboard_tile_numvotesgiven_value !== (assistant_apps_translation_leaderboard_tile_numvotesgiven_value = /*leaderBoardItem*/ ctx[2].numVotesGiven)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesgiven", assistant_apps_translation_leaderboard_tile_numvotesgiven_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_translation_leaderboard_tile_numvotesreceived_value !== (assistant_apps_translation_leaderboard_tile_numvotesreceived_value = /*leaderBoardItem*/ ctx[2].numVotesReceived)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesreceived", assistant_apps_translation_leaderboard_tile_numvotesreceived_value);
    			}

    			if (dirty & /*items*/ 2 && assistant_apps_translation_leaderboard_tile_total_value !== (assistant_apps_translation_leaderboard_tile_total_value = /*leaderBoardItem*/ ctx[2].total)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "total", assistant_apps_translation_leaderboard_tile_total_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_translation_leaderboard_tile);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(19:4) {#each items as leaderBoardItem}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let assistant_apps_loading;
    	let slot0;
    	let t0;
    	let slot1;
    	let t1;
    	let div;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_loading = element("assistant-apps-loading");
    			slot0 = element("slot");
    			t0 = space();
    			slot1 = element("slot");
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop$1;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$8, 15, 2, 526);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$8, 16, 2, 568);
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container leaderboard-container noselect");
    			add_location(div, file$8, 17, 2, 606);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$8, 14, 0, 470);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_loading, anchor);
    			append_dev(assistant_apps_loading, slot0);
    			append_dev(assistant_apps_loading, t0);
    			append_dev(assistant_apps_loading, slot1);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*networkState*/ 1) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_loading);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-translation-leaderboard', slots, []);
    	let networkState = NetworkState.Loading;
    	let items = [];

    	onMount(async () => {
    		const [localNetworkState, localItemList] = await init$1();
    		$$invalidate(1, items = [...localItemList]);
    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-translation-leaderboard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		init: init$1,
    		networkState,
    		items
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, items];
    }

    class LeaderboardList extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{--aa-grid-columns:2;display:flex;flex-wrap:wrap;margin-bottom:3em;justify-content:center;column-gap:1em;row-gap:1em}.grid-container>*{width:calc(100% / var(--aa-grid-columns, 3) - 0.33em * var(--aa-grid-columns, 3))}@media only screen and (max-width: 1300px){.grid-container{--aa-grid-columns:2}}@media only screen and (max-width: 800px){.grid-container{--aa-grid-columns:1}}.leaderboard-container{--aa-grid-columns:var(--aa-grid-leaderboard-columns, 3)}@media only screen and (max-width: 1300px){.leaderboard-container{--aa-grid-columns:var(--aa-grid-leaderboard-columns, 2)}}@media only screen and (max-width: 800px){.leaderboard-container{--aa-grid-columns:var(--aa-grid-leaderboard-columns, 1)}}@media only screen and (max-width: 500px){.leaderboard-container{--aa-grid-columns:var(--aa-grid-leaderboard-columns, 1)}}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$8,
    			create_fragment$8,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-translation-leaderboard", LeaderboardList);

    /* src\module\translatorLeaderboard\leaderboardTile.svelte generated by Svelte v3.58.0 */
    const file$7 = "src\\module\\translatorLeaderboard\\leaderboardTile.svelte";

    // (25:6) {#if numtranslations > 0}
    function create_if_block_2$1(ctx) {
    	let assistant_apps_tooltip;
    	let span;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			assistant_apps_tooltip = element("assistant-apps-tooltip");
    			span = element("span");
    			t0 = text("🌐 ");
    			t1 = text(/*numtranslations*/ ctx[2]);
    			attr_dev(span, "class", "stat");
    			add_location(span, file$7, 26, 10, 976);
    			set_custom_element_data(assistant_apps_tooltip, "tooltiptext", "Number of translations submitted");
    			add_location(assistant_apps_tooltip, file$7, 25, 8, 893);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_tooltip, anchor);
    			append_dev(assistant_apps_tooltip, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numtranslations*/ 4) set_data_dev(t1, /*numtranslations*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_tooltip);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(25:6) {#if numtranslations > 0}",
    		ctx
    	});

    	return block;
    }

    // (30:6) {#if numvotesgiven > 0}
    function create_if_block_1$3(ctx) {
    	let assistant_apps_tooltip;
    	let span;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			assistant_apps_tooltip = element("assistant-apps-tooltip");
    			span = element("span");
    			t0 = text("✔️ ");
    			t1 = text(/*numvotesgiven*/ ctx[3]);
    			attr_dev(span, "class", "stat");
    			add_location(span, file$7, 33, 10, 1220);
    			set_custom_element_data(assistant_apps_tooltip, "tooltiptext", "Number of votes given to translations");
    			add_location(assistant_apps_tooltip, file$7, 30, 8, 1111);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_tooltip, anchor);
    			append_dev(assistant_apps_tooltip, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numvotesgiven*/ 8) set_data_dev(t1, /*numvotesgiven*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_tooltip);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(30:6) {#if numvotesgiven > 0}",
    		ctx
    	});

    	return block;
    }

    // (37:6) {#if numvotesreceived > 0}
    function create_if_block$4(ctx) {
    	let assistant_apps_tooltip;
    	let span;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			assistant_apps_tooltip = element("assistant-apps-tooltip");
    			span = element("span");
    			t0 = text("🗳️ ");
    			t1 = text(/*numvotesreceived*/ ctx[4]);
    			attr_dev(span, "class", "stat");
    			add_location(span, file$7, 38, 10, 1431);
    			set_custom_element_data(assistant_apps_tooltip, "tooltiptext", "Number of votes received");
    			add_location(assistant_apps_tooltip, file$7, 37, 8, 1356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_tooltip, anchor);
    			append_dev(assistant_apps_tooltip, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numvotesreceived*/ 16) set_data_dev(t1, /*numvotesreceived*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_tooltip);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(37:6) {#if numvotesreceived > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h2;
    	let t1;
    	let t2;
    	let h4;
    	let t3;
    	let t4;
    	let t5;
    	let h3;
    	let assistant_apps_tooltip;
    	let t6;
    	let t7;
    	let mounted;
    	let dispose;
    	let if_block0 = /*numtranslations*/ ctx[2] > 0 && create_if_block_2$1(ctx);
    	let if_block1 = /*numvotesgiven*/ ctx[3] > 0 && create_if_block_1$3(ctx);
    	let if_block2 = /*numvotesreceived*/ ctx[4] > 0 && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t1 = text(/*username*/ ctx[0]);
    			t2 = space();
    			h4 = element("h4");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			if (if_block2) if_block2.c();
    			t5 = space();
    			h3 = element("h3");
    			assistant_apps_tooltip = element("assistant-apps-tooltip");
    			t6 = text(/*total*/ ctx[5]);
    			t7 = text(" 🏆");
    			this.c = noop$1;
    			if (!src_url_equal(img.src, img_src_value = /*profileimageurl*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*username*/ ctx[0]);
    			attr_dev(img, "class", "leaderboard-item-img");
    			add_location(img, file$7, 14, 4, 570);
    			attr_dev(div0, "class", "leaderboard-item-img-container");
    			add_location(div0, file$7, 13, 2, 520);
    			attr_dev(h2, "class", "leaderboard-item-name");
    			add_location(h2, file$7, 22, 4, 758);
    			attr_dev(h4, "class", "leaderboard-item-numbers");
    			add_location(h4, file$7, 23, 4, 813);
    			attr_dev(div1, "class", "leaderboard-item-contents");
    			add_location(div1, file$7, 21, 2, 713);
    			set_custom_element_data(assistant_apps_tooltip, "tooltiptext", "Total points");
    			add_location(assistant_apps_tooltip, file$7, 44, 4, 1576);
    			attr_dev(h3, "class", "total");
    			add_location(h3, file$7, 43, 2, 1552);
    			attr_dev(div2, "class", "leaderboard-item noselect");
    			add_location(div2, file$7, 12, 0, 477);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, h4);
    			if (if_block0) if_block0.m(h4, null);
    			append_dev(h4, t3);
    			if (if_block1) if_block1.m(h4, null);
    			append_dev(h4, t4);
    			if (if_block2) if_block2.m(h4, null);
    			append_dev(div2, t5);
    			append_dev(div2, h3);
    			append_dev(h3, assistant_apps_tooltip);
    			append_dev(assistant_apps_tooltip, t6);
    			append_dev(assistant_apps_tooltip, t7);

    			if (!mounted) {
    				dispose = listen_dev(img, "error", /*handleError*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*profileimageurl*/ 2 && !src_url_equal(img.src, img_src_value = /*profileimageurl*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*username*/ 1) {
    				attr_dev(img, "alt", /*username*/ ctx[0]);
    			}

    			if (dirty & /*username*/ 1) set_data_dev(t1, /*username*/ ctx[0]);

    			if (/*numtranslations*/ ctx[2] > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(h4, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*numvotesgiven*/ ctx[3] > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					if_block1.m(h4, t4);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*numvotesreceived*/ ctx[4] > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$4(ctx);
    					if_block2.c();
    					if_block2.m(h4, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*total*/ 32) set_data_dev(t6, /*total*/ ctx[5]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-translation-leaderboard-tile', slots, []);
    	let { username = "" } = $$props;
    	let { profileimageurl = "" } = $$props;
    	let { numtranslations = 0 } = $$props;
    	let { numvotesgiven = 0 } = $$props;
    	let { numvotesreceived = 0 } = $$props;
    	let { total = 0 } = $$props;
    	const handleError = ev => ev.target.src = `${getAssistantAppsImgRoot()}/assets/img/translatorFallback.png`;

    	const writable_props = [
    		'username',
    		'profileimageurl',
    		'numtranslations',
    		'numvotesgiven',
    		'numvotesreceived',
    		'total'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-translation-leaderboard-tile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('username' in $$props) $$invalidate(0, username = $$props.username);
    		if ('profileimageurl' in $$props) $$invalidate(1, profileimageurl = $$props.profileimageurl);
    		if ('numtranslations' in $$props) $$invalidate(2, numtranslations = $$props.numtranslations);
    		if ('numvotesgiven' in $$props) $$invalidate(3, numvotesgiven = $$props.numvotesgiven);
    		if ('numvotesreceived' in $$props) $$invalidate(4, numvotesreceived = $$props.numvotesreceived);
    		if ('total' in $$props) $$invalidate(5, total = $$props.total);
    	};

    	$$self.$capture_state = () => ({
    		getAssistantAppsImgRoot,
    		username,
    		profileimageurl,
    		numtranslations,
    		numvotesgiven,
    		numvotesreceived,
    		total,
    		handleError
    	});

    	$$self.$inject_state = $$props => {
    		if ('username' in $$props) $$invalidate(0, username = $$props.username);
    		if ('profileimageurl' in $$props) $$invalidate(1, profileimageurl = $$props.profileimageurl);
    		if ('numtranslations' in $$props) $$invalidate(2, numtranslations = $$props.numtranslations);
    		if ('numvotesgiven' in $$props) $$invalidate(3, numvotesgiven = $$props.numvotesgiven);
    		if ('numvotesreceived' in $$props) $$invalidate(4, numvotesreceived = $$props.numvotesreceived);
    		if ('total' in $$props) $$invalidate(5, total = $$props.total);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		profileimageurl,
    		numtranslations,
    		numvotesgiven,
    		numvotesreceived,
    		total,
    		handleError
    	];
    }

    class LeaderboardTile extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.leaderboard-item{display:flex;border-radius:5px;background-color:var(--assistantapps-leaderboard-item-background-colour, #6c757d);height:var(--assistantapps-leaderboard-tile-size, 100px)}.leaderboard-item .leaderboard-item-img-container{width:var(--assistantapps-leaderboard-tile-size, 100px);height:var(--assistantapps-leaderboard-tile-size, 100px);position:relative}.leaderboard-item .leaderboard-item-img-container img.leaderboard-item-img{width:var(--assistantapps-leaderboard-tile-size, 100px);height:var(--assistantapps-leaderboard-tile-size, 100px);border-top-left-radius:5px;border-bottom-left-radius:5px}.leaderboard-item .leaderboard-item-img-container .total{position:absolute;right:0;bottom:0;margin:0;padding:0.15em 0.15em 0.15em 0.5em;border-radius:1em;color:var(--assistantapps-leaderboard-item-text-colour, #f0f0f0);background-color:var(--assistantapps-leaderboard-item-background-colour, #494e52)}.leaderboard-item .leaderboard-item-contents{flex-grow:3;display:flex;flex-direction:column;justify-content:center;padding-left:1em;width:calc(100% - 200px)}.leaderboard-item .leaderboard-item-name,.leaderboard-item .leaderboard-item-numbers{margin:0;padding:0;color:var(--assistantapps-leaderboard-item-text-colour, #f0f0f0)}.leaderboard-item .leaderboard-item-numbers{padding-top:0.5em;max-width:100%;max-height:50%}.leaderboard-item .leaderboard-item-name{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25em}.leaderboard-item .leaderboard-item-numbers{max-lines:3}.leaderboard-item .leaderboard-item-numbers .stat{display:inline-block;margin-right:0.125em;margin-bottom:0.25em;padding:0.25em 0.5em 0.25em 0.3em;border-radius:1em;background-color:var(--assistantapps-leaderboard-item-background-colour, #494e52)}.leaderboard-item .total{display:flex;flex-grow:1;align-items:center;justify-content:end;padding-right:0.5em;color:var(--assistantapps-leaderboard-item-text-colour, #f0f0f0)}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$7,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				username: 0,
    				profileimageurl: 1,
    				numtranslations: 2,
    				numvotesgiven: 3,
    				numvotesreceived: 4,
    				total: 5
    			},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"username",
    			"profileimageurl",
    			"numtranslations",
    			"numvotesgiven",
    			"numvotesreceived",
    			"total"
    		];
    	}

    	get username() {
    		return this.$$.ctx[0];
    	}

    	set username(username) {
    		this.$$set({ username });
    		flush();
    	}

    	get profileimageurl() {
    		return this.$$.ctx[1];
    	}

    	set profileimageurl(profileimageurl) {
    		this.$$set({ profileimageurl });
    		flush();
    	}

    	get numtranslations() {
    		return this.$$.ctx[2];
    	}

    	set numtranslations(numtranslations) {
    		this.$$set({ numtranslations });
    		flush();
    	}

    	get numvotesgiven() {
    		return this.$$.ctx[3];
    	}

    	set numvotesgiven(numvotesgiven) {
    		this.$$set({ numvotesgiven });
    		flush();
    	}

    	get numvotesreceived() {
    		return this.$$.ctx[4];
    	}

    	set numvotesreceived(numvotesreceived) {
    		this.$$set({ numvotesreceived });
    		flush();
    	}

    	get total() {
    		return this.$$.ctx[5];
    	}

    	set total(total) {
    		this.$$set({ total });
    		flush();
    	}
    }

    customElements.define("assistant-apps-translation-leaderboard-tile", LeaderboardTile);

    const init = async () => {
        const aaApi = getAssistantAppsService();
        const fetchAppsState = await fetchApps(aaApi);
        if (fetchAppsState[0] == NetworkState.Error) {
            return {
                networkState: NetworkState.Error,
                appLookup: [],
                selectedApp: anyObject,
                whatIsNewItems: [],
            };
        }
        const fetchLanguagesState = await fetchWhatIsNewItems(aaApi, fetchAppsState[2]);
        if (fetchLanguagesState[0] == NetworkState.Error) {
            return {
                networkState: NetworkState.Error,
                appLookup: [],
                selectedApp: anyObject,
                whatIsNewItems: [],
            };
        }
        return {
            networkState: NetworkState.Success,
            appLookup: fetchAppsState[1],
            selectedApp: fetchAppsState[2],
            whatIsNewItems: fetchLanguagesState[1],
        };
    };
    const fetchApps = async (aaApi) => {
        const [localNetworkState, localItemList] = await useApiCall(aaApi.app.readAll);
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, [], anyObject];
        }
        const localItems = localItemList.filter((app) => app.isVisible);
        localItems.sort((a, b) => a.sortOrder - b.sortOrder);
        return [NetworkState.Success, localItemList, localItems[0]];
    };
    const fetchWhatIsNewItems = async (aaApi, appSelected) => {
        if (appSelected == null)
            return;
        // selectedApp = appSelected;
        const search = {
            appGuid: appSelected.guid,
            languageCode: null,
            platforms: [],
            page: 1,
        };
        const [localNetworkState, localItemList] = await useApiCall(() => aaApi.version.createSearch(search) // TODO fix once types are updated
        );
        if (localNetworkState == NetworkState.Error) {
            return [localNetworkState, []];
        }
        if (localItemList == null ||
            localItemList.length < 1 // TODO fix once types are updated
        ) {
            return [localNetworkState, []];
        }
        return [localNetworkState, localItemList.value]; // TODO fix once types are updated
    };

    /* src\module\version\versionSearch.svelte generated by Svelte v3.58.0 */
    const file$6 = "src\\module\\version\\versionSearch.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (41:8) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Please Select an App";
    			add_location(p, file$6, 42, 12, 1592);
    			attr_dev(div, "class", "dd-button");
    			add_location(div, file$6, 41, 10, 1555);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(41:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:8) {#if selectedApp != null}
    function create_if_block_1$2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p;
    	let t1_value = /*selectedApp*/ ctx[2].name + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			if (!src_url_equal(img.src, img_src_value = /*selectedApp*/ ctx[2].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*selectedApp*/ ctx[2].name);
    			add_location(img, file$6, 37, 12, 1413);
    			add_location(p, file$6, 38, 12, 1483);
    			attr_dev(div, "class", "dd-button");
    			add_location(div, file$6, 36, 10, 1376);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedApp*/ 4 && !src_url_equal(img.src, img_src_value = /*selectedApp*/ ctx[2].iconUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*selectedApp*/ 4 && img_alt_value !== (img_alt_value = /*selectedApp*/ ctx[2].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*selectedApp*/ 4 && t1_value !== (t1_value = /*selectedApp*/ ctx[2].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(36:8) {#if selectedApp != null}",
    		ctx
    	});

    	return block;
    }

    // (48:10) {#each appLookup as app}
    function create_each_block_1(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p;
    	let t1_value = /*app*/ ctx[9].name + "";
    	let t1;
    	let t2;
    	let li_value_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*app*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*app*/ ctx[9].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*app*/ ctx[9].name);
    			add_location(img, file$6, 54, 14, 2018);
    			add_location(p, file$6, 55, 14, 2074);
    			attr_dev(li, "class", "dd-menu-item");
    			li.value = li_value_value = /*app*/ ctx[9].guid;
    			add_location(li, file$6, 49, 12, 1854);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    			append_dev(li, t0);
    			append_dev(li, p);
    			append_dev(p, t1);
    			append_dev(li, t2);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*appLookup*/ 2 && !src_url_equal(img.src, img_src_value = /*app*/ ctx[9].iconUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*appLookup*/ 2 && img_alt_value !== (img_alt_value = /*app*/ ctx[9].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*appLookup*/ 2 && t1_value !== (t1_value = /*app*/ ctx[9].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*appLookup*/ 2 && li_value_value !== (li_value_value = /*app*/ ctx[9].guid)) {
    				prop_dev(li, "value", li_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(48:10) {#each appLookup as app}",
    		ctx
    	});

    	return block;
    }

    // (63:8) {#each whatIsNewItems ?? [] as whatIsNewItem}
    function create_each_block(ctx) {
    	let assistant_apps_version_search_tile;
    	let assistant_apps_version_search_tile_guid_value;
    	let assistant_apps_version_search_tile_markdown_value;
    	let assistant_apps_version_search_tile_buildname_value;
    	let assistant_apps_version_search_tile_buildnumber_value;
    	let assistant_apps_version_search_tile_platforms_value;
    	let assistant_apps_version_search_tile_activedate_value;

    	const block = {
    		c: function create() {
    			assistant_apps_version_search_tile = element("assistant-apps-version-search-tile");
    			set_custom_element_data(assistant_apps_version_search_tile, "guid", assistant_apps_version_search_tile_guid_value = /*whatIsNewItem*/ ctx[6].guid);
    			set_custom_element_data(assistant_apps_version_search_tile, "markdown", assistant_apps_version_search_tile_markdown_value = /*whatIsNewItem*/ ctx[6].markdown);
    			set_custom_element_data(assistant_apps_version_search_tile, "buildname", assistant_apps_version_search_tile_buildname_value = /*whatIsNewItem*/ ctx[6].buildName);
    			set_custom_element_data(assistant_apps_version_search_tile, "buildnumber", assistant_apps_version_search_tile_buildnumber_value = /*whatIsNewItem*/ ctx[6].buildNumber);
    			set_custom_element_data(assistant_apps_version_search_tile, "platforms", assistant_apps_version_search_tile_platforms_value = /*whatIsNewItem*/ ctx[6].platforms);
    			set_custom_element_data(assistant_apps_version_search_tile, "activedate", assistant_apps_version_search_tile_activedate_value = /*whatIsNewItem*/ ctx[6].activeDate);
    			add_location(assistant_apps_version_search_tile, file$6, 63, 10, 2281);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_version_search_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*whatIsNewItems*/ 8 && assistant_apps_version_search_tile_guid_value !== (assistant_apps_version_search_tile_guid_value = /*whatIsNewItem*/ ctx[6].guid)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "guid", assistant_apps_version_search_tile_guid_value);
    			}

    			if (dirty & /*whatIsNewItems*/ 8 && assistant_apps_version_search_tile_markdown_value !== (assistant_apps_version_search_tile_markdown_value = /*whatIsNewItem*/ ctx[6].markdown)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "markdown", assistant_apps_version_search_tile_markdown_value);
    			}

    			if (dirty & /*whatIsNewItems*/ 8 && assistant_apps_version_search_tile_buildname_value !== (assistant_apps_version_search_tile_buildname_value = /*whatIsNewItem*/ ctx[6].buildName)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "buildname", assistant_apps_version_search_tile_buildname_value);
    			}

    			if (dirty & /*whatIsNewItems*/ 8 && assistant_apps_version_search_tile_buildnumber_value !== (assistant_apps_version_search_tile_buildnumber_value = /*whatIsNewItem*/ ctx[6].buildNumber)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "buildnumber", assistant_apps_version_search_tile_buildnumber_value);
    			}

    			if (dirty & /*whatIsNewItems*/ 8 && assistant_apps_version_search_tile_platforms_value !== (assistant_apps_version_search_tile_platforms_value = /*whatIsNewItem*/ ctx[6].platforms)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "platforms", assistant_apps_version_search_tile_platforms_value);
    			}

    			if (dirty & /*whatIsNewItems*/ 8 && assistant_apps_version_search_tile_activedate_value !== (assistant_apps_version_search_tile_activedate_value = /*whatIsNewItem*/ ctx[6].activeDate)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "activedate", assistant_apps_version_search_tile_activedate_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_version_search_tile);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(63:8) {#each whatIsNewItems ?? [] as whatIsNewItem}",
    		ctx
    	});

    	return block;
    }

    // (73:8) {#if whatIsNewItems == null || whatIsNewItems.length < 1}
    function create_if_block$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No items to display";
    			add_location(p, file$6, 73, 10, 2714);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(73:8) {#if whatIsNewItems == null || whatIsNewItems.length < 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let assistant_apps_loading;
    	let slot0;
    	let t0;
    	let slot1;
    	let t1;
    	let div1;
    	let label;
    	let t2;
    	let input;
    	let t3;
    	let ul;
    	let t4;
    	let div0;
    	let t5;

    	function select_block_type(ctx, dirty) {
    		if (/*selectedApp*/ ctx[2] != null) return create_if_block_1$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let each_value_1 = /*appLookup*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*whatIsNewItems*/ ctx[3] ?? [];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block1 = (/*whatIsNewItems*/ ctx[3] == null || /*whatIsNewItems*/ ctx[3].length < 1) && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			assistant_apps_loading = element("assistant-apps-loading");
    			slot0 = element("slot");
    			t0 = space();
    			slot1 = element("slot");
    			t1 = space();
    			div1 = element("div");
    			label = element("label");
    			if_block0.c();
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			if (if_block1) if_block1.c();
    			this.c = noop$1;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$6, 31, 4, 1168);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$6, 32, 4, 1212);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "dd-input");
    			add_location(input, file$6, 45, 8, 1662);
    			attr_dev(ul, "class", "dd-menu");
    			add_location(ul, file$6, 46, 8, 1714);
    			attr_dev(label, "class", "dropdown");
    			add_location(label, file$6, 34, 6, 1305);
    			attr_dev(div0, "class", "what-is-new-container noselect");
    			add_location(div0, file$6, 61, 6, 2170);
    			attr_dev(div1, "slot", "loaded");
    			attr_dev(div1, "class", "version-container");
    			add_location(div1, file$6, 33, 4, 1252);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$6, 30, 2, 1110);
    			attr_dev(div2, "class", "noselect");
    			add_location(div2, file$6, 29, 0, 1084);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, assistant_apps_loading);
    			append_dev(assistant_apps_loading, slot0);
    			append_dev(assistant_apps_loading, t0);
    			append_dev(assistant_apps_loading, slot1);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div1);
    			append_dev(div1, label);
    			if_block0.m(label, null);
    			append_dev(label, t2);
    			append_dev(label, input);
    			append_dev(label, t3);
    			append_dev(label, ul);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(ul, null);
    				}
    			}

    			append_dev(div1, t4);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(div0, t5);
    			if (if_block1) if_block1.m(div0, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(label, t2);
    				}
    			}

    			if (dirty & /*appLookup, localFetchWhatIsNewItems*/ 18) {
    				each_value_1 = /*appLookup*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*whatIsNewItems*/ 8) {
    				each_value = /*whatIsNewItems*/ ctx[3] ?? [];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, t5);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*whatIsNewItems*/ ctx[3] == null || /*whatIsNewItems*/ ctx[3].length < 1) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*networkState*/ 1) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block0.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-version-search', slots, []);
    	let networkState = NetworkState.Loading;
    	let appLookup = [];
    	let selectedApp;
    	let whatIsNewItems = [];

    	onMount(async () => {
    		const initState = await init();
    		$$invalidate(0, networkState = initState.networkState);
    		$$invalidate(1, appLookup = initState.appLookup);
    		$$invalidate(2, selectedApp = initState.selectedApp);
    		$$invalidate(3, whatIsNewItems = initState.whatIsNewItems);
    	});

    	const localFetchWhatIsNewItems = async appSelected => {
    		const aaApi = getAssistantAppsService();
    		const fetchWhatIsNewState = await fetchWhatIsNewItems(aaApi, appSelected);

    		if (fetchWhatIsNewState[0] == NetworkState.Error) {
    			$$invalidate(0, networkState = NetworkState.Error);
    			return;
    		}

    		$$invalidate(3, whatIsNewItems = fetchWhatIsNewState[1]);
    		$$invalidate(0, networkState = NetworkState.Success);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-version-search> was created with unknown prop '${key}'`);
    	});

    	const click_handler = app => localFetchWhatIsNewItems(app);

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		getAssistantAppsService,
    		fetchWhatIsNewItems,
    		init,
    		networkState,
    		appLookup,
    		selectedApp,
    		whatIsNewItems,
    		localFetchWhatIsNewItems
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('appLookup' in $$props) $$invalidate(1, appLookup = $$props.appLookup);
    		if ('selectedApp' in $$props) $$invalidate(2, selectedApp = $$props.selectedApp);
    		if ('whatIsNewItems' in $$props) $$invalidate(3, whatIsNewItems = $$props.whatIsNewItems);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		networkState,
    		appLookup,
    		selectedApp,
    		whatIsNewItems,
    		localFetchWhatIsNewItems,
    		click_handler
    	];
    }

    class VersionSearch extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.dropdown{display:inline-block;position:relative;margin-bottom:1em;z-index:20}.dd-button{display:flex;border:1px solid gray;border-radius:4px;padding:10px 30px 10px 10px;background-color:var(--assistantapps-version-dropdown-background-colour, rgba(108, 117, 125, 0.4745098039));cursor:pointer;white-space:nowrap}.dd-button:after{content:"";position:absolute;top:50%;right:15px;transform:translateY(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid var(--assistantapps-version-dropdown-background-colour, #6c757d)}.dd-button:hover{background-color:var(--assistantapps-version-dropdown-background-hover-colour, #6c757d)}.dd-button img{width:20px;height:20px;margin-right:0.5em}.dd-button p{display:flex;flex-direction:column;justify-content:center;margin:0;padding:0}.dd-input{display:none}.dd-menu{position:absolute;top:100%;border:1px solid #ccc;border-radius:4px;padding:0;margin:2px 0 0 0;box-shadow:0 0 6px 0 rgba(0, 0, 0, 0.1);background-color:var(--assistantapps-version-dropdown-background-colour, #6c757d);list-style-type:none}.dd-input+.dd-menu{display:none}.dd-input:checked+.dd-menu{display:block}.dd-menu li{padding:10px 20px;cursor:pointer;white-space:nowrap}.dd-menu li:hover{background-color:var(--assistantapps-version-dropdown-background-hover-colour, #7b848b)}.dd-menu li.dd-menu-item{display:flex}.dd-menu li.dd-menu-item img{width:40px;height:40px;margin-right:1em}.dd-menu li.dd-menu-item p{display:flex;flex-direction:column;justify-content:center;margin:0;padding:0}.what-is-new-container{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:1em;row-gap:1em;margin-bottom:3em}@media only screen and (max-width: 1000px){.what-is-new-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 600px){.what-is-new-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$6,
    			create_fragment$6,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("assistant-apps-version-search", VersionSearch);

    const defaultFormat = (date) => {
        return dayjs(date).format('YYYY-MM-DD');
    };

    /* src\module\version\versionSearchTile.svelte generated by Svelte v3.58.0 */
    const file$5 = "src\\module\\version\\versionSearchTile.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let h3;
    	let t0;
    	let t1;
    	let span;
    	let t2_value = defaultFormat(/*activedate*/ ctx[3]) + "";
    	let t2;
    	let t3;
    	let div1;
    	let assistant_apps_markdown;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(/*buildname*/ ctx[2]);
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			assistant_apps_markdown = element("assistant-apps-markdown");
    			this.c = noop$1;
    			attr_dev(h3, "class", "version-name");
    			add_location(h3, file$5, 13, 4, 415);
    			attr_dev(span, "class", "version-date");
    			add_location(span, file$5, 14, 4, 462);
    			attr_dev(div0, "class", "version-header");
    			add_location(div0, file$5, 12, 2, 381);
    			set_custom_element_data(assistant_apps_markdown, "source", /*markdown*/ ctx[1]);
    			add_location(assistant_apps_markdown, file$5, 17, 4, 565);
    			attr_dev(div1, "class", "markdown");
    			add_location(div1, file$5, 16, 2, 537);
    			attr_dev(div2, "class", "version");
    			attr_dev(div2, "data-guid", /*guid*/ ctx[0]);
    			add_location(div2, file$5, 11, 0, 339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(span, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, assistant_apps_markdown);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*buildname*/ 4) set_data_dev(t0, /*buildname*/ ctx[2]);
    			if (dirty & /*activedate*/ 8 && t2_value !== (t2_value = defaultFormat(/*activedate*/ ctx[3]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*markdown*/ 2) {
    				set_custom_element_data(assistant_apps_markdown, "source", /*markdown*/ ctx[1]);
    			}

    			if (dirty & /*guid*/ 1) {
    				attr_dev(div2, "data-guid", /*guid*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-version-search-tile', slots, []);
    	let { guid = "" } = $$props;
    	let { markdown = "" } = $$props;
    	let { buildname = "" } = $$props;
    	let { activedate = null } = $$props;
    	const writable_props = ['guid', 'markdown', 'buildname', 'activedate'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-version-search-tile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('guid' in $$props) $$invalidate(0, guid = $$props.guid);
    		if ('markdown' in $$props) $$invalidate(1, markdown = $$props.markdown);
    		if ('buildname' in $$props) $$invalidate(2, buildname = $$props.buildname);
    		if ('activedate' in $$props) $$invalidate(3, activedate = $$props.activedate);
    	};

    	$$self.$capture_state = () => ({
    		defaultFormat,
    		guid,
    		markdown,
    		buildname,
    		activedate
    	});

    	$$self.$inject_state = $$props => {
    		if ('guid' in $$props) $$invalidate(0, guid = $$props.guid);
    		if ('markdown' in $$props) $$invalidate(1, markdown = $$props.markdown);
    		if ('buildname' in $$props) $$invalidate(2, buildname = $$props.buildname);
    		if ('activedate' in $$props) $$invalidate(3, activedate = $$props.activedate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [guid, markdown, buildname, activedate];
    }

    class VersionSearchTile extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');

    		style.textContent = `*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.version{display:flex;flex-direction:column;position:relative;background-color:var(
      --assistantapps-version-background-colour,
      rgba(122, 122, 122, 0.7)
    );border-radius:5px;overflow:hidden}.version-header .version-date{position:absolute;top:1em;right:1em;color:var(--assistantapps-version-text-colour, white)}.version .version-name{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-version-text-colour, white);padding-left:1em;padding-right:0.5em;margin-bottom:0;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.version .markdown{padding-right:0.5em;margin-bottom:0.5em}.version .markdown,.version .markdown *{color:var(--assistantapps-version-text-colour, white);padding:0 1em}`;

    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$5,
    			create_fragment$5,
    			safe_not_equal,
    			{
    				guid: 0,
    				markdown: 1,
    				buildname: 2,
    				activedate: 3
    			},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["guid", "markdown", "buildname", "activedate"];
    	}

    	get guid() {
    		return this.$$.ctx[0];
    	}

    	set guid(guid) {
    		this.$$set({ guid });
    		flush();
    	}

    	get markdown() {
    		return this.$$.ctx[1];
    	}

    	set markdown(markdown) {
    		this.$$set({ markdown });
    		flush();
    	}

    	get buildname() {
    		return this.$$.ctx[2];
    	}

    	set buildname(buildname) {
    		this.$$set({ buildname });
    		flush();
    	}

    	get activedate() {
    		return this.$$.ctx[3];
    	}

    	set activedate(activedate) {
    		this.$$set({ activedate });
    		flush();
    	}
    }

    customElements.define("assistant-apps-version-search-tile", VersionSearchTile);

    /* src\shared\dropdown.svelte generated by Svelte v3.58.0 */
    const file$4 = "src\\shared\\dropdown.svelte";

    // (25:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Please Select an option";
    			add_location(p, file$4, 26, 6, 752);
    			attr_dev(div, "class", "dd-button");
    			add_location(div, file$4, 25, 4, 721);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(25:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:2) {#if selectedOption != null}
    function create_if_block$2(ctx) {
    	let div;
    	let t0;
    	let p;
    	let t1_value = /*selectedOption*/ ctx[0].name + "";
    	let t1;
    	let if_block = /*selectedOption*/ ctx[0].iconUrl != null && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			add_location(p, file$4, 22, 6, 664);
    			attr_dev(div, "class", "dd-button");
    			add_location(div, file$4, 18, 4, 503);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (/*selectedOption*/ ctx[0].iconUrl != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*selectedOption*/ 1 && t1_value !== (t1_value = /*selectedOption*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(18:2) {#if selectedOption != null}",
    		ctx
    	});

    	return block;
    }

    // (20:6) {#if selectedOption.iconUrl != null}
    function create_if_block_1$1(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*selectedOption*/ ctx[0].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*selectedOption*/ ctx[0].value);
    			add_location(img, file$4, 20, 8, 580);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedOption*/ 1 && !src_url_equal(img.src, img_src_value = /*selectedOption*/ ctx[0].iconUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*selectedOption*/ 1 && img_alt_value !== (img_alt_value = /*selectedOption*/ ctx[0].value)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(20:6) {#if selectedOption.iconUrl != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let label;
    	let t0;
    	let input;
    	let t1;
    	let ul;
    	let slot;
    	let span;
    	let label_data_selectedoption_value;

    	function select_block_type(ctx, dirty) {
    		if (/*selectedOption*/ ctx[0] != null) return create_if_block$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			label = element("label");
    			if_block.c();
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			ul = element("ul");
    			slot = element("slot");
    			span = element("span");
    			span.textContent = "No options";
    			this.c = noop$1;
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "dd-input");
    			add_location(input, file$4, 29, 2, 807);
    			add_location(span, file$4, 32, 6, 908);
    			attr_dev(slot, "name", "options");
    			add_location(slot, file$4, 31, 4, 879);
    			attr_dev(ul, "class", "dd-menu");
    			add_location(ul, file$4, 30, 2, 853);
    			attr_dev(label, "class", "dropdown noselect");
    			attr_dev(label, "data-selectedoption", label_data_selectedoption_value = /*selectedOption*/ ctx[0]?.name ?? "-");
    			add_location(label, file$4, 13, 0, 374);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			if_block.m(label, null);
    			append_dev(label, t0);
    			append_dev(label, input);
    			append_dev(label, t1);
    			append_dev(label, ul);
    			append_dev(ul, slot);
    			append_dev(slot, span);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(label, t0);
    				}
    			}

    			if (dirty & /*selectedOption*/ 1 && label_data_selectedoption_value !== (label_data_selectedoption_value = /*selectedOption*/ ctx[0]?.name ?? "-")) {
    				attr_dev(label, "data-selectedoption", label_data_selectedoption_value);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-dropdown', slots, []);
    	let { options = [] } = $$props;
    	let { selectedvalue = null } = $$props;
    	let selectedOption = null;

    	onMount(() => {
    		if (selectedvalue != null && selectedvalue.length > 0) {
    			$$invalidate(0, selectedOption = options.find(opt => opt.value == selectedvalue));
    		}
    	});

    	const writable_props = ['options', 'selectedvalue'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-dropdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('selectedvalue' in $$props) $$invalidate(2, selectedvalue = $$props.selectedvalue);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		options,
    		selectedvalue,
    		selectedOption
    	});

    	$$self.$inject_state = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('selectedvalue' in $$props) $$invalidate(2, selectedvalue = $$props.selectedvalue);
    		if ('selectedOption' in $$props) $$invalidate(0, selectedOption = $$props.selectedOption);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedOption, options, selectedvalue];
    }

    class Dropdown extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `.dropdown{display:inline-block;position:relative;margin-bottom:1em;z-index:20}.dd-button{display:flex;border:1px solid gray;border-radius:4px;padding:10px 30px 10px 10px;background-color:var(--assistantapps-dropdown-background-colour, #646464);cursor:pointer;white-space:nowrap}.dd-button:after{content:"";position:absolute;top:50%;right:15px;transform:translateY(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid var(--assistantapps-dropdown-background-colour, #646464)}.dd-button:hover{background-color:var(--assistantapps-dropdown-background-hover-colour, #7e7e7e)}.dd-button img{width:20px;height:20px;margin-right:0.5em}.dd-button p{display:flex;flex-direction:column;justify-content:center;margin:0;padding:0}.dd-input{display:none}.dd-menu{position:absolute;top:100%;border:1px solid #ccc;border-radius:4px;padding:0;margin:2px 0 0 0;box-shadow:0 0 6px 0 rgba(0, 0, 0, 0.1);background-color:var(--assistantapps-dropdown-background-colour, #646464);list-style-type:none;max-height:500px;overflow-y:auto}.dd-input+.dd-menu{display:none}.dd-input:checked+.dd-menu{display:block}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{ options: 1, selectedvalue: 2 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["options", "selectedvalue"];
    	}

    	get options() {
    		return this.$$.ctx[1];
    	}

    	set options(options) {
    		this.$$set({ options });
    		flush();
    	}

    	get selectedvalue() {
    		return this.$$.ctx[2];
    	}

    	set selectedvalue(selectedvalue) {
    		this.$$set({ selectedvalue });
    		flush();
    	}
    }

    customElements.define("assistant-apps-dropdown", Dropdown);

    /* src\shared\dropdownOption.svelte generated by Svelte v3.58.0 */

    const file$3 = "src\\shared\\dropdownOption.svelte";

    // (9:2) {#if iconurl != null}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*iconurl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*value*/ ctx[1]);
    			add_location(img, file$3, 9, 4, 229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*iconurl*/ 4 && !src_url_equal(img.src, img_src_value = /*iconurl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*value*/ 2) {
    				attr_dev(img, "alt", /*value*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(9:2) {#if iconurl != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let li;
    	let t0;
    	let p;
    	let t1;
    	let if_block = /*iconurl*/ ctx[2] != null && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (if_block) if_block.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(/*name*/ ctx[0]);
    			this.c = noop$1;
    			add_location(p, file$3, 11, 2, 275);
    			attr_dev(li, "class", "dd-menu-item");
    			li.value = /*value*/ ctx[1];
    			add_location(li, file$3, 7, 0, 165);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if (if_block) if_block.m(li, null);
    			append_dev(li, t0);
    			append_dev(li, p);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*iconurl*/ ctx[2] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(li, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

    			if (dirty & /*value*/ 2) {
    				prop_dev(li, "value", /*value*/ ctx[1]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-dropdown-option', slots, []);
    	let { name = "" } = $$props;
    	let { value = "" } = $$props;
    	let { iconurl = null } = $$props;
    	const writable_props = ['name', 'value', 'iconurl'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-dropdown-option> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('value' in $$props) $$invalidate(1, value = $$props.value);
    		if ('iconurl' in $$props) $$invalidate(2, iconurl = $$props.iconurl);
    	};

    	$$self.$capture_state = () => ({ name, value, iconurl });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('value' in $$props) $$invalidate(1, value = $$props.value);
    		if ('iconurl' in $$props) $$invalidate(2, iconurl = $$props.iconurl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, value, iconurl];
    }

    class DropdownOption extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `li{padding:10px 20px;cursor:pointer;white-space:nowrap}li:hover{background-color:var(--assistantapps-version-dropdown-background-hover-colour, #7d7d7d)}li.dd-menu-item{display:flex}li.dd-menu-item img{width:40px;height:40px;margin-right:1em}li.dd-menu-item p{display:flex;flex-direction:column;justify-content:center;margin:0;padding:0}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{ name: 0, value: 1, iconurl: 2 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["name", "value", "iconurl"];
    	}

    	get name() {
    		return this.$$.ctx[0];
    	}

    	set name(name) {
    		this.$$set({ name });
    		flush();
    	}

    	get value() {
    		return this.$$.ctx[1];
    	}

    	set value(value) {
    		this.$$set({ value });
    		flush();
    	}

    	get iconurl() {
    		return this.$$.ctx[2];
    	}

    	set iconurl(iconurl) {
    		this.$$set({ iconurl });
    		flush();
    	}
    }

    customElements.define("assistant-apps-dropdown-option", DropdownOption);

    /* src\shared\loadingWithSlots.svelte generated by Svelte v3.58.0 */
    const file$2 = "src\\shared\\loadingWithSlots.svelte";

    // (20:49) 
    function create_if_block_2(ctx) {
    	let slot;
    	let div;
    	let span;
    	let t0;
    	let b;
    	let t2;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			div = element("div");
    			span = element("span");
    			t0 = text("Nothing supplied in the ");
    			b = element("b");
    			b.textContent = "loaded";
    			t2 = text(" slot");
    			add_location(b, file$2, 22, 38, 772);
    			add_location(span, file$2, 22, 8, 742);
    			set_style(div, "text-align", "center");
    			add_location(div, file$2, 21, 6, 700);
    			attr_dev(slot, "name", "loaded");
    			add_location(slot, file$2, 20, 4, 672);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    			append_dev(slot, div);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, b);
    			append_dev(span, t2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(20:49) ",
    		ctx
    	});

    	return block;
    }

    // (10:47) 
    function create_if_block_1(ctx) {
    	let slot;
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Something went wrong";
    			if (!src_url_equal(img.src, img_src_value = "https://cdn.assistantapps.com/icon/NMSCDCreatureBuilder.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "monster representing an error");
    			add_location(img, file$2, 12, 8, 411);
    			add_location(p, file$2, 16, 8, 561);
    			attr_dev(div, "class", "aa-error");
    			add_location(div, file$2, 11, 6, 379);
    			attr_dev(slot, "name", "error");
    			add_location(slot, file$2, 10, 4, 352);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    			append_dev(slot, div);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(10:47) ",
    		ctx
    	});

    	return block;
    }

    // (8:2) {#if networkstate == NetworkState.Loading}
    function create_if_block(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			add_location(slot, file$2, 8, 4, 274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, slot, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(slot);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(8:2) {#if networkstate == NetworkState.Loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*networkstate*/ ctx[0] == NetworkState.Loading) return create_if_block;
    		if (/*networkstate*/ ctx[0] == NetworkState.Error) return create_if_block_1;
    		if (/*networkstate*/ ctx[0] == NetworkState.Success) return create_if_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			this.c = noop$1;
    			attr_dev(div, "class", "noselect");
    			attr_dev(div, "data-networkstate", /*networkstate*/ ctx[0]);
    			add_location(div, file$2, 6, 0, 167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*networkstate*/ 1) {
    				attr_dev(div, "data-networkstate", /*networkstate*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-loading', slots, []);
    	let { networkstate } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (networkstate === undefined && !('networkstate' in $$props || $$self.$$.bound[$$self.$$.props['networkstate']])) {
    			console.warn("<assistant-apps-loading> was created without expected prop 'networkstate'");
    		}
    	});

    	const writable_props = ['networkstate'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-loading> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('networkstate' in $$props) $$invalidate(0, networkstate = $$props.networkstate);
    	};

    	$$self.$capture_state = () => ({ NetworkState, networkstate });

    	$$self.$inject_state = $$props => {
    		if ('networkstate' in $$props) $$invalidate(0, networkstate = $$props.networkstate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkstate];
    }

    class LoadingWithSlots extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');
    		style.textContent = `*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.aa-error{display:flex;justify-content:center;flex-direction:column}.aa-error img{max-width:100px}.aa-error>*{margin:0 auto}`;
    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{ networkstate: 0 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["networkstate"];
    	}

    	get networkstate() {
    		return this.$$.ctx[0];
    	}

    	set networkstate(networkstate) {
    		this.$$set({ networkstate });
    		flush();
    	}
    }

    customElements.define("assistant-apps-loading", LoadingWithSlots);

    /**
     * marked v4.3.0 - a markdown parser
     * Copyright (c) 2011-2023, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/markedjs/marked
     */

    /**
     * DO NOT EDIT THIS FILE
     * The code in this file is generated from files in ./src/
     */

    function getDefaults() {
      return {
        async: false,
        baseUrl: null,
        breaks: false,
        extensions: null,
        gfm: true,
        headerIds: true,
        headerPrefix: '',
        highlight: null,
        hooks: null,
        langPrefix: 'language-',
        mangle: true,
        pedantic: false,
        renderer: null,
        sanitize: false,
        sanitizer: null,
        silent: false,
        smartypants: false,
        tokenizer: null,
        walkTokens: null,
        xhtml: false
      };
    }

    let defaults = getDefaults();

    function changeDefaults(newDefaults) {
      defaults = newDefaults;
    }

    /**
     * Helpers
     */
    const escapeTest = /[&<>"']/;
    const escapeReplace = new RegExp(escapeTest.source, 'g');
    const escapeTestNoEncode = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
    const escapeReplaceNoEncode = new RegExp(escapeTestNoEncode.source, 'g');
    const escapeReplacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    const getEscapeReplacement = (ch) => escapeReplacements[ch];
    function escape(html, encode) {
      if (encode) {
        if (escapeTest.test(html)) {
          return html.replace(escapeReplace, getEscapeReplacement);
        }
      } else {
        if (escapeTestNoEncode.test(html)) {
          return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
        }
      }

      return html;
    }

    const unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;

    /**
     * @param {string} html
     */
    function unescape$1(html) {
      // explicitly match decimal, hex, and named HTML entities
      return html.replace(unescapeTest, (_, n) => {
        n = n.toLowerCase();
        if (n === 'colon') return ':';
        if (n.charAt(0) === '#') {
          return n.charAt(1) === 'x'
            ? String.fromCharCode(parseInt(n.substring(2), 16))
            : String.fromCharCode(+n.substring(1));
        }
        return '';
      });
    }

    const caret = /(^|[^\[])\^/g;

    /**
     * @param {string | RegExp} regex
     * @param {string} opt
     */
    function edit(regex, opt) {
      regex = typeof regex === 'string' ? regex : regex.source;
      opt = opt || '';
      const obj = {
        replace: (name, val) => {
          val = val.source || val;
          val = val.replace(caret, '$1');
          regex = regex.replace(name, val);
          return obj;
        },
        getRegex: () => {
          return new RegExp(regex, opt);
        }
      };
      return obj;
    }

    const nonWordAndColonTest = /[^\w:]/g;
    const originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

    /**
     * @param {boolean} sanitize
     * @param {string} base
     * @param {string} href
     */
    function cleanUrl(sanitize, base, href) {
      if (sanitize) {
        let prot;
        try {
          prot = decodeURIComponent(unescape$1(href))
            .replace(nonWordAndColonTest, '')
            .toLowerCase();
        } catch (e) {
          return null;
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
          return null;
        }
      }
      if (base && !originIndependentUrl.test(href)) {
        href = resolveUrl(base, href);
      }
      try {
        href = encodeURI(href).replace(/%25/g, '%');
      } catch (e) {
        return null;
      }
      return href;
    }

    const baseUrls = {};
    const justDomain = /^[^:]+:\/*[^/]*$/;
    const protocol = /^([^:]+:)[\s\S]*$/;
    const domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;

    /**
     * @param {string} base
     * @param {string} href
     */
    function resolveUrl(base, href) {
      if (!baseUrls[' ' + base]) {
        // we can ignore everything in base after the last slash of its path component,
        // but we might need to add _that_
        // https://tools.ietf.org/html/rfc3986#section-3
        if (justDomain.test(base)) {
          baseUrls[' ' + base] = base + '/';
        } else {
          baseUrls[' ' + base] = rtrim(base, '/', true);
        }
      }
      base = baseUrls[' ' + base];
      const relativeBase = base.indexOf(':') === -1;

      if (href.substring(0, 2) === '//') {
        if (relativeBase) {
          return href;
        }
        return base.replace(protocol, '$1') + href;
      } else if (href.charAt(0) === '/') {
        if (relativeBase) {
          return href;
        }
        return base.replace(domain, '$1') + href;
      } else {
        return base + href;
      }
    }

    const noopTest = { exec: function noopTest() {} };

    function splitCells(tableRow, count) {
      // ensure that every cell-delimiting pipe has a space
      // before it to distinguish it from an escaped pipe
      const row = tableRow.replace(/\|/g, (match, offset, str) => {
          let escaped = false,
            curr = offset;
          while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
          if (escaped) {
            // odd number of slashes means | is escaped
            // so we leave it alone
            return '|';
          } else {
            // add space before unescaped |
            return ' |';
          }
        }),
        cells = row.split(/ \|/);
      let i = 0;

      // First/last cell in a row cannot be empty if it has no leading/trailing pipe
      if (!cells[0].trim()) { cells.shift(); }
      if (cells.length > 0 && !cells[cells.length - 1].trim()) { cells.pop(); }

      if (cells.length > count) {
        cells.splice(count);
      } else {
        while (cells.length < count) cells.push('');
      }

      for (; i < cells.length; i++) {
        // leading or trailing whitespace is ignored per the gfm spec
        cells[i] = cells[i].trim().replace(/\\\|/g, '|');
      }
      return cells;
    }

    /**
     * Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
     * /c*$/ is vulnerable to REDOS.
     *
     * @param {string} str
     * @param {string} c
     * @param {boolean} invert Remove suffix of non-c chars instead. Default falsey.
     */
    function rtrim(str, c, invert) {
      const l = str.length;
      if (l === 0) {
        return '';
      }

      // Length of suffix matching the invert condition.
      let suffLen = 0;

      // Step left until we fail to match the invert condition.
      while (suffLen < l) {
        const currChar = str.charAt(l - suffLen - 1);
        if (currChar === c && !invert) {
          suffLen++;
        } else if (currChar !== c && invert) {
          suffLen++;
        } else {
          break;
        }
      }

      return str.slice(0, l - suffLen);
    }

    function findClosingBracket(str, b) {
      if (str.indexOf(b[1]) === -1) {
        return -1;
      }
      const l = str.length;
      let level = 0,
        i = 0;
      for (; i < l; i++) {
        if (str[i] === '\\') {
          i++;
        } else if (str[i] === b[0]) {
          level++;
        } else if (str[i] === b[1]) {
          level--;
          if (level < 0) {
            return i;
          }
        }
      }
      return -1;
    }

    function checkSanitizeDeprecation(opt) {
      if (opt && opt.sanitize && !opt.silent) {
        console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
      }
    }

    // copied from https://stackoverflow.com/a/5450113/806777
    /**
     * @param {string} pattern
     * @param {number} count
     */
    function repeatString(pattern, count) {
      if (count < 1) {
        return '';
      }
      let result = '';
      while (count > 1) {
        if (count & 1) {
          result += pattern;
        }
        count >>= 1;
        pattern += pattern;
      }
      return result + pattern;
    }

    function outputLink(cap, link, raw, lexer) {
      const href = link.href;
      const title = link.title ? escape(link.title) : null;
      const text = cap[1].replace(/\\([\[\]])/g, '$1');

      if (cap[0].charAt(0) !== '!') {
        lexer.state.inLink = true;
        const token = {
          type: 'link',
          raw,
          href,
          title,
          text,
          tokens: lexer.inlineTokens(text)
        };
        lexer.state.inLink = false;
        return token;
      }
      return {
        type: 'image',
        raw,
        href,
        title,
        text: escape(text)
      };
    }

    function indentCodeCompensation(raw, text) {
      const matchIndentToCode = raw.match(/^(\s+)(?:```)/);

      if (matchIndentToCode === null) {
        return text;
      }

      const indentToCode = matchIndentToCode[1];

      return text
        .split('\n')
        .map(node => {
          const matchIndentInNode = node.match(/^\s+/);
          if (matchIndentInNode === null) {
            return node;
          }

          const [indentInNode] = matchIndentInNode;

          if (indentInNode.length >= indentToCode.length) {
            return node.slice(indentToCode.length);
          }

          return node;
        })
        .join('\n');
    }

    /**
     * Tokenizer
     */
    class Tokenizer {
      constructor(options) {
        this.options = options || defaults;
      }

      space(src) {
        const cap = this.rules.block.newline.exec(src);
        if (cap && cap[0].length > 0) {
          return {
            type: 'space',
            raw: cap[0]
          };
        }
      }

      code(src) {
        const cap = this.rules.block.code.exec(src);
        if (cap) {
          const text = cap[0].replace(/^ {1,4}/gm, '');
          return {
            type: 'code',
            raw: cap[0],
            codeBlockStyle: 'indented',
            text: !this.options.pedantic
              ? rtrim(text, '\n')
              : text
          };
        }
      }

      fences(src) {
        const cap = this.rules.block.fences.exec(src);
        if (cap) {
          const raw = cap[0];
          const text = indentCodeCompensation(raw, cap[3] || '');

          return {
            type: 'code',
            raw,
            lang: cap[2] ? cap[2].trim().replace(this.rules.inline._escapes, '$1') : cap[2],
            text
          };
        }
      }

      heading(src) {
        const cap = this.rules.block.heading.exec(src);
        if (cap) {
          let text = cap[2].trim();

          // remove trailing #s
          if (/#$/.test(text)) {
            const trimmed = rtrim(text, '#');
            if (this.options.pedantic) {
              text = trimmed.trim();
            } else if (!trimmed || / $/.test(trimmed)) {
              // CommonMark requires space before trailing #s
              text = trimmed.trim();
            }
          }

          return {
            type: 'heading',
            raw: cap[0],
            depth: cap[1].length,
            text,
            tokens: this.lexer.inline(text)
          };
        }
      }

      hr(src) {
        const cap = this.rules.block.hr.exec(src);
        if (cap) {
          return {
            type: 'hr',
            raw: cap[0]
          };
        }
      }

      blockquote(src) {
        const cap = this.rules.block.blockquote.exec(src);
        if (cap) {
          const text = cap[0].replace(/^ *>[ \t]?/gm, '');
          const top = this.lexer.state.top;
          this.lexer.state.top = true;
          const tokens = this.lexer.blockTokens(text);
          this.lexer.state.top = top;
          return {
            type: 'blockquote',
            raw: cap[0],
            tokens,
            text
          };
        }
      }

      list(src) {
        let cap = this.rules.block.list.exec(src);
        if (cap) {
          let raw, istask, ischecked, indent, i, blankLine, endsWithBlankLine,
            line, nextLine, rawLine, itemContents, endEarly;

          let bull = cap[1].trim();
          const isordered = bull.length > 1;

          const list = {
            type: 'list',
            raw: '',
            ordered: isordered,
            start: isordered ? +bull.slice(0, -1) : '',
            loose: false,
            items: []
          };

          bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;

          if (this.options.pedantic) {
            bull = isordered ? bull : '[*+-]';
          }

          // Get next list item
          const itemRegex = new RegExp(`^( {0,3}${bull})((?:[\t ][^\\n]*)?(?:\\n|$))`);

          // Check if current bullet point can start a new List Item
          while (src) {
            endEarly = false;
            if (!(cap = itemRegex.exec(src))) {
              break;
            }

            if (this.rules.block.hr.test(src)) { // End list if bullet was actually HR (possibly move into itemRegex?)
              break;
            }

            raw = cap[0];
            src = src.substring(raw.length);

            line = cap[2].split('\n', 1)[0].replace(/^\t+/, (t) => ' '.repeat(3 * t.length));
            nextLine = src.split('\n', 1)[0];

            if (this.options.pedantic) {
              indent = 2;
              itemContents = line.trimLeft();
            } else {
              indent = cap[2].search(/[^ ]/); // Find first non-space char
              indent = indent > 4 ? 1 : indent; // Treat indented code blocks (> 4 spaces) as having only 1 indent
              itemContents = line.slice(indent);
              indent += cap[1].length;
            }

            blankLine = false;

            if (!line && /^ *$/.test(nextLine)) { // Items begin with at most one blank line
              raw += nextLine + '\n';
              src = src.substring(nextLine.length + 1);
              endEarly = true;
            }

            if (!endEarly) {
              const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`);
              const hrRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`);
              const fencesBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`);
              const headingBeginRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`);

              // Check if following lines should be included in List Item
              while (src) {
                rawLine = src.split('\n', 1)[0];
                nextLine = rawLine;

                // Re-align to follow commonmark nesting rules
                if (this.options.pedantic) {
                  nextLine = nextLine.replace(/^ {1,4}(?=( {4})*[^ ])/g, '  ');
                }

                // End list item if found code fences
                if (fencesBeginRegex.test(nextLine)) {
                  break;
                }

                // End list item if found start of new heading
                if (headingBeginRegex.test(nextLine)) {
                  break;
                }

                // End list item if found start of new bullet
                if (nextBulletRegex.test(nextLine)) {
                  break;
                }

                // Horizontal rule found
                if (hrRegex.test(src)) {
                  break;
                }

                if (nextLine.search(/[^ ]/) >= indent || !nextLine.trim()) { // Dedent if possible
                  itemContents += '\n' + nextLine.slice(indent);
                } else {
                  // not enough indentation
                  if (blankLine) {
                    break;
                  }

                  // paragraph continuation unless last line was a different block level element
                  if (line.search(/[^ ]/) >= 4) { // indented code block
                    break;
                  }
                  if (fencesBeginRegex.test(line)) {
                    break;
                  }
                  if (headingBeginRegex.test(line)) {
                    break;
                  }
                  if (hrRegex.test(line)) {
                    break;
                  }

                  itemContents += '\n' + nextLine;
                }

                if (!blankLine && !nextLine.trim()) { // Check if current line is blank
                  blankLine = true;
                }

                raw += rawLine + '\n';
                src = src.substring(rawLine.length + 1);
                line = nextLine.slice(indent);
              }
            }

            if (!list.loose) {
              // If the previous item ended with a blank line, the list is loose
              if (endsWithBlankLine) {
                list.loose = true;
              } else if (/\n *\n *$/.test(raw)) {
                endsWithBlankLine = true;
              }
            }

            // Check for task list items
            if (this.options.gfm) {
              istask = /^\[[ xX]\] /.exec(itemContents);
              if (istask) {
                ischecked = istask[0] !== '[ ] ';
                itemContents = itemContents.replace(/^\[[ xX]\] +/, '');
              }
            }

            list.items.push({
              type: 'list_item',
              raw,
              task: !!istask,
              checked: ischecked,
              loose: false,
              text: itemContents
            });

            list.raw += raw;
          }

          // Do not consume newlines at end of final item. Alternatively, make itemRegex *start* with any newlines to simplify/speed up endsWithBlankLine logic
          list.items[list.items.length - 1].raw = raw.trimRight();
          list.items[list.items.length - 1].text = itemContents.trimRight();
          list.raw = list.raw.trimRight();

          const l = list.items.length;

          // Item child tokens handled here at end because we needed to have the final item to trim it first
          for (i = 0; i < l; i++) {
            this.lexer.state.top = false;
            list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);

            if (!list.loose) {
              // Check if list should be loose
              const spacers = list.items[i].tokens.filter(t => t.type === 'space');
              const hasMultipleLineBreaks = spacers.length > 0 && spacers.some(t => /\n.*\n/.test(t.raw));

              list.loose = hasMultipleLineBreaks;
            }
          }

          // Set all items to loose if list is loose
          if (list.loose) {
            for (i = 0; i < l; i++) {
              list.items[i].loose = true;
            }
          }

          return list;
        }
      }

      html(src) {
        const cap = this.rules.block.html.exec(src);
        if (cap) {
          const token = {
            type: 'html',
            raw: cap[0],
            pre: !this.options.sanitizer
              && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
            text: cap[0]
          };
          if (this.options.sanitize) {
            const text = this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]);
            token.type = 'paragraph';
            token.text = text;
            token.tokens = this.lexer.inline(text);
          }
          return token;
        }
      }

      def(src) {
        const cap = this.rules.block.def.exec(src);
        if (cap) {
          const tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
          const href = cap[2] ? cap[2].replace(/^<(.*)>$/, '$1').replace(this.rules.inline._escapes, '$1') : '';
          const title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline._escapes, '$1') : cap[3];
          return {
            type: 'def',
            tag,
            raw: cap[0],
            href,
            title
          };
        }
      }

      table(src) {
        const cap = this.rules.block.table.exec(src);
        if (cap) {
          const item = {
            type: 'table',
            header: splitCells(cap[1]).map(c => { return { text: c }; }),
            align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
            rows: cap[3] && cap[3].trim() ? cap[3].replace(/\n[ \t]*$/, '').split('\n') : []
          };

          if (item.header.length === item.align.length) {
            item.raw = cap[0];

            let l = item.align.length;
            let i, j, k, row;
            for (i = 0; i < l; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = 'right';
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = 'center';
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = 'left';
              } else {
                item.align[i] = null;
              }
            }

            l = item.rows.length;
            for (i = 0; i < l; i++) {
              item.rows[i] = splitCells(item.rows[i], item.header.length).map(c => { return { text: c }; });
            }

            // parse child tokens inside headers and cells

            // header child tokens
            l = item.header.length;
            for (j = 0; j < l; j++) {
              item.header[j].tokens = this.lexer.inline(item.header[j].text);
            }

            // cell child tokens
            l = item.rows.length;
            for (j = 0; j < l; j++) {
              row = item.rows[j];
              for (k = 0; k < row.length; k++) {
                row[k].tokens = this.lexer.inline(row[k].text);
              }
            }

            return item;
          }
        }
      }

      lheading(src) {
        const cap = this.rules.block.lheading.exec(src);
        if (cap) {
          return {
            type: 'heading',
            raw: cap[0],
            depth: cap[2].charAt(0) === '=' ? 1 : 2,
            text: cap[1],
            tokens: this.lexer.inline(cap[1])
          };
        }
      }

      paragraph(src) {
        const cap = this.rules.block.paragraph.exec(src);
        if (cap) {
          const text = cap[1].charAt(cap[1].length - 1) === '\n'
            ? cap[1].slice(0, -1)
            : cap[1];
          return {
            type: 'paragraph',
            raw: cap[0],
            text,
            tokens: this.lexer.inline(text)
          };
        }
      }

      text(src) {
        const cap = this.rules.block.text.exec(src);
        if (cap) {
          return {
            type: 'text',
            raw: cap[0],
            text: cap[0],
            tokens: this.lexer.inline(cap[0])
          };
        }
      }

      escape(src) {
        const cap = this.rules.inline.escape.exec(src);
        if (cap) {
          return {
            type: 'escape',
            raw: cap[0],
            text: escape(cap[1])
          };
        }
      }

      tag(src) {
        const cap = this.rules.inline.tag.exec(src);
        if (cap) {
          if (!this.lexer.state.inLink && /^<a /i.test(cap[0])) {
            this.lexer.state.inLink = true;
          } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap[0])) {
            this.lexer.state.inLink = false;
          }
          if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
            this.lexer.state.inRawBlock = true;
          } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
            this.lexer.state.inRawBlock = false;
          }

          return {
            type: this.options.sanitize
              ? 'text'
              : 'html',
            raw: cap[0],
            inLink: this.lexer.state.inLink,
            inRawBlock: this.lexer.state.inRawBlock,
            text: this.options.sanitize
              ? (this.options.sanitizer
                ? this.options.sanitizer(cap[0])
                : escape(cap[0]))
              : cap[0]
          };
        }
      }

      link(src) {
        const cap = this.rules.inline.link.exec(src);
        if (cap) {
          const trimmedUrl = cap[2].trim();
          if (!this.options.pedantic && /^</.test(trimmedUrl)) {
            // commonmark requires matching angle brackets
            if (!(/>$/.test(trimmedUrl))) {
              return;
            }

            // ending angle bracket cannot be escaped
            const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), '\\');
            if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
              return;
            }
          } else {
            // find closing parenthesis
            const lastParenIndex = findClosingBracket(cap[2], '()');
            if (lastParenIndex > -1) {
              const start = cap[0].indexOf('!') === 0 ? 5 : 4;
              const linkLen = start + cap[1].length + lastParenIndex;
              cap[2] = cap[2].substring(0, lastParenIndex);
              cap[0] = cap[0].substring(0, linkLen).trim();
              cap[3] = '';
            }
          }
          let href = cap[2];
          let title = '';
          if (this.options.pedantic) {
            // split pedantic href and title
            const link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

            if (link) {
              href = link[1];
              title = link[3];
            }
          } else {
            title = cap[3] ? cap[3].slice(1, -1) : '';
          }

          href = href.trim();
          if (/^</.test(href)) {
            if (this.options.pedantic && !(/>$/.test(trimmedUrl))) {
              // pedantic allows starting angle bracket without ending angle bracket
              href = href.slice(1);
            } else {
              href = href.slice(1, -1);
            }
          }
          return outputLink(cap, {
            href: href ? href.replace(this.rules.inline._escapes, '$1') : href,
            title: title ? title.replace(this.rules.inline._escapes, '$1') : title
          }, cap[0], this.lexer);
        }
      }

      reflink(src, links) {
        let cap;
        if ((cap = this.rules.inline.reflink.exec(src))
            || (cap = this.rules.inline.nolink.exec(src))) {
          let link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
          link = links[link.toLowerCase()];
          if (!link) {
            const text = cap[0].charAt(0);
            return {
              type: 'text',
              raw: text,
              text
            };
          }
          return outputLink(cap, link, cap[0], this.lexer);
        }
      }

      emStrong(src, maskedSrc, prevChar = '') {
        let match = this.rules.inline.emStrong.lDelim.exec(src);
        if (!match) return;

        // _ can't be between two alphanumerics. \p{L}\p{N} includes non-english alphabet/numbers as well
        if (match[3] && prevChar.match(/[\p{L}\p{N}]/u)) return;

        const nextChar = match[1] || match[2] || '';

        if (!nextChar || (nextChar && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar)))) {
          const lLength = match[0].length - 1;
          let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;

          const endReg = match[0][0] === '*' ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
          endReg.lastIndex = 0;

          // Clip maskedSrc to same section of string as src (move to lexer?)
          maskedSrc = maskedSrc.slice(-1 * src.length + lLength);

          while ((match = endReg.exec(maskedSrc)) != null) {
            rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];

            if (!rDelim) continue; // skip single * in __abc*abc__

            rLength = rDelim.length;

            if (match[3] || match[4]) { // found another Left Delim
              delimTotal += rLength;
              continue;
            } else if (match[5] || match[6]) { // either Left or Right Delim
              if (lLength % 3 && !((lLength + rLength) % 3)) {
                midDelimTotal += rLength;
                continue; // CommonMark Emphasis Rules 9-10
              }
            }

            delimTotal -= rLength;

            if (delimTotal > 0) continue; // Haven't found enough closing delimiters

            // Remove extra characters. *a*** -> *a*
            rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);

            const raw = src.slice(0, lLength + match.index + (match[0].length - rDelim.length) + rLength);

            // Create `em` if smallest delimiter has odd char count. *a***
            if (Math.min(lLength, rLength) % 2) {
              const text = raw.slice(1, -1);
              return {
                type: 'em',
                raw,
                text,
                tokens: this.lexer.inlineTokens(text)
              };
            }

            // Create 'strong' if smallest delimiter has even char count. **a***
            const text = raw.slice(2, -2);
            return {
              type: 'strong',
              raw,
              text,
              tokens: this.lexer.inlineTokens(text)
            };
          }
        }
      }

      codespan(src) {
        const cap = this.rules.inline.code.exec(src);
        if (cap) {
          let text = cap[2].replace(/\n/g, ' ');
          const hasNonSpaceChars = /[^ ]/.test(text);
          const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
          if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
            text = text.substring(1, text.length - 1);
          }
          text = escape(text, true);
          return {
            type: 'codespan',
            raw: cap[0],
            text
          };
        }
      }

      br(src) {
        const cap = this.rules.inline.br.exec(src);
        if (cap) {
          return {
            type: 'br',
            raw: cap[0]
          };
        }
      }

      del(src) {
        const cap = this.rules.inline.del.exec(src);
        if (cap) {
          return {
            type: 'del',
            raw: cap[0],
            text: cap[2],
            tokens: this.lexer.inlineTokens(cap[2])
          };
        }
      }

      autolink(src, mangle) {
        const cap = this.rules.inline.autolink.exec(src);
        if (cap) {
          let text, href;
          if (cap[2] === '@') {
            text = escape(this.options.mangle ? mangle(cap[1]) : cap[1]);
            href = 'mailto:' + text;
          } else {
            text = escape(cap[1]);
            href = text;
          }

          return {
            type: 'link',
            raw: cap[0],
            text,
            href,
            tokens: [
              {
                type: 'text',
                raw: text,
                text
              }
            ]
          };
        }
      }

      url(src, mangle) {
        let cap;
        if (cap = this.rules.inline.url.exec(src)) {
          let text, href;
          if (cap[2] === '@') {
            text = escape(this.options.mangle ? mangle(cap[0]) : cap[0]);
            href = 'mailto:' + text;
          } else {
            // do extended autolink path validation
            let prevCapZero;
            do {
              prevCapZero = cap[0];
              cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
            } while (prevCapZero !== cap[0]);
            text = escape(cap[0]);
            if (cap[1] === 'www.') {
              href = 'http://' + cap[0];
            } else {
              href = cap[0];
            }
          }
          return {
            type: 'link',
            raw: cap[0],
            text,
            href,
            tokens: [
              {
                type: 'text',
                raw: text,
                text
              }
            ]
          };
        }
      }

      inlineText(src, smartypants) {
        const cap = this.rules.inline.text.exec(src);
        if (cap) {
          let text;
          if (this.lexer.state.inRawBlock) {
            text = this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0])) : cap[0];
          } else {
            text = escape(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
          }
          return {
            type: 'text',
            raw: cap[0],
            text
          };
        }
      }
    }

    /**
     * Block-Level Grammar
     */
    const block = {
      newline: /^(?: *(?:\n|$))+/,
      code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
      fences: /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
      hr: /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
      heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
      blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
      list: /^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/,
      html: '^ {0,3}(?:' // optional indentation
        + '<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
        + '|comment[^\\n]*(\\n+|$)' // (2)
        + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
        + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
        + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
        + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (6)
        + '|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (7) open tag
        + '|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (7) closing tag
        + ')',
      def: /^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/,
      table: noopTest,
      lheading: /^((?:.|\n(?!\n))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
      // regex template, placeholders will be replaced according to different paragraph
      // interruption rules of commonmark and the original markdown spec:
      _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
      text: /^[^\n]+/
    };

    block._label = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
    block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
    block.def = edit(block.def)
      .replace('label', block._label)
      .replace('title', block._title)
      .getRegex();

    block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
    block.listItemStart = edit(/^( *)(bull) */)
      .replace('bull', block.bullet)
      .getRegex();

    block.list = edit(block.list)
      .replace(/bull/g, block.bullet)
      .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
      .replace('def', '\\n+(?=' + block.def.source + ')')
      .getRegex();

    block._tag = 'address|article|aside|base|basefont|blockquote|body|caption'
      + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
      + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
      + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
      + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
      + '|track|ul';
    block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
    block.html = edit(block.html, 'i')
      .replace('comment', block._comment)
      .replace('tag', block._tag)
      .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
      .getRegex();

    block.paragraph = edit(block._paragraph)
      .replace('hr', block.hr)
      .replace('heading', ' {0,3}#{1,6} ')
      .replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
      .replace('|table', '')
      .replace('blockquote', ' {0,3}>')
      .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
      .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
      .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
      .getRegex();

    block.blockquote = edit(block.blockquote)
      .replace('paragraph', block.paragraph)
      .getRegex();

    /**
     * Normal Block Grammar
     */

    block.normal = { ...block };

    /**
     * GFM Block Grammar
     */

    block.gfm = {
      ...block.normal,
      table: '^ *([^\\n ].*\\|.*)\\n' // Header
        + ' {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?' // Align
        + '(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells
    };

    block.gfm.table = edit(block.gfm.table)
      .replace('hr', block.hr)
      .replace('heading', ' {0,3}#{1,6} ')
      .replace('blockquote', ' {0,3}>')
      .replace('code', ' {4}[^\\n]')
      .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
      .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
      .replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
      .getRegex();

    block.gfm.paragraph = edit(block._paragraph)
      .replace('hr', block.hr)
      .replace('heading', ' {0,3}#{1,6} ')
      .replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
      .replace('table', block.gfm.table) // interrupt paragraphs with table
      .replace('blockquote', ' {0,3}>')
      .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
      .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
      .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
      .getRegex();
    /**
     * Pedantic grammar (original John Gruber's loose markdown specification)
     */

    block.pedantic = {
      ...block.normal,
      html: edit(
        '^ *(?:comment *(?:\\n|\\s*$)'
        + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
        + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
        .replace('comment', block._comment)
        .replace(/tag/g, '(?!(?:'
          + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
          + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
          + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
        .getRegex(),
      def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
      heading: /^(#{1,6})(.*)(?:\n+|$)/,
      fences: noopTest, // fences not supported
      lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
      paragraph: edit(block.normal._paragraph)
        .replace('hr', block.hr)
        .replace('heading', ' *#{1,6} *[^\n]')
        .replace('lheading', block.lheading)
        .replace('blockquote', ' {0,3}>')
        .replace('|fences', '')
        .replace('|list', '')
        .replace('|html', '')
        .getRegex()
    };

    /**
     * Inline-Level Grammar
     */
    const inline = {
      escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
      autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
      url: noopTest,
      tag: '^comment'
        + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
        + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
        + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
        + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
        + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
      link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
      reflink: /^!?\[(label)\]\[(ref)\]/,
      nolink: /^!?\[(ref)\](?:\[\])?/,
      reflinkSearch: 'reflink|nolink(?!\\()',
      emStrong: {
        lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
        //        (1) and (2) can only be a Right Delimiter. (3) and (4) can only be Left.  (5) and (6) can be either Left or Right.
        //          () Skip orphan inside strong                                      () Consume to delim     (1) #***                (2) a***#, a***                             (3) #***a, ***a                 (4) ***#              (5) #***#                 (6) a***a
        rDelimAst: /^(?:[^_*\\]|\\.)*?\_\_(?:[^_*\\]|\\.)*?\*(?:[^_*\\]|\\.)*?(?=\_\_)|(?:[^*\\]|\\.)+(?=[^*])|[punct_](\*+)(?=[\s]|$)|(?:[^punct*_\s\\]|\\.)(\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|(?:[^punct*_\s\\]|\\.)(\*+)(?=[^punct*_\s])/,
        rDelimUnd: /^(?:[^_*\\]|\\.)*?\*\*(?:[^_*\\]|\\.)*?\_(?:[^_*\\]|\\.)*?(?=\*\*)|(?:[^_\\]|\\.)+(?=[^_])|[punct*](\_+)(?=[\s]|$)|(?:[^punct*_\s\\]|\\.)(\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/ // ^- Not allowed for _
      },
      code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
      br: /^( {2,}|\\)\n(?!\s*$)/,
      del: noopTest,
      text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
      punctuation: /^([\spunctuation])/
    };

    // list of punctuation marks from CommonMark spec
    // without * and _ to handle the different emphasis markers * and _
    inline._punctuation = '!"#$%&\'()+\\-.,/:;<=>?@\\[\\]`^{|}~';
    inline.punctuation = edit(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex();

    // sequences em should skip over [title](link), `code`, <html>
    inline.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
    // lookbehind is not available on Safari as of version 16
    // inline.escapedEmSt = /(?<=(?:^|[^\\)(?:\\[^])*)\\[*_]/g;
    inline.escapedEmSt = /(?:^|[^\\])(?:\\\\)*\\[*_]/g;

    inline._comment = edit(block._comment).replace('(?:-->|$)', '-->').getRegex();

    inline.emStrong.lDelim = edit(inline.emStrong.lDelim)
      .replace(/punct/g, inline._punctuation)
      .getRegex();

    inline.emStrong.rDelimAst = edit(inline.emStrong.rDelimAst, 'g')
      .replace(/punct/g, inline._punctuation)
      .getRegex();

    inline.emStrong.rDelimUnd = edit(inline.emStrong.rDelimUnd, 'g')
      .replace(/punct/g, inline._punctuation)
      .getRegex();

    inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;

    inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
    inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
    inline.autolink = edit(inline.autolink)
      .replace('scheme', inline._scheme)
      .replace('email', inline._email)
      .getRegex();

    inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;

    inline.tag = edit(inline.tag)
      .replace('comment', inline._comment)
      .replace('attribute', inline._attribute)
      .getRegex();

    inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
    inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
    inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;

    inline.link = edit(inline.link)
      .replace('label', inline._label)
      .replace('href', inline._href)
      .replace('title', inline._title)
      .getRegex();

    inline.reflink = edit(inline.reflink)
      .replace('label', inline._label)
      .replace('ref', block._label)
      .getRegex();

    inline.nolink = edit(inline.nolink)
      .replace('ref', block._label)
      .getRegex();

    inline.reflinkSearch = edit(inline.reflinkSearch, 'g')
      .replace('reflink', inline.reflink)
      .replace('nolink', inline.nolink)
      .getRegex();

    /**
     * Normal Inline Grammar
     */

    inline.normal = { ...inline };

    /**
     * Pedantic Inline Grammar
     */

    inline.pedantic = {
      ...inline.normal,
      strong: {
        start: /^__|\*\*/,
        middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
        endAst: /\*\*(?!\*)/g,
        endUnd: /__(?!_)/g
      },
      em: {
        start: /^_|\*/,
        middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
        endAst: /\*(?!\*)/g,
        endUnd: /_(?!_)/g
      },
      link: edit(/^!?\[(label)\]\((.*?)\)/)
        .replace('label', inline._label)
        .getRegex(),
      reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
        .replace('label', inline._label)
        .getRegex()
    };

    /**
     * GFM Inline Grammar
     */

    inline.gfm = {
      ...inline.normal,
      escape: edit(inline.escape).replace('])', '~|])').getRegex(),
      _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
      url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
      _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
      del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
      text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
    };

    inline.gfm.url = edit(inline.gfm.url, 'i')
      .replace('email', inline.gfm._extended_email)
      .getRegex();
    /**
     * GFM + Line Breaks Inline Grammar
     */

    inline.breaks = {
      ...inline.gfm,
      br: edit(inline.br).replace('{2,}', '*').getRegex(),
      text: edit(inline.gfm.text)
        .replace('\\b_', '\\b_| {2,}\\n')
        .replace(/\{2,\}/g, '*')
        .getRegex()
    };

    /**
     * smartypants text replacement
     * @param {string} text
     */
    function smartypants(text) {
      return text
        // em-dashes
        .replace(/---/g, '\u2014')
        // en-dashes
        .replace(/--/g, '\u2013')
        // opening singles
        .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
        // closing singles & apostrophes
        .replace(/'/g, '\u2019')
        // opening doubles
        .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
        // closing doubles
        .replace(/"/g, '\u201d')
        // ellipses
        .replace(/\.{3}/g, '\u2026');
    }

    /**
     * mangle email addresses
     * @param {string} text
     */
    function mangle(text) {
      let out = '',
        i,
        ch;

      const l = text.length;
      for (i = 0; i < l; i++) {
        ch = text.charCodeAt(i);
        if (Math.random() > 0.5) {
          ch = 'x' + ch.toString(16);
        }
        out += '&#' + ch + ';';
      }

      return out;
    }

    /**
     * Block Lexer
     */
    class Lexer {
      constructor(options) {
        this.tokens = [];
        this.tokens.links = Object.create(null);
        this.options = options || defaults;
        this.options.tokenizer = this.options.tokenizer || new Tokenizer();
        this.tokenizer = this.options.tokenizer;
        this.tokenizer.options = this.options;
        this.tokenizer.lexer = this;
        this.inlineQueue = [];
        this.state = {
          inLink: false,
          inRawBlock: false,
          top: true
        };

        const rules = {
          block: block.normal,
          inline: inline.normal
        };

        if (this.options.pedantic) {
          rules.block = block.pedantic;
          rules.inline = inline.pedantic;
        } else if (this.options.gfm) {
          rules.block = block.gfm;
          if (this.options.breaks) {
            rules.inline = inline.breaks;
          } else {
            rules.inline = inline.gfm;
          }
        }
        this.tokenizer.rules = rules;
      }

      /**
       * Expose Rules
       */
      static get rules() {
        return {
          block,
          inline
        };
      }

      /**
       * Static Lex Method
       */
      static lex(src, options) {
        const lexer = new Lexer(options);
        return lexer.lex(src);
      }

      /**
       * Static Lex Inline Method
       */
      static lexInline(src, options) {
        const lexer = new Lexer(options);
        return lexer.inlineTokens(src);
      }

      /**
       * Preprocessing
       */
      lex(src) {
        src = src
          .replace(/\r\n|\r/g, '\n');

        this.blockTokens(src, this.tokens);

        let next;
        while (next = this.inlineQueue.shift()) {
          this.inlineTokens(next.src, next.tokens);
        }

        return this.tokens;
      }

      /**
       * Lexing
       */
      blockTokens(src, tokens = []) {
        if (this.options.pedantic) {
          src = src.replace(/\t/g, '    ').replace(/^ +$/gm, '');
        } else {
          src = src.replace(/^( *)(\t+)/gm, (_, leading, tabs) => {
            return leading + '    '.repeat(tabs.length);
          });
        }

        let token, lastToken, cutSrc, lastParagraphClipped;

        while (src) {
          if (this.options.extensions
            && this.options.extensions.block
            && this.options.extensions.block.some((extTokenizer) => {
              if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                return true;
              }
              return false;
            })) {
            continue;
          }

          // newline
          if (token = this.tokenizer.space(src)) {
            src = src.substring(token.raw.length);
            if (token.raw.length === 1 && tokens.length > 0) {
              // if there's a single \n as a spacer, it's terminating the last line,
              // so move it there so that we don't get unecessary paragraph tags
              tokens[tokens.length - 1].raw += '\n';
            } else {
              tokens.push(token);
            }
            continue;
          }

          // code
          if (token = this.tokenizer.code(src)) {
            src = src.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            // An indented code block cannot interrupt a paragraph.
            if (lastToken && (lastToken.type === 'paragraph' || lastToken.type === 'text')) {
              lastToken.raw += '\n' + token.raw;
              lastToken.text += '\n' + token.text;
              this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
            } else {
              tokens.push(token);
            }
            continue;
          }

          // fences
          if (token = this.tokenizer.fences(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // heading
          if (token = this.tokenizer.heading(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // hr
          if (token = this.tokenizer.hr(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // blockquote
          if (token = this.tokenizer.blockquote(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // list
          if (token = this.tokenizer.list(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // html
          if (token = this.tokenizer.html(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // def
          if (token = this.tokenizer.def(src)) {
            src = src.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (lastToken && (lastToken.type === 'paragraph' || lastToken.type === 'text')) {
              lastToken.raw += '\n' + token.raw;
              lastToken.text += '\n' + token.raw;
              this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
            } else if (!this.tokens.links[token.tag]) {
              this.tokens.links[token.tag] = {
                href: token.href,
                title: token.title
              };
            }
            continue;
          }

          // table (gfm)
          if (token = this.tokenizer.table(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // lheading
          if (token = this.tokenizer.lheading(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // top-level paragraph
          // prevent paragraph consuming extensions by clipping 'src' to extension start
          cutSrc = src;
          if (this.options.extensions && this.options.extensions.startBlock) {
            let startIndex = Infinity;
            const tempSrc = src.slice(1);
            let tempStart;
            this.options.extensions.startBlock.forEach(function(getStartIndex) {
              tempStart = getStartIndex.call({ lexer: this }, tempSrc);
              if (typeof tempStart === 'number' && tempStart >= 0) { startIndex = Math.min(startIndex, tempStart); }
            });
            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src.substring(0, startIndex + 1);
            }
          }
          if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
            lastToken = tokens[tokens.length - 1];
            if (lastParagraphClipped && lastToken.type === 'paragraph') {
              lastToken.raw += '\n' + token.raw;
              lastToken.text += '\n' + token.text;
              this.inlineQueue.pop();
              this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
            } else {
              tokens.push(token);
            }
            lastParagraphClipped = (cutSrc.length !== src.length);
            src = src.substring(token.raw.length);
            continue;
          }

          // text
          if (token = this.tokenizer.text(src)) {
            src = src.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (lastToken && lastToken.type === 'text') {
              lastToken.raw += '\n' + token.raw;
              lastToken.text += '\n' + token.text;
              this.inlineQueue.pop();
              this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
            } else {
              tokens.push(token);
            }
            continue;
          }

          if (src) {
            const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
            if (this.options.silent) {
              console.error(errMsg);
              break;
            } else {
              throw new Error(errMsg);
            }
          }
        }

        this.state.top = true;
        return tokens;
      }

      inline(src, tokens = []) {
        this.inlineQueue.push({ src, tokens });
        return tokens;
      }

      /**
       * Lexing/Compiling
       */
      inlineTokens(src, tokens = []) {
        let token, lastToken, cutSrc;

        // String with links masked to avoid interference with em and strong
        let maskedSrc = src;
        let match;
        let keepPrevChar, prevChar;

        // Mask out reflinks
        if (this.tokens.links) {
          const links = Object.keys(this.tokens.links);
          if (links.length > 0) {
            while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
              if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
                maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
              }
            }
          }
        }
        // Mask out other blocks
        while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
          maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
        }

        // Mask out escaped em & strong delimiters
        while ((match = this.tokenizer.rules.inline.escapedEmSt.exec(maskedSrc)) != null) {
          maskedSrc = maskedSrc.slice(0, match.index + match[0].length - 2) + '++' + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
          this.tokenizer.rules.inline.escapedEmSt.lastIndex--;
        }

        while (src) {
          if (!keepPrevChar) {
            prevChar = '';
          }
          keepPrevChar = false;

          // extensions
          if (this.options.extensions
            && this.options.extensions.inline
            && this.options.extensions.inline.some((extTokenizer) => {
              if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
                src = src.substring(token.raw.length);
                tokens.push(token);
                return true;
              }
              return false;
            })) {
            continue;
          }

          // escape
          if (token = this.tokenizer.escape(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // tag
          if (token = this.tokenizer.tag(src)) {
            src = src.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (lastToken && token.type === 'text' && lastToken.type === 'text') {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }

          // link
          if (token = this.tokenizer.link(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // reflink, nolink
          if (token = this.tokenizer.reflink(src, this.tokens.links)) {
            src = src.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (lastToken && token.type === 'text' && lastToken.type === 'text') {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }

          // em & strong
          if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // code
          if (token = this.tokenizer.codespan(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // br
          if (token = this.tokenizer.br(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // del (gfm)
          if (token = this.tokenizer.del(src)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // autolink
          if (token = this.tokenizer.autolink(src, mangle)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // url (gfm)
          if (!this.state.inLink && (token = this.tokenizer.url(src, mangle))) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            continue;
          }

          // text
          // prevent inlineText consuming extensions by clipping 'src' to extension start
          cutSrc = src;
          if (this.options.extensions && this.options.extensions.startInline) {
            let startIndex = Infinity;
            const tempSrc = src.slice(1);
            let tempStart;
            this.options.extensions.startInline.forEach(function(getStartIndex) {
              tempStart = getStartIndex.call({ lexer: this }, tempSrc);
              if (typeof tempStart === 'number' && tempStart >= 0) { startIndex = Math.min(startIndex, tempStart); }
            });
            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src.substring(0, startIndex + 1);
            }
          }
          if (token = this.tokenizer.inlineText(cutSrc, smartypants)) {
            src = src.substring(token.raw.length);
            if (token.raw.slice(-1) !== '_') { // Track prevChar before string of ____ started
              prevChar = token.raw.slice(-1);
            }
            keepPrevChar = true;
            lastToken = tokens[tokens.length - 1];
            if (lastToken && lastToken.type === 'text') {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }

          if (src) {
            const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
            if (this.options.silent) {
              console.error(errMsg);
              break;
            } else {
              throw new Error(errMsg);
            }
          }
        }

        return tokens;
      }
    }

    /**
     * Renderer
     */
    class Renderer {
      constructor(options) {
        this.options = options || defaults;
      }

      code(code, infostring, escaped) {
        const lang = (infostring || '').match(/\S*/)[0];
        if (this.options.highlight) {
          const out = this.options.highlight(code, lang);
          if (out != null && out !== code) {
            escaped = true;
            code = out;
          }
        }

        code = code.replace(/\n$/, '') + '\n';

        if (!lang) {
          return '<pre><code>'
            + (escaped ? code : escape(code, true))
            + '</code></pre>\n';
        }

        return '<pre><code class="'
          + this.options.langPrefix
          + escape(lang)
          + '">'
          + (escaped ? code : escape(code, true))
          + '</code></pre>\n';
      }

      /**
       * @param {string} quote
       */
      blockquote(quote) {
        return `<blockquote>\n${quote}</blockquote>\n`;
      }

      html(html) {
        return html;
      }

      /**
       * @param {string} text
       * @param {string} level
       * @param {string} raw
       * @param {any} slugger
       */
      heading(text, level, raw, slugger) {
        if (this.options.headerIds) {
          const id = this.options.headerPrefix + slugger.slug(raw);
          return `<h${level} id="${id}">${text}</h${level}>\n`;
        }

        // ignore IDs
        return `<h${level}>${text}</h${level}>\n`;
      }

      hr() {
        return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
      }

      list(body, ordered, start) {
        const type = ordered ? 'ol' : 'ul',
          startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
        return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
      }

      /**
       * @param {string} text
       */
      listitem(text) {
        return `<li>${text}</li>\n`;
      }

      checkbox(checked) {
        return '<input '
          + (checked ? 'checked="" ' : '')
          + 'disabled="" type="checkbox"'
          + (this.options.xhtml ? ' /' : '')
          + '> ';
      }

      /**
       * @param {string} text
       */
      paragraph(text) {
        return `<p>${text}</p>\n`;
      }

      /**
       * @param {string} header
       * @param {string} body
       */
      table(header, body) {
        if (body) body = `<tbody>${body}</tbody>`;

        return '<table>\n'
          + '<thead>\n'
          + header
          + '</thead>\n'
          + body
          + '</table>\n';
      }

      /**
       * @param {string} content
       */
      tablerow(content) {
        return `<tr>\n${content}</tr>\n`;
      }

      tablecell(content, flags) {
        const type = flags.header ? 'th' : 'td';
        const tag = flags.align
          ? `<${type} align="${flags.align}">`
          : `<${type}>`;
        return tag + content + `</${type}>\n`;
      }

      /**
       * span level renderer
       * @param {string} text
       */
      strong(text) {
        return `<strong>${text}</strong>`;
      }

      /**
       * @param {string} text
       */
      em(text) {
        return `<em>${text}</em>`;
      }

      /**
       * @param {string} text
       */
      codespan(text) {
        return `<code>${text}</code>`;
      }

      br() {
        return this.options.xhtml ? '<br/>' : '<br>';
      }

      /**
       * @param {string} text
       */
      del(text) {
        return `<del>${text}</del>`;
      }

      /**
       * @param {string} href
       * @param {string} title
       * @param {string} text
       */
      link(href, title, text) {
        href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
        if (href === null) {
          return text;
        }
        let out = '<a href="' + href + '"';
        if (title) {
          out += ' title="' + title + '"';
        }
        out += '>' + text + '</a>';
        return out;
      }

      /**
       * @param {string} href
       * @param {string} title
       * @param {string} text
       */
      image(href, title, text) {
        href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
        if (href === null) {
          return text;
        }

        let out = `<img src="${href}" alt="${text}"`;
        if (title) {
          out += ` title="${title}"`;
        }
        out += this.options.xhtml ? '/>' : '>';
        return out;
      }

      text(text) {
        return text;
      }
    }

    /**
     * TextRenderer
     * returns only the textual part of the token
     */
    class TextRenderer {
      // no need for block level renderers
      strong(text) {
        return text;
      }

      em(text) {
        return text;
      }

      codespan(text) {
        return text;
      }

      del(text) {
        return text;
      }

      html(text) {
        return text;
      }

      text(text) {
        return text;
      }

      link(href, title, text) {
        return '' + text;
      }

      image(href, title, text) {
        return '' + text;
      }

      br() {
        return '';
      }
    }

    /**
     * Slugger generates header id
     */
    class Slugger {
      constructor() {
        this.seen = {};
      }

      /**
       * @param {string} value
       */
      serialize(value) {
        return value
          .toLowerCase()
          .trim()
          // remove html tags
          .replace(/<[!\/a-z].*?>/ig, '')
          // remove unwanted chars
          .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
          .replace(/\s/g, '-');
      }

      /**
       * Finds the next safe (unique) slug to use
       * @param {string} originalSlug
       * @param {boolean} isDryRun
       */
      getNextSafeSlug(originalSlug, isDryRun) {
        let slug = originalSlug;
        let occurenceAccumulator = 0;
        if (this.seen.hasOwnProperty(slug)) {
          occurenceAccumulator = this.seen[originalSlug];
          do {
            occurenceAccumulator++;
            slug = originalSlug + '-' + occurenceAccumulator;
          } while (this.seen.hasOwnProperty(slug));
        }
        if (!isDryRun) {
          this.seen[originalSlug] = occurenceAccumulator;
          this.seen[slug] = 0;
        }
        return slug;
      }

      /**
       * Convert string to unique id
       * @param {object} [options]
       * @param {boolean} [options.dryrun] Generates the next unique slug without
       * updating the internal accumulator.
       */
      slug(value, options = {}) {
        const slug = this.serialize(value);
        return this.getNextSafeSlug(slug, options.dryrun);
      }
    }

    /**
     * Parsing & Compiling
     */
    class Parser {
      constructor(options) {
        this.options = options || defaults;
        this.options.renderer = this.options.renderer || new Renderer();
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
        this.textRenderer = new TextRenderer();
        this.slugger = new Slugger();
      }

      /**
       * Static Parse Method
       */
      static parse(tokens, options) {
        const parser = new Parser(options);
        return parser.parse(tokens);
      }

      /**
       * Static Parse Inline Method
       */
      static parseInline(tokens, options) {
        const parser = new Parser(options);
        return parser.parseInline(tokens);
      }

      /**
       * Parse Loop
       */
      parse(tokens, top = true) {
        let out = '',
          i,
          j,
          k,
          l2,
          l3,
          row,
          cell,
          header,
          body,
          token,
          ordered,
          start,
          loose,
          itemBody,
          item,
          checked,
          task,
          checkbox,
          ret;

        const l = tokens.length;
        for (i = 0; i < l; i++) {
          token = tokens[i];

          // Run any renderer extensions
          if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
            ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
            if (ret !== false || !['space', 'hr', 'heading', 'code', 'table', 'blockquote', 'list', 'html', 'paragraph', 'text'].includes(token.type)) {
              out += ret || '';
              continue;
            }
          }

          switch (token.type) {
            case 'space': {
              continue;
            }
            case 'hr': {
              out += this.renderer.hr();
              continue;
            }
            case 'heading': {
              out += this.renderer.heading(
                this.parseInline(token.tokens),
                token.depth,
                unescape$1(this.parseInline(token.tokens, this.textRenderer)),
                this.slugger);
              continue;
            }
            case 'code': {
              out += this.renderer.code(token.text,
                token.lang,
                token.escaped);
              continue;
            }
            case 'table': {
              header = '';

              // header
              cell = '';
              l2 = token.header.length;
              for (j = 0; j < l2; j++) {
                cell += this.renderer.tablecell(
                  this.parseInline(token.header[j].tokens),
                  { header: true, align: token.align[j] }
                );
              }
              header += this.renderer.tablerow(cell);

              body = '';
              l2 = token.rows.length;
              for (j = 0; j < l2; j++) {
                row = token.rows[j];

                cell = '';
                l3 = row.length;
                for (k = 0; k < l3; k++) {
                  cell += this.renderer.tablecell(
                    this.parseInline(row[k].tokens),
                    { header: false, align: token.align[k] }
                  );
                }

                body += this.renderer.tablerow(cell);
              }
              out += this.renderer.table(header, body);
              continue;
            }
            case 'blockquote': {
              body = this.parse(token.tokens);
              out += this.renderer.blockquote(body);
              continue;
            }
            case 'list': {
              ordered = token.ordered;
              start = token.start;
              loose = token.loose;
              l2 = token.items.length;

              body = '';
              for (j = 0; j < l2; j++) {
                item = token.items[j];
                checked = item.checked;
                task = item.task;

                itemBody = '';
                if (item.task) {
                  checkbox = this.renderer.checkbox(checked);
                  if (loose) {
                    if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
                      item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
                      if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                        item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
                      }
                    } else {
                      item.tokens.unshift({
                        type: 'text',
                        text: checkbox
                      });
                    }
                  } else {
                    itemBody += checkbox;
                  }
                }

                itemBody += this.parse(item.tokens, loose);
                body += this.renderer.listitem(itemBody, task, checked);
              }

              out += this.renderer.list(body, ordered, start);
              continue;
            }
            case 'html': {
              // TODO parse inline content if parameter markdown=1
              out += this.renderer.html(token.text);
              continue;
            }
            case 'paragraph': {
              out += this.renderer.paragraph(this.parseInline(token.tokens));
              continue;
            }
            case 'text': {
              body = token.tokens ? this.parseInline(token.tokens) : token.text;
              while (i + 1 < l && tokens[i + 1].type === 'text') {
                token = tokens[++i];
                body += '\n' + (token.tokens ? this.parseInline(token.tokens) : token.text);
              }
              out += top ? this.renderer.paragraph(body) : body;
              continue;
            }

            default: {
              const errMsg = 'Token with "' + token.type + '" type was not found.';
              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
          }
        }

        return out;
      }

      /**
       * Parse Inline Tokens
       */
      parseInline(tokens, renderer) {
        renderer = renderer || this.renderer;
        let out = '',
          i,
          token,
          ret;

        const l = tokens.length;
        for (i = 0; i < l; i++) {
          token = tokens[i];

          // Run any renderer extensions
          if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
            ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
            if (ret !== false || !['escape', 'html', 'link', 'image', 'strong', 'em', 'codespan', 'br', 'del', 'text'].includes(token.type)) {
              out += ret || '';
              continue;
            }
          }

          switch (token.type) {
            case 'escape': {
              out += renderer.text(token.text);
              break;
            }
            case 'html': {
              out += renderer.html(token.text);
              break;
            }
            case 'link': {
              out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
              break;
            }
            case 'image': {
              out += renderer.image(token.href, token.title, token.text);
              break;
            }
            case 'strong': {
              out += renderer.strong(this.parseInline(token.tokens, renderer));
              break;
            }
            case 'em': {
              out += renderer.em(this.parseInline(token.tokens, renderer));
              break;
            }
            case 'codespan': {
              out += renderer.codespan(token.text);
              break;
            }
            case 'br': {
              out += renderer.br();
              break;
            }
            case 'del': {
              out += renderer.del(this.parseInline(token.tokens, renderer));
              break;
            }
            case 'text': {
              out += renderer.text(token.text);
              break;
            }
            default: {
              const errMsg = 'Token with "' + token.type + '" type was not found.';
              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
          }
        }
        return out;
      }
    }

    class Hooks {
      constructor(options) {
        this.options = options || defaults;
      }

      static passThroughHooks = new Set([
        'preprocess',
        'postprocess'
      ]);

      /**
       * Process markdown before marked
       */
      preprocess(markdown) {
        return markdown;
      }

      /**
       * Process HTML after marked is finished
       */
      postprocess(html) {
        return html;
      }
    }

    function onError(silent, async, callback) {
      return (e) => {
        e.message += '\nPlease report this to https://github.com/markedjs/marked.';

        if (silent) {
          const msg = '<p>An error occurred:</p><pre>'
            + escape(e.message + '', true)
            + '</pre>';
          if (async) {
            return Promise.resolve(msg);
          }
          if (callback) {
            callback(null, msg);
            return;
          }
          return msg;
        }

        if (async) {
          return Promise.reject(e);
        }
        if (callback) {
          callback(e);
          return;
        }
        throw e;
      };
    }

    function parseMarkdown(lexer, parser) {
      return (src, opt, callback) => {
        if (typeof opt === 'function') {
          callback = opt;
          opt = null;
        }

        const origOpt = { ...opt };
        opt = { ...marked.defaults, ...origOpt };
        const throwError = onError(opt.silent, opt.async, callback);

        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
          return throwError(new Error('marked(): input parameter is undefined or null'));
        }
        if (typeof src !== 'string') {
          return throwError(new Error('marked(): input parameter is of type '
            + Object.prototype.toString.call(src) + ', string expected'));
        }

        checkSanitizeDeprecation(opt);

        if (opt.hooks) {
          opt.hooks.options = opt;
        }

        if (callback) {
          const highlight = opt.highlight;
          let tokens;

          try {
            if (opt.hooks) {
              src = opt.hooks.preprocess(src);
            }
            tokens = lexer(src, opt);
          } catch (e) {
            return throwError(e);
          }

          const done = function(err) {
            let out;

            if (!err) {
              try {
                if (opt.walkTokens) {
                  marked.walkTokens(tokens, opt.walkTokens);
                }
                out = parser(tokens, opt);
                if (opt.hooks) {
                  out = opt.hooks.postprocess(out);
                }
              } catch (e) {
                err = e;
              }
            }

            opt.highlight = highlight;

            return err
              ? throwError(err)
              : callback(null, out);
          };

          if (!highlight || highlight.length < 3) {
            return done();
          }

          delete opt.highlight;

          if (!tokens.length) return done();

          let pending = 0;
          marked.walkTokens(tokens, function(token) {
            if (token.type === 'code') {
              pending++;
              setTimeout(() => {
                highlight(token.text, token.lang, function(err, code) {
                  if (err) {
                    return done(err);
                  }
                  if (code != null && code !== token.text) {
                    token.text = code;
                    token.escaped = true;
                  }

                  pending--;
                  if (pending === 0) {
                    done();
                  }
                });
              }, 0);
            }
          });

          if (pending === 0) {
            done();
          }

          return;
        }

        if (opt.async) {
          return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src)
            .then(src => lexer(src, opt))
            .then(tokens => opt.walkTokens ? Promise.all(marked.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens)
            .then(tokens => parser(tokens, opt))
            .then(html => opt.hooks ? opt.hooks.postprocess(html) : html)
            .catch(throwError);
        }

        try {
          if (opt.hooks) {
            src = opt.hooks.preprocess(src);
          }
          const tokens = lexer(src, opt);
          if (opt.walkTokens) {
            marked.walkTokens(tokens, opt.walkTokens);
          }
          let html = parser(tokens, opt);
          if (opt.hooks) {
            html = opt.hooks.postprocess(html);
          }
          return html;
        } catch (e) {
          return throwError(e);
        }
      };
    }

    /**
     * Marked
     */
    function marked(src, opt, callback) {
      return parseMarkdown(Lexer.lex, Parser.parse)(src, opt, callback);
    }

    /**
     * Options
     */

    marked.options =
    marked.setOptions = function(opt) {
      marked.defaults = { ...marked.defaults, ...opt };
      changeDefaults(marked.defaults);
      return marked;
    };

    marked.getDefaults = getDefaults;

    marked.defaults = defaults;

    /**
     * Use Extension
     */

    marked.use = function(...args) {
      const extensions = marked.defaults.extensions || { renderers: {}, childTokens: {} };

      args.forEach((pack) => {
        // copy options to new object
        const opts = { ...pack };

        // set async to true if it was set to true before
        opts.async = marked.defaults.async || opts.async || false;

        // ==-- Parse "addon" extensions --== //
        if (pack.extensions) {
          pack.extensions.forEach((ext) => {
            if (!ext.name) {
              throw new Error('extension name required');
            }
            if (ext.renderer) { // Renderer extensions
              const prevRenderer = extensions.renderers[ext.name];
              if (prevRenderer) {
                // Replace extension with func to run new extension but fall back if false
                extensions.renderers[ext.name] = function(...args) {
                  let ret = ext.renderer.apply(this, args);
                  if (ret === false) {
                    ret = prevRenderer.apply(this, args);
                  }
                  return ret;
                };
              } else {
                extensions.renderers[ext.name] = ext.renderer;
              }
            }
            if (ext.tokenizer) { // Tokenizer Extensions
              if (!ext.level || (ext.level !== 'block' && ext.level !== 'inline')) {
                throw new Error("extension level must be 'block' or 'inline'");
              }
              if (extensions[ext.level]) {
                extensions[ext.level].unshift(ext.tokenizer);
              } else {
                extensions[ext.level] = [ext.tokenizer];
              }
              if (ext.start) { // Function to check for start of token
                if (ext.level === 'block') {
                  if (extensions.startBlock) {
                    extensions.startBlock.push(ext.start);
                  } else {
                    extensions.startBlock = [ext.start];
                  }
                } else if (ext.level === 'inline') {
                  if (extensions.startInline) {
                    extensions.startInline.push(ext.start);
                  } else {
                    extensions.startInline = [ext.start];
                  }
                }
              }
            }
            if (ext.childTokens) { // Child tokens to be visited by walkTokens
              extensions.childTokens[ext.name] = ext.childTokens;
            }
          });
          opts.extensions = extensions;
        }

        // ==-- Parse "overwrite" extensions --== //
        if (pack.renderer) {
          const renderer = marked.defaults.renderer || new Renderer();
          for (const prop in pack.renderer) {
            const prevRenderer = renderer[prop];
            // Replace renderer with func to run extension, but fall back if false
            renderer[prop] = (...args) => {
              let ret = pack.renderer[prop].apply(renderer, args);
              if (ret === false) {
                ret = prevRenderer.apply(renderer, args);
              }
              return ret;
            };
          }
          opts.renderer = renderer;
        }
        if (pack.tokenizer) {
          const tokenizer = marked.defaults.tokenizer || new Tokenizer();
          for (const prop in pack.tokenizer) {
            const prevTokenizer = tokenizer[prop];
            // Replace tokenizer with func to run extension, but fall back if false
            tokenizer[prop] = (...args) => {
              let ret = pack.tokenizer[prop].apply(tokenizer, args);
              if (ret === false) {
                ret = prevTokenizer.apply(tokenizer, args);
              }
              return ret;
            };
          }
          opts.tokenizer = tokenizer;
        }

        // ==-- Parse Hooks extensions --== //
        if (pack.hooks) {
          const hooks = marked.defaults.hooks || new Hooks();
          for (const prop in pack.hooks) {
            const prevHook = hooks[prop];
            if (Hooks.passThroughHooks.has(prop)) {
              hooks[prop] = (arg) => {
                if (marked.defaults.async) {
                  return Promise.resolve(pack.hooks[prop].call(hooks, arg)).then(ret => {
                    return prevHook.call(hooks, ret);
                  });
                }

                const ret = pack.hooks[prop].call(hooks, arg);
                return prevHook.call(hooks, ret);
              };
            } else {
              hooks[prop] = (...args) => {
                let ret = pack.hooks[prop].apply(hooks, args);
                if (ret === false) {
                  ret = prevHook.apply(hooks, args);
                }
                return ret;
              };
            }
          }
          opts.hooks = hooks;
        }

        // ==-- Parse WalkTokens extensions --== //
        if (pack.walkTokens) {
          const walkTokens = marked.defaults.walkTokens;
          opts.walkTokens = function(token) {
            let values = [];
            values.push(pack.walkTokens.call(this, token));
            if (walkTokens) {
              values = values.concat(walkTokens.call(this, token));
            }
            return values;
          };
        }

        marked.setOptions(opts);
      });
    };

    /**
     * Run callback for every token
     */

    marked.walkTokens = function(tokens, callback) {
      let values = [];
      for (const token of tokens) {
        values = values.concat(callback.call(marked, token));
        switch (token.type) {
          case 'table': {
            for (const cell of token.header) {
              values = values.concat(marked.walkTokens(cell.tokens, callback));
            }
            for (const row of token.rows) {
              for (const cell of row) {
                values = values.concat(marked.walkTokens(cell.tokens, callback));
              }
            }
            break;
          }
          case 'list': {
            values = values.concat(marked.walkTokens(token.items, callback));
            break;
          }
          default: {
            if (marked.defaults.extensions && marked.defaults.extensions.childTokens && marked.defaults.extensions.childTokens[token.type]) { // Walk any extensions
              marked.defaults.extensions.childTokens[token.type].forEach(function(childTokens) {
                values = values.concat(marked.walkTokens(token[childTokens], callback));
              });
            } else if (token.tokens) {
              values = values.concat(marked.walkTokens(token.tokens, callback));
            }
          }
        }
      }
      return values;
    };

    /**
     * Parse Inline
     * @param {string} src
     */
    marked.parseInline = parseMarkdown(Lexer.lexInline, Parser.parseInline);

    /**
     * Expose
     */
    marked.Parser = Parser;
    marked.parser = Parser.parse;
    marked.Renderer = Renderer;
    marked.TextRenderer = TextRenderer;
    marked.Lexer = Lexer;
    marked.lexer = Lexer.lex;
    marked.Tokenizer = Tokenizer;
    marked.Slugger = Slugger;
    marked.Hooks = Hooks;
    marked.parse = marked;

    marked.options;
    marked.setOptions;
    marked.use;
    marked.walkTokens;
    marked.parseInline;
    Parser.parse;
    Lexer.lex;

    /* src\shared\markdown.svelte generated by Svelte v3.58.0 */
    const file$1 = "src\\shared\\markdown.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let raw_value = /*_marked*/ ctx[1](/*source*/ ctx[0]) + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			this.c = noop$1;
    			attr_dev(div, "class", "markdown");
    			add_location(div, file$1, 7, 0, 165);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*source*/ 1 && raw_value !== (raw_value = /*_marked*/ ctx[1](/*source*/ ctx[0]) + "")) div.innerHTML = raw_value;		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-markdown', slots, []);
    	let _marked = marked;
    	let { source = "" } = $$props;
    	const writable_props = ['source'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-markdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('source' in $$props) $$invalidate(0, source = $$props.source);
    	};

    	$$self.$capture_state = () => ({ marked, _marked, source });

    	$$self.$inject_state = $$props => {
    		if ('_marked' in $$props) $$invalidate(1, _marked = $$props._marked);
    		if ('source' in $$props) $$invalidate(0, source = $$props.source);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [source, _marked];
    }

    class Markdown extends SvelteElement {
    	constructor(options) {
    		super();

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{ source: 0 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["source"];
    	}

    	get source() {
    		return this.$$.ctx[0];
    	}

    	set source(source) {
    		this.$$set({ source });
    		flush();
    	}
    }

    customElements.define("assistant-apps-markdown", Markdown);

    /* src\shared\tooltip.svelte generated by Svelte v3.58.0 */

    const file = "src\\shared\\tooltip.svelte";

    function create_fragment(ctx) {
    	let div;
    	let slot;
    	let t0;
    	let span;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			slot = element("slot");
    			t0 = space();
    			span = element("span");
    			t1 = text(/*tooltiptext*/ ctx[0]);
    			this.c = noop$1;
    			add_location(slot, file, 6, 4, 139);
    			attr_dev(span, "class", "tooltiptext");
    			add_location(span, file, 7, 4, 153);
    			attr_dev(div, "class", "tooltip");
    			add_location(div, file, 5, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, slot);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tooltiptext*/ 1) set_data_dev(t1, /*tooltiptext*/ ctx[0]);
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-tooltip', slots, []);
    	let { tooltiptext = "" } = $$props;
    	const writable_props = ['tooltiptext'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-tooltip> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tooltiptext' in $$props) $$invalidate(0, tooltiptext = $$props.tooltiptext);
    	};

    	$$self.$capture_state = () => ({ tooltiptext });

    	$$self.$inject_state = $$props => {
    		if ('tooltiptext' in $$props) $$invalidate(0, tooltiptext = $$props.tooltiptext);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tooltiptext];
    }

    class Tooltip extends SvelteElement {
    	constructor(options) {
    		super();
    		const style = document.createElement('style');

    		style.textContent = `.tooltip{position:relative;display:inline-block}.tooltip .tooltiptext{left:50%;bottom:120%;min-width:100px;margin-left:-50%;visibility:hidden;background-color:var(
            --assistantapps-tooltip-background-colour,
            #383838
        );color:var(--assistantapps-tooltip-text-colour, #ffffff);text-align:center;border-radius:6px;padding:0.25em 0.5em;position:absolute;z-index:1}.tooltip:hover .tooltiptext{visibility:visible}`;

    		this.shadowRoot.appendChild(style);

    		init$9(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{ tooltiptext: 0 },
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["tooltiptext"];
    	}

    	get tooltiptext() {
    		return this.$$.ctx[0];
    	}

    	set tooltiptext(tooltiptext) {
    		this.$$set({ tooltiptext });
    		flush();
    	}
    }

    customElements.define("assistant-apps-tooltip", Tooltip);

    console.log(`AssistantApps.WebComponents v${currentVersion}`);

})();
//# sourceMappingURL=bundle.js.map
