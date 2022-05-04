
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
    'use strict';

    const currentVersion = '1.0.19';

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
            this.getPatronsList = () => this.get('patreon');
            this.getTeamMembersList = () => this.get('teammember');
            this.getTranslators = () => this.post('translationStats/TranslatorLeaderboard', anyObject);
        }
        async getWhatIsNewItems(search) {
            const result = await this.post('Version/Search', search);
            return result.value;
        }
    }

    var NetworkState;
    (function (NetworkState) {
        NetworkState[NetworkState["Loading"] = 0] = "Loading";
        NetworkState[NetworkState["Success"] = 1] = "Success";
        NetworkState[NetworkState["Error"] = 2] = "Error";
    })(NetworkState || (NetworkState = {}));

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\module\patreon\patreonList.svelte generated by Svelte v3.48.0 */
    const file$a = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\module\\patreon\\patreonList.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (34:6) {#each patrons as patron}
    function create_each_block$3(ctx) {
    	let assistant_apps_patron_tile;
    	let assistant_apps_patron_tile_name_value;
    	let assistant_apps_patron_tile_imageurl_value;

    	const block = {
    		c: function create() {
    			assistant_apps_patron_tile = element("assistant-apps-patron-tile");
    			set_custom_element_data(assistant_apps_patron_tile, "name", assistant_apps_patron_tile_name_value = /*patron*/ ctx[4].name);
    			set_custom_element_data(assistant_apps_patron_tile, "imageurl", assistant_apps_patron_tile_imageurl_value = /*patron*/ ctx[4].imageUrl);
    			add_location(assistant_apps_patron_tile, file$a, 34, 8, 1159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_patron_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*patrons*/ 2 && assistant_apps_patron_tile_name_value !== (assistant_apps_patron_tile_name_value = /*patron*/ ctx[4].name)) {
    				set_custom_element_data(assistant_apps_patron_tile, "name", assistant_apps_patron_tile_name_value);
    			}

    			if (dirty & /*patrons*/ 2 && assistant_apps_patron_tile_imageurl_value !== (assistant_apps_patron_tile_imageurl_value = /*patron*/ ctx[4].imageUrl)) {
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
    		source: "(34:6) {#each patrons as patron}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let assistant_apps_loading;
    	let slot0;
    	let t0;
    	let slot1;
    	let t1;
    	let div0;
    	let assistant_apps_loading_customloading_value;
    	let assistant_apps_loading_customerror_value;
    	let each_value = /*patrons*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			assistant_apps_loading = element("assistant-apps-loading");
    			slot0 = element("slot");
    			t0 = space();
    			slot1 = element("slot");
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$a, 30, 4, 987);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$a, 31, 4, 1031);
    			attr_dev(div0, "slot", "loaded");
    			attr_dev(div0, "class", "patreon-container");
    			add_location(div0, file$a, 32, 4, 1071);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			set_custom_element_data(assistant_apps_loading, "customloading", assistant_apps_loading_customloading_value = /*$$slots*/ ctx[2].loading);
    			set_custom_element_data(assistant_apps_loading, "customerror", assistant_apps_loading_customerror_value = /*$$slots*/ ctx[2].error);
    			add_location(assistant_apps_loading, file$a, 25, 2, 850);
    			attr_dev(div1, "class", "noselect");
    			add_location(div1, file$a, 24, 0, 824);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, assistant_apps_loading);
    			append_dev(assistant_apps_loading, slot0);
    			append_dev(assistant_apps_loading, t0);
    			append_dev(assistant_apps_loading, slot1);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*patrons*/ 2) {
    				each_value = /*patrons*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
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

    			if (dirty & /*$$slots*/ 4 && assistant_apps_loading_customloading_value !== (assistant_apps_loading_customloading_value = /*$$slots*/ ctx[2].loading)) {
    				set_custom_element_data(assistant_apps_loading, "customloading", assistant_apps_loading_customloading_value);
    			}

    			if (dirty & /*$$slots*/ 4 && assistant_apps_loading_customerror_value !== (assistant_apps_loading_customerror_value = /*$$slots*/ ctx[2].error)) {
    				set_custom_element_data(assistant_apps_loading, "customerror", assistant_apps_loading_customerror_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	validate_slots('assistant-apps-patreon-list', slots, []);
    	const $$slots = compute_slots(slots);
    	let networkState = NetworkState.Loading;
    	let patrons = [];

    	const fetchPatreons = async () => {
    		const aaApi = new AssistantAppsApiService();
    		const patreonListResult = await aaApi.getPatronsList();

    		if (patreonListResult.isSuccess == false || patreonListResult.value == null || patreonListResult.value.length < 1) {
    			$$invalidate(0, networkState = NetworkState.Error);
    			return;
    		}

    		$$invalidate(1, patrons = patreonListResult.value);
    		$$invalidate(0, networkState = NetworkState.Success);
    	};

    	onMount(async () => {
    		fetchPatreons();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-patreon-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		AssistantAppsApiService,
    		NetworkState,
    		networkState,
    		patrons,
    		fetchPatreons
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('patrons' in $$props) $$invalidate(1, patrons = $$props.patrons);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, patrons, $$slots];
    }

    class PatreonList extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.patreon-container{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));column-gap:1em;row-gap:1em;margin-bottom:3em}@media only screen and (max-width: 1300px){.patreon-container{grid-template-columns:repeat(2, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}@media only screen and (max-width: 800px){.patreon-container{grid-template-columns:repeat(1, minmax(0, 1fr));column-gap:0.5em;row-gap:0.5em}}</style>`;

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

    customElements.define("assistant-apps-patreon-list", PatreonList);

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\module\patreon\patronTile.svelte generated by Svelte v3.48.0 */

    const file$9 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\module\\patreon\\patronTile.svelte";

    function create_fragment$9(ctx) {
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
    			t1 = text(/*name*/ ctx[0]);
    			this.c = noop;
    			if (!src_url_equal(img.src, img_src_value = /*imageurl*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			attr_dev(img, "class", "patron-img");
    			add_location(img, file$9, 7, 2, 160);
    			attr_dev(h2, "class", "patron-name");
    			add_location(h2, file$9, 8, 2, 216);
    			attr_dev(div, "class", "patron");
    			add_location(div, file$9, 6, 0, 136);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h2);
    			append_dev(h2, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imageurl*/ 2 && !src_url_equal(img.src, img_src_value = /*imageurl*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 1) {
    				attr_dev(img, "alt", /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	validate_slots('assistant-apps-patron-tile', slots, []);
    	let { name = "" } = $$props;
    	let { imageurl = "" } = $$props;
    	const writable_props = ['name', 'imageurl'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-patron-tile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('imageurl' in $$props) $$invalidate(1, imageurl = $$props.imageurl);
    	};

    	$$self.$capture_state = () => ({ name, imageurl });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('imageurl' in $$props) $$invalidate(1, imageurl = $$props.imageurl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, imageurl];
    }

    class PatronTile extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.patron{display:flex;background-color:var(--assistantapps-patron-background-colour, #6c757d);border-radius:5px;overflow:hidden}.patron img.patron-img{height:100px;width:100px;object-fit:cover;margin:0}.patron .patron-name{display:flex;flex-direction:column;justify-content:center;color:var(--assistantapps-patron-text-colour, white);padding-left:0.5em;padding-right:0.5em;line-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>`;

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
    			{ name: 0, imageurl: 1 },
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
    		return ["name", "imageurl"];
    	}

    	get name() {
    		return this.$$.ctx[0];
    	}

    	set name(name) {
    		this.$$set({ name });
    		flush();
    	}

    	get imageurl() {
    		return this.$$.ctx[1];
    	}

    	set imageurl(imageurl) {
    		this.$$set({ imageurl });
    		flush();
    	}
    }

    customElements.define("assistant-apps-patron-tile", PatronTile);

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\module\team\teamList.svelte generated by Svelte v3.48.0 */
    const file$8 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\module\\team\\teamList.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (34:6) {#each teamMembers as teamMember}
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
    			set_custom_element_data(assistant_apps_team_tile, "name", assistant_apps_team_tile_name_value = /*teamMember*/ ctx[4].name);
    			set_custom_element_data(assistant_apps_team_tile, "role", assistant_apps_team_tile_role_value = /*teamMember*/ ctx[4].role);
    			set_custom_element_data(assistant_apps_team_tile, "imageurl", assistant_apps_team_tile_imageurl_value = /*teamMember*/ ctx[4].imageUrl);
    			set_custom_element_data(assistant_apps_team_tile, "linkname", assistant_apps_team_tile_linkname_value = /*teamMember*/ ctx[4].linkName);
    			set_custom_element_data(assistant_apps_team_tile, "linkurl", assistant_apps_team_tile_linkurl_value = /*teamMember*/ ctx[4].linkUrl);
    			add_location(assistant_apps_team_tile, file$8, 34, 8, 1207);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_team_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*teamMembers*/ 2 && assistant_apps_team_tile_name_value !== (assistant_apps_team_tile_name_value = /*teamMember*/ ctx[4].name)) {
    				set_custom_element_data(assistant_apps_team_tile, "name", assistant_apps_team_tile_name_value);
    			}

    			if (dirty & /*teamMembers*/ 2 && assistant_apps_team_tile_role_value !== (assistant_apps_team_tile_role_value = /*teamMember*/ ctx[4].role)) {
    				set_custom_element_data(assistant_apps_team_tile, "role", assistant_apps_team_tile_role_value);
    			}

    			if (dirty & /*teamMembers*/ 2 && assistant_apps_team_tile_imageurl_value !== (assistant_apps_team_tile_imageurl_value = /*teamMember*/ ctx[4].imageUrl)) {
    				set_custom_element_data(assistant_apps_team_tile, "imageurl", assistant_apps_team_tile_imageurl_value);
    			}

    			if (dirty & /*teamMembers*/ 2 && assistant_apps_team_tile_linkname_value !== (assistant_apps_team_tile_linkname_value = /*teamMember*/ ctx[4].linkName)) {
    				set_custom_element_data(assistant_apps_team_tile, "linkname", assistant_apps_team_tile_linkname_value);
    			}

    			if (dirty & /*teamMembers*/ 2 && assistant_apps_team_tile_linkurl_value !== (assistant_apps_team_tile_linkurl_value = /*teamMember*/ ctx[4].linkUrl)) {
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
    		source: "(34:6) {#each teamMembers as teamMember}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div1;
    	let assistant_apps_loading;
    	let slot0;
    	let t0;
    	let slot1;
    	let t1;
    	let div0;
    	let assistant_apps_loading_customloading_value;
    	let assistant_apps_loading_customerror_value;
    	let each_value = /*teamMembers*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			assistant_apps_loading = element("assistant-apps-loading");
    			slot0 = element("slot");
    			t0 = space();
    			slot1 = element("slot");
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$8, 30, 4, 1022);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$8, 31, 4, 1066);
    			attr_dev(div0, "slot", "loaded");
    			attr_dev(div0, "class", "team-members-container");
    			add_location(div0, file$8, 32, 4, 1106);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			set_custom_element_data(assistant_apps_loading, "customloading", assistant_apps_loading_customloading_value = /*$$slots*/ ctx[2].loading);
    			set_custom_element_data(assistant_apps_loading, "customerror", assistant_apps_loading_customerror_value = /*$$slots*/ ctx[2].error);
    			add_location(assistant_apps_loading, file$8, 25, 2, 885);
    			attr_dev(div1, "class", "noselect");
    			add_location(div1, file$8, 24, 0, 859);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, assistant_apps_loading);
    			append_dev(assistant_apps_loading, slot0);
    			append_dev(assistant_apps_loading, t0);
    			append_dev(assistant_apps_loading, slot1);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*teamMembers*/ 2) {
    				each_value = /*teamMembers*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
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

    			if (dirty & /*$$slots*/ 4 && assistant_apps_loading_customloading_value !== (assistant_apps_loading_customloading_value = /*$$slots*/ ctx[2].loading)) {
    				set_custom_element_data(assistant_apps_loading, "customloading", assistant_apps_loading_customloading_value);
    			}

    			if (dirty & /*$$slots*/ 4 && assistant_apps_loading_customerror_value !== (assistant_apps_loading_customerror_value = /*$$slots*/ ctx[2].error)) {
    				set_custom_element_data(assistant_apps_loading, "customerror", assistant_apps_loading_customerror_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	validate_slots('assistant-apps-team-list', slots, []);
    	const $$slots = compute_slots(slots);
    	let networkState = NetworkState.Loading;
    	let teamMembers = [];

    	const fetchTeamMembers = async () => {
    		const aaApi = new AssistantAppsApiService();
    		const teamMembersListResult = await aaApi.getTeamMembersList();

    		if (teamMembersListResult.isSuccess == false || teamMembersListResult.value == null || teamMembersListResult.value.length < 1) {
    			$$invalidate(0, networkState = NetworkState.Error);
    			return;
    		}

    		$$invalidate(1, teamMembers = teamMembersListResult.value);
    		$$invalidate(0, networkState = NetworkState.Success);
    	};

    	onMount(async () => {
    		fetchTeamMembers();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-team-list> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		AssistantAppsApiService,
    		NetworkState,
    		networkState,
    		teamMembers,
    		fetchTeamMembers
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('teamMembers' in $$props) $$invalidate(1, teamMembers = $$props.teamMembers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, teamMembers, $$slots];
    }

    class TeamList extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}assistant-apps-team-tile{display:block;margin-bottom:1em;border-bottom:1px solid
      var(
        --assistantapps-team-member-background-colour,
        rgba(255, 255, 255, 0.1)
      )}assistant-apps-team-tile:last-child{border-bottom:none}</style>`;

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

    customElements.define("assistant-apps-team-list", TeamList);

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\module\team\teamTile.svelte generated by Svelte v3.48.0 */

    const file$7 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\module\\team\\teamTile.svelte";

    // (15:4) {#if linkurl != null && linkname != null}
    function create_if_block$2(ctx) {
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*linkname*/ ctx[3]);
    			attr_dev(a, "href", /*linkurl*/ ctx[4]);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			add_location(a, file$7, 15, 6, 479);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(15:4) {#if linkurl != null && linkname != null}",
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
    	let h3;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let if_block = /*linkurl*/ ctx[4] != null && /*linkname*/ ctx[3] != null && create_if_block$2(ctx);

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
    			attr_dev(img, "class", "team-member-img");
    			add_location(img, file$7, 10, 2, 239);
    			attr_dev(h3, "class", "team-member-name");
    			add_location(h3, file$7, 12, 4, 340);
    			attr_dev(p, "class", "team-member-role");
    			add_location(p, file$7, 13, 4, 386);
    			attr_dev(div0, "class", "team-member-contents");
    			add_location(div0, file$7, 11, 2, 300);
    			attr_dev(div1, "class", "team-member");
    			add_location(div1, file$7, 9, 0, 210);
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
    					if_block = create_if_block$2(ctx);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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

    		this.shadowRoot.innerHTML = `<style>*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.team-member{display:flex;padding-bottom:1em}.team-member img.team-member-img{width:75px;height:75px;border-radius:5px}.team-member .team-member-contents{display:flex;flex-direction:column;justify-content:center;padding-left:1em}.team-member .team-member-name,.team-member .team-member-role{margin:0;padding:0;color:var(--assistantapps-team-member-text-colour, #f0f0f0)}.team-member a{margin:0;padding:0;color:var(--assistantapps-team-member-link-text-colour, #0000ee)}</style>`;

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

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\module\translatorLeaderboard\leaderboardList.svelte generated by Svelte v3.48.0 */
    const file$6 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\module\\translatorLeaderboard\\leaderboardList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (37:6) {#each leaderBoardResult.value ?? [] as leaderBoardItem}
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
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "username", assistant_apps_translation_leaderboard_tile_username_value = /*leaderBoardItem*/ ctx[4].username);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "profileimageurl", assistant_apps_translation_leaderboard_tile_profileimageurl_value = /*leaderBoardItem*/ ctx[4].profileImageUrl);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numtranslations", assistant_apps_translation_leaderboard_tile_numtranslations_value = /*leaderBoardItem*/ ctx[4].numTranslations);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesgiven", assistant_apps_translation_leaderboard_tile_numvotesgiven_value = /*leaderBoardItem*/ ctx[4].numVotesGiven);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesreceived", assistant_apps_translation_leaderboard_tile_numvotesreceived_value = /*leaderBoardItem*/ ctx[4].numVotesReceived);
    			set_custom_element_data(assistant_apps_translation_leaderboard_tile, "total", assistant_apps_translation_leaderboard_tile_total_value = /*leaderBoardItem*/ ctx[4].total);
    			add_location(assistant_apps_translation_leaderboard_tile, file$6, 37, 8, 1436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_translation_leaderboard_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_username_value !== (assistant_apps_translation_leaderboard_tile_username_value = /*leaderBoardItem*/ ctx[4].username)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "username", assistant_apps_translation_leaderboard_tile_username_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_profileimageurl_value !== (assistant_apps_translation_leaderboard_tile_profileimageurl_value = /*leaderBoardItem*/ ctx[4].profileImageUrl)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "profileimageurl", assistant_apps_translation_leaderboard_tile_profileimageurl_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_numtranslations_value !== (assistant_apps_translation_leaderboard_tile_numtranslations_value = /*leaderBoardItem*/ ctx[4].numTranslations)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numtranslations", assistant_apps_translation_leaderboard_tile_numtranslations_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_numvotesgiven_value !== (assistant_apps_translation_leaderboard_tile_numvotesgiven_value = /*leaderBoardItem*/ ctx[4].numVotesGiven)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesgiven", assistant_apps_translation_leaderboard_tile_numvotesgiven_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_numvotesreceived_value !== (assistant_apps_translation_leaderboard_tile_numvotesreceived_value = /*leaderBoardItem*/ ctx[4].numVotesReceived)) {
    				set_custom_element_data(assistant_apps_translation_leaderboard_tile, "numvotesreceived", assistant_apps_translation_leaderboard_tile_numvotesreceived_value);
    			}

    			if (dirty & /*leaderBoardResult*/ 2 && assistant_apps_translation_leaderboard_tile_total_value !== (assistant_apps_translation_leaderboard_tile_total_value = /*leaderBoardItem*/ ctx[4].total)) {
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
    		source: "(37:6) {#each leaderBoardResult.value ?? [] as leaderBoardItem}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let assistant_apps_loading;
    	let slot0;
    	let t0;
    	let slot1;
    	let t1;
    	let div0;
    	let assistant_apps_loading_customloading_value;
    	let assistant_apps_loading_customerror_value;
    	let each_value = /*leaderBoardResult*/ ctx[1].value ?? [];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			assistant_apps_loading = element("assistant-apps-loading");
    			slot0 = element("slot");
    			t0 = space();
    			slot1 = element("slot");
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop;
    			attr_dev(slot0, "name", "loading");
    			attr_dev(slot0, "slot", "loading");
    			add_location(slot0, file$6, 33, 4, 1229);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$6, 34, 4, 1273);
    			attr_dev(div0, "slot", "loaded");
    			attr_dev(div0, "class", "leaderboard-container");
    			add_location(div0, file$6, 35, 4, 1313);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[0]);
    			set_custom_element_data(assistant_apps_loading, "customloading", assistant_apps_loading_customloading_value = /*$$slots*/ ctx[2].loading);
    			set_custom_element_data(assistant_apps_loading, "customerror", assistant_apps_loading_customerror_value = /*$$slots*/ ctx[2].error);
    			add_location(assistant_apps_loading, file$6, 28, 2, 1092);
    			attr_dev(div1, "class", "noselect");
    			add_location(div1, file$6, 27, 0, 1066);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, assistant_apps_loading);
    			append_dev(assistant_apps_loading, slot0);
    			append_dev(assistant_apps_loading, t0);
    			append_dev(assistant_apps_loading, slot1);
    			append_dev(assistant_apps_loading, t1);
    			append_dev(assistant_apps_loading, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
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
    						each_blocks[i].m(div0, null);
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

    			if (dirty & /*$$slots*/ 4 && assistant_apps_loading_customloading_value !== (assistant_apps_loading_customloading_value = /*$$slots*/ ctx[2].loading)) {
    				set_custom_element_data(assistant_apps_loading, "customloading", assistant_apps_loading_customloading_value);
    			}

    			if (dirty & /*$$slots*/ 4 && assistant_apps_loading_customerror_value !== (assistant_apps_loading_customerror_value = /*$$slots*/ ctx[2].error)) {
    				set_custom_element_data(assistant_apps_loading, "customerror", assistant_apps_loading_customerror_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots('assistant-apps-translation-leaderboard', slots, []);
    	const $$slots = compute_slots(slots);
    	let networkState = NetworkState.Loading;
    	let leaderBoardResult = anyObject;

    	const fetchLeaderboard = async () => {
    		const aaApi = new AssistantAppsApiService();
    		const leaderboardListResult = await aaApi.getTranslators();

    		if (leaderboardListResult.isSuccess == false || leaderboardListResult.value == null || leaderboardListResult.value.isSuccess == false || leaderboardListResult.value.value == null || leaderboardListResult.value.value.length < 1) {
    			$$invalidate(0, networkState = NetworkState.Error);
    			return;
    		}

    		$$invalidate(1, leaderBoardResult = leaderboardListResult.value);
    		$$invalidate(0, networkState = NetworkState.Success);
    	};

    	onMount(async () => {
    		fetchLeaderboard();
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
    		leaderBoardResult,
    		fetchLeaderboard
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkState' in $$props) $$invalidate(0, networkState = $$props.networkState);
    		if ('leaderBoardResult' in $$props) $$invalidate(1, leaderBoardResult = $$props.leaderBoardResult);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkState, leaderBoardResult, $$slots];
    }

    class LeaderboardList extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}</style>`;

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

    customElements.define("assistant-apps-translation-leaderboard", LeaderboardList);

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\module\translatorLeaderboard\leaderboardTile.svelte generated by Svelte v3.48.0 */

    const file$5 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\module\\translatorLeaderboard\\leaderboardTile.svelte";

    function create_fragment$5(ctx) {
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

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(/*username*/ ctx[0]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*total*/ ctx[2]);
    			this.c = noop;
    			if (!src_url_equal(img.src, img_src_value = /*profileimageurl*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*username*/ ctx[0]);
    			attr_dev(img, "class", "leaderboard-item-img");
    			add_location(img, file$5, 11, 2, 319);
    			attr_dev(h3, "class", "leaderboard-item-name");
    			add_location(h3, file$5, 13, 4, 441);
    			attr_dev(p, "class", "leaderboard-item-role");
    			add_location(p, file$5, 14, 4, 496);
    			attr_dev(div0, "class", "leaderboard-item-contents");
    			add_location(div0, file$5, 12, 2, 396);
    			attr_dev(div1, "class", "leaderboard-item");
    			add_location(div1, file$5, 10, 0, 285);
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
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*profileimageurl*/ 2 && !src_url_equal(img.src, img_src_value = /*profileimageurl*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*username*/ 1) {
    				attr_dev(img, "alt", /*username*/ ctx[0]);
    			}

    			if (dirty & /*username*/ 1) set_data_dev(t1, /*username*/ ctx[0]);
    			if (dirty & /*total*/ 4) set_data_dev(t3, /*total*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    		if ('numtranslations' in $$props) $$invalidate(3, numtranslations = $$props.numtranslations);
    		if ('numvotesgiven' in $$props) $$invalidate(4, numvotesgiven = $$props.numvotesgiven);
    		if ('numvotesreceived' in $$props) $$invalidate(5, numvotesreceived = $$props.numvotesreceived);
    		if ('total' in $$props) $$invalidate(2, total = $$props.total);
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
    		if ('numtranslations' in $$props) $$invalidate(3, numtranslations = $$props.numtranslations);
    		if ('numvotesgiven' in $$props) $$invalidate(4, numvotesgiven = $$props.numvotesgiven);
    		if ('numvotesreceived' in $$props) $$invalidate(5, numvotesreceived = $$props.numvotesreceived);
    		if ('total' in $$props) $$invalidate(2, total = $$props.total);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		profileimageurl,
    		total,
    		numtranslations,
    		numvotesgiven,
    		numvotesreceived
    	];
    }

    class LeaderboardTile extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>*{font-family:var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );font-weight:var(--assistantapps-font-weight, "bold")}.leaderboard-item{display:flex;padding-bottom:1em}.leaderboard-item img.leaderboard-item-img{width:75px;height:75px;border-radius:5px}.leaderboard-item .leaderboard-item-contents{display:flex;flex-direction:column;justify-content:center;padding-left:1em}.leaderboard-item .leaderboard-item-name,.leaderboard-item .leaderboard-item-role{margin:0;padding:0;color:var(--assistantapps-leaderboard-item-text-colour, #f0f0f0)}</style>`;

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
    				username: 0,
    				profileimageurl: 1,
    				numtranslations: 3,
    				numvotesgiven: 4,
    				numvotesreceived: 5,
    				total: 2
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
    		return this.$$.ctx[3];
    	}

    	set numtranslations(numtranslations) {
    		this.$$set({ numtranslations });
    		flush();
    	}

    	get numvotesgiven() {
    		return this.$$.ctx[4];
    	}

    	set numvotesgiven(numvotesgiven) {
    		this.$$set({ numvotesgiven });
    		flush();
    	}

    	get numvotesreceived() {
    		return this.$$.ctx[5];
    	}

    	set numvotesreceived(numvotesreceived) {
    		this.$$set({ numvotesreceived });
    		flush();
    	}

    	get total() {
    		return this.$$.ctx[2];
    	}

    	set total(total) {
    		this.$$set({ total });
    		flush();
    	}
    }

    customElements.define("assistant-apps-translation-leaderboard-tile", LeaderboardTile);

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\module\version\versionSearch.svelte generated by Svelte v3.48.0 */
    const file$4 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\module\\version\\versionSearch.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (66:8) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Please Select an App";
    			add_location(p, file$4, 67, 12, 2236);
    			attr_dev(div, "class", "dd-button");
    			add_location(div, file$4, 66, 10, 2199);
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
    		source: "(66:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:8) {#if selectedApp != null}
    function create_if_block_1$1(ctx) {
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
    			add_location(img, file$4, 62, 12, 2057);
    			add_location(p, file$4, 63, 12, 2127);
    			attr_dev(div, "class", "dd-button");
    			add_location(div, file$4, 61, 10, 2020);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(61:8) {#if selectedApp != null}",
    		ctx
    	});

    	return block;
    }

    // (73:10) {#each appLookup as app}
    function create_each_block_1(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p;
    	let t1_value = /*app*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let li_value_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*app*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*app*/ ctx[12].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*app*/ ctx[12].name);
    			add_location(img, file$4, 78, 14, 2587);
    			add_location(p, file$4, 79, 14, 2643);
    			attr_dev(li, "class", "dd-menu-item");
    			li.value = li_value_value = /*app*/ ctx[12].guid;
    			add_location(li, file$4, 73, 12, 2428);
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

    			if (dirty & /*appLookup*/ 1 && !src_url_equal(img.src, img_src_value = /*app*/ ctx[12].iconUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*appLookup*/ 1 && img_alt_value !== (img_alt_value = /*app*/ ctx[12].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*appLookup*/ 1 && t1_value !== (t1_value = /*app*/ ctx[12].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*appLookup*/ 1 && li_value_value !== (li_value_value = /*app*/ ctx[12].guid)) {
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
    		source: "(73:10) {#each appLookup as app}",
    		ctx
    	});

    	return block;
    }

    // (87:8) {#each whatIsNewPagination.value ?? [] as whatIsNewItem}
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
    			set_custom_element_data(assistant_apps_version_search_tile, "guid", assistant_apps_version_search_tile_guid_value = /*whatIsNewItem*/ ctx[9].guid);
    			set_custom_element_data(assistant_apps_version_search_tile, "markdown", assistant_apps_version_search_tile_markdown_value = /*whatIsNewItem*/ ctx[9].markdown);
    			set_custom_element_data(assistant_apps_version_search_tile, "buildname", assistant_apps_version_search_tile_buildname_value = /*whatIsNewItem*/ ctx[9].buildName);
    			set_custom_element_data(assistant_apps_version_search_tile, "buildnumber", assistant_apps_version_search_tile_buildnumber_value = /*whatIsNewItem*/ ctx[9].buildNumber);
    			set_custom_element_data(assistant_apps_version_search_tile, "platforms", assistant_apps_version_search_tile_platforms_value = /*whatIsNewItem*/ ctx[9].platforms);
    			set_custom_element_data(assistant_apps_version_search_tile, "activedate", assistant_apps_version_search_tile_activedate_value = /*whatIsNewItem*/ ctx[9].activeDate);
    			add_location(assistant_apps_version_search_tile, file$4, 87, 10, 2861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, assistant_apps_version_search_tile, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_guid_value !== (assistant_apps_version_search_tile_guid_value = /*whatIsNewItem*/ ctx[9].guid)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "guid", assistant_apps_version_search_tile_guid_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_markdown_value !== (assistant_apps_version_search_tile_markdown_value = /*whatIsNewItem*/ ctx[9].markdown)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "markdown", assistant_apps_version_search_tile_markdown_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_buildname_value !== (assistant_apps_version_search_tile_buildname_value = /*whatIsNewItem*/ ctx[9].buildName)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "buildname", assistant_apps_version_search_tile_buildname_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_buildnumber_value !== (assistant_apps_version_search_tile_buildnumber_value = /*whatIsNewItem*/ ctx[9].buildNumber)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "buildnumber", assistant_apps_version_search_tile_buildnumber_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_platforms_value !== (assistant_apps_version_search_tile_platforms_value = /*whatIsNewItem*/ ctx[9].platforms)) {
    				set_custom_element_data(assistant_apps_version_search_tile, "platforms", assistant_apps_version_search_tile_platforms_value);
    			}

    			if (dirty & /*whatIsNewPagination*/ 8 && assistant_apps_version_search_tile_activedate_value !== (assistant_apps_version_search_tile_activedate_value = /*whatIsNewItem*/ ctx[9].activeDate)) {
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
    		source: "(87:8) {#each whatIsNewPagination.value ?? [] as whatIsNewItem}",
    		ctx
    	});

    	return block;
    }

    // (97:8) {#if whatIsNewPagination.value == null || whatIsNewPagination.value.length < 1}
    function create_if_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No items to display";
    			add_location(p, file$4, 97, 10, 3316);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(97:8) {#if whatIsNewPagination.value == null || whatIsNewPagination.value.length < 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
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
    	let assistant_apps_loading_customloading_value;
    	let assistant_apps_loading_customerror_value;

    	function select_block_type(ctx, dirty) {
    		if (/*selectedApp*/ ctx[1] != null) return create_if_block_1$1;
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

    	let if_block1 = (/*whatIsNewPagination*/ ctx[3].value == null || /*whatIsNewPagination*/ ctx[3].value.length < 1) && create_if_block$1(ctx);

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
    			add_location(slot0, file$4, 56, 4, 1812);
    			attr_dev(slot1, "name", "error");
    			attr_dev(slot1, "slot", "error");
    			add_location(slot1, file$4, 57, 4, 1856);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "dd-input");
    			add_location(input, file$4, 70, 8, 2306);
    			attr_dev(ul, "class", "dd-menu");
    			add_location(ul, file$4, 71, 8, 2358);
    			attr_dev(label, "class", "dropdown");
    			add_location(label, file$4, 59, 6, 1949);
    			attr_dev(div0, "class", "what-is-new-container noselect");
    			add_location(div0, file$4, 85, 6, 2739);
    			attr_dev(div1, "slot", "loaded");
    			attr_dev(div1, "class", "version-container");
    			add_location(div1, file$4, 58, 4, 1896);
    			set_custom_element_data(assistant_apps_loading, "networkstate", /*networkState*/ ctx[2]);
    			set_custom_element_data(assistant_apps_loading, "customloading", assistant_apps_loading_customloading_value = /*$$slots*/ ctx[5].loading);
    			set_custom_element_data(assistant_apps_loading, "customerror", assistant_apps_loading_customerror_value = /*$$slots*/ ctx[5].error);
    			add_location(assistant_apps_loading, file$4, 51, 2, 1675);
    			attr_dev(div2, "class", "noselect");
    			add_location(div2, file$4, 50, 0, 1649);
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
    					if_block1 = create_if_block$1(ctx);
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

    			if (dirty & /*$$slots*/ 32 && assistant_apps_loading_customloading_value !== (assistant_apps_loading_customloading_value = /*$$slots*/ ctx[5].loading)) {
    				set_custom_element_data(assistant_apps_loading, "customloading", assistant_apps_loading_customloading_value);
    			}

    			if (dirty & /*$$slots*/ 32 && assistant_apps_loading_customerror_value !== (assistant_apps_loading_customerror_value = /*$$slots*/ ctx[5].error)) {
    				set_custom_element_data(assistant_apps_loading, "customerror", assistant_apps_loading_customerror_value);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-version-search', slots, []);
    	const $$slots = compute_slots(slots);
    	const aaApi = new AssistantAppsApiService();
    	let appLookup = [];
    	let selectedApp;
    	let networkState = NetworkState.Loading;
    	let whatIsNewPagination = anyObject;

    	const fetchApps = async () => {
    		const appsResult = await aaApi.getApps();

    		if (appsResult.isSuccess === false || appsResult.value == null || appsResult.value.length < 1) {
    			$$invalidate(2, networkState = NetworkState.Error);
    			return;
    		}

    		$$invalidate(0, appLookup = appsResult.value);
    		$$invalidate(1, selectedApp = appsResult.value[0]);
    		$$invalidate(2, networkState = NetworkState.Success);
    	};

    	const fetchWhatIsNewItems = async appSelected => {
    		if (appSelected == null) return;
    		$$invalidate(1, selectedApp = appSelected);
    		$$invalidate(2, networkState = NetworkState.Loading);

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
    		$$slots,
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
    				props: {
    					...attribute_to_object(this.attributes),
    					$$slots: get_custom_elements_slots(this)
    				},
    				customElement: true
    			},
    			instance$4,
    			create_fragment$4,
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

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\module\version\versionSearchTile.svelte generated by Svelte v3.48.0 */
    const file$3 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\module\\version\\versionSearchTile.svelte";

    function create_fragment$3(ctx) {
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
    			add_location(h3, file$3, 13, 4, 394);
    			attr_dev(span, "class", "version-date");
    			add_location(span, file$3, 14, 4, 441);
    			attr_dev(div0, "class", "version-header");
    			add_location(div0, file$3, 12, 2, 360);
    			set_custom_element_data(assistant_apps_markdown, "source", /*markdown*/ ctx[1]);
    			add_location(assistant_apps_markdown, file$3, 17, 4, 544);
    			attr_dev(div1, "class", "markdown");
    			add_location(div1, file$3, 16, 2, 516);
    			attr_dev(div2, "class", "version");
    			attr_dev(div2, "data-guid", /*guid*/ ctx[0]);
    			add_location(div2, file$3, 11, 0, 318);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('assistant-apps-version-search-tile', slots, []);
    	let { guid = "" } = $$props;
    	let { markdown = "" } = $$props;
    	let { buildname = "" } = $$props;
    	let { buildnumber = 0 } = $$props;
    	let { platforms = [] } = $$props;
    	let { activedate = null } = $$props;
    	const writable_props = ['guid', 'markdown', 'buildname', 'buildnumber', 'platforms', 'activedate'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-version-search-tile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('guid' in $$props) $$invalidate(0, guid = $$props.guid);
    		if ('markdown' in $$props) $$invalidate(1, markdown = $$props.markdown);
    		if ('buildname' in $$props) $$invalidate(2, buildname = $$props.buildname);
    		if ('buildnumber' in $$props) $$invalidate(4, buildnumber = $$props.buildnumber);
    		if ('platforms' in $$props) $$invalidate(5, platforms = $$props.platforms);
    		if ('activedate' in $$props) $$invalidate(3, activedate = $$props.activedate);
    	};

    	$$self.$capture_state = () => ({
    		defaultFormat,
    		guid,
    		markdown,
    		buildname,
    		buildnumber,
    		platforms,
    		activedate
    	});

    	$$self.$inject_state = $$props => {
    		if ('guid' in $$props) $$invalidate(0, guid = $$props.guid);
    		if ('markdown' in $$props) $$invalidate(1, markdown = $$props.markdown);
    		if ('buildname' in $$props) $$invalidate(2, buildname = $$props.buildname);
    		if ('buildnumber' in $$props) $$invalidate(4, buildnumber = $$props.buildnumber);
    		if ('platforms' in $$props) $$invalidate(5, platforms = $$props.platforms);
    		if ('activedate' in $$props) $$invalidate(3, activedate = $$props.activedate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [guid, markdown, buildname, activedate, buildnumber, platforms];
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
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				guid: 0,
    				markdown: 1,
    				buildname: 2,
    				buildnumber: 4,
    				platforms: 5,
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
    		return ["guid", "markdown", "buildname", "buildnumber", "platforms", "activedate"];
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

    	get buildnumber() {
    		return this.$$.ctx[4];
    	}

    	set buildnumber(buildnumber) {
    		this.$$set({ buildnumber });
    		flush();
    	}

    	get platforms() {
    		return this.$$.ctx[5];
    	}

    	set platforms(platforms) {
    		this.$$set({ platforms });
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

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\shared\loadingWithSlots.svelte generated by Svelte v3.48.0 */
    const file$2 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\shared\\loadingWithSlots.svelte";

    // (11:2) {#if networkstate == NetworkState.Loading}
    function create_if_block_2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*customloading*/ ctx[1]) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(11:2) {#if networkstate == NetworkState.Loading}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Loading...";
    			add_location(span, file$2, 15, 8, 433);
    			set_style(div, "text-align", "center");
    			add_location(div, file$2, 14, 6, 391);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(14:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:4) {#if customloading}
    function create_if_block_3(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			attr_dev(slot, "name", "loading");
    			add_location(slot, file$2, 12, 6, 347);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(12:4) {#if customloading}",
    		ctx
    	});

    	return block;
    }

    // (20:2) {#if networkstate == NetworkState.Error}
    function create_if_block(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*customerror*/ ctx[2]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(20:2) {#if networkstate == NetworkState.Error}",
    		ctx
    	});

    	return block;
    }

    // (23:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Something went wrong...";
    			add_location(span, file$2, 24, 8, 659);
    			set_style(div, "text-align", "center");
    			add_location(div, file$2, 23, 6, 617);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(23:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:4) {#if customerror}
    function create_if_block_1(ctx) {
    	let slot;

    	const block = {
    		c: function create() {
    			slot = element("slot");
    			slot.textContent = "error";
    			attr_dev(slot, "name", "error");
    			add_location(slot, file$2, 21, 6, 565);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:4) {#if customerror}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let slot0;
    	let t0;
    	let t1;
    	let t2;
    	let slot1;
    	let div0;
    	let span;
    	let t3;
    	let b;
    	let t5;
    	let if_block0 = /*networkstate*/ ctx[0] == NetworkState.Loading && create_if_block_2(ctx);
    	let if_block1 = /*networkstate*/ ctx[0] == NetworkState.Error && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			slot0 = element("slot");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			slot1 = element("slot");
    			div0 = element("div");
    			span = element("span");
    			t3 = text("Nothing supplied in the ");
    			b = element("b");
    			b.textContent = "loaded";
    			t5 = text(" slot");
    			this.c = noop;
    			attr_dev(slot0, "name", "loading");
    			add_location(slot0, file$2, 9, 2, 245);
    			add_location(b, file$2, 30, 36, 829);
    			add_location(span, file$2, 30, 6, 799);
    			set_style(div0, "text-align", "center");
    			add_location(div0, file$2, 29, 4, 759);
    			attr_dev(slot1, "name", "loaded");
    			add_location(slot1, file$2, 28, 2, 733);
    			attr_dev(div1, "class", "noselect");
    			add_location(div1, file$2, 8, 0, 219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, slot0);
    			append_dev(div1, t0);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, slot1);
    			append_dev(slot1, div0);
    			append_dev(div0, span);
    			append_dev(span, t3);
    			append_dev(span, b);
    			append_dev(span, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*networkstate*/ ctx[0] == NetworkState.Loading) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div1, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*networkstate*/ ctx[0] == NetworkState.Error) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div1, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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
    	let { customloading } = $$props;
    	let { customerror } = $$props;
    	const writable_props = ['networkstate', 'customloading', 'customerror'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-loading> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('networkstate' in $$props) $$invalidate(0, networkstate = $$props.networkstate);
    		if ('customloading' in $$props) $$invalidate(1, customloading = $$props.customloading);
    		if ('customerror' in $$props) $$invalidate(2, customerror = $$props.customerror);
    	};

    	$$self.$capture_state = () => ({
    		NetworkState,
    		networkstate,
    		customloading,
    		customerror
    	});

    	$$self.$inject_state = $$props => {
    		if ('networkstate' in $$props) $$invalidate(0, networkstate = $$props.networkstate);
    		if ('customloading' in $$props) $$invalidate(1, customloading = $$props.customloading);
    		if ('customerror' in $$props) $$invalidate(2, customerror = $$props.customerror);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkstate, customloading, customerror];
    }

    class LoadingWithSlots extends SvelteElement {
    	constructor(options) {
    		super();

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
    			{
    				networkstate: 0,
    				customloading: 1,
    				customerror: 2
    			},
    			null
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*networkstate*/ ctx[0] === undefined && !('networkstate' in props)) {
    			console.warn("<assistant-apps-loading> was created without expected prop 'networkstate'");
    		}

    		if (/*customloading*/ ctx[1] === undefined && !('customloading' in props)) {
    			console.warn("<assistant-apps-loading> was created without expected prop 'customloading'");
    		}

    		if (/*customerror*/ ctx[2] === undefined && !('customerror' in props)) {
    			console.warn("<assistant-apps-loading> was created without expected prop 'customerror'");
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
    		return ["networkstate", "customloading", "customerror"];
    	}

    	get networkstate() {
    		return this.$$.ctx[0];
    	}

    	set networkstate(networkstate) {
    		this.$$set({ networkstate });
    		flush();
    	}

    	get customloading() {
    		return this.$$.ctx[1];
    	}

    	set customloading(customloading) {
    		this.$$set({ customloading });
    		flush();
    	}

    	get customerror() {
    		return this.$$.ctx[2];
    	}

    	set customerror(customerror) {
    		this.$$set({ customerror });
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

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\shared\markdown.svelte generated by Svelte v3.48.0 */
    const file$1 = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\shared\\markdown.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let raw_value = /*_marked*/ ctx[1](/*source*/ ctx[0]) + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			this.c = noop;
    			attr_dev(div, "class", "markdown");
    			add_location(div, file$1, 7, 0, 167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: noop,
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
    	const source = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<assistant-apps-markdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ marked, _marked, source });

    	$$self.$inject_state = $$props => {
    		if ('_marked' in $$props) $$invalidate(1, _marked = $$props._marked);
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

    	set source(value) {
    		throw new Error("<assistant-apps-markdown>: Cannot set read-only property 'source'");
    	}
    }

    customElements.define("assistant-apps-markdown", Markdown);

    /* D:\Development\Projects\AssistantApps\AssistantApps.WebComponents\src\App.svelte generated by Svelte v3.48.0 */

    const file = "D:\\Development\\Projects\\AssistantApps\\AssistantApps.WebComponents\\src\\App.svelte";

    function create_fragment(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = `Hello ${/*name*/ ctx[0]}!`;
    			this.c = noop;
    			add_location(h1, file, 5, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
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
    	validate_slots('my-counter', slots, []);
    	let name = "world";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<my-counter> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ name });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteElement {
    	constructor(options) {
    		super();

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

    customElements.define("my-counter", App);

    console.log(`AssistantApps.WebComponents v${currentVersion}`);

})();
//# sourceMappingURL=bundle.js.map
