YUI.add('transition-native', function(Y) {

/**
* Provides the transition method for Node.
* Transition has no API of its own, but adds the transition method to Node.
*
* @module transition
* @requires node
*/

var TRANSITION = '-webkit-transition',
    TRANSITION_PROPERTY_CAMEL = 'WebkitTransition',
    TRANSITION_PROPERTY = '-webkit-transition-property',
    TRANSITION_DURATION = '-webkit-transition-duration',
    TRANSITION_TIMING_FUNCTION = '-webkit-transition-timing-function',
    TRANSITION_DELAY = '-webkit-transition-delay',
    TRANSITION_END = 'webkitTransitionEnd',
    TRANSFORM_CAMEL = 'WebkitTransform',

    EMPTY_OBJ = {},

/**
 * A class for constructing transition instances.
 * Adds the "transition" method to Node.
 * @class Transition
 * @constructor
 */

Transition = function() {
    this.init.apply(this, arguments);
};

Transition._fx = {};

Transition.add = function(name, config) {
    if (typeof name !== 'string') {
        Y.Object.each(name, function(v, n) {
            Transition.add(n, v);
        });
    } else {
        Transition._fx[name] = config;
    }
};

Transition._toCamel = function(property) {
    property = property.replace(/-([a-z])/gi, function(m0, m1) {
        return m1.toUpperCase();
    });

    return property;
};

Transition._toHyphen = function(property) {
    property = property.replace(/([A-Z]?)([a-z]+)([A-Z]?)/g, function(m0, m1, m2, m3) {
        var str = '';
        if (m1) {
            str += '-' + m1.toLowerCase();
        }
        str += m2;
        
        if (m3) {
            str += '-' + m3.toLowerCase();
        }

        return str;
    }); 

    return property;
};


Transition._reKeywords = /^(?:node|duration|iterations|easing|delay|on|onstart|onend)$/i;

Transition.useNative = false;

if (TRANSITION in Y.config.doc.documentElement.style) {
    Transition.useNative = true;
    Transition.supported = true; // TODO: remove
}

Y.Node.DOM_EVENTS[TRANSITION_END] = 1; 

Transition.NAME = 'transition';

Transition.DEFAULT_EASING = 'ease';
Transition.DEFAULT_DURATION = 0.5;
Transition.DEFAULT_DELAY = 0;

Transition._nodeAttrs = {};

Transition.prototype = {
    constructor: Transition,
    init: function(node, config) {
        var anim = this;
        if (!anim._running) {
            anim._node = node;
            anim._config = config;
            node._transition = anim; // cache for reuse

            anim._duration = ('duration' in config) ?
                config.duration: anim.constructor.DEFAULT_DURATION;

            anim._delay = ('delay' in config) ?
                config.delay: anim.constructor.DEFAULT_DELAY;

            anim._easing = config.easing || anim.constructor.DEFAULT_EASING;
            anim._count = 0; // track number of animated properties
            anim._running = false;

        }

        return anim;
    },

    addProperty: function(prop, config) {
        var anim = this,
            node = this._node,
            uid = Y.stamp(node),
            attrs = Transition._nodeAttrs[uid],
            attr,
            val;

        if (!attrs) {
            attrs = Transition._nodeAttrs[uid] = {};
        }

        attr = attrs[prop];

        // might just be a value
        if (config && config.value !== undefined) {
            val = config.value;
        } else if (config !== undefined) {
            val = config; 
            config = EMPTY_OBJ;
        }

        if (typeof val === 'function') {
            val = val.call(node, node);
        }

        // take control if another transition owns this property
        if (attr && attr.transition && attr.transition !== anim) {
            attr.transition._count--; // remapping attr to this transition
        }

        anim._count++; // properties per transition

        attrs[prop] = {
            value: val,
            duration: ((typeof config.duration !== 'undefined') ? config.duration :
                    anim._duration) || 0.0001, // make 0 async and fire events

            delay: (typeof config.delay !== 'undefined') ? config.delay :
                    anim._delay,

            easing: config.easing || anim._easing,

            transition: anim
        };
    },

    removeProperty: function(prop) {
        var anim = this,
            attrs = Transition._nodeAttrs[Y.stamp(anim._node)];

        if (attrs && attrs[prop]) {
            delete attrs[prop];
            anim._count--;
        }

    },

    initAttrs: function(config) {
        var attr;

        if (config.transform && !config[TRANSFORM_CAMEL]) {
            config[TRANSFORM_CAMEL] = config.transform;
            delete config.transform; // TODO: copy
        }

        for (attr in config) {
            if (config.hasOwnProperty(attr) && !Transition._reKeywords.test(attr)) {
                this.addProperty(attr, config[attr]);
            }

        }
    },

    /**
     * Starts or an animation.
     * @method run
     * @chainable
     * @private
     */    
    run: function(callback) {
        var anim = this,
            node = anim._node,
            config = anim._config,
            data = {
                type: 'transition:start',
                config: config
            };


        if (!anim._running) {
            anim._running = true;

            anim._node.fire('transition:start', data);

            if (config.on && config.on.start) {
                config.on.start.call(node, data);
            }

            anim.initAttrs(anim._config);

            anim._callback = callback;
            anim._start();
        }


        return anim;
    },

    _start: function() {
        this._runNative();
    },

    _prepDur: function(dur) {
        dur = parseFloat(dur);

        return dur + 's';
    },

    _runNative: function(time) {
        var anim = this,
            node = anim._node,
            uid = Y.stamp(node),
            domNode = node._node,
            style = domNode.style,
            computed = getComputedStyle(domNode),
            attrs = Transition._nodeAttrs[uid],
            cssText = '',
            cssTransition = computed[TRANSITION_PROPERTY],

            transitionText = TRANSITION_PROPERTY + ': ',
            duration = TRANSITION_DURATION + ': ',
            easing = TRANSITION_TIMING_FUNCTION + ': ',
            delay = TRANSITION_DELAY + ': ',
            hyphy,
            attr,
            name;

        // preserve existing transitions
        if (cssTransition !== 'all') {
            transitionText += cssTransition + ',';
            duration += computed[TRANSITION_DURATION] + ',';
            easing += computed[TRANSITION_TIMING_FUNCTION] + ',';
            delay += computed[TRANSITION_DELAY] + ',';

        }

        // run transitions mapped to this instance
        for (name in attrs) {
            hyphy = Transition._toHyphen(name);
            attr = attrs[name];
            if (attrs.hasOwnProperty(name) && attr.transition === anim) {
                if (name in domNode.style) { // only native styles allowed
                    duration += anim._prepDur(attr.duration) + ',';
                    delay += anim._prepDur(attr.delay) + ',';
                    easing += (attr.easing) + ',';

                    transitionText += hyphy + ',';
                    cssText += hyphy + ': ' + attr.value + '; ';
                } else {
                    this.removeProperty(name);
                }
            }
        }

        transitionText = transitionText.replace(/,$/, ';');
        duration = duration.replace(/,$/, ';');
        easing = easing.replace(/,$/, ';');
        delay = delay.replace(/,$/, ';');

        // only one native end event per node
        if (!node._hasTransitionEnd) {
            anim._detach = node.on(TRANSITION_END, anim._onNativeEnd);
            node._hasTransitionEnd = true;

        }

        style.cssText += transitionText + duration + easing + delay + cssText;

    },

    _end: function(elapsed) {
        var anim = this,
            node = anim._node,
            callback = anim._callback,
            config = anim._config,
            data = {
                type: 'transition:end',
                config: config,
                elapsedTime: elapsed 
            };

        anim._running = false;
        anim._callback = null;

        if (config.on && config.on.end) {
            setTimeout(function() { // IE: allow previous update to finish
                config.on.end.call(node, data);

                // nested to ensure proper fire order
                if (callback) {
                    callback.call(node, data);
                }

            }, 1);
        } else if (callback) {
            setTimeout(function() { // IE: allow previous update to finish
                callback.call(node, data);
            }, 1);
        }

        node.fire('transition:end', data);
    },

    _endNative: function(name) {
        var node = this._node,
            value = node.getComputedStyle(TRANSITION_PROPERTY);

        if (typeof value === 'string') {
            value = value.replace(new RegExp('(?:^|,\\s)' + name + ',?'), ',');
            value = value.replace(/^,|,$/, '');
            node.setStyle(TRANSITION_PROPERTY_CAMEL, value);
        }
    },

    _onNativeEnd: function(e) {
        var node = this,
            uid = Y.stamp(node),
            event = e._event,
            name = Transition._toCamel(event.propertyName),
            elapsed = event.elapsedTime,
            attrs = Transition._nodeAttrs[uid],
            attr = attrs[name],
            anim = (attr) ? attr.transition : null,
            data = {
                type: 'propertyEnd',
                propertyName: name,
                elapsedTime: elapsed
            },
            config;

        if (anim) {
            anim.removeProperty(name);
            anim._endNative(name);
            config = anim._config[name];

            if (config && config.on && config.on.end) {
                config.on.end.call(node, data);
            }

            node.fire('transition:propertyEnd', data);

            if (anim._count <= 0)  { // after propertEnd fires
                anim._end(elapsed);
            }

        }
    },

    destroy: function() {
        var anim = this;
        if (anim._detach) {
            anim._detach.detach();
        }
        anim._node = null;
    }
};

Y.Transition = Transition;
Y.TransitionNative = Transition; // TODO: remove

/** 
 *   Animate one or more css properties to a given value. Requires the "transition" module.
 *   <pre>example usage:
 *       Y.one('#demo').transition({
 *           duration: 1, // in seconds, default is 0.5
 *           easing: 'ease-out', // default is 'ease'
 *           delay: '1', // delay start for 1 second, default is 0
 *
 *           height: '10px',
 *           width: '10px',
 *
 *           opacity: { // per property
 *               value: 0,
 *               duration: 2,
 *               delay: 2,
 *               easing: 'ease-in'
 *           }
 *       });
 *   </pre>
 *   @for Node
 *   @method transition
 *   @param {Object} config An object containing one or more style properties, a duration and an easing.
 *   @param {Function} callback A function to run after the transition has completed. 
 *   @chainable
*/
Y.Node.prototype.transition = function(name, config, callback) {
    var anim = this._transition,
        fxConfig,
        prop;
    
    if (typeof name === 'string') { // named effect, pull config from registry
        if (typeof config === 'function') {
            callback = config;
            config = null;
        }

        fxConfig = Transition._fx[name];

        if (config && typeof config !== 'boolean') {
            config = Y.clone(config);

            for (prop in fxConfig) {
                if (fxConfig.hasOwnProperty(prop)) {
                    if (! (prop in config)) {
                        config[prop] = fxConfig[prop]; 
                    }
                }
            }
        } else {
            config = fxConfig;
        }

    } else { // name is a config, config is a callback or undefined
        callback = config;
        config = name;
    }

    if (anim && !anim._running) {
        anim.init(this, config);
    } else {
        anim = new Transition(this, config);
    }

    anim.run(callback);
    return this;
};

Y.Node.prototype.show = function(name, config, callback) {
    this._show(); // show prior to transition
    if (name && Y.Transition) {
        if (typeof name !== 'string' && !name.push) { // named effect or array of effects supercedes default
            if (typeof config === 'function') {
                callback = config;
                config = name;
            }
            name = this.SHOW_TRANSITION; 
        }    
        this.transition(name, config, callback);
    }    
    return this;
};

var _wrapCallBack = function(callback, fn) {
    return function() {
        if (fn) {
            fn.call(this);
        }
        callback.apply(this, arguments);
    }
};

Y.Node.prototype.hide = function(name, config, callback) {
    if (name && Y.Transition) {
        if (typeof config === 'function') {
            callback = config;
            config = null;
        }

        if (callback) { // need to hide when transition ends
            callback = _wrapCallBack(callback, this._hide); // wrap with existing callback
        } else {
            callback = this._hide;
        }    
        if (typeof name !== 'string' && !name.push) { // named effect or array of effects supercedes default
            if (typeof config === 'function') {
                callback = config;
                config = name;
            }
            name = this.HIDE_TRANSITION; 
        }    
        this.transition(name, config, callback);
    } else {
        this._hide();
    }    
    return this;
}; 

/** 
 *   Animate one or more css properties to a given value. Requires the "transition" module.
 *   <pre>example usage:
 *       Y.all('.demo').transition({
 *           duration: 1, // in seconds, default is 0.5
 *           easing: 'ease-out', // default is 'ease'
 *           delay: '1', // delay start for 1 second, default is 0
 *
 *           height: '10px',
 *           width: '10px',
 *
 *           opacity: { // per property
 *               value: 0,
 *               duration: 2,
 *               delay: 2,
 *               easing: 'ease-in'
 *           }
 *       });
 *   </pre>
 *   @for NodeList
 *   @method transition
 *   @param {Object} config An object containing one or more style properties, a duration and an easing.
 *   @param {Function} callback A function to run after the transition has completed. The callback fires
 *       once per item in the NodeList.
 *   @chainable
*/
Y.NodeList.prototype.transition = function(config, callback) {
    this.each(function(node) {
        node.transition(config, callback);
    });

    return this;
};

Transition.add({
    fadeOut: {
        opacity: 0,
        duration: 0.5,
        easing: 'ease-out'
    },

    fadeIn: {
        opacity: 1,
        duration: 0.5,
        easing: 'ease-in'
    },

    sizeOut: {
        height: 0,
        width: 0,
        duration: 0.75,
        easing: 'ease-out'
    },

    sizeIn: {
        height: function(node) {
            return node.get('scrollHeight') + 'px';
        },
        width: function(node) {
            return node.get('scrollWidth') + 'px';
        },
        duration: 0.5,
        easing: 'ease-in',
        
        on: {
            start: function() {
                var overflow = this.getStyle('overflow');
                if (overflow !== 'hidden') { // enable scrollHeight/Width
                    this.setStyle('overflow', 'hidden');
                    this._transitionOverflow = overflow;
                }
            },

            end: function() {
                if (this._transitionOverflow) { // revert overridden value
                    this.setStyle('overflow', this._transitionOverflow);
                }
            }
        } 
    }
});


}, '@VERSION@' ,{requires:['node-base']});
