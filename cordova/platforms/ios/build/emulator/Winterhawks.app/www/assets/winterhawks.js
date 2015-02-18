define('winterhawks/adapters/application', ['exports', 'ember-data', 'winterhawks/config/environment'], function (exports, DS, config) {

  'use strict';

  exports['default'] = DS['default'].ActiveModelAdapter.extend({
    host: config['default'].apiUrl
  });

});
define('winterhawks/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'winterhawks/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  var App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('winterhawks/components/cdv-nav-bar', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    tagName: "header"
  });

});
define('winterhawks/components/lf-overlay', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    tagName: "span",
    classNames: ["lf-overlay"],
    didInsertElement: function () {
      Ember['default'].$("body").addClass("lf-modal-open");
    },
    willDestroy: function () {
      Ember['default'].$("body").removeClass("lf-modal-open");
    },
    click: function () {
      this.sendAction("clickAway");
    }
  });

});
define('winterhawks/components/liquid-measured', ['exports', 'liquid-fire/mutation-observer', 'ember'], function (exports, MutationObserver, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({

    didInsertElement: function () {
      var self = this;

      // This prevents margin collapse
      this.$().css({
        border: "1px solid transparent",
        margin: "-1px"
      });

      this.didMutate();

      this.observer = new MutationObserver['default'](function (mutations) {
        self.didMutate(mutations);
      });
      this.observer.observe(this.get("element"), {
        attributes: true,
        subtree: true,
        childList: true
      });
      this.$().bind("webkitTransitionEnd", function () {
        self.didMutate();
      });
      // Chrome Memory Leak: https://bugs.webkit.org/show_bug.cgi?id=93661
      window.addEventListener("unload", function () {
        self.willDestroyElement();
      });
    },

    willDestroyElement: function () {
      if (this.observer) {
        this.observer.disconnect();
      }
    },

    didMutate: function () {
      Ember['default'].run.next(this, function () {
        this._didMutate();
      });
    },

    _didMutate: function () {
      var elt = this.$();
      if (!elt || !elt[0]) {
        return;
      }

      // if jQuery sees a zero dimension, it will temporarily modify the
      // element's css to try to make its size measurable. But that's bad
      // for us here, because we'll get an infinite recursion of mutation
      // events. So we trap the zero case without hitting jQuery.

      if (elt[0].offsetWidth === 0) {
        this.set("width", 0);
      } else {
        this.set("width", elt.outerWidth());
      }
      if (elt[0].offsetHeight === 0) {
        this.set("height", 0);
      } else {
        this.set("height", elt.outerHeight());
      }
    }

  });

});
define('winterhawks/components/liquid-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    classNames: ["liquid-modal"],
    currentContext: Ember['default'].computed.oneWay("owner.modalContexts.lastObject"),

    owner: null, // set by injection

    innerView: Ember['default'].computed("currentContext", function () {
      var self = this,
          current = this.get("currentContext"),
          name = current.get("name"),
          container = this.get("container"),
          component = container.lookup("component-lookup:main").lookupFactory(name);
      Ember['default'].assert("Tried to render a modal using component '" + name + "', but couldn't find it.", !!component);

      var args = Ember['default'].copy(current.get("params"));

      args.registerMyself = Ember['default'].on("init", function () {
        self.set("innerViewInstance", this);
      });

      // set source so we can bind other params to it
      args._source = Ember['default'].computed(function () {
        return current.get("source");
      });

      var otherParams = current.get("options.otherParams");
      var from, to;
      for (from in otherParams) {
        to = otherParams[from];
        args[to] = Ember['default'].computed.alias("_source." + from);
      }

      var actions = current.get("options.actions") || {};

      // Override sendAction in the modal component so we can intercept and
      // dynamically dispatch to the controller as expected
      args.sendAction = function (name) {
        var actionName = actions[name];
        if (!actionName) {
          this._super.apply(this, Array.prototype.slice.call(arguments));
          return;
        }

        var controller = current.get("source");
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(actionName);
        controller.send.apply(controller, args);
      };

      return component.extend(args);
    }),

    actions: {
      outsideClick: function () {
        if (this.get("currentContext.options.dismissWithOutsideClick")) {
          this.send("dismiss");
        } else {
          proxyToInnerInstance(this, "outsideClick");
        }
      },
      escape: function () {
        if (this.get("currentContext.options.dismissWithEscape")) {
          this.send("dismiss");
        } else {
          proxyToInnerInstance(this, "escape");
        }
      },
      dismiss: function () {
        var source = this.get("currentContext.source"),
            proto = source.constructor.proto(),
            params = this.get("currentContext.options.withParams"),
            clearThem = {};

        for (var key in params) {
          clearThem[key] = proto[key];
        }
        source.setProperties(clearThem);
      }
    }
  });

  function proxyToInnerInstance(self, message) {
    var vi = self.get("innerViewInstance");
    if (vi) {
      vi.send(message);
    }
  }

});
define('winterhawks/components/liquid-spacer', ['exports', 'ember', 'liquid-fire/promise'], function (exports, Ember, Promise) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    growDuration: 250,
    growPixelsPerSecond: 200,
    growEasing: "slide",
    enabled: true,

    didInsertElement: function () {
      var child = this.$("> div");
      this.$().css({
        overflow: "hidden",
        width: child.width(),
        height: child.height()
      });
    },

    sizeChange: Ember['default'].observer("width", "height", function () {
      var elt = this.$();
      if (!this.get("enabled")) {
        elt.width(this.get("width"));
        elt.height(this.get("height"));
        return Promise['default'].resolve();
      }
      return Promise['default'].all([this.adaptDimension(elt, "width"), this.adaptDimension(elt, "height")]);
    }),

    adaptDimension: function (elt, dimension) {
      var have = elt[dimension]();
      var want = this.get(dimension);
      var target = {};
      target[dimension] = want;

      return Ember['default'].$.Velocity(elt[0], target, {
        duration: this.durationFor(have, want),
        queue: false,
        easing: this.get("growEasing")
      });
    },

    durationFor: function (before, after) {
      return Math.min(this.get("growDuration"), 1000 * Math.abs(before - after) / this.get("growPixelsPerSecond"));
    } });

});
define('winterhawks/components/lm-container', ['exports', 'ember', 'liquid-fire/tabbable'], function (exports, Ember) {

  'use strict';

  /*
     Parts of this file were adapted from ic-modal

     https://github.com/instructure/ic-modal
     Released under The MIT License (MIT)
     Copyright (c) 2014 Instructure, Inc.
  */

  var lastOpenedModal = null;
  Ember['default'].$(document).on("focusin", handleTabIntoBrowser);

  function handleTabIntoBrowser() {
    if (lastOpenedModal) {
      lastOpenedModal.focus();
    }
  }


  exports['default'] = Ember['default'].Component.extend({
    classNames: ["lm-container"],
    attributeBindings: ["tabindex"],
    tabindex: 0,

    keyUp: function (event) {
      // Escape key
      if (event.keyCode === 27) {
        this.sendAction();
      }
    },

    keyDown: function (event) {
      // Tab key
      if (event.keyCode === 9) {
        this.constrainTabNavigation(event);
      }
    },

    didInsertElement: function () {
      this.focus();
      lastOpenedModal = this;
    },

    willDestroy: function () {
      lastOpenedModal = null;
    },

    focus: function () {
      if (this.get("element").contains(document.activeElement)) {
        // just let it be if we already contain the activeElement
        return;
      }
      var target = this.$("[autofocus]");
      if (!target.length) {
        target = this.$(":tabbable");
      }

      if (!target.length) {
        target = this.$();
      }

      target[0].focus();
    },

    constrainTabNavigation: function (event) {
      var tabbable = this.$(":tabbable");
      var finalTabbable = tabbable[event.shiftKey ? "first" : "last"]()[0];
      var leavingFinalTabbable = finalTabbable === document.activeElement ||
      // handle immediate shift+tab after opening with mouse
      this.get("element") === document.activeElement;
      if (!leavingFinalTabbable) {
        return;
      }
      event.preventDefault();
      tabbable[event.shiftKey ? "last" : "first"]()[0].focus();
    }
  });

});
define('winterhawks/components/modal-dialog', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    actions: {
      close: function () {
        this.sendAction();
      }
    }
  });

});
define('winterhawks/helpers/liquid-bind', ['exports'], function (exports) {

  'use strict';

  /* liquid-bind is really just liquid-with with a pre-provided block
     that just says {{this}} */

  var isHTMLBars = !!Ember.HTMLBars;

  function liquidBindHelperFunc() {
    var options, container;

    if (isHTMLBars) {
      options = arguments[2];
      container = this.container;
    } else {
      options = arguments[arguments.length - 1];
      container = options.data.view.container;
    }

    var liquidWithSelf = container.lookupFactory("template:liquid-with-self");
    var liquidWith = container.lookupFactory("helper:liquid-with");

    if (isHTMLBars) {
      options.template = liquidWithSelf;
    } else {
      options.fn = liquidWithSelf;
    }

    if (isHTMLBars) {
      liquidWith.helperFunction.apply(this, arguments);
    } else {
      return liquidWith.apply(this, arguments);
    }
  }

  var liquidBindHelper = liquidBindHelperFunc;
  if (Ember.HTMLBars) {
    liquidBindHelper = {
      isHTMLBars: true,
      helperFunction: liquidBindHelperFunc,
      preprocessArguments: function () {}
    };
  }

  exports['default'] = liquidBindHelper;

});
define('winterhawks/helpers/liquid-if', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports.factory = factory;

  var isHTMLBars = !!Ember['default'].HTMLBars;function factory(invert) {
    function helperFunc() {
      var property, hash, options, env, container;

      if (isHTMLBars) {
        property = arguments[0][0];
        hash = arguments[1];
        options = arguments[2];
        env = arguments[3];
        container = this.container;
      } else {
        property = arguments[0];
        options = arguments[1];
        hash = options.hash;
        container = options.data.view.container;
      }
      var View = container.lookupFactory("view:liquid-if");

      var templates = [options.fn || options.template, options.inverse];
      if (invert) {
        templates.reverse();
      }
      delete options.fn;
      delete options.template;
      delete options.inverse;

      if (hash.containerless) {
        View = View.extend(Ember['default']._Metamorph);
      }

      hash.templates = templates;

      if (isHTMLBars) {
        hash.showFirst = property;
        env.helpers.view.helperFunction.call(this, [View], hash, options, env);
      } else {
        hash.showFirstBinding = property;
        return Ember['default'].Handlebars.helpers.view.call(this, View, options);
      }
    }

    if (Ember['default'].HTMLBars) {
      return {
        isHTMLBars: true,
        helperFunction: helperFunc,
        preprocessArguments: function () {}
      };
    } else {
      return helperFunc;
    }
  }exports['default'] = factory(false);

});
define('winterhawks/helpers/liquid-measure', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = function () {
    Ember['default'].assert("liquid-measure is deprecated, see CHANGELOG.md", false);
  };

});
define('winterhawks/helpers/liquid-outlet', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var isHTMLBars = !!Ember['default'].HTMLBars;

  function liquidOutletHelperFunc(property, options) {
    var property, options, container, hash, env;

    if (isHTMLBars) {
      property = arguments[0][0]; // params[0]
      hash = arguments[1];
      options = arguments[2];
      env = arguments[3];
      container = this.container;

      if (!property) {
        property = "main";
        options.paramTypes = ["string"];
      }
    } else {
      property = arguments[0];

      if (property && property.data && property.data.isRenderData) {
        options = property;
        property = "main";
        options.types.push("STRING");
      }

      container = options.data.view.container;
      hash = options.hash;
    }

    var View = container.lookupFactory("view:liquid-outlet");
    if (hash.containerless) {
      View = View.extend(Ember['default']._Metamorph);
    }
    hash.viewClass = View;

    if (isHTMLBars) {
      env.helpers.outlet.helperFunction.call(this, [property], hash, options, env);
    } else {
      return Ember['default'].Handlebars.helpers.outlet.call(this, property, options);
    }
  }

  var liquidOutletHelper = liquidOutletHelperFunc;
  if (Ember['default'].HTMLBars) {
    liquidOutletHelper = {
      isHTMLBars: true,
      helperFunction: liquidOutletHelperFunc,
      preprocessArguments: function () {}
    };
  }

  exports['default'] = liquidOutletHelper;

});
define('winterhawks/helpers/liquid-unless', ['exports', 'winterhawks/helpers/liquid-if'], function (exports, liquid_if) {

	'use strict';

	exports['default'] = liquid_if.factory(true);

});
define('winterhawks/helpers/liquid-with', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var isHTMLBars = !!Ember['default'].HTMLBars;

  function liquidWithHelperFunc() {
    var params, context, options, container, innerOptions, data, hash, env;

    var innerOptions = {
      hashTypes: {}
    };

    var innerHash = {};

    if (isHTMLBars) {
      params = arguments[0];
      hash = arguments[1];
      options = arguments[2];
      env = arguments[3];
      context = params[0];
      container = this.container;
      data = arguments[3].data;
      innerOptions.morph = options.morph;

      if (params.length === 3) {
        hash.keywordName = params[2]._label;
        params = [context];
      }
    } else {
      params = Array.prototype.slice.apply(arguments, [0, -1]);
      context = arguments[0];
      options = arguments[arguments.length - 1];
      data = options.data;
      hash = options.hash;
      container = data.view.container;
      innerOptions.data = data;
      innerOptions.hash = innerHash;
    }

    var View = container.lookupFactory("view:liquid-with");

    View = View.extend({
      originalArgs: params,
      originalHash: hash,
      originalHashTypes: options.hashTypes,
      innerTemplate: options.fn || options.template
    });

    if (hash.containerless) {
      View = View.extend(Ember['default']._Metamorph);
    }

    innerHash.boundContextBinding = context;

    ["class", "classNames", "classNameBindings", "use", "id", "growDuration", "growPixelsPerSecond", "growEasing", "enableGrowth", "containerless"].forEach(function (field) {
      if (hash.hasOwnProperty(field)) {
        innerHash[field] = hash[field];
        innerOptions.hashTypes[field] = options.hashTypes ? options.hashTypes[field] : undefined;
      }
    });


    if (isHTMLBars) {
      env.helpers.view.helperFunction.call(this, [View], innerHash, innerOptions, env);
    } else {
      return Ember['default'].Handlebars.helpers.view.call(this, View, innerOptions);
    }
  }

  var liquidWithHelper = liquidWithHelperFunc;
  if (isHTMLBars) {
    liquidWithHelper = {
      isHTMLBars: true,
      helperFunction: liquidWithHelperFunc,
      preprocessArguments: function () {}
    };
  }

  exports['default'] = liquidWithHelper;

});
define('winterhawks/helpers/with-apply', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var isHTMLBars = !!Ember['default'].HTMLBars;

  // This helper is internal to liquid-with.
  function withApplyHelperFunc() {
    var hash, options, env, view;

    if (isHTMLBars) {
      hash = arguments[1];
      options = arguments[2];
      env = arguments[3];
      view = this;
    } else {
      options = arguments[0];
      hash = options.hash;
      view = options.data.view;
    }

    var parent = view.get("liquidWithParent");
    var withArgs = parent.get("originalArgs").slice();

    withArgs[0] = "lwith-view.boundContext";
    options = Ember['default'].copy(options);

    // This works to inject our keyword in Ember >= 1.9
    if (!view._keywords) {
      view._keywords = {};
    }
    view._keywords["lwith-view"] = view;

    // This works to inject our keyword in Ember < 1.9
    if (!isHTMLBars) {
      if (!options.data.keywords) {
        options.data.keywords = {};
      }
      options.data.keywords["lwith-view"] = view;
    }

    if (isHTMLBars) {
      options.template = parent.get("innerTemplate");
    } else {
      options.fn = parent.get("innerTemplate");
    }

    hash = parent.get("originalHash");
    options.hashTypes = parent.get("originalHashTypes");

    if (isHTMLBars) {
      env.helpers["with"].helperFunction.call(this, [view.getStream(withArgs[0])], hash, options, env);
    } else {
      options.hash = hash;
      withArgs.push(options);
      return Ember['default'].Handlebars.helpers["with"].apply(this, withArgs);
    }
  }

  var withApplyHelper = withApplyHelperFunc;
  if (Ember['default'].HTMLBars) {
    withApplyHelper = {
      isHTMLBars: true,
      helperFunction: withApplyHelperFunc,
      preprocessArguments: function () {}
    };
  }

  exports['default'] = withApplyHelper;

});
define('winterhawks/initializers/app-version', ['exports', 'winterhawks/config/environment', 'ember'], function (exports, config, Ember) {

  'use strict';

  var classify = Ember['default'].String.classify;

  exports['default'] = {
    name: "App Version",
    initialize: function (container, application) {
      var appName = classify(application.toString());
      Ember['default'].libraries.register(appName, config['default'].APP.version);
    }
  };

});
define('winterhawks/initializers/export-application-global', ['exports', 'ember', 'winterhawks/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  };

  exports['default'] = {
    name: "export-application-global",

    initialize: initialize
  };

});
define('winterhawks/initializers/in-app-livereload', ['exports', 'winterhawks/config/environment', 'ember-cli-cordova/initializers/in-app-livereload'], function (exports, config, reloadInitializer) {

  'use strict';

  /* globals cordova */

  var inAppReload = reloadInitializer['default'].initialize;

  var initialize = function (container, app) {
    if (typeof cordova === "undefined" || config['default'].environment !== "development" || config['default'].cordova && (!config['default'].cordova.liveReload || !config['default'].cordova.liveReload.enabled)) {
      return;
    }

    return inAppReload(container, app, config['default']);
  };

  exports['default'] = {
    name: "cordova:in-app-livereload",
    initialize: initialize
  };

  exports.initialize = initialize;

});
define('winterhawks/initializers/liquid-fire', ['exports', 'liquid-fire', 'ember'], function (exports, liquid_fire, Ember) {

  'use strict';

  exports['default'] = {
    name: "liquid-fire",

    initialize: function (container) {
      if (!Ember['default'].$.Velocity) {
        Ember['default'].warn("Velocity.js is missing");
      } else {
        var version = Ember['default'].$.Velocity.version;
        var recommended = [0, 11, 8];
        if (Ember['default'].compare(recommended, [version.major, version.minor, version.patch]) === 1) {
          Ember['default'].warn("You should probably upgrade Velocity.js, recommended minimum is " + recommended.join("."));
        }
      }

      liquid_fire.initialize(container);
    }
  };

});
define('winterhawks/router', ['exports', 'ember', 'winterhawks/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function () {});

  exports['default'] = Router;

});
define('winterhawks/routes/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    actions: {
      back: function () {
        history.back();
      },

      closeModal: function () {
        this.disconnectOutlet({
          outlet: "modal",
          parentView: "application"
        });
      },

      openModal: function (name) {
        this.render(name, {
          into: "application",
          outlet: "modal"
        });
      },

      openLink: function (url) {
        window.open(url, "_system");
      }
    }
  });

});
define('winterhawks/templates/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


    data.buffer.push("<h1>Welcome to ember-cli-cordova!</h1>\n\n");
    data.buffer.push(escapeExpression((helper = helpers['liquid-outlet'] || (depth0 && depth0['liquid-outlet']),options={hash:{
      'name': ("main")
    },hashTypes:{'name': "STRING"},hashContexts:{'name': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "liquid-outlet", options))));
    data.buffer.push("\n\n");
    data.buffer.push(escapeExpression((helper = helpers['liquid-outlet'] || (depth0 && depth0['liquid-outlet']),options={hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data},helper ? helper.call(depth0, "modal", options) : helperMissing.call(depth0, "liquid-outlet", "modal", options))));
    data.buffer.push("\n");
    return buffer;
    
  });

});
define('winterhawks/templates/cdv-generic-nav-bar', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, escapeExpression=this.escapeExpression, self=this;

  function program1(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n  <button ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "leftButton", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">\n    ");
    stack1 = helpers['if'].call(depth0, "nav.leftButton.icon", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(2, program2, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n    ");
    stack1 = helpers._triageMustache.call(depth0, "nav.leftButton.text", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n  </button>\n");
    return buffer;
    }
  function program2(depth0,data) {
    
    var buffer = '';
    data.buffer.push("\n      <i ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'class': (":icon nav.leftButton.icon")
    },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
    data.buffer.push("></i>\n    ");
    return buffer;
    }

  function program4(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n  <h1>\n    ");
    stack1 = helpers._triageMustache.call(depth0, "nav.title.text", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n  </h1>\n");
    return buffer;
    }

  function program6(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n  <button ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "rightButton", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">\n    ");
    stack1 = helpers['if'].call(depth0, "nav.rightButton.icon", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(7, program7, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n    ");
    stack1 = helpers._triageMustache.call(depth0, "nav.rightButton.text", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n  </button>\n");
    return buffer;
    }
  function program7(depth0,data) {
    
    var buffer = '';
    data.buffer.push("\n      <i ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'class': (":icon nav.rightButton.icon")
    },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
    data.buffer.push("></i>\n    ");
    return buffer;
    }

    stack1 = helpers['if'].call(depth0, "nav.leftButton.text", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n");
    stack1 = helpers['if'].call(depth0, "nav.title.text", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(4, program4, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n");
    stack1 = helpers['if'].call(depth0, "nav.rightButton.text", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(6, program6, data),contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    
  });

});
define('winterhawks/templates/components/cdv-nav-bar', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1;


    stack1 = helpers._triageMustache.call(depth0, "yield", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    
  });

});
define('winterhawks/templates/components/liquid-measured', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var stack1;


    stack1 = helpers._triageMustache.call(depth0, "yield", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    else { data.buffer.push(''); }
    
  });

});
define('winterhawks/templates/components/liquid-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, helper, options, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

  function program1(depth0,data) {
    
    var buffer = '', stack1, helper, options;
    data.buffer.push("\n  ");
    stack1 = (helper = helpers['lm-container'] || (depth0 && depth0['lm-container']),options={hash:{
      'action': ("escape")
    },hashTypes:{'action': "STRING"},hashContexts:{'action': depth0},inverse:self.noop,fn:self.program(2, program2, data),contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "lm-container", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    }
  function program2(depth0,data) {
    
    var buffer = '', helper, options;
    data.buffer.push("\n    <div ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'class': (":lf-dialog cc.options.dialogClass")
    },hashTypes:{'class': "STRING"},hashContexts:{'class': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(" role=\"dialog\" ");
    data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {hash:{
      'aria-labelledby': ("cc.options.ariaLabelledBy"),
      'aria-label': ("cc.options.ariaLabel")
    },hashTypes:{'aria-labelledby': "STRING",'aria-label': "STRING"},hashContexts:{'aria-labelledby': depth0,'aria-label': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(">\n      ");
    data.buffer.push(escapeExpression(helpers.view.call(depth0, "innerView", {hash:{
      'dismiss': ("dismiss")
    },hashTypes:{'dismiss': "STRING"},hashContexts:{'dismiss': depth0},contexts:[depth0],types:["ID"],data:data})));
    data.buffer.push("\n    </div>\n    ");
    data.buffer.push(escapeExpression((helper = helpers['lf-overlay'] || (depth0 && depth0['lf-overlay']),options={hash:{
      'clickAway': ("outsideClick")
    },hashTypes:{'clickAway': "STRING"},hashContexts:{'clickAway': depth0},contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "lf-overlay", options))));
    data.buffer.push("\n  ");
    return buffer;
    }

    stack1 = (helper = helpers['liquid-with'] || (depth0 && depth0['liquid-with']),options={hash:{
      'class': ("lm-with"),
      'containerless': (true)
    },hashTypes:{'class': "STRING",'containerless': "BOOLEAN"},hashContexts:{'class': depth0,'containerless': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],data:data},helper ? helper.call(depth0, "currentContext", "as", "cc", options) : helperMissing.call(depth0, "liquid-with", "currentContext", "as", "cc", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    
  });

});
define('winterhawks/templates/components/liquid-spacer', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var stack1, helper, options, self=this, helperMissing=helpers.helperMissing;

  function program1(depth0,data) {
    
    var buffer = '', stack1;
    data.buffer.push("\n  ");
    stack1 = helpers._triageMustache.call(depth0, "yield", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    }

    stack1 = (helper = helpers['liquid-measured'] || (depth0 && depth0['liquid-measured']),options={hash:{
      'width': ("width"),
      'height': ("height")
    },hashTypes:{'width': "ID",'height': "ID"},hashContexts:{'width': depth0,'height': depth0},inverse:self.noop,fn:self.program(1, program1, data),contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "liquid-measured", options));
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    else { data.buffer.push(''); }
    
  });

});
define('winterhawks/templates/components/modal-dialog', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1, escapeExpression=this.escapeExpression;


    data.buffer.push("<div class=\"overlay\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "close", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">\n  <div class=\"modal\">\n    <div class=\"close\" ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, "close", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
    data.buffer.push(">X</div>\n    <div ");
    data.buffer.push(escapeExpression(helpers.action.call(depth0, {hash:{
      'bubbles': (false)
    },hashTypes:{'bubbles': "BOOLEAN"},hashContexts:{'bubbles': depth0},contexts:[],types:[],data:data})));
    data.buffer.push(">\n      ");
    stack1 = helpers._triageMustache.call(depth0, "yield", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n    </div>\n  </div>\n</div>\n\n");
    return buffer;
    
  });

});
define('winterhawks/templates/liquid-with-self', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1;


    stack1 = helpers._triageMustache.call(depth0, "", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n");
    return buffer;
    
  });

});
define('winterhawks/templates/liquid-with', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
  helpers = this.merge(helpers, Ember['default'].Handlebars.helpers); data = data || {};
    var buffer = '', stack1;


    stack1 = helpers._triageMustache.call(depth0, "with-apply", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
    if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
    data.buffer.push("\n\n\n");
    return buffer;
    
  });

});
define('winterhawks/tests/adapters/application.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/application.js should pass jshint', function() { 
    ok(true, 'adapters/application.js should pass jshint.'); 
  });

});
define('winterhawks/tests/app.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('app.js should pass jshint', function() { 
    ok(true, 'app.js should pass jshint.'); 
  });

});
define('winterhawks/tests/components/modal-dialog.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/modal-dialog.js should pass jshint', function() { 
    ok(true, 'components/modal-dialog.js should pass jshint.'); 
  });

});
define('winterhawks/tests/helpers/resolver', ['exports', 'ember/resolver', 'winterhawks/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('winterhawks/tests/helpers/resolver.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/resolver.js should pass jshint', function() { 
    ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('winterhawks/tests/helpers/start-app', ['exports', 'ember', 'winterhawks/app', 'winterhawks/router', 'winterhawks/config/environment'], function (exports, Ember, Application, Router, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('winterhawks/tests/helpers/start-app.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/start-app.js should pass jshint', function() { 
    ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('winterhawks/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(true, 'router.js should pass jshint.'); 
  });

});
define('winterhawks/tests/routes/application.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/application.js should pass jshint', function() { 
    ok(true, 'routes/application.js should pass jshint.'); 
  });

});
define('winterhawks/tests/test-helper', ['winterhawks/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('winterhawks/tests/test-helper.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('test-helper.js should pass jshint', function() { 
    ok(true, 'test-helper.js should pass jshint.'); 
  });

});
define('winterhawks/tests/transitions.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('transitions.js should pass jshint', function() { 
    ok(true, 'transitions.js should pass jshint.'); 
  });

});
define('winterhawks/transitions', ['exports'], function (exports) {

	'use strict';

	exports['default'] = function () {};

});
define('winterhawks/transitions/cross-fade', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = crossFade;
  // BEGIN-SNIPPET cross-fade-definition
  function crossFade(oldView, insertNewView, opts) {
    liquid_fire.stop(oldView);
    return insertNewView().then(function (newView) {
      return liquid_fire.Promise.all([liquid_fire.animate(oldView, { opacity: 0 }, opts), liquid_fire.animate(newView, { opacity: [1, 0] }, opts)]);
    });
  } // END-SNIPPET

});
define('winterhawks/transitions/fade', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = fade;
  // BEGIN-SNIPPET fade-definition
  function fade(oldView, insertNewView, opts) {
    var firstStep,
        outOpts = opts;

    if (liquid_fire.isAnimating(oldView, "fade-out")) {
      // if the old view is already fading out, let it finish.
      firstStep = liquid_fire.finish(oldView, "fade-out");
    } else {
      if (liquid_fire.isAnimating(oldView, "fade-in")) {
        // if the old view is partially faded in, scale its fade-out
        // duration appropriately.
        outOpts = { duration: liquid_fire.timeSpent(oldView, "fade-in") };
      }
      liquid_fire.stop(oldView);
      firstStep = liquid_fire.animate(oldView, { opacity: 0 }, outOpts, "fade-out");
    }

    return firstStep.then(insertNewView).then(function (newView) {
      return liquid_fire.animate(newView, { opacity: [1, 0] }, opts, "fade-in");
    });
  } // END-SNIPPET

});
define('winterhawks/transitions/flex-grow', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = flexGrow;
  function flexGrow(oldView, insertNewView, opts) {
    liquid_fire.stop(oldView);
    return insertNewView().then(function (newView) {
      return liquid_fire.Promise.all([liquid_fire.animate(oldView, { "flex-grow": 0 }, opts), liquid_fire.animate(newView, { "flex-grow": [1, 0] }, opts)]);
    });
  }

});
define('winterhawks/transitions/modal-popup', ['exports', 'ember', 'liquid-fire'], function (exports, Ember, liquid_fire) {

  'use strict';



  exports['default'] = modalPopup;
  var Velocity = Ember['default'].$.Velocity;

  function hideModal(oldView) {
    var box, obscure;
    if (!oldView || !(box = oldView.$(".lm-container > div")) || !(box = box[0]) || !(obscure = oldView.$(".lf-overlay")) || !(obscure = obscure[0])) {
      return liquid_fire.Promise.resolve();
    }

    return liquid_fire.Promise.all([Velocity.animate(obscure, { opacity: [0, 0.5] }, { duration: 250 }), Velocity.animate(box, { scale: [0, 1] }, { duration: 250 })]);
  }

  function revealModal(insertNewView) {
    return insertNewView().then(function (newView) {
      var box, obscure;
      if (!newView || !(box = newView.$(".lm-container > div")[0]) || !(obscure = newView.$(".lf-overlay")[0])) {
        return;
      }

      // we're not going to animate the whole view, rather we're going
      // to animate two pieces of it separately. So we move the view
      // properties down onto the individual elements, so that the
      // animate function can reveal them at precisely the right time.
      Ember['default'].$(box).css({
        display: "none"
      });

      Ember['default'].$(obscure).css({
        display: "none"
      });
      newView.$().css({
        display: "",
        visibility: ""
      });

      return liquid_fire.Promise.all([Velocity.animate(obscure, { opacity: [0.5, 0] }, { duration: 250, display: "" }), Velocity.animate(box, { scale: [1, 0] }, { duration: 250, display: "" })]);
    });
  }function modalPopup(oldView, insertNewView) {
    return hideModal(oldView).then(function () {
      return revealModal(insertNewView);
    });
  }

});
define('winterhawks/transitions/move-over', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';



  exports['default'] = moveOver;
  function moveOver(oldView, insertNewView, dimension, direction, opts) {
    var oldParams = {},
        newParams = {},
        firstStep,
        property,
        measure;

    if (dimension.toLowerCase() === "x") {
      property = "translateX";
      measure = "width";
    } else {
      property = "translateY";
      measure = "height";
    }

    if (liquid_fire.isAnimating(oldView, "moving-in")) {
      firstStep = liquid_fire.finish(oldView, "moving-in");
    } else {
      liquid_fire.stop(oldView);
      firstStep = liquid_fire.Promise.resolve();
    }


    return firstStep.then(insertNewView).then(function (newView) {
      if (newView && newView.$() && oldView && oldView.$()) {
        var sizes = [parseInt(newView.$().css(measure), 10), parseInt(oldView.$().css(measure), 10)];
        var bigger = Math.max.apply(null, sizes);
        oldParams[property] = bigger * direction + "px";
        newParams[property] = ["0px", -1 * bigger * direction + "px"];
      } else {
        oldParams[property] = 100 * direction + "%";
        newParams[property] = ["0%", -100 * direction + "%"];
      }

      return liquid_fire.Promise.all([liquid_fire.animate(oldView, oldParams, opts), liquid_fire.animate(newView, newParams, opts, "moving-in")]);
    });
  }

});
define('winterhawks/transitions/scroll-then', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = function () {
    Ember['default'].assert("You must provide a transition name as the first argument to scrollThen. Example: this.use('scrollThen', 'toLeft')", "string" === typeof arguments[2]);

    var el = document.getElementsByTagName("html"),
        transitionArgs = Array.prototype.slice.call(arguments, 0, 2),
        nextTransition = this.lookup(arguments[2]),
        self = this,
        options = arguments[3] || {};

    Ember['default'].assert("The second argument to scrollThen is passed to Velocity's scroll function and must be an object", "object" === typeof options);

    // set scroll options via: this.use('scrollThen', 'ToLeft', {easing: 'spring'})
    options = Ember['default'].merge({ duration: 500, offset: 0 }, options);

    // additional args can be passed through after the scroll options object
    // like so: this.use('scrollThen', 'moveOver', {duration: 100}, 'x', -1);
    transitionArgs.push.apply(transitionArgs, Array.prototype.slice.call(arguments, 4));

    return window.$.Velocity(el, "scroll", options).then(function () {
      nextTransition.apply(self, transitionArgs);
    });
  };

});
define('winterhawks/transitions/to-down', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

	'use strict';

	exports['default'] = liquid_fire.curryTransition("move-over", "y", 1);

});
define('winterhawks/transitions/to-left', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

	'use strict';

	exports['default'] = liquid_fire.curryTransition("move-over", "x", -1);

});
define('winterhawks/transitions/to-right', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

	'use strict';

	exports['default'] = liquid_fire.curryTransition("move-over", "x", 1);

});
define('winterhawks/transitions/to-up', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

	'use strict';

	exports['default'] = liquid_fire.curryTransition("move-over", "y", -1);

});
define('winterhawks/views/liquid-child', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].ContainerView.extend({
    classNames: ["liquid-child"],
    resolveInsertionPromise: Ember['default'].on("didInsertElement", function () {
      // Children start out hidden and invisible.
      // Measurement will `show` them and Velocity will make them visible.
      // This prevents a flash of pre-animated content.
      this.$().css({ visibility: "hidden" }).hide();
      if (this._resolveInsertion) {
        this._resolveInsertion(this);
      }
    })
  });

});
define('winterhawks/views/liquid-if', ['exports', 'winterhawks/views/liquid-outlet', 'ember'], function (exports, LiquidOutlet, Ember) {

  'use strict';

  var isHTMLBars = !!Ember['default'].HTMLBars;

  exports['default'] = LiquidOutlet['default'].extend({
    liquidUpdate: Ember['default'].on("init", Ember['default'].observer("showFirst", function () {
      var template = this.get("templates")[this.get("showFirst") ? 0 : 1];
      if (!template || !isHTMLBars && template === Ember['default'].Handlebars.VM.noop) {
        this.set("currentView", null);
        return;
      }
      var view = Ember['default']._MetamorphView.create({
        container: this.container,
        template: template,
        liquidParent: this,
        contextBinding: "liquidParent.context",
        liquidContext: this.get("showFirst"),
        hasLiquidContext: true
      });
      this.set("currentView", view);
    }))

  });

});
define('winterhawks/views/liquid-outlet', ['exports', 'ember', 'liquid-fire'], function (exports, Ember, liquid_fire) {

  'use strict';

  var capitalize = Ember['default'].String.capitalize;

  exports['default'] = Ember['default'].ContainerView.extend({
    classNames: ["liquid-container"],
    growDuration: 250,
    growPixelsPerSecond: 200,
    growEasing: "slide",
    enableGrowth: true,

    init: function () {
      // The ContainerView constructor normally sticks our "currentView"
      // directly into _childViews, but we want to leave that up to
      // _currentViewDidChange so we have the opportunity to launch a
      // transition.
      this._super();
      Ember['default'].A(this._childViews).clear();

      if (this.get("containerless")) {
        // This prevents Ember from throwing an assertion when we try to
        // render as a virtual view.
        this.set("innerClassNameBindings", this.get("classNameBindings"));
        this.set("classNameBindings", Ember['default'].A());
      }
    },

    // Deliberately overriding a private method from
    // Ember.ContainerView!
    //
    // We need to stop it from destroying our outgoing child view
    // prematurely.
    _currentViewWillChange: Ember['default'].beforeObserver("currentView", function () {}),

    // Deliberately overriding a private method from
    // Ember.ContainerView!
    _currentViewDidChange: Ember['default'].on("init", Ember['default'].observer("currentView", function () {
      // Normally there is only one child (the view we're
      // replacing). But sometimes there may be two children (because a
      // transition is already in progress). In any case, we tell all of
      // them to start heading for the exits now.

      var oldView = this.get("childViews.lastObject"),
          newView = this.get("currentView"),
          firstTime;

      // For the convenience of the transition rules, we explicitly
      // track our first transition, which happens at initial render.
      firstTime = !this._hasTransitioned;
      this._hasTransitioned = true;

      // Idempotence
      if (!oldView && !newView || oldView && oldView.get("currentView") === newView || this._runningTransition && this._runningTransition.oldView === oldView && this._runningTransition.newContent === newView) {
        return;
      }

      // `transitions` comes from dependency injection, see the
      // liquid-fire app initializer.
      var transition = this.get("transitions").transitionFor(this, oldView, newView, this.get("use"), firstTime);

      if (this._runningTransition) {
        this._runningTransition.interrupt();
      }

      this._runningTransition = transition;
      transition.run()["catch"](function (err) {
        // Force any errors through to the RSVP error handler, because
        // of https://github.com/tildeio/rsvp.js/pull/278.  The fix got
        // into Ember 1.7, so we can drop this once we decide 1.6 is
        // EOL.
        Ember['default'].RSVP.Promise.resolve()._onerror(err);
      });
    })),

    _liquidChildFor: function (content) {
      if (content && !content.get("hasLiquidContext")) {
        content.set("liquidContext", content.get("context"));
      }
      var LiquidChild = this.container.lookupFactory("view:liquid-child");
      var childProperties = {
        currentView: content
      };
      if (this.get("containerless")) {
        childProperties.classNames = this.get("classNames").without("liquid-container");
        childProperties.classNameBindings = this.get("innerClassNameBindings");
      }
      return LiquidChild.create(childProperties);
    },

    _pushNewView: function (newView) {
      if (!newView) {
        return liquid_fire.Promise.resolve();
      }
      var child = this._liquidChildFor(newView),
          promise = new liquid_fire.Promise(function (resolve) {
        child._resolveInsertion = resolve;
      });
      this.pushObject(child);
      return promise;
    },

    cacheSize: function () {
      var elt = this.$();
      if (elt) {
        // Measure original size.
        this._cachedSize = getSize(elt);
      }
    },

    unlockSize: function () {
      var self = this;
      function doUnlock() {
        var elt = self.$();
        if (elt) {
          elt.css({ width: "", height: "" });
        }
      }
      if (this._scaling) {
        this._scaling.then(doUnlock);
      } else {
        doUnlock();
      }
    },

    _durationFor: function (before, after) {
      return Math.min(this.get("growDuration"), 1000 * Math.abs(before - after) / this.get("growPixelsPerSecond"));
    },

    _adaptDimension: function (dimension, before, after) {
      if (before[dimension] === after[dimension] || !this.get("enableGrowth")) {
        var elt = this.$();
        if (elt) {
          elt[dimension](after[dimension]);
        }
        return liquid_fire.Promise.resolve();
      } else {
        // Velocity deals in literal width/height, whereas jQuery deals
        // in box-sizing-dependent measurements.
        var target = {};
        target[dimension] = [after["literal" + capitalize(dimension)], before["literal" + capitalize(dimension)]];
        return liquid_fire.animate(this, target, {
          duration: this._durationFor(before[dimension], after[dimension]),
          queue: false,
          easing: this.get("growEasing")
        });
      }
    },

    adaptSize: function () {
      liquid_fire.stop(this);

      var elt = this.$();
      if (!elt) {
        return;
      }

      // Measure new size.
      var newSize = getSize(elt);
      if (typeof this._cachedSize === "undefined") {
        this._cachedSize = newSize;
      }

      // Now that measurements have been taken, lock the size
      // before the invoking the scaling transition.
      elt.width(this._cachedSize.width);
      elt.height(this._cachedSize.height);

      this._scaling = liquid_fire.Promise.all([this._adaptDimension("width", this._cachedSize, newSize), this._adaptDimension("height", this._cachedSize, newSize)]);
    }

  });

  // We're tracking both jQuery's box-sizing dependent measurements and
  // the literal CSS properties, because it's nice to get/set dimensions
  // with jQuery and not worry about boz-sizing *but* Velocity needs the
  // raw values.
  function getSize(elt) {
    return {
      width: elt.width(),
      literalWidth: parseInt(elt.css("width"), 10),
      height: elt.height(),
      literalHeight: parseInt(elt.css("height"), 10)
    };
  }

});
define('winterhawks/views/liquid-with', ['exports', 'winterhawks/views/liquid-outlet', 'ember'], function (exports, LiquidOutlet, Ember) {

  'use strict';

  exports['default'] = LiquidOutlet['default'].extend({
    liquidUpdate: Ember['default'].on("init", Ember['default'].observer("boundContext", function () {
      var context = this.get("boundContext");
      if (Ember['default'].isEmpty(context)) {
        this.set("currentView", null);
        return;
      }
      var view = Ember['default']._MetamorphView.create({
        container: this.container,
        templateName: "liquid-with",
        boundContext: context,
        liquidWithParent: this,
        liquidContext: context,
        hasLiquidContext: true });
      this.set("currentView", view);
    }))

  });

});
/* jshint ignore:start */

define('winterhawks/config/environment', ['ember'], function(Ember) {
  var prefix = 'winterhawks';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("winterhawks/tests/test-helper");
} else {
  require("winterhawks/app")["default"].create({"LOG_ACTIVE_GENERATION":true,"LOG_VIEW_LOOKUPS":true,"name":"winterhawks","version":"0.0.0.0ad20ec6"});
}

/* jshint ignore:end */
//# sourceMappingURL=winterhawks.map