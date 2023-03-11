
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
    'use strict';

    const currentVersion = '1.1.4';

    function noop() { }
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
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
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
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
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
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
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
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
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
        if (text.wholeText === data)
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

    var NetworkState;
    (function (NetworkState) {
        NetworkState[NetworkState["Loading"] = 0] = "Loading";
        NetworkState[NetworkState["Success"] = 1] = "Success";
        NetworkState[NetworkState["Error"] = 2] = "Error";
    })(NetworkState || (NetworkState = {}));

    const useApiCall = async (apiCall) => {
        const appListResult = await apiCall();
        if (appListResult.isSuccess == false || appListResult.value == null) {
            return [
                NetworkState.Error,
                [],
            ];
        }
        return [
            NetworkState.Success,
            appListResult.value,
        ];
    };

    const anyObject = {};

    class BaseApiService {
        constructor(newBaseUrl) {
            var _a, _b;
            this._baseUrl = (_b = (_a = window.config) === null || _a === void 0 ? void 0 : _a.apiUrl) !== null && _b !== void 0 ? _b : 'https://api.assistantapps.com';
            if (newBaseUrl != null)
                this._baseUrl = newBaseUrl;
        }
        async get(url) {
            try {
                const result = await fetch(`${this._baseUrl}/${url}`);
                const content = await result.json();
                return {
                    isSuccess: true,
                    value: content,
                    errorMessage: ''
                };
            }
            catch (ex) {
                return {
                    isSuccess: false,
                    value: anyObject,
                    errorMessage: ex.message
                };
            }
        }
        async post(url, payload, customMapper) {
            try {
                const result = await fetch(`${this._baseUrl}/${url}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                });
                const content = await result.json();
                if (customMapper != null)
                    return customMapper(content);
                return {
                    isSuccess: true,
                    value: content,
                    errorMessage: ''
                };
            }
            catch (ex) {
                return {
                    isSuccess: false,
                    value: anyObject,
                    errorMessage: ex.message
                };
            }
        }
    }

    class AssistantAppsApiService extends BaseApiService {
        constructor() {
            var _a;
            super((_a = window.config) === null || _a === void 0 ? void 0 : _a.assistantAppsUrl);
            this.getApps = () => this.get('app');
            this.getAppNotices = (appGuid, langCode) => this.get(`appNotice/${appGuid}/${langCode}`);
            this.getDonators = () => this.get('donation');
            this.getLanguages = () => this.get('language');
            this.getPatronsList = () => this.get('patreon');
            this.getTeamMembersList = () => this.get('teammember');
            this.getTranslators = () => this.post('translationStats/TranslatorLeaderboard', anyObject);
        }
        async getWhatIsNewItems(search) {
            const result = await this.post('Version/Search', search);
            return result.value;
        }
    }

    /* src\module\apps\appList.svelte generated by Svelte v3.48.0 */

    const file$l = "src\\module\\apps\\appList.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (24:2) {#if $$slots.loading != null}
    function create_if_block_1$8(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$l, 23, 31, 943);
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
    		source: "(24:2) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (25:2) {#if $$slots.error != null}
    function create_if_block$b(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$l, 24, 29, 1017);
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
    		source: "(25:2) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#each items as item}
    function create_each_block$8(ctx) {
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
    			add_location(assistant_apps_app_tile, file$l, 27, 6, 1161);
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
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(27:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
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
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
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

    			this.c = noop;
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container apps-container noselect");
    			add_location(div, file$l, 25, 2, 1060);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$l, 22, 0, 858);
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
    				each_blocks[i].m(div, null);
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

    			if (dirty & /*networkState*/ 1) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_loading);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
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
    	validate_slots('assistant-apps-apps-list', slots, []);
    	const $$slots = compute_slots(slots);
    	let networkState = NetworkState.Loading;
    	let items = [];

    	onMount(async () => {
    		const aaApi = new AssistantAppsApiService();
    		const [localNetworkState, localItemList] = await useApiCall(aaApi.getApps);

    		if (localNetworkState == NetworkState.Error) {
    			$$invalidate(0, networkState = localNetworkState);
    			return;
    		}

    		const localApps = localItemList.filter(app => app.isVisible);
    		localApps.sort((a, b) => a.sortOrder - b.sortOrder);
    		$$invalidate(1, items = [...localApps]);
    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-apps-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		useApiCall,
    		AssistantAppsApiService,
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:1em;row-gap:1em;margin-bottom:3em}@media only screen and (max-width: 1300px){.grid-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 800px){.grid-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}.apps-container{grid-template-columns:repeat(3, minmax(0, 1fr))}@media only screen and (max-width: 1300px){.apps-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 800px){.apps-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$l,
    			create_fragment$l,
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

    /* src\module\apps\appTile.svelte generated by Svelte v3.48.0 */

    const file$k = "src\\module\\apps\\appTile.svelte";

    function create_fragment$k(ctx) {
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
    			this.c = noop;
    			if (!src_url_equal(img.src, img_src_value = /*logourl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			attr_dev(img, "class", "app-img noselect");
    			add_location(img, file$k, 13, 2, 386);
    			add_location(span0, file$k, 16, 6, 503);
    			add_location(br, file$k, 16, 57, 554);
    			attr_dev(span1, "class", "highlight");
    			add_location(span1, file$k, 16, 63, 560);
    			attr_dev(h2, "class", "app-name");
    			add_location(h2, file$k, 15, 4, 474);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$k, 14, 2, 447);
    			attr_dev(div1, "class", "aa-app");
    			add_location(div1, file$k, 12, 0, 362);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.aa-app{display:flex;height:var(--assistantapps-apps-tile-height, 75px);background-color:var(--assistantapps-apps-background-colour, #6c757d79);border-radius:5px;text-decoration:none;overflow:hidden}.aa-app img.app-img{height:var(--assistantapps-apps-tile-height, 75px);width:var(--assistantapps-apps-tile-height, 75px);object-fit:cover;margin:0}.aa-app .content{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-apps-text-colour, white);padding-left:1em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-app .content .app-name{margin:0;max-width:100%;line-height:110%;overflow-wrap:break-word;white-space:pre-wrap;word-wrap:break-word}.aa-app .content .app-name .highlight{color:var(--assistantapps-apps-text-highlight-colour, #91ccff)}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$k,
    			create_fragment$k,
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

    const getImgRoot = () => { var _a, _b; return (_b = (_a = window === null || window === void 0 ? void 0 : window.config) === null || _a === void 0 ? void 0 : _a.assistantAppsImgRoot) !== null && _b !== void 0 ? _b : ""; };

    /* src\module\appsNotices\appsNoticeListSearch.svelte generated by Svelte v3.48.0 */

    const file$j = "src\\module\\appsNotices\\appsNoticeListSearch.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (66:2) {#if appLookup.length > 0}
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
    		source: "(66:2) {#if appLookup.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (73:10) {#each appLookup as opt}
    function create_each_block_1$2(ctx) {
    	let assistant_apps_dropdown_option;
    	let assistant_apps_dropdown_option_name_value;
    	let assistant_apps_dropdown_option_value_value;
    	let assistant_apps_dropdown_option_iconurl_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*opt*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown_option = element("assistant-apps-dropdown-option");
    			set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value = /*opt*/ ctx[11].name);
    			set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value = /*opt*/ ctx[11].value);
    			set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[11].iconUrl);
    			add_location(assistant_apps_dropdown_option, file$j, 73, 12, 2582);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown_option, anchor);

    			if (!mounted) {
    				dispose = listen_dev(assistant_apps_dropdown_option, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_name_value !== (assistant_apps_dropdown_option_name_value = /*opt*/ ctx[11].name)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value);
    			}

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_value_value !== (assistant_apps_dropdown_option_value_value = /*opt*/ ctx[11].value)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value);
    			}

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_iconurl_value !== (assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[11].iconUrl)) {
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
    		source: "(73:10) {#each appLookup as opt}",
    		ctx
    	});

    	return block;
    }

    // (67:4) {#key selectedAppGuid}
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
    			add_location(div, file$j, 71, 8, 2512);
    			set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedAppGuid*/ ctx[1]);
    			set_custom_element_data(assistant_apps_dropdown, "options", /*appLookup*/ ctx[0]);
    			add_location(assistant_apps_dropdown, file$j, 67, 6, 2399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown, anchor);
    			append_dev(assistant_apps_dropdown, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
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
    		source: "(67:4) {#key selectedAppGuid}",
    		ctx
    	});

    	return block;
    }

    // (87:2) {#if langLookup.length > 0}
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
    		source: "(87:2) {#if langLookup.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (94:10) {#each langLookup as opt}
    function create_each_block$7(ctx) {
    	let assistant_apps_dropdown_option;
    	let assistant_apps_dropdown_option_name_value;
    	let assistant_apps_dropdown_option_value_value;
    	let assistant_apps_dropdown_option_iconurl_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*opt*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown_option = element("assistant-apps-dropdown-option");
    			set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value = /*opt*/ ctx[11].name);
    			set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value = /*opt*/ ctx[11].value);
    			set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[11].iconUrl);
    			add_location(assistant_apps_dropdown_option, file$j, 94, 12, 3171);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown_option, anchor);

    			if (!mounted) {
    				dispose = listen_dev(assistant_apps_dropdown_option, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*langLookup*/ 4 && assistant_apps_dropdown_option_name_value !== (assistant_apps_dropdown_option_name_value = /*opt*/ ctx[11].name)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value);
    			}

    			if (dirty & /*langLookup*/ 4 && assistant_apps_dropdown_option_value_value !== (assistant_apps_dropdown_option_value_value = /*opt*/ ctx[11].value)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value);
    			}

    			if (dirty & /*langLookup*/ 4 && assistant_apps_dropdown_option_iconurl_value !== (assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[11].iconUrl)) {
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
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(94:10) {#each langLookup as opt}",
    		ctx
    	});

    	return block;
    }

    // (88:4) {#key selectedLangCode}
    function create_key_block_2$1(ctx) {
    	let assistant_apps_dropdown;
    	let div;
    	let each_value = /*langLookup*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown = element("assistant-apps-dropdown");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "slot", "options");
    			add_location(div, file$j, 92, 8, 3100);
    			set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedLangCode*/ ctx[3]);
    			set_custom_element_data(assistant_apps_dropdown, "options", /*langLookup*/ ctx[2]);
    			add_location(assistant_apps_dropdown, file$j, 88, 6, 2985);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown, anchor);
    			append_dev(assistant_apps_dropdown, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*langLookup, selectedLangCode*/ 12) {
    				each_value = /*langLookup*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
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
    		source: "(88:4) {#key selectedLangCode}",
    		ctx
    	});

    	return block;
    }

    // (110:4) {#if $$slots.loading != null}
    function create_if_block_2$4(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$j, 109, 33, 3600);
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
    		source: "(110:4) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (111:4) {#if $$slots.error != null}
    function create_if_block_1$7(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$j, 110, 31, 3676);
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
    		source: "(111:4) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (115:10) {#if selectedAppGuid.length > 0 && selectedLangCode.length > 0}
    function create_if_block$a(ctx) {
    	let assistant_apps_app_notice_list;

    	const block = {
    		c: function create() {
    			assistant_apps_app_notice_list = element("assistant-apps-app-notice-list");
    			set_custom_element_data(assistant_apps_app_notice_list, "appguid", /*selectedAppGuid*/ ctx[1]);
    			set_custom_element_data(assistant_apps_app_notice_list, "langcode", /*selectedLangCode*/ ctx[3]);
    			add_location(assistant_apps_app_notice_list, file$j, 115, 12, 3892);
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
    		source: "(115:10) {#if selectedAppGuid.length > 0 && selectedLangCode.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (114:8) {#key selectedLangCode}
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
    		source: "(114:8) {#key selectedLangCode}",
    		ctx
    	});

    	return block;
    }

    // (113:6) {#key selectedAppGuid}
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
    		source: "(113:6) {#key selectedAppGuid}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
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
    			this.c = noop;
    			attr_dev(div0, "slot", "loaded");
    			add_location(div0, file$j, 111, 4, 3721);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[4]);
    			add_location(assistant_apps_loading, file$j, 108, 2, 3513);
    			add_location(div1, file$j, 64, 0, 2328);
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
    		i: noop,
    		o: noop,
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-app-notice-list-search', slots, []);
    	const $$slots = compute_slots(slots);
    	const aaApi = new AssistantAppsApiService();
    	let appLookup = [];
    	let selectedAppGuid = "";
    	let langLookup = [];
    	let selectedLangCode = "";
    	let networkState = NetworkState.Loading;

    	const fetchApps = async () => {
    		const [localNetworkState, localItemList] = await useApiCall(aaApi.getApps);

    		if (localNetworkState == NetworkState.Error) {
    			return localNetworkState;
    		}

    		const localItems = localItemList.filter(app => app.isVisible);
    		localItems.sort((a, b) => a.sortOrder - b.sortOrder);

    		$$invalidate(0, appLookup = localItems.map(a => ({
    			name: a.name,
    			value: a.guid,
    			iconUrl: a.iconUrl
    		})));

    		$$invalidate(1, selectedAppGuid = localItems[0].guid);
    		return NetworkState.Success;
    	};

    	const fetchLanguages = async () => {
    		const [localNetworkState, localItemList] = await useApiCall(aaApi.getLanguages);

    		if (localNetworkState == NetworkState.Error) {
    			return localNetworkState;
    		}

    		const localItems = localItemList.filter(app => app.isVisible);
    		localItems.sort((a, b) => a.sortOrder - b.sortOrder);

    		const enLangHack = {
    			guid: "hack",
    			name: "English",
    			languageCode: "en",
    			countryCode: "gb",
    			sortOrder: 0,
    			isVisible: true
    		};

    		$$invalidate(2, langLookup = [enLangHack, ...localItems].map(a => ({
    			name: a.name,
    			value: a.languageCode,
    			iconUrl: `${getImgRoot()}/assets/img/countryCode/${a.countryCode.toLocaleUpperCase()}.svg`
    		})));

    		$$invalidate(3, selectedLangCode = enLangHack.languageCode);
    		return NetworkState.Success;
    	};

    	onMount(async () => {
    		const fetchAppsState = await fetchApps();
    		const fetchLanguagesState = await fetchLanguages();

    		if (fetchAppsState != NetworkState.Error && fetchLanguagesState != NetworkState.Error) {
    			$$invalidate(4, networkState = NetworkState.Success);
    		} else {
    			$$invalidate(4, networkState = NetworkState.Error);
    		}
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
    		NetworkState,
    		useApiCall,
    		getImgRoot,
    		AssistantAppsApiService,
    		aaApi,
    		appLookup,
    		selectedAppGuid,
    		langLookup,
    		selectedLangCode,
    		networkState,
    		fetchApps,
    		fetchLanguages
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

    		init(
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

    /* src\module\appsNotices\appsNoticeList.svelte generated by Svelte v3.48.0 */

    const file$i = "src\\module\\appsNotices\\appsNoticeList.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (22:2) {#if $$slots.loading != null}
    function create_if_block_2$3(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$i, 21, 31, 917);
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
    		source: "(22:2) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (23:2) {#if $$slots.error != null}
    function create_if_block_1$6(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$i, 22, 29, 991);
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
    		source: "(23:2) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (33:4) {:else}
    function create_else_block$3(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "No Notices to display";
    			add_location(h3, file$i, 33, 6, 1350);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(33:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:4) {#if items.length > 0}
    function create_if_block$9(ctx) {
    	let each_1_anchor;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
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
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
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
    		source: "(25:4) {#if items.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (26:6) {#each items as item}
    function create_each_block$6(ctx) {
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
    			add_location(assistant_apps_app_notice_tile, file$i, 26, 8, 1173);
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
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(26:6) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
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
    			this.c = noop;
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container app-notice-container noselect");
    			add_location(div, file$i, 23, 2, 1034);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$i, 20, 0, 832);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(assistant_apps_loading);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();
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
    	validate_slots('assistant-apps-app-notice-list', slots, []);
    	const $$slots = compute_slots(slots);
    	let { appguid = "" } = $$props;
    	let { langcode = "" } = $$props;
    	let networkState = NetworkState.Loading;
    	let items = [];

    	onMount(async () => {
    		const aaApi = new AssistantAppsApiService();
    		const [localNetworkState, localItemList] = await useApiCall(() => aaApi.getAppNotices(appguid, langcode));
    		const localItems = localItemList.filter(app => app.isVisible);
    		localItems.sort((a, b) => a.sortOrder - b.sortOrder);
    		$$invalidate(1, items = [...localItems]);
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
    		useApiCall,
    		AssistantAppsApiService,
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:1em;row-gap:1em;margin-bottom:3em}@media only screen and (max-width: 1300px){.grid-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 800px){.grid-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}.app-notice-container{grid-template-columns:repeat(3, minmax(0, 1fr))}@media only screen and (max-width: 1300px){.app-notice-container{grid-template-columns:repeat(2, minmax(0, 1fr))}}@media only screen and (max-width: 800px){.app-notice-container{grid-template-columns:repeat(1, minmax(0, 1fr))}}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$i,
    			create_fragment$i,
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

    /* src\module\appsNotices\appsNoticeTile.svelte generated by Svelte v3.48.0 */

    const file$h = "src\\module\\appsNotices\\appsNoticeTile.svelte";

    function create_fragment$h(ctx) {
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
    			this.c = noop;
    			if (!src_url_equal(img.src, img_src_value = /*iconurl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			attr_dev(img, "class", "app-img noselect");
    			add_location(img, file$h, 16, 2, 498);
    			add_location(span0, file$h, 19, 6, 615);
    			add_location(br, file$h, 19, 25, 634);
    			add_location(span1, file$h, 19, 31, 640);
    			attr_dev(h2, "class", "app-name");
    			add_location(h2, file$h, 18, 4, 586);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$h, 17, 2, 559);
    			attr_dev(div1, "class", "aa-app");
    			add_location(div1, file$h, 15, 0, 474);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.aa-app{display:flex;height:var(--assistantapps-app-notice-tile-height, 75px);background-color:var(--assistantapps-app-notice-background-colour, #6c757d79);border-radius:5px;text-decoration:none;overflow:hidden}.aa-app img.app-img{height:var(--assistantapps-app-notice-tile-height, 75px);width:var(--assistantapps-app-notice-tile-height, 75px);object-fit:cover;margin:0}.aa-app .content{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-app-notice-text-colour, white);padding-left:1em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-app .content .app-name{margin:0;max-width:100%;line-height:110%;overflow-wrap:break-word;white-space:pre-wrap;word-wrap:break-word}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$h,
    			create_fragment$h,
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

    /* src\module\badge\badgeSelector.svelte generated by Svelte v3.48.0 */

    const file$g = "src\\module\\badge\\badgeSelector.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (62:4) {#if appLookup.length > 0}
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
    		source: "(62:4) {#if appLookup.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (69:20) {#each appLookup as opt}
    function create_each_block_1$1(ctx) {
    	let assistant_apps_dropdown_option;
    	let assistant_apps_dropdown_option_name_value;
    	let assistant_apps_dropdown_option_value_value;
    	let assistant_apps_dropdown_option_iconurl_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*opt*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown_option = element("assistant-apps-dropdown-option");
    			set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value = /*opt*/ ctx[12].name);
    			set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value = /*opt*/ ctx[12].value);
    			set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[12].iconUrl);
    			add_location(assistant_apps_dropdown_option, file$g, 69, 24, 2346);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown_option, anchor);

    			if (!mounted) {
    				dispose = listen_dev(assistant_apps_dropdown_option, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_name_value !== (assistant_apps_dropdown_option_name_value = /*opt*/ ctx[12].name)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value);
    			}

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_value_value !== (assistant_apps_dropdown_option_value_value = /*opt*/ ctx[12].value)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value);
    			}

    			if (dirty & /*appLookup*/ 1 && assistant_apps_dropdown_option_iconurl_value !== (assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[12].iconUrl)) {
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
    		source: "(69:20) {#each appLookup as opt}",
    		ctx
    	});

    	return block;
    }

    // (63:8) {#key selectedAppGuid}
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
    			add_location(div, file$g, 67, 16, 2254);
    			set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedAppGuid*/ ctx[1]);
    			set_custom_element_data(assistant_apps_dropdown, "options", /*appLookup*/ ctx[0]);
    			add_location(assistant_apps_dropdown, file$g, 63, 12, 2111);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown, anchor);
    			append_dev(assistant_apps_dropdown, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
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
    		source: "(63:8) {#key selectedAppGuid}",
    		ctx
    	});

    	return block;
    }

    // (84:4) {#if platLookup.length > 0}
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
    		source: "(84:4) {#if platLookup.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (91:20) {#each platLookup as opt}
    function create_each_block$5(ctx) {
    	let assistant_apps_dropdown_option;
    	let assistant_apps_dropdown_option_name_value;
    	let assistant_apps_dropdown_option_value_value;
    	let assistant_apps_dropdown_option_iconurl_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*opt*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown_option = element("assistant-apps-dropdown-option");
    			set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value = /*opt*/ ctx[12].name);
    			set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value = /*opt*/ ctx[12].value);
    			set_custom_element_data(assistant_apps_dropdown_option, "iconurl", assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[12].iconUrl);
    			add_location(assistant_apps_dropdown_option, file$g, 91, 24, 3189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown_option, anchor);

    			if (!mounted) {
    				dispose = listen_dev(assistant_apps_dropdown_option, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*platLookup*/ 8 && assistant_apps_dropdown_option_name_value !== (assistant_apps_dropdown_option_name_value = /*opt*/ ctx[12].name)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "name", assistant_apps_dropdown_option_name_value);
    			}

    			if (dirty & /*platLookup*/ 8 && assistant_apps_dropdown_option_value_value !== (assistant_apps_dropdown_option_value_value = /*opt*/ ctx[12].value)) {
    				set_custom_element_data(assistant_apps_dropdown_option, "value", assistant_apps_dropdown_option_value_value);
    			}

    			if (dirty & /*platLookup*/ 8 && assistant_apps_dropdown_option_iconurl_value !== (assistant_apps_dropdown_option_iconurl_value = /*opt*/ ctx[12].iconUrl)) {
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
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(91:20) {#each platLookup as opt}",
    		ctx
    	});

    	return block;
    }

    // (85:8) {#key selectedPlatType}
    function create_key_block_3(ctx) {
    	let assistant_apps_dropdown;
    	let div;
    	let each_value = /*platLookup*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			assistant_apps_dropdown = element("assistant-apps-dropdown");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "slot", "options");
    			add_location(div, file$g, 89, 16, 3096);
    			set_custom_element_data(assistant_apps_dropdown, "selectedvalue", /*selectedPlatType*/ ctx[4]);
    			set_custom_element_data(assistant_apps_dropdown, "options", /*platLookup*/ ctx[3]);
    			add_location(assistant_apps_dropdown, file$g, 85, 12, 2951);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_dropdown, anchor);
    			append_dev(assistant_apps_dropdown, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*platLookup, selectedPlatType*/ 24) {
    				each_value = /*platLookup*/ ctx[3];
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
    		source: "(85:8) {#key selectedPlatType}",
    		ctx
    	});

    	return block;
    }

    // (107:8) {#if $$slots.loading != null}
    function create_if_block_1$5(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$g, 106, 37, 3752);
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
    		source: "(107:8) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (108:8) {#if $$slots.error != null}
    function create_if_block$8(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$g, 107, 35, 3832);
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
    		source: "(108:8) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (111:16) {#key selectedPlatType}
    function create_key_block_2(ctx) {
    	let assistant_apps_review_badge;

    	const block = {
    		c: function create() {
    			assistant_apps_review_badge = element("assistant-apps-review-badge");
    			set_custom_element_data(assistant_apps_review_badge, "apptype", /*selectedAppType*/ ctx[2]);
    			set_custom_element_data(assistant_apps_review_badge, "platform", /*selectedPlatType*/ ctx[4]);
    			add_location(assistant_apps_review_badge, file$g, 111, 20, 3999);
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
    		source: "(111:16) {#key selectedPlatType}",
    		ctx
    	});

    	return block;
    }

    // (110:12) {#key selectedAppType}
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
    		source: "(110:12) {#key selectedAppType}",
    		ctx
    	});

    	return block;
    }

    // (119:12) {#key selectedAppGuid}
    function create_key_block(ctx) {
    	let assistant_apps_version_badge;

    	const block = {
    		c: function create() {
    			assistant_apps_version_badge = element("assistant-apps-version-badge");
    			set_custom_element_data(assistant_apps_version_badge, "appguid", /*selectedAppGuid*/ ctx[1]);
    			add_location(assistant_apps_version_badge, file$g, 119, 16, 4273);
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
    		source: "(119:12) {#key selectedAppGuid}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
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
    			this.c = noop;
    			add_location(br, file$g, 117, 12, 4213);
    			attr_dev(div0, "slot", "loaded");
    			add_location(div0, file$g, 108, 8, 3881);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[5]);
    			add_location(assistant_apps_loading, file$g, 105, 4, 3661);
    			add_location(div1, file$g, 60, 0, 2028);
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
    		i: noop,
    		o: noop,
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-badge-selector', slots, []);
    	const $$slots = compute_slots(slots);
    	const aaApi = new AssistantAppsApiService();
    	let appLookup = [];
    	let selectedAppGuid = "";
    	let selectedAppType = "";
    	let platLookup = [];
    	let selectedPlatType = "";
    	let networkState = NetworkState.Loading;

    	const fetchApps = async () => {
    		const [localNetworkState, localItemList] = await useApiCall(aaApi.getApps);

    		if (localNetworkState == NetworkState.Error) {
    			return localNetworkState;
    		}

    		const localItems = localItemList.filter(app => app.isVisible);
    		localItems.sort((a, b) => a.sortOrder - b.sortOrder);

    		$$invalidate(0, appLookup = localItems.map(a => ({
    			name: a.name,
    			value: a.guid,
    			iconUrl: a.iconUrl
    		})));

    		$$invalidate(1, selectedAppGuid = localItems[0].guid);
    		$$invalidate(2, selectedAppType = "1");
    		return NetworkState.Success;
    	};

    	const setPlatforms = async () => {
    		const localPlatLookup = [
    			{
    				name: "Google Play",
    				value: "1",
    				iconUrl: `${getImgRoot()}/assets/img/platform/android.png`
    			},
    			{
    				name: "Apple App Store",
    				value: "2",
    				iconUrl: `${getImgRoot()}/assets/img/platform/iOS.png`
    			}
    		];

    		$$invalidate(3, platLookup = [...localPlatLookup]);
    		$$invalidate(4, selectedPlatType = platLookup[0].value);
    		return NetworkState.Success;
    	};

    	onMount(async () => {
    		const fetchAppsState = await fetchApps();
    		const setPlatformsState = await setPlatforms();

    		if (fetchAppsState != NetworkState.Error && setPlatformsState != NetworkState.Error) {
    			$$invalidate(5, networkState = NetworkState.Success);
    		} else {
    			$$invalidate(5, networkState = NetworkState.Error);
    		}
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
    		useApiCall,
    		getImgRoot,
    		AssistantAppsApiService,
    		aaApi,
    		appLookup,
    		selectedAppGuid,
    		selectedAppType,
    		platLookup,
    		selectedPlatType,
    		networkState,
    		fetchApps,
    		setPlatforms
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

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$g,
    			create_fragment$g,
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

    /* src\module\badge\reviewBadge.svelte generated by Svelte v3.48.0 */
    const file$f = "src\\module\\badge\\reviewBadge.svelte";

    function create_fragment$f(ctx) {
    	let object;
    	let img;
    	let img_src_value;
    	let object_data_value;

    	const block = {
    		c: function create() {
    			object = element("object");
    			img = element("img");
    			this.c = noop;
    			if (!src_url_equal(img.src, img_src_value = `${getImgRoot()}./assets/img/fallback.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "review-badge");
    			add_location(img, file$f, 12, 2, 338);
    			attr_dev(object, "title", "review-badge");
    			attr_dev(object, "data", object_data_value = `https://api.assistantapps.com/badge/review/${/*apptype*/ ctx[0]}/${/*platform*/ ctx[1]}.svg`);
    			attr_dev(object, "type", "image/jpeg");
    			add_location(object, file$f, 7, 0, 197);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, object, anchor);
    			append_dev(object, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*apptype, platform*/ 3 && object_data_value !== (object_data_value = `https://api.assistantapps.com/badge/review/${/*apptype*/ ctx[0]}/${/*platform*/ ctx[1]}.svg`)) {
    				attr_dev(object, "data", object_data_value);
    			}
    		},
    		i: noop,
    		o: noop,
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
    	validate_slots('assistant-apps-review-badge', slots, []);
    	let { apptype = "" } = $$props;
    	let { platform = "" } = $$props;
    	const writable_props = ['apptype', 'platform'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-review-badge> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('apptype' in $$props) $$invalidate(0, apptype = $$props.apptype);
    		if ('platform' in $$props) $$invalidate(1, platform = $$props.platform);
    	};

    	$$self.$capture_state = () => ({ getImgRoot, apptype, platform });

    	$$self.$inject_state = $$props => {
    		if ('apptype' in $$props) $$invalidate(0, apptype = $$props.apptype);
    		if ('platform' in $$props) $$invalidate(1, platform = $$props.platform);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [apptype, platform];
    }

    class ReviewBadge extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$f,
    			create_fragment$f,
    			safe_not_equal,
    			{ apptype: 0, platform: 1 },
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
    		return ["apptype", "platform"];
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
    }

    customElements.define("assistant-apps-review-badge", ReviewBadge);

    /* src\module\badge\versionBadge.svelte generated by Svelte v3.48.0 */
    const file$e = "src\\module\\badge\\versionBadge.svelte";

    function create_fragment$e(ctx) {
    	let object;
    	let img;
    	let img_src_value;
    	let object_data_value;

    	const block = {
    		c: function create() {
    			object = element("object");
    			img = element("img");
    			this.c = noop;
    			if (!src_url_equal(img.src, img_src_value = `${getImgRoot()}./assets/img/fallback.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "version-badge");
    			add_location(img, file$e, 11, 2, 301);
    			attr_dev(object, "title", "review-badge");
    			attr_dev(object, "data", object_data_value = `https://api.assistantapps.com/badge/version/${/*appguid*/ ctx[0]}.svg`);
    			attr_dev(object, "type", "image/jpeg");
    			add_location(object, file$e, 6, 0, 171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, object, anchor);
    			append_dev(object, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*appguid*/ 1 && object_data_value !== (object_data_value = `https://api.assistantapps.com/badge/version/${/*appguid*/ ctx[0]}.svg`)) {
    				attr_dev(object, "data", object_data_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(object);
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
    	validate_slots('assistant-apps-version-badge', slots, []);
    	let { appguid = "" } = $$props;
    	const writable_props = ['appguid'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-version-badge> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('appguid' in $$props) $$invalidate(0, appguid = $$props.appguid);
    	};

    	$$self.$capture_state = () => ({ getImgRoot, appguid });

    	$$self.$inject_state = $$props => {
    		if ('appguid' in $$props) $$invalidate(0, appguid = $$props.appguid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [appguid];
    }

    class VersionBadge extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$e,
    			create_fragment$e,
    			safe_not_equal,
    			{ appguid: 0 },
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
    		return ["appguid"];
    	}

    	get appguid() {
    		return this.$$.ctx[0];
    	}

    	set appguid(appguid) {
    		this.$$set({ appguid });
    		flush();
    	}
    }

    customElements.define("assistant-apps-version-badge", VersionBadge);

    /* src\module\donators\donatorsList.svelte generated by Svelte v3.48.0 */

    const file$d = "src\\module\\donators\\donatorsList.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (23:2) {#if $$slots.loading != null}
    function create_if_block_1$4(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			attr_dev(slot, "slot", "loading");
    			add_location(slot, file$d, 22, 31, 886);
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
    		source: "(23:2) {#if $$slots.loading != null}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#if $$slots.error != null}
    function create_if_block$7(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "error");
    			attr_dev(slot, "slot", "error");
    			add_location(slot, file$d, 23, 29, 960);
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
    		source: "(24:2) {#if $$slots.error != null}",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#each items as item}
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
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = `${getImgRoot()}/assets/img/donation/${/*item*/ ctx[3].type}.png`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[3].type.toString());
    			attr_dev(img, "class", "donation-img noselect");
    			add_location(img, file$d, 27, 8, 1134);
    			attr_dev(h2, "class", "app-name");
    			add_location(h2, file$d, 33, 10, 1344);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$d, 32, 8, 1311);
    			attr_dev(div1, "class", "aa-donation");
    			add_location(div1, file$d, 26, 6, 1099);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && !src_url_equal(img.src, img_src_value = `${getImgRoot()}/assets/img/donation/${/*item*/ ctx[3].type}.png`)) {
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
    		source: "(26:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let assistant_apps_loading;
    	let t0;
    	let t1;
    	let div;
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
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop;
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container donation-container");
    			add_location(div, file$d, 24, 2, 1003);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$d, 21, 0, 801);
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
    				each_blocks[i].m(div, null);
    			}
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

    			if (dirty & /*items, getImgRoot*/ 2) {
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
    		i: noop,
    		o: noop,
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
    		const aaApi = new AssistantAppsApiService();
    		const [localNetworkState, localItemList] = await useApiCall(aaApi.getDonators);

    		if (localNetworkState == NetworkState.Error) {
    			$$invalidate(0, networkState = localNetworkState);
    			return;
    		}

    		$$invalidate(1, items = localItemList.value);
    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-donators-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		useApiCall,
    		getImgRoot,
    		AssistantAppsApiService,
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:1em;row-gap:1em;margin-bottom:3em}@media only screen and (max-width: 1300px){.grid-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 800px){.grid-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}.donation-container{grid-template-columns:repeat(3, minmax(0, 1fr))}@media only screen and (max-width: 1300px){.donation-container{grid-template-columns:repeat(3, minmax(0, 1fr))}}@media only screen and (max-width: 800px){.donation-container{grid-template-columns:repeat(2, minmax(0, 1fr))}}.aa-donation{display:flex;height:var(--assistantapps-donation-tile-height, 75px);background-color:var(--assistantapps-donation-background-colour, #6c757d79);border-radius:5px;text-decoration:none;overflow:hidden}.aa-donation img.donation-img{height:calc(var(--assistantapps-donation-tile-height, 75px) - 20px);width:calc(var(--assistantapps-donation-tile-height, 75px) - 20px);object-fit:cover;margin:0;padding:10px}.aa-donation .content{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-donation-text-colour, white);padding-left:1em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aa-donation .content .app-name{margin:0;max-width:100%;line-height:110%;overflow-wrap:break-word;white-space:pre-wrap;word-wrap:break-word}</style>`;

    		init(
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

    /* src\module\patreon\patreonList.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1 } = globals;

    const file$c = "src\\module\\patreon\\patreonList.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (33:4) {#each items as patron}
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
    			add_location(assistant_apps_patron_tile, file$c, 33, 6, 1327);
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
    		source: "(33:4) {#each items as patron}",
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

    			this.c = noop;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$c, 29, 2, 1141);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$c, 30, 2, 1183);
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container patreon-container noselect");
    			add_location(div, file$c, 31, 2, 1221);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$c, 28, 0, 1085);
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
    				each_blocks[i].m(div, null);
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
    		i: noop,
    		o: noop,
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
    		const aaApi = new AssistantAppsApiService();
    		const [localNetworkState, localItemList] = await useApiCall(aaApi.getPatronsList);

    		if (localNetworkState == NetworkState.Error) {
    			$$invalidate(0, networkState = localNetworkState);
    			return;
    		}

    		$$invalidate(1, items = [
    			...localItemList.map(p => Object.assign(Object.assign({}, p), { url: undefined })),
    			{
    				name: "Join Patreon",
    				imageUrl: "https://cdn.assistantapps.com/patreon.png",
    				thumbnailUrl: "https://cdn.assistantapps.com/patreon.png",
    				url: "https://patreon.com/AssistantApps"
    			}
    		]);

    		$$invalidate(0, networkState = localNetworkState);
    	});

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-patreon-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		NetworkState,
    		useApiCall,
    		AssistantAppsApiService,
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:1em;row-gap:1em;margin-bottom:3em}@media only screen and (max-width: 1300px){.grid-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 800px){.grid-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}.patreon-container{grid-template-columns:repeat(3, minmax(0, 1fr))}@media only screen and (max-width: 1300px){.patreon-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 800px){.patreon-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}</style>`;

    		init(
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

    /* src\module\patreon\patronTile.svelte generated by Svelte v3.48.0 */

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
    			this.c = noop;
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
    		i: noop,
    		o: noop,
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.patron{display:flex;background-color:var(--assistantapps-patron-background-colour, #6c757d);border-radius:5px;text-decoration:none;overflow:hidden}.patron img.patron-img{height:100px;width:100px;object-fit:cover;margin:0}.patron .patron-name{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-patron-text-colour, white);padding-left:0.5em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>`;

    		init(
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

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*url*/ ctx[0] === undefined && !('url' in props)) {
    			console.warn("<assistant-apps-patron-tile> was created without expected prop 'url'");
    		}

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

    /* src\module\team\teamList.svelte generated by Svelte v3.48.0 */

    const file$a = "src\\module\\team\\teamList.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (25:4) {#each items as teamMember}
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
    			add_location(assistant_apps_team_tile, file$a, 25, 6, 982);
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
    		source: "(25:4) {#each items as teamMember}",
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

    			this.c = noop;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$a, 21, 2, 802);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$a, 22, 2, 844);
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "team-members-container noselect");
    			add_location(div, file$a, 23, 2, 882);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$a, 20, 0, 746);
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
    				each_blocks[i].m(div, null);
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
    		i: noop,
    		o: noop,
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
    		const aaApi = new AssistantAppsApiService();
    		const [localNetworkState, localItemList] = await useApiCall(aaApi.getTeamMembersList);

    		if (localNetworkState == NetworkState.Error) {
    			$$invalidate(0, networkState = localNetworkState);
    			return;
    		}

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
    		useApiCall,
    		AssistantAppsApiService,
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}assistant-apps-team-tile{display:block;margin-bottom:1em;border-bottom:1px solid var(--assistantapps-team-member-background-colour, rgba(255, 255, 255, 0.1))}assistant-apps-team-tile:last-child{border-bottom:none}</style>`;

    		init(
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

    /* src\module\team\teamTile.svelte generated by Svelte v3.48.0 */

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
    			this.c = noop;
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
    		i: noop,
    		o: noop,
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.team-member{display:flex;padding-bottom:1em}.team-member img.team-member-img{width:var(--assistantapps-team-member-tile-size, 75px);height:var(--assistantapps-team-member-tile-size, 75px);border-radius:5px}.team-member .team-member-contents{display:flex;flex-direction:column;justify-content:center;padding-left:1em}.team-member .team-member-name,.team-member .team-member-role{margin:0;padding:0;color:var(--assistantapps-team-member-text-colour, #f0f0f0)}.team-member a{margin:0;padding:0;color:var(--assistantapps-team-member-link-text-colour, #0000ee)}</style>`;

    		init(
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

    /* src\module\translatorLeaderboard\leaderboardList.svelte generated by Svelte v3.48.0 */
    const file$8 = "src\\module\\translatorLeaderboard\\leaderboardList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (29:4) {#each leaderBoardResult.value ?? [] as leaderBoardItem}
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
    			add_location(assistant_apps_translation_leaderboard_tile, file$8, 29, 6, 1276);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_translation_leaderboard_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_username_value !== (assistant_apps_translation_leaderboard_tile_username_value = /*leaderBoardItem*/ ctx[2].username)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "username", assistant_apps_translation_leaderboard_tile_username_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_profileimageurl_value !== (assistant_apps_translation_leaderboard_tile_profileimageurl_value = /*leaderBoardItem*/ ctx[2].profileImageUrl)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "profileimageurl", assistant_apps_translation_leaderboard_tile_profileimageurl_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_numtranslations_value !== (assistant_apps_translation_leaderboard_tile_numtranslations_value = /*leaderBoardItem*/ ctx[2].numTranslations)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numtranslations", assistant_apps_translation_leaderboard_tile_numtranslations_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_numvotesgiven_value !== (assistant_apps_translation_leaderboard_tile_numvotesgiven_value = /*leaderBoardItem*/ ctx[2].numVotesGiven)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesgiven", assistant_apps_translation_leaderboard_tile_numvotesgiven_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_numvotesreceived_value !== (assistant_apps_translation_leaderboard_tile_numvotesreceived_value = /*leaderBoardItem*/ ctx[2].numVotesReceived)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesreceived", assistant_apps_translation_leaderboard_tile_numvotesreceived_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_total_value !== (assistant_apps_translation_leaderboard_tile_total_value = /*leaderBoardItem*/ ctx[2].total)) {
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
    		source: "(29:4) {#each leaderBoardResult.value ?? [] as leaderBoardItem}",
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
    	let each_value = /*leaderBoardResult*/ ctx[1].value ?? [];
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

    			this.c = noop;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$8, 25, 2, 1053);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$8, 26, 2, 1095);
    			attr_dev(div, "slot", "loaded");
    			attr_dev(div, "class", "grid-container leaderboard-container noselect");
    			add_location(div, file$8, 27, 2, 1133);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			add_location(assistant_apps_loading, file$8, 24, 0, 997);
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
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*leaderBoardResult*/ 2) {
    				each_value = /*leaderBoardResult*/ ctx[1].value ?? [];
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
    		i: noop,
    		o: noop,
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
    	let leaderBoardResult = anyObject;

    	onMount(async () => {
    		const aaApi = new AssistantAppsApiService();
    		const leaderboardListResult = await aaApi.getTranslators();

    		if (leaderboardListResult.isSuccess == false || leaderboardListResult.value == null || leaderboardListResult.value.isSuccess == false || leaderboardListResult.value.value == null || leaderboardListResult.value.value.length < 1) {
    			$$invalidate(0, networkState = NetworkState.Error);
    			return;
    		}

    		$$invalidate(1, leaderBoardResult = leaderboardListResult.value);
    		$$invalidate(0, networkState = NetworkState.Success);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-translation-leaderboard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		AssistantAppsApiService,
    		NetworkState,
    		anyObject,
    		networkState,
    		leaderBoardResult
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('leaderBoardResult' in $$props) $$invalidate(1, leaderBoardResult = $$props.leaderBoardResult);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, leaderBoardResult];
    }

    class LeaderboardList extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.grid-container{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:1em;row-gap:1em;margin-bottom:3em}@media only screen and (max-width: 1300px){.grid-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 800px){.grid-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}.leaderboard-container{grid-template-columns:repeat(3, minmax(0, 1fr))}@media only screen and (max-width: 1300px){.leaderboard-container{grid-template-columns:repeat(3, minmax(0, 1fr))}}@media only screen and (max-width: 800px){.leaderboard-container{grid-template-columns:repeat(2, minmax(0, 1fr))}}@media only screen and (max-width: 500px){.leaderboard-container{grid-template-columns:repeat(1, minmax(0, 1fr))}}</style>`;

    		init(
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

    /* src\module\translatorLeaderboard\leaderboardTile.svelte generated by Svelte v3.48.0 */

    const file$7 = "src\\module\\translatorLeaderboard\\leaderboardTile.svelte";

    // (16:6) {#if numtranslations > 0}
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
    			add_location(span, file$7, 17, 10, 668);
    			set_custom_element_data(assistant_apps_tooltip, "tooltiptext", "Number of translations submitted");
    			add_location(assistant_apps_tooltip, file$7, 16, 8, 585);
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
    		source: "(16:6) {#if numtranslations > 0}",
    		ctx
    	});

    	return block;
    }

    // (21:6) {#if numvotesgiven > 0}
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
    			add_location(span, file$7, 24, 10, 912);
    			set_custom_element_data(assistant_apps_tooltip, "tooltiptext", "Number of votes given to translations");
    			add_location(assistant_apps_tooltip, file$7, 21, 8, 803);
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
    		source: "(21:6) {#if numvotesgiven > 0}",
    		ctx
    	});

    	return block;
    }

    // (28:6) {#if numvotesreceived > 0}
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
    			add_location(span, file$7, 29, 10, 1123);
    			set_custom_element_data(assistant_apps_tooltip, "tooltiptext", "Number of votes received");
    			add_location(assistant_apps_tooltip, file$7, 28, 8, 1048);
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
    		source: "(28:6) {#if numvotesreceived > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
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
    	let if_block0 = /*numtranslations*/ ctx[2] > 0 && create_if_block_2$1(ctx);
    	let if_block1 = /*numvotesgiven*/ ctx[3] > 0 && create_if_block_1$3(ctx);
    	let if_block2 = /*numvotesreceived*/ ctx[4] > 0 && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
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
    			this.c = noop;
    			if (!src_url_equal(img.src, img_src_value = /*profileimageurl*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*username*/ ctx[0]);
    			attr_dev(img, "class", "leaderboard-item-img");
    			add_location(img, file$7, 11, 2, 328);
    			attr_dev(h2, "class", "leaderboard-item-name");
    			add_location(h2, file$7, 13, 4, 450);
    			attr_dev(h4, "class", "leaderboard-item-numbers");
    			add_location(h4, file$7, 14, 4, 505);
    			attr_dev(div0, "class", "leaderboard-item-contents");
    			add_location(div0, file$7, 12, 2, 405);
    			set_custom_element_data(assistant_apps_tooltip, "tooltiptext", "Total points");
    			add_location(assistant_apps_tooltip, file$7, 35, 4, 1268);
    			attr_dev(h3, "class", "total");
    			add_location(h3, file$7, 34, 2, 1244);
    			attr_dev(div1, "class", "leaderboard-item noselect");
    			add_location(div1, file$7, 10, 0, 285);
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
    			append_dev(h2, t1);
    			append_dev(div0, t2);
    			append_dev(div0, h4);
    			if (if_block0) if_block0.m(h4, null);
    			append_dev(h4, t3);
    			if (if_block1) if_block1.m(h4, null);
    			append_dev(h4, t4);
    			if (if_block2) if_block2.m(h4, null);
    			append_dev(div1, t5);
    			append_dev(div1, h3);
    			append_dev(h3, assistant_apps_tooltip);
    			append_dev(assistant_apps_tooltip, t6);
    			append_dev(assistant_apps_tooltip, t7);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
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
    		username,
    		profileimageurl,
    		numtranslations,
    		numvotesgiven,
    		numvotesreceived,
    		total
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
    		total
    	];
    }

    class LeaderboardTile extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.leaderboard-item{display:flex;border-radius:5px;background-color:var(--assistantapps-leaderboard-item-background-colour, #6c757d);height:var(--assistantapps-leaderboard-tile-size, 100px)}.leaderboard-item img.leaderboard-item-img{width:var(--assistantapps-leaderboard-tile-size, 100px);height:var(--assistantapps-leaderboard-tile-size, 100px);border-top-left-radius:5px;border-bottom-left-radius:5px}.leaderboard-item .leaderboard-item-contents{flex-grow:3;display:flex;flex-direction:column;justify-content:center;padding-left:1em;max-width:calc(100% - 150px);overflow:hidden}.leaderboard-item .leaderboard-item-name,.leaderboard-item .leaderboard-item-numbers{margin:0;padding:0;color:var(--assistantapps-leaderboard-item-text-colour, #f0f0f0)}.leaderboard-item .leaderboard-item-numbers{padding-top:0.5em;max-width:100%;max-height:50%}.leaderboard-item .leaderboard-item-name{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25em}.leaderboard-item .leaderboard-item-numbers{max-lines:3}.leaderboard-item .leaderboard-item-numbers .stat{display:inline-block;margin-right:0.125em;margin-bottom:0.25em;padding:0.25em 0.5em 0.25em 0.3em;border-radius:1em;background-color:var(--assistantapps-leaderboard-item-background-colour, #494e52)}.leaderboard-item .total{display:flex;flex-grow:1;align-items:center;justify-content:end;padding-right:0.5em;color:var(--assistantapps-leaderboard-item-text-colour, #f0f0f0)}</style>`;

    		init(
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

    /* src\module\version\versionSearch.svelte generated by Svelte v3.48.0 */
    const file$6 = "src\\module\\version\\versionSearch.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (60:8) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Please Select an App";
    			add_location(p, file$6, 61, 12, 2175);
    			attr_dev(div, "class", "dd-button");
    			add_location(div, file$6, 60, 10, 2138);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(60:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:8) {#if selectedApp != null}
    function create_if_block_1$2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p;
    	let t1_value = /*selectedApp*/ ctx[1].name + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			if (!src_url_equal(img.src, img_src_value = /*selectedApp*/ ctx[1].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*selectedApp*/ ctx[1].name);
    			add_location(img, file$6, 56, 12, 1996);
    			add_location(p, file$6, 57, 12, 2066);
    			attr_dev(div, "class", "dd-button");
    			add_location(div, file$6, 55, 10, 1959);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedApp*/ 2 && !src_url_equal(img.src, img_src_value = /*selectedApp*/ ctx[1].iconUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*selectedApp*/ 2 && img_alt_value !== (img_alt_value = /*selectedApp*/ ctx[1].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*selectedApp*/ 2 && t1_value !== (t1_value = /*selectedApp*/ ctx[1].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(55:8) {#if selectedApp != null}",
    		ctx
    	});

    	return block;
    }

    // (67:10) {#each appLookup as app}
    function create_each_block_1(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p;
    	let t1_value = /*app*/ ctx[11].name + "";
    	let t1;
    	let t2;
    	let li_value_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*app*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*app*/ ctx[11].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*app*/ ctx[11].name);
    			add_location(img, file$6, 72, 14, 2526);
    			add_location(p, file$6, 73, 14, 2582);
    			attr_dev(li, "class", "dd-menu-item");
    			li.value = li_value_value = /*app*/ ctx[11].guid;
    			add_location(li, file$6, 67, 12, 2367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    			append_dev(li, t0);
    			append_dev(li, p);
    			append_dev(p, t1);
    			append_dev(li, t2);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*appLookup*/ 1 && !src_url_equal(img.src, img_src_value = /*app*/ ctx[11].iconUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*appLookup*/ 1 && img_alt_value !== (img_alt_value = /*app*/ ctx[11].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*appLookup*/ 1 && t1_value !== (t1_value = /*app*/ ctx[11].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*appLookup*/ 1 && li_value_value !== (li_value_value = /*app*/ ctx[11].guid)) {
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
    		source: "(67:10) {#each appLookup as app}",
    		ctx
    	});

    	return block;
    }

    // (81:8) {#each whatIsNewPagination.value ?? [] as whatIsNewItem}
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
    			set_custom_element_data(assistant_apps_version_search_tile, "guid", assistant_apps_version_search_tile_guid_value = /*whatIsNewItem*/ ctx[8].guid);
    			set_custom_element_data(assistant_apps_version_search_tile, "markdown", assistant_apps_version_search_tile_markdown_value = /*whatIsNewItem*/ ctx[8].markdown);
    			set_custom_element_data(assistant_apps_version_search_tile, "buildname", assistant_apps_version_search_tile_buildname_value = /*whatIsNewItem*/ ctx[8].buildName);
    			set_custom_element_data(assistant_apps_version_search_tile, "buildnumber", assistant_apps_version_search_tile_buildnumber_value = /*whatIsNewItem*/ ctx[8].buildNumber);
    			set_custom_element_data(assistant_apps_version_search_tile, "platforms", assistant_apps_version_search_tile_platforms_value = /*whatIsNewItem*/ ctx[8].platforms);
    			set_custom_element_data(assistant_apps_version_search_tile, "activedate", assistant_apps_version_search_tile_activedate_value = /*whatIsNewItem*/ ctx[8].activeDate);
    			add_location(assistant_apps_version_search_tile, file$6, 81, 10, 2800);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_version_search_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_guid_value !== (assistant_apps_version_search_tile_guid_value = /*whatIsNewItem*/ ctx[8].guid)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "guid", assistant_apps_version_search_tile_guid_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_markdown_value !== (assistant_apps_version_search_tile_markdown_value = /*whatIsNewItem*/ ctx[8].markdown)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "markdown", assistant_apps_version_search_tile_markdown_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_buildname_value !== (assistant_apps_version_search_tile_buildname_value = /*whatIsNewItem*/ ctx[8].buildName)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "buildname", assistant_apps_version_search_tile_buildname_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_buildnumber_value !== (assistant_apps_version_search_tile_buildnumber_value = /*whatIsNewItem*/ ctx[8].buildNumber)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "buildnumber", assistant_apps_version_search_tile_buildnumber_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_platforms_value !== (assistant_apps_version_search_tile_platforms_value = /*whatIsNewItem*/ ctx[8].platforms)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "platforms", assistant_apps_version_search_tile_platforms_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_activedate_value !== (assistant_apps_version_search_tile_activedate_value = /*whatIsNewItem*/ ctx[8].activeDate)) {
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
    		source: "(81:8) {#each whatIsNewPagination.value ?? [] as whatIsNewItem}",
    		ctx
    	});

    	return block;
    }

    // (91:8) {#if whatIsNewPagination.value == null || whatIsNewPagination.value.length < 1}
    function create_if_block$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No items to display";
    			add_location(p, file$6, 91, 10, 3255);
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
    		source: "(91:8) {#if whatIsNewPagination.value == null || whatIsNewPagination.value.length < 1}",
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
    		if (/*selectedApp*/ ctx[1] != null) return create_if_block_1$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let each_value_1 = /*appLookup*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*whatIsNewPagination*/ ctx[3].value ?? [];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block1 = (/*whatIsNewPagination*/ ctx[3].value == null || /*whatIsNewPagination*/ ctx[3].value.length < 1) && create_if_block$3(ctx);

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
    			this.c = noop;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$6, 50, 4, 1751);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$6, 51, 4, 1795);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "dd-input");
    			add_location(input, file$6, 64, 8, 2245);
    			attr_dev(ul, "class", "dd-menu");
    			add_location(ul, file$6, 65, 8, 2297);
    			attr_dev(label, "class", "dropdown");
    			add_location(label, file$6, 53, 6, 1888);
    			attr_dev(div0, "class", "what-is-new-container noselect");
    			add_location(div0, file$6, 79, 6, 2678);
    			attr_dev(div1, "slot", "loaded");
    			attr_dev(div1, "class", "version-container");
    			add_location(div1, file$6, 52, 4, 1835);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[2]);
    			add_location(assistant_apps_loading, file$6, 49, 2, 1693);
    			attr_dev(div2, "class", "noselect");
    			add_location(div2, file$6, 48, 0, 1667);
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
    				each_blocks_1[i].m(ul, null);
    			}

    			append_dev(div1, t4);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
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

    			if (dirty & /*appLookup, fetchWhatIsNewItems*/ 17) {
    				each_value_1 = /*appLookup*/ ctx[0];
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

    			if (dirty & /*whatIsNewPagination*/ 8) {
    				each_value = /*whatIsNewPagination*/ ctx[3].value ?? [];
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

    			if (/*whatIsNewPagination*/ ctx[3].value == null || /*whatIsNewPagination*/ ctx[3].value.length < 1) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*networkState*/ 4) {
    				set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
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
    	const aaApi = new AssistantAppsApiService();
    	let appLookup = [];
    	let selectedApp;
    	let networkState = NetworkState.Loading;
    	let whatIsNewPagination = anyObject;

    	const fetchApps = async () => {
    		const [localNetworkState, localItemList] = await useApiCall(aaApi.getApps);

    		if (localNetworkState == NetworkState.Error) {
    			return;
    		}

    		const localItems = localItemList.filter(app => app.isVisible);
    		localItems.sort((a, b) => a.sortOrder - b.sortOrder);
    		$$invalidate(0, appLookup = [...localItems]);
    		$$invalidate(1, selectedApp = localItems[0]);
    	};

    	const fetchWhatIsNewItems = async appSelected => {
    		if (appSelected == null) return;
    		$$invalidate(1, selectedApp = appSelected);

    		const search = {
    			appGuid: appSelected.guid,
    			languageCode: null,
    			platforms: [],
    			page: 1
    		};

    		const whatIsNewResult = await aaApi.getWhatIsNewItems(search);

    		if (whatIsNewResult.isSuccess == false || whatIsNewResult.value == null || whatIsNewResult.value.length < 1) {
    			$$invalidate(2, networkState = NetworkState.Error);
    			return;
    		}

    		$$invalidate(3, whatIsNewPagination = whatIsNewResult);
    		$$invalidate(2, networkState = NetworkState.Success);
    	};

    	onMount(async () => {
    		await fetchApps();
    		fetchWhatIsNewItems(selectedApp);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-version-search> was created with unknown prop '${key}'`);
    	});

    	const click_handler = app => fetchWhatIsNewItems(app);

    	$$self.$capture_state = () => ({
    		onMount,
    		AssistantAppsApiService,
    		NetworkState,
    		anyObject,
    		useApiCall,
    		aaApi,
    		appLookup,
    		selectedApp,
    		networkState,
    		whatIsNewPagination,
    		fetchApps,
    		fetchWhatIsNewItems
    	});

    	$$self.$inject_state = $$props => {
    		if ('appLookup' in $$props) $$invalidate(0, appLookup = $$props.appLookup);
    		if ('selectedApp' in $$props) $$invalidate(1, selectedApp = $$props.selectedApp);
    		if ('networkState' in $$props) $$invalidate(2, networkState = $$props.networkState);
    		if ('whatIsNewPagination' in $$props) $$invalidate(3, whatIsNewPagination = $$props.whatIsNewPagination);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		appLookup,
    		selectedApp,
    		networkState,
    		whatIsNewPagination,
    		fetchWhatIsNewItems,
    		click_handler
    	];
    }

    class VersionSearch extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.dropdown{display:inline-block;position:relative;margin-bottom:1em;z-index:20}.dd-button{display:flex;border:1px solid gray;border-radius:4px;padding:10px 30px 10px 10px;background-color:var(
      --assistantapps-version-dropdown-background-colour,
      #ffffff
    );cursor:pointer;white-space:nowrap}.dd-button:after{content:"";position:absolute;top:50%;right:15px;transform:translateY(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid
      var(--assistantapps-version-dropdown-background-colour, #ffffff)}.dd-button:hover{background-color:var(
      --assistantapps-version-dropdown-background-hover-colour,
      #eeeeee
    )}.dd-button img{width:20px;height:20px;margin-right:0.5em}.dd-button p{display:flex;flex-direction:column;justify-content:center;margin:0;padding:0}.dd-input{display:none}.dd-menu{position:absolute;top:100%;border:1px solid #ccc;border-radius:4px;padding:0;margin:2px 0 0 0;box-shadow:0 0 6px 0 rgba(0, 0, 0, 0.1);background-color:var(
      --assistantapps-version-dropdown-background-colour,
      #ffffff
    );list-style-type:none}.dd-input+.dd-menu{display:none}.dd-input:checked+.dd-menu{display:block}.dd-menu li{padding:10px 20px;cursor:pointer;white-space:nowrap}.dd-menu li:hover{background-color:var(
      --assistantapps-version-dropdown-background-hover-colour,
      #f6f6f6
    )}.dd-menu li.dd-menu-item{display:flex}.dd-menu li.dd-menu-item img{width:40px;height:40px;margin-right:1em}.dd-menu li.dd-menu-item p{display:flex;flex-direction:column;justify-content:center;margin:0;padding:0}.what-is-new-container{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:1em;row-gap:1em;margin-bottom:3em}@media only screen and (max-width: 1000px){.what-is-new-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 600px){.what-is-new-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}</style>`;

    		init(
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var dayjs_min = createCommonjsModule(function (module, exports) {
    !function(t,e){module.exports=e();}(commonjsGlobal,(function(){var t=1e3,e=6e4,n=36e5,r="millisecond",i="second",s="minute",u="hour",a="day",o="week",f="month",h="quarter",c="year",d="date",$="Invalid Date",l=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,y=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,M={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},m=function(t,e,n){var r=String(t);return !r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},g={s:m,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return (e<=0?"+":"-")+m(r,2,"0")+":"+m(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return -t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,f),s=n-i<0,u=e.clone().add(r+(s?-1:1),f);return +(-(r+(n-i)/(s?i-u:u-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(t){return {M:f,y:c,w:o,d:a,D:d,h:u,m:s,s:i,ms:r,Q:h}[t]||String(t||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},v="en",D={};D[v]=M;var p=function(t){return t instanceof _},S=function t(e,n,r){var i;if(!e)return v;if("string"==typeof e){var s=e.toLowerCase();D[s]&&(i=s),n&&(D[s]=n,i=s);var u=e.split("-");if(!i&&u.length>1)return t(u[0])}else {var a=e.name;D[a]=e,i=a;}return !r&&i&&(v=i),i||!r&&v},w=function(t,e){if(p(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new _(n)},O=g;O.l=S,O.i=p,O.w=function(t,e){return w(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var _=function(){function M(t){this.$L=S(t.locale,null,!0),this.parse(t);}var m=M.prototype;return m.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(O.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match(l);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.$x=t.x||{},this.init();},m.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds();},m.$utils=function(){return O},m.isValid=function(){return !(this.$d.toString()===$)},m.isSame=function(t,e){var n=w(t);return this.startOf(e)<=n&&n<=this.endOf(e)},m.isAfter=function(t,e){return w(t)<this.startOf(e)},m.isBefore=function(t,e){return this.endOf(e)<w(t)},m.$g=function(t,e,n){return O.u(t)?this[e]:this.set(n,t)},m.unix=function(){return Math.floor(this.valueOf()/1e3)},m.valueOf=function(){return this.$d.getTime()},m.startOf=function(t,e){var n=this,r=!!O.u(e)||e,h=O.p(t),$=function(t,e){var i=O.w(n.$u?Date.UTC(n.$y,e,t):new Date(n.$y,e,t),n);return r?i:i.endOf(a)},l=function(t,e){return O.w(n.toDate()[t].apply(n.toDate("s"),(r?[0,0,0,0]:[23,59,59,999]).slice(e)),n)},y=this.$W,M=this.$M,m=this.$D,g="set"+(this.$u?"UTC":"");switch(h){case c:return r?$(1,0):$(31,11);case f:return r?$(1,M):$(0,M+1);case o:var v=this.$locale().weekStart||0,D=(y<v?y+7:y)-v;return $(r?m-D:m+(6-D),M);case a:case d:return l(g+"Hours",0);case u:return l(g+"Minutes",1);case s:return l(g+"Seconds",2);case i:return l(g+"Milliseconds",3);default:return this.clone()}},m.endOf=function(t){return this.startOf(t,!1)},m.$set=function(t,e){var n,o=O.p(t),h="set"+(this.$u?"UTC":""),$=(n={},n[a]=h+"Date",n[d]=h+"Date",n[f]=h+"Month",n[c]=h+"FullYear",n[u]=h+"Hours",n[s]=h+"Minutes",n[i]=h+"Seconds",n[r]=h+"Milliseconds",n)[o],l=o===a?this.$D+(e-this.$W):e;if(o===f||o===c){var y=this.clone().set(d,1);y.$d[$](l),y.init(),this.$d=y.set(d,Math.min(this.$D,y.daysInMonth())).$d;}else $&&this.$d[$](l);return this.init(),this},m.set=function(t,e){return this.clone().$set(t,e)},m.get=function(t){return this[O.p(t)]()},m.add=function(r,h){var d,$=this;r=Number(r);var l=O.p(h),y=function(t){var e=w($);return O.w(e.date(e.date()+Math.round(t*r)),$)};if(l===f)return this.set(f,this.$M+r);if(l===c)return this.set(c,this.$y+r);if(l===a)return y(1);if(l===o)return y(7);var M=(d={},d[s]=e,d[u]=n,d[i]=t,d)[l]||1,m=this.$d.getTime()+r*M;return O.w(m,this)},m.subtract=function(t,e){return this.add(-1*t,e)},m.format=function(t){var e=this,n=this.$locale();if(!this.isValid())return n.invalidDate||$;var r=t||"YYYY-MM-DDTHH:mm:ssZ",i=O.z(this),s=this.$H,u=this.$m,a=this.$M,o=n.weekdays,f=n.months,h=function(t,n,i,s){return t&&(t[n]||t(e,r))||i[n].slice(0,s)},c=function(t){return O.s(s%12||12,t,"0")},d=n.meridiem||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r},l={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:O.s(a+1,2,"0"),MMM:h(n.monthsShort,a,f,3),MMMM:h(f,a),D:this.$D,DD:O.s(this.$D,2,"0"),d:String(this.$W),dd:h(n.weekdaysMin,this.$W,o,2),ddd:h(n.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:O.s(s,2,"0"),h:c(1),hh:c(2),a:d(s,u,!0),A:d(s,u,!1),m:String(u),mm:O.s(u,2,"0"),s:String(this.$s),ss:O.s(this.$s,2,"0"),SSS:O.s(this.$ms,3,"0"),Z:i};return r.replace(y,(function(t,e){return e||l[t]||i.replace(":","")}))},m.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},m.diff=function(r,d,$){var l,y=O.p(d),M=w(r),m=(M.utcOffset()-this.utcOffset())*e,g=this-M,v=O.m(this,M);return v=(l={},l[c]=v/12,l[f]=v,l[h]=v/3,l[o]=(g-m)/6048e5,l[a]=(g-m)/864e5,l[u]=g/n,l[s]=g/e,l[i]=g/t,l)[y]||g,$?v:O.a(v)},m.daysInMonth=function(){return this.endOf(f).$D},m.$locale=function(){return D[this.$L]},m.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=S(t,e,!0);return r&&(n.$L=r),n},m.clone=function(){return O.w(this.$d,this)},m.toDate=function(){return new Date(this.valueOf())},m.toJSON=function(){return this.isValid()?this.toISOString():null},m.toISOString=function(){return this.$d.toISOString()},m.toString=function(){return this.$d.toUTCString()},M}(),T=_.prototype;return w.prototype=T,[["$ms",r],["$s",i],["$m",s],["$H",u],["$W",a],["$M",f],["$y",c],["$D",d]].forEach((function(t){T[t[1]]=function(e){return this.$g(e,t[0],t[1])};})),w.extend=function(t,e){return t.$i||(t(e,_,w),t.$i=!0),w},w.locale=S,w.isDayjs=p,w.unix=function(t){return w(1e3*t)},w.en=D[v],w.Ls=D,w.p={},w}));
    });

    const defaultFormat = (date) => {
        return dayjs_min(date).format('YYYY-MM-DD');
    };

    /* src\module\version\versionSearchTile.svelte generated by Svelte v3.48.0 */
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
    			this.c = noop;
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
    		i: noop,
    		o: noop,
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

    		this.shadowRoot.innerHTML = `<style>*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.version{display:flex;flex-direction:column;position:relative;background-color:var(
      --assistantapps-version-background-colour,
      rgba(122, 122, 122, 0.7)
    );border-radius:5px;overflow:hidden}.version-header .version-date{position:absolute;top:1em;right:1em;color:var(--assistantapps-version-text-colour, white)}.version .version-name{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-version-text-colour, white);padding-left:1em;padding-right:0.5em;margin-bottom:0;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.version .markdown{padding-right:0.5em;margin-bottom:0.5em}.version .markdown,.version .markdown *{color:var(--assistantapps-version-text-colour, white);padding:0 1em}</style>`;

    		init(
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

    /* src\shared\dropdown.svelte generated by Svelte v3.48.0 */
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
    		p: noop,
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
    			this.c = noop;
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
    		i: noop,
    		o: noop,
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
    		this.shadowRoot.innerHTML = `<style>.dropdown{display:inline-block;position:relative;margin-bottom:1em;z-index:20}.dd-button{display:flex;border:1px solid gray;border-radius:4px;padding:10px 30px 10px 10px;background-color:var(--assistantapps-dropdown-background-colour, #646464);cursor:pointer;white-space:nowrap}.dd-button:after{content:"";position:absolute;top:50%;right:15px;transform:translateY(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid var(--assistantapps-dropdown-background-colour, #646464)}.dd-button:hover{background-color:var(--assistantapps-dropdown-background-hover-colour, #7e7e7e)}.dd-button img{width:20px;height:20px;margin-right:0.5em}.dd-button p{display:flex;flex-direction:column;justify-content:center;margin:0;padding:0}.dd-input{display:none}.dd-menu{position:absolute;top:100%;border:1px solid #ccc;border-radius:4px;padding:0;margin:2px 0 0 0;box-shadow:0 0 6px 0 rgba(0, 0, 0, 0.1);background-color:var(--assistantapps-dropdown-background-colour, #646464);list-style-type:none;max-height:500px;overflow-y:auto}.dd-input+.dd-menu{display:none}.dd-input:checked+.dd-menu{display:block}</style>`;

    		init(
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

    /* src\shared\dropdownOption.svelte generated by Svelte v3.48.0 */

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
    			this.c = noop;
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
    		i: noop,
    		o: noop,
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
    		this.shadowRoot.innerHTML = `<style>li{padding:10px 20px;cursor:pointer;white-space:nowrap}li:hover{background-color:var(--assistantapps-version-dropdown-background-hover-colour, #7d7d7d)}li.dd-menu-item{display:flex}li.dd-menu-item img{width:40px;height:40px;margin-right:1em}li.dd-menu-item p{display:flex;flex-direction:column;justify-content:center;margin:0;padding:0}</style>`;

    		init(
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

    /* src\shared\loadingWithSlots.svelte generated by Svelte v3.48.0 */
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
    			this.c = noop;
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
    		i: noop,
    		o: noop,
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
    		this.shadowRoot.innerHTML = `<style>*{font-family:var(--assistantapps-font-family, "Roboto", Helvetica, Arial, sans-serif);font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.aa-error{display:flex;justify-content:center;flex-direction:column}.aa-error img{max-width:100px}.aa-error>*{margin:0 auto}</style>`;

    		init(
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

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*networkstate*/ ctx[0] === undefined && !('networkstate' in props)) {
    			console.warn("<assistant-apps-loading> was created without expected prop 'networkstate'");
    		}

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
     * marked - a markdown parser
     * Copyright (c) 2011-2022, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/markedjs/marked
     */

    /**
     * DO NOT EDIT THIS FILE
     * The code in this file is generated from files in ./src/
     */

    function getDefaults() {
      return {
        baseUrl: null,
        breaks: false,
        extensions: null,
        gfm: true,
        headerIds: true,
        headerPrefix: '',
        highlight: null,
        langPrefix: 'language-',
        mangle: true,
        pedantic: false,
        renderer: null,
        sanitize: false,
        sanitizer: null,
        silent: false,
        smartLists: false,
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
    const escapeReplace = /[&<>"']/g;
    const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
    const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
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
    function unescape(html) {
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
          prot = decodeURIComponent(unescape(href))
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

    function merge(obj) {
      let i = 1,
        target,
        key;

      for (; i < arguments.length; i++) {
        target = arguments[i];
        for (key in target) {
          if (Object.prototype.hasOwnProperty.call(target, key)) {
            obj[key] = target[key];
          }
        }
      }

      return obj;
    }

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
          tokens: lexer.inlineTokens(text, [])
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
            lang: cap[2] ? cap[2].trim() : cap[2],
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

          const token = {
            type: 'heading',
            raw: cap[0],
            depth: cap[1].length,
            text,
            tokens: []
          };
          this.lexer.inline(token.text, token.tokens);
          return token;
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

          return {
            type: 'blockquote',
            raw: cap[0],
            tokens: this.lexer.blockTokens(text, []),
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

            line = cap[2].split('\n', 1)[0];
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
              const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?: [^\\n]*)?(?:\\n|$))`);
              const hrRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`);

              // Check if following lines should be included in List Item
              while (src) {
                rawLine = src.split('\n', 1)[0];
                line = rawLine;

                // Re-align to follow commonmark nesting rules
                if (this.options.pedantic) {
                  line = line.replace(/^ {1,4}(?=( {4})*[^ ])/g, '  ');
                }

                // End list item if found start of new bullet
                if (nextBulletRegex.test(line)) {
                  break;
                }

                // Horizontal rule found
                if (hrRegex.test(src)) {
                  break;
                }

                if (line.search(/[^ ]/) >= indent || !line.trim()) { // Dedent if possible
                  itemContents += '\n' + line.slice(indent);
                } else if (!blankLine) { // Until blank line, item doesn't need indentation
                  itemContents += '\n' + line;
                } else { // Otherwise, improper indentation ends this item
                  break;
                }

                if (!blankLine && !line.trim()) { // Check if current line is blank
                  blankLine = true;
                }

                raw += rawLine + '\n';
                src = src.substring(rawLine.length + 1);
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
            const spacers = list.items[i].tokens.filter(t => t.type === 'space');
            const hasMultipleLineBreaks = spacers.every(t => {
              const chars = t.raw.split('');
              let lineBreaks = 0;
              for (const char of chars) {
                if (char === '\n') {
                  lineBreaks += 1;
                }
                if (lineBreaks > 1) {
                  return true;
                }
              }

              return false;
            });

            if (!list.loose && spacers.length && hasMultipleLineBreaks) {
              // Having a single line break doesn't mean a list is loose. A single line break is terminating the last list item
              list.loose = true;
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
            token.type = 'paragraph';
            token.text = this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]);
            token.tokens = [];
            this.lexer.inline(token.text, token.tokens);
          }
          return token;
        }
      }

      def(src) {
        const cap = this.rules.block.def.exec(src);
        if (cap) {
          if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
          const tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
          return {
            type: 'def',
            tag,
            raw: cap[0],
            href: cap[2],
            title: cap[3]
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
              item.header[j].tokens = [];
              this.lexer.inlineTokens(item.header[j].text, item.header[j].tokens);
            }

            // cell child tokens
            l = item.rows.length;
            for (j = 0; j < l; j++) {
              row = item.rows[j];
              for (k = 0; k < row.length; k++) {
                row[k].tokens = [];
                this.lexer.inlineTokens(row[k].text, row[k].tokens);
              }
            }

            return item;
          }
        }
      }

      lheading(src) {
        const cap = this.rules.block.lheading.exec(src);
        if (cap) {
          const token = {
            type: 'heading',
            raw: cap[0],
            depth: cap[2].charAt(0) === '=' ? 1 : 2,
            text: cap[1],
            tokens: []
          };
          this.lexer.inline(token.text, token.tokens);
          return token;
        }
      }

      paragraph(src) {
        const cap = this.rules.block.paragraph.exec(src);
        if (cap) {
          const token = {
            type: 'paragraph',
            raw: cap[0],
            text: cap[1].charAt(cap[1].length - 1) === '\n'
              ? cap[1].slice(0, -1)
              : cap[1],
            tokens: []
          };
          this.lexer.inline(token.text, token.tokens);
          return token;
        }
      }

      text(src) {
        const cap = this.rules.block.text.exec(src);
        if (cap) {
          const token = {
            type: 'text',
            raw: cap[0],
            text: cap[0],
            tokens: []
          };
          this.lexer.inline(token.text, token.tokens);
          return token;
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
          if (!link || !link.href) {
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

            // Create `em` if smallest delimiter has odd char count. *a***
            if (Math.min(lLength, rLength) % 2) {
              const text = src.slice(1, lLength + match.index + rLength);
              return {
                type: 'em',
                raw: src.slice(0, lLength + match.index + rLength + 1),
                text,
                tokens: this.lexer.inlineTokens(text, [])
              };
            }

            // Create 'strong' if smallest delimiter has even char count. **a***
            const text = src.slice(2, lLength + match.index + rLength - 1);
            return {
              type: 'strong',
              raw: src.slice(0, lLength + match.index + rLength + 1),
              text,
              tokens: this.lexer.inlineTokens(text, [])
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
            tokens: this.lexer.inlineTokens(cap[2], [])
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
              href = 'http://' + text;
            } else {
              href = text;
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
      fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
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
      def: /^ {0,3}\[(label)\]: *(?:\n *)?<?([^\s>]+)>?(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/,
      table: noopTest,
      lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
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

    block.normal = merge({}, block);

    /**
     * GFM Block Grammar
     */

    block.gfm = merge({}, block.normal, {
      table: '^ *([^\\n ].*\\|.*)\\n' // Header
        + ' {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?' // Align
        + '(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells
    });

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

    block.pedantic = merge({}, block.normal, {
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
      paragraph: edit(block.normal._paragraph)
        .replace('hr', block.hr)
        .replace('heading', ' *#{1,6} *[^\n]')
        .replace('lheading', block.lheading)
        .replace('blockquote', ' {0,3}>')
        .replace('|fences', '')
        .replace('|list', '')
        .replace('|html', '')
        .getRegex()
    });

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
        //          () Skip orphan inside strong  () Consume to delim (1) #***                (2) a***#, a***                   (3) #***a, ***a                 (4) ***#              (5) #***#                 (6) a***a
        rDelimAst: /^[^_*]*?\_\_[^_*]*?\*[^_*]*?(?=\_\_)|[^*]+(?=[^*])|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
        rDelimUnd: /^[^_*]*?\*\*[^_*]*?\_[^_*]*?(?=\*\*)|[^_]+(?=[^_])|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/ // ^- Not allowed for _
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
    inline.escapedEmSt = /\\\*|\\_/g;

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

    inline.normal = merge({}, inline);

    /**
     * Pedantic Inline Grammar
     */

    inline.pedantic = merge({}, inline.normal, {
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
    });

    /**
     * GFM Inline Grammar
     */

    inline.gfm = merge({}, inline.normal, {
      escape: edit(inline.escape).replace('])', '~|])').getRegex(),
      _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
      url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
      _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
      del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
      text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
    });

    inline.gfm.url = edit(inline.gfm.url, 'i')
      .replace('email', inline.gfm._extended_email)
      .getRegex();
    /**
     * GFM + Line Breaks Inline Grammar
     */

    inline.breaks = merge({}, inline.gfm, {
      br: edit(inline.br).replace('{2,}', '*').getRegex(),
      text: edit(inline.gfm.text)
        .replace('\\b_', '\\b_| {2,}\\n')
        .replace(/\{2,\}/g, '*')
        .getRegex()
    });

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

      inline(src, tokens) {
        this.inlineQueue.push({ src, tokens });
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
          maskedSrc = maskedSrc.slice(0, match.index) + '++' + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
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
          + escape(lang, true)
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
        let out = '<a href="' + escape(href) + '"';
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
                unescape(this.parseInline(token.tokens, this.textRenderer)),
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

    /**
     * Marked
     */
    function marked(src, opt, callback) {
      // throw error in case of non string input
      if (typeof src === 'undefined' || src === null) {
        throw new Error('marked(): input parameter is undefined or null');
      }
      if (typeof src !== 'string') {
        throw new Error('marked(): input parameter is of type '
          + Object.prototype.toString.call(src) + ', string expected');
      }

      if (typeof opt === 'function') {
        callback = opt;
        opt = null;
      }

      opt = merge({}, marked.defaults, opt || {});
      checkSanitizeDeprecation(opt);

      if (callback) {
        const highlight = opt.highlight;
        let tokens;

        try {
          tokens = Lexer.lex(src, opt);
        } catch (e) {
          return callback(e);
        }

        const done = function(err) {
          let out;

          if (!err) {
            try {
              if (opt.walkTokens) {
                marked.walkTokens(tokens, opt.walkTokens);
              }
              out = Parser.parse(tokens, opt);
            } catch (e) {
              err = e;
            }
          }

          opt.highlight = highlight;

          return err
            ? callback(err)
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

      try {
        const tokens = Lexer.lex(src, opt);
        if (opt.walkTokens) {
          marked.walkTokens(tokens, opt.walkTokens);
        }
        return Parser.parse(tokens, opt);
      } catch (e) {
        e.message += '\nPlease report this to https://github.com/markedjs/marked.';
        if (opt.silent) {
          return '<p>An error occurred:</p><pre>'
            + escape(e.message + '', true)
            + '</pre>';
        }
        throw e;
      }
    }

    /**
     * Options
     */

    marked.options =
    marked.setOptions = function(opt) {
      merge(marked.defaults, opt);
      changeDefaults(marked.defaults);
      return marked;
    };

    marked.getDefaults = getDefaults;

    marked.defaults = defaults;

    /**
     * Use Extension
     */

    marked.use = function(...args) {
      const opts = merge({}, ...args);
      const extensions = marked.defaults.extensions || { renderers: {}, childTokens: {} };
      let hasExtensions;

      args.forEach((pack) => {
        // ==-- Parse "addon" extensions --== //
        if (pack.extensions) {
          hasExtensions = true;
          pack.extensions.forEach((ext) => {
            if (!ext.name) {
              throw new Error('extension name required');
            }
            if (ext.renderer) { // Renderer extensions
              const prevRenderer = extensions.renderers ? extensions.renderers[ext.name] : null;
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

        // ==-- Parse WalkTokens extensions --== //
        if (pack.walkTokens) {
          const walkTokens = marked.defaults.walkTokens;
          opts.walkTokens = function(token) {
            pack.walkTokens.call(this, token);
            if (walkTokens) {
              walkTokens.call(this, token);
            }
          };
        }

        if (hasExtensions) {
          opts.extensions = extensions;
        }

        marked.setOptions(opts);
      });
    };

    /**
     * Run callback for every token
     */

    marked.walkTokens = function(tokens, callback) {
      for (const token of tokens) {
        callback.call(marked, token);
        switch (token.type) {
          case 'table': {
            for (const cell of token.header) {
              marked.walkTokens(cell.tokens, callback);
            }
            for (const row of token.rows) {
              for (const cell of row) {
                marked.walkTokens(cell.tokens, callback);
              }
            }
            break;
          }
          case 'list': {
            marked.walkTokens(token.items, callback);
            break;
          }
          default: {
            if (marked.defaults.extensions && marked.defaults.extensions.childTokens && marked.defaults.extensions.childTokens[token.type]) { // Walk any extensions
              marked.defaults.extensions.childTokens[token.type].forEach(function(childTokens) {
                marked.walkTokens(token[childTokens], callback);
              });
            } else if (token.tokens) {
              marked.walkTokens(token.tokens, callback);
            }
          }
        }
      }
    };

    /**
     * Parse Inline
     * @param {string} src
     */
    marked.parseInline = function(src, opt) {
      // throw error in case of non string input
      if (typeof src === 'undefined' || src === null) {
        throw new Error('marked.parseInline(): input parameter is undefined or null');
      }
      if (typeof src !== 'string') {
        throw new Error('marked.parseInline(): input parameter is of type '
          + Object.prototype.toString.call(src) + ', string expected');
      }

      opt = merge({}, marked.defaults, opt || {});
      checkSanitizeDeprecation(opt);

      try {
        const tokens = Lexer.lexInline(src, opt);
        if (opt.walkTokens) {
          marked.walkTokens(tokens, opt.walkTokens);
        }
        return Parser.parseInline(tokens, opt);
      } catch (e) {
        e.message += '\nPlease report this to https://github.com/markedjs/marked.';
        if (opt.silent) {
          return '<p>An error occurred:</p><pre>'
            + escape(e.message + '', true)
            + '</pre>';
        }
        throw e;
      }
    };

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
    marked.parse = marked;
    Parser.parse;
    Lexer.lex;

    /* src\shared\markdown.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\shared\\markdown.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let raw_value = /*_marked*/ ctx[1](/*source*/ ctx[0]) + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			this.c = noop;
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
    		i: noop,
    		o: noop,
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

    		init(
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

    /* src\shared\tooltip.svelte generated by Svelte v3.48.0 */

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
    			this.c = noop;
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
    		i: noop,
    		o: noop,
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

    		this.shadowRoot.innerHTML = `<style>.tooltip{position:relative;display:inline-block}.tooltip .tooltiptext{left:50%;bottom:120%;min-width:100px;margin-left:-50%;visibility:hidden;background-color:var(
            --assistantapps-tooltip-background-colour,
            #383838
        );color:var(--assistantapps-tooltip-text-colour, #ffffff);text-align:center;border-radius:6px;padding:0.25em 0.5em;position:absolute;z-index:1}.tooltip:hover .tooltiptext{visibility:visible}</style>`;

    		init(
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
