/*!
 * Djsango: A Django-esque framework for client-side web applications
 * By @westonruter; http://weston.ruter.net/
 * Project URL: http://github.com/westonruter/djsango
 * MIT/GPL license.
 * Developed at Shepherd Interactive <http://shepherdinteractive.com/>
 * Version: 0.2pre
 * Date: Thu, 13 May 2010 00:17:24 +0000
 */



// File: init.js ---------------------------------------------------------------


/**
 * Django-style framework for client-side JavaScript web applications.
 */
function Djsango(name, routes){
	this.name = name;
	
	this.routes = new Djsango.RouteList();
	this.routes.app = this;
	//this.urls = this.routes; //Alias
	
	if(routes){
		this.routes.add.apply(this.routes, routes);
	}
	
	// Initialize each of the modules
	//this._constructors.forEach(function(init){
	//	init.apply(this);
	//}, this);
	
	this.dispatchEvent('construct');
};
Djsango.version = '0.2pre';
Djsango.toString = function(){
	return "Djsango";
};
Djsango.prototype.toString = function(){
	return "Djsango<" + this.name + ">";
};

/**
 * Additional functions from other modules that get called when instantiated
 */
//Djsango.this._constructors = [];

/**
 * Load the initial view based on the location.hash and
 * get everything going!
 */
Djsango.init = function(initialURL){
	
	// Initialize each of the modules
	this._initializers.forEach(function(init){
		init.apply(this);
	}, this);
	this._initializers = []; //Make sure these are only run once
	
	// By having an 'init' event handler return false, it allows us to
	// asynchronously initialize to load content, and then once loaded to run
	// Djsango.init() again.
	if(!this.dispatchEvent('init'))
		return false;
	
	if(initialURL)
		this.request(initialURL);
	else
		this.request();
	
	return true;
};

/**
 * Other Djsango components located in other .js files append functions
 * to this list which set up their respective functionalities.
 */
Djsango._initializers = []; //We probably don't need this




// File: events.js ---------------------------------------------------------------

/*!
 * Djsango Events
 *
 * @todo Events need to be dispatched from Djsango, not from the instance: how can the instances listen to
 * @todo Can we dispatch events that have asynchronous handlers?
 */

//Djsango._initializers.push(function(){
//	//this._eventListeners = {};
//	//TODO: This needs to actually be in the singleton
//});
Djsango._eventListeners = {};


/*!
 * Event handlers inspired in part by http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/
 * Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
 * MIT License
 */

Djsango.Event = function(type, target){
	this.type = type;
	this.target = target;
	this.defaultPrevented = false;
};
Djsango.Event.prototype.toString = function(){
	var str = "Djsango.Event<" + this.type + ">";
	if(this.target){
		str += "( " + this.target.toString() + " )";
	}
	return str;
};


/**
 * Set the defaultPrevented flag to true
 */
Djsango.Event.prototype.preventDefault = function(){
	this.defaultPrevented = true;
};


/**
 * Add an a callback for a given event; index indicates the order that the
 * handler should be called. By default it gets called in the order it was
 * added. Return value of a handler overwrites the event.target.
 * 
 * @todo implement Djsango.prototype.addEventListener which restrict listener to an app
 * @todo Can we have an async handler? Will require reorganizing dispatching code
 * @todo Rename to bind()?
 */
Djsango.addEventListener = function(type, handler, index){
	if(!(this._eventListeners[type] instanceof Array))
		this._eventListeners[type] = [];
	var listeners = this._eventListeners[type];
	if(index == undefined)
		index = listeners.length;
	listeners.splice(index, 0, handler);
	return listeners.length;
};


/**
 * Fire a new event and invoke all of the callbacks with
 * the event type and target passed in. Context is the application.
 * @returns {mixed} The target after potentially being modified by callbacks
 *
 * @todo Rename to trigger()?
 */
Djsango.dispatchEvent = Djsango.prototype.dispatchEvent = function(event, target){
	if(typeof event == "string"){
		event = new Djsango.Event(event);
	}
	else if(!event.type){  //falsy
		throw new Error("Event object missing 'type' property.");
	}
	
	if(target !== undefined){
		event.target = target;
	}
	
	// Fire before events
	if(!/^(before|after)_event/.test(event.type)){
		if(!this.dispatchEvent('before_event', event))
			return false;
		if(!this.dispatchEvent('before_event_' + event.type, event))
			return false;
	}
	
	// Invoke each of the event handlers with the event object,
	// each which can preventDefault, or modify the event target
	// (akin to WordPress filters).
	if(Djsango._eventListeners[event.type] instanceof Array){
		var listeners = Djsango._eventListeners[event.type];
		for (var i = 0, len = listeners.length; i < len; i++){
			try {
				target = listeners[i].call(this, event, event.target);
				if(target !== undefined){
					event.target = target;
				}
			}
			catch(error){
				// don't allow second exception to break things
				if(event.type == 'error'){
					setTimeout(function(){
						throw error;
					}, 0);
				}
				// try to notify the application of the error handler's error
				else {
					var errorEvent = new Djsango.Event('error', error);
					errorEvent.originalEvent = event;
					this.dispatchEvent('error', errorEvent);
				}
			}
		}
	}
	
	// Fire after events
	if(!/^(before|after)_event/.test(event.type)){
		this.dispatchEvent('after_event_' + event.type, event);
		this.dispatchEvent('after_event', event);
	}
	
	return !event.defaultPrevented;
};


/**
 * Remove a previously assigned event callback
 * @param type {string} The event name
 * @param handler {mixed} Either the function to remove or the position
 * @todo Rename to unbind()?
 * @todo Djsango.prototype.removeEventListener
 */
Djsango.removeEventListener = function(type, handler){
	if(this._eventListeners[type] instanceof Array){
		// Look for the provided function and remove it
		if(handler instanceof Function){
			var listeners = this._eventListeners[type];
			for(var i = 0, len = listeners.length; i < len; i++){
				if(listeners[i] == handler){
					listeners.splice(i,1);
					return true;
				}
			}
		}
		// Remove the handler at the provided position
		else if(!isNaN(handler) && listeners[handler]){
			listeners.splice(handler,1);
			return true;
		}
	}
	return false;
};



// File: urls.js ---------------------------------------------------------------

/*!
 * Djsango URLs
 *
 * @todo Rename urls to routes
 */

//if(!Djsango.Event)
//	throw Error("Expected Djsango.Event");

Djsango.fragmentSigil = "!";

/**
 * Hash change handler; this will get called at least once
 * @param {Object} e Event object if invoked as hashchange
 * @private
 */
Djsango._onhashchange = function(e){
	var onhashchange = Djsango._onhashchange;
	
	// Defer to native hashchange event
	if(!e)
		e = window.event;
	if(onhashchange.intervalTimerID && e && e.type && e.type.indexOf('hashchange') != -1){
		window.clearInterval(onhashchange.intervalTimerID);
		onhashchange.intervalTimerID = null;
	}
	
	// Prevent this hashchange handler if temporarily suppressed (i.e. navigate() was called by code)
	if(onhashchange.suppressCount > 0){
		onhashchange.suppressCount--;
		return;
	}
	
	// Stop if we've already handled this
	if(onhashchange.previousHash == window.location.hash)
		return;
	
	onhashchange.previousHash = window.location.hash;
	
	Djsango.get();
};
Djsango._onhashchange.intervalTimerID = null;
Djsango._onhashchange.intervalMS = 100;
Djsango._onhashchange.suppressCount = 0;
Djsango._onhashchange.previousHash = window.location.hash;


// Start watching for hashchange events
Djsango._initializers.push(function(e){
	if(window.addEventListener){
		window.addEventListener('hashchange', Djsango._onhashchange, false);
	}
	else if(window.attachEvent){
		window.attachEvent('onhashchange', Djsango._onhashchange);
	}
	Djsango._onhashchange.intervalTimerID = window.setInterval(
		Djsango._onhashchange,
		Djsango._onhashchange.intervalMS
	);
});




/**
 * Djsango URL object which associates a pattern (RegExp) with a view (function)
 */
Djsango.Route = function(pattern, /*app,*/ view){
	//TODO: Allow name parameter http://docs.djangoproject.com/en/dev/topics/http/urls/#id2
	this.pattern = pattern;
	this.view = view;
	this.app = null;
	this.matches = [];
};
//Djsango.Route.prototype.app = null;
Djsango.Route.prototype.toString = function(){
	return "Djsango.Route<" + this.pattern + ">";
};
//Djsango.Route.prototype.match = function(url){
//	if(typeof url != "string")
//		throw Error("Expected 'url' to be a string.");
//	return url.match(this.pattern);
//};


/**
 * Representation of a URLPatternList included from another app
 */
Djsango.RouteListInclusion = function(basePattern, app){
	this.basePattern = basePattern;
	this.app = app;
};
Djsango.RouteListInclusion.prototype.toString = function(){
	return "Djsango.RouteListInclusion<" + this.basePattern + ", " + this.app + ">";
};


/**
 * i.e. Django's django.conf.urls.defaults.patterns
 */
Djsango.RouteList = function(){
	//if(list && !(list instanceof Array))
	//	throw TypeError("Expected a list as the argument.");
	
	var that = this;
	if(arguments.length){
		Array.forEach.call(arguments, function(arg){
			that.add.apply(that, arg);
		});
	}
	//item.forEach(function(list){
	//	that.add.apply(that, item);
	//});
	//}
};

Djsango.RouteList.prototype = new Array();
Djsango.RouteList.prototype.app = null; //keep track of who we belong to


/**
 * Splice in either a single URL Pattern or multiple URL Patterns.
 */
Djsango.RouteList.prototype.add = function(/*...*/){
	function add(pattern, /*app,*/ view, position){
		//QUESTION: Should it always be a string like Django? And only get JIT compiled?
		//          To do URLConf unclude
		if(typeof pattern == 'string')
			pattern = new RegExp(pattern);
		else if(!(pattern instanceof RegExp))
			throw TypeError("The 'pattern' argument must be a RegExp: " + pattern);
		//if(!(app instanceof Djsango))
		//	throw TypeError("The 'app' argument must be an instance of Djsango");
		if(!(view instanceof Function))
			throw TypeError("The 'view' argument must be a function");
	
		var route = new Djsango.Route(pattern, view);
		if(position === undefined)
			position = this.length;
		this.splice(position, 0, route);
		return route;
	}
	
	// If a list of pattern sets is passed in
	if(arguments[0] instanceof Array){
		if(arguments[0][0] instanceof Array){
			throw TypeError("Expected add's arguments to be multiple 'tuples' of pattern/view/position sets, not an array of tuples.");
		}
		
		for(var i = 0, len = arguments.length; i < len; i++){
			add.call(this,
				arguments[i][0], //pattern
				arguments[i][1], //view
				arguments[i][2]  //position
			);
		}
	}
	// Only a single pattern set is passed in
	else {
		add.call(this,
			arguments[0], //pattern
			arguments[1], //view
			arguments[2]  //position
		);
	}
	
};

Djsango.RouteList.prototype.include = function(basePattern, app, position){
	//TODO: basePattern should be optional; then it becomes like import
	//TODO: Django include(<module or pattern_list>)
	//TODO: Naming URL Patterns, url(regex, view, kwargs=None, name=None, prefix='')
	
	if(typeof basePattern == 'string')
		basePattern = new RegExp(basePattern);
	else if(!(basePattern instanceof RegExp) && basePattern)
		throw TypeError("The 'basePattern' argument must be a RegExp, or not supplied at all.");
	if(!(app instanceof Djsango))
		throw TypeError("The 'app' argument must be a Djsango instance.");
		
	if(position === undefined)
		position = this.length;
	var patternInclusion = new Djsango.RouteListInclusion(
		basePattern,
		app
	);
	this.splice(position, 0, patternInclusion);
};


/**
 * 
 * This needs to return the URLPattern that matched as well as the matches
 * @todo Should match return an object {matches, app, item}; we don't want to override matches' properties
 */
Djsango.RouteList.prototype.match = function(url){
	var result = null;
	
	var matches, item;
	for(var i = 0, len = this.length; i < len; i++){
		item = this[i];
		if(item instanceof Djsango.Route){
			matches = url.match(item.pattern);
			if(matches){
				// Clone to new URLPattern
				result = new Djsango.Route(
					item.pattern,
					item.view
				);
				result.app = this.app;
				result.matches = matches;
				
				//result = { //This sucks. TODO
				//	items: matches,
				//	route: item,
				//	app: this.app
				//};
			}
			//matches = url.match(item.pattern); //matches = item.match(url);
			//if(matches){
			//	matches.route = item;
			//	matches.app = this.app;
			//}
		}
		else if(item instanceof Djsango.RouteListInclusion){
			var suburl = url;
			// Strip off base pattern from the URL if it was supplied
			if(item.basePattern){
				var urlMatches = url.match(item.basePattern);
				if(urlMatches && url.indexOf(urlMatches[0]) === 0){
					suburl = url.substr(urlMatches[0].length);
				}
				// Ensure that tested URLs never begin with slash
				if(suburl.substr(0, 1) == '/'){
					suburl = suburl.substr(1);
				}
			}
			result = item.app.routes.match(suburl);
		}
		else {
			throw TypeError("Unexpected member in routes: " + this[i]);
		}
		
		if(result){
			break;
		}
	}
	
	//return matches;
	return result;
};


//Djsango._initializers.push(function(){
//	if(!this.routes)
//		this.routes = new Djsango.RouteList();
//});

//Djsango.routes = new Djsango.RouteList();
//Djsango.prototype._constructors.push(function(){
//	this.routes = new Djsango.RouteList(); //why not just put this in the constructor?
//});


/**
 * Allow URLPatterns to be assigned via simple array
 */
//Djsango.__defineSetter__('routes', function(list){
//	if(!(list instanceof Array))
//		throw TypeError("Only assignment by list is permitted.");
//	
//	if(list instanceof Array){
//		item.forEach(function(list){
//			that.add.apply(that, item);
//		});
//	}
//});

Djsango.routes = new Djsango.RouteList();
//Djsango.urls = Djsango.routes; //Alias



// File: request.js ---------------------------------------------------------------

/**
 * Request object similar to Django's; instead of GET, POST, REQUEST
 * members being instances of QueryDict, there is only one member `queryDict`
 * that has the GET parameters, as obviously POST isn't possible.
 * Two sets of parameter lists may be provided, either an object
 * with members:
 *    @param arguments[0] {object} With members (url, method, data, redirect)
 * Or three parameters:
 *    @param url {string}
 *    @param method {string} Default 'GET'
 *    @param data {mixed}
 *    @param redirect {boolean} Whether or not window.location.replace() is/was used
 */
Djsango.Request = function(/*...*/){
	var existingHash = window.location.hash.replace(/^#/, '');
	if(Djsango.fragmentSigil && existingHash.indexOf(Djsango.fragmentSigil) == 0){
		existingHash = existingHash.substr(Djsango.fragmentSigil.length);
	}
	
	if(typeof arguments[0] == "string"){
		this.url = arguments[0] || existingHash;
		this.method = arguments[1] || 'GET';
		this.data = arguments[2] || null;
		this.redirect = !!arguments[3];
	}
	else {
		var args = arguments[0] || {};
		this.url = args.url || existingHash;
		this.method = args.method || 'GET';
		this.data = args.data || null;
		this.redirect = !!args.redirect;
	}
	this.method = this.method.toUpperCase();
	
	var parsedUrl = this.url.match(/^(.*?)(?:\?(.*?))?(?:#(.*))?$/);
	if(!parsedUrl)
		throw SyntaxError("Unable to parse URL: " + url);
	
	this.path = parsedUrl[1];
	this.query = parsedUrl[2];
	this.fragment = parsedUrl[3];
	
	this.route = null; // The route associated with this request
	
	// Parse the query parameters
	this.queryDict = {};
	if(this.query){
		var queryPairs = this.query.split(/&/);
		for(var i = 0; i < queryPairs.length; i++){
			var queryPair = queryPairs[i].split(/=/, 2);
			var key = decodeURIComponent(queryPair[0]);
			var value = decodeURIComponent(queryPair[1]);
			
			// List value
			if(key.substr(-2) == '[]'){
				key = key.substr(0, key.length-2);
				if(!this.queryDict[key])
					this.queryDict[key] = [];
				this.queryDict[key].push(value);
			}
			// Single value
			else {
				this.queryDict[key] = value;
			}
		}
	}
	
	// For GET requests, the query is the data
	if(this.method == "GET" && !this.data)
		this.data = this.queryDict;
	
};
Djsango.Request.prototype.toString = function(){
	return "Djsango.Request<" + this.method + " " + this.url + ">";
};
Djsango.Request.prototype.send = function(){
	//console.warn('send ' + this.url)
	//method = method ? method.toUpperCase() : 'GET';
	
	//var context = this;
	//var existingHash = window.location.hash.replace(/^#/, '');
	
	// Get existing url and use it if no argument url provided; strip out Ajax hash shebang (fragment sigil)
	//if(url === undefined && existingHash.substr(0, Djsango.fragmentSigil.length) == Djsango.fragmentSigil){
	//	//var wasURL = url;
	//	url = existingHash.substr(Djsango.fragmentSigil.length);
	//}
	
	// If can't discern the URL, then just use empty string
	//if(!url)
	//	url = '';
	
	// If a GET request and data is provided, append to URL
	if(this.method == 'GET' && this.data){
		//TODO
		//If string, just urlencode it; if object, then serialize it
	}
	
	// Fire navigate event so that plugins can modify the hash or
	// abort the navigation completely
	var event = new Djsango.Event('request', this);
	event.previousTarget = Djsango._previousRequest;
	if(!Djsango.dispatchEvent(event))
		return false;
	//url = event.target;
	Djsango._previousRequest = this;
	
	// Update window location if url isn't the existing one
	var newLocationHash = '#' + Djsango.fragmentSigil + this.url;
	if(/*arguments.length &&*/ newLocationHash != window.location.hash){
		Djsango._onhashchange.suppressCount++;
		if(this.redirect)
			window.location.replace(newLocationHash);
		else
			window.location.href = newLocationHash;
	}
	
	//TODO: Put this above for a new 'request' event replacing 'navigate'
	//var request = new Djsango.Request({
	//	url:url,
	//	method:method,
	//	data:data
	//});
	
	//NOTE: In order for this to work, the app needs to be tied to the view; currying?
	
	
	var matchedRoute = Djsango.routes.match(this.path);
	if(matchedRoute){
		if(!(matchedRoute instanceof Djsango.Route))
			throw TypeError("Assertion fail");
		
		this.route = matchedRoute; //This sucks. TODO
		
		//var pattern = matchResult.urlPattern.pattern;
		//var view = matchResult.urlPattern.view;
		var context = Djsango;
		
		// Update the context for the view and events
		if(matchedRoute.app){
			context = matchedRoute.app;
		}
		
		var event = new Djsango.Event('url_success', this.url);
		event.request = this;
		//event.matches = matchResult;
		//event.pattern = pattern;
		//event.view = view;
		if(!context.dispatchEvent(event))
			return false;
		
		var result;
		var viewSuccess;
		try {
			// Dispatch the view
			var args = matchedRoute.matches;
			args[0] = this; //replace the entire string match with the request object
			result = matchedRoute.view.apply(context, args);
			viewSuccess = true;
			
			// Fire view success event
			event = new Djsango.Event('view_success', result);
			event.request = this;
			//event.matches = matches;
			//event.pattern = pattern;
			//event.view = view;
			context.dispatchEvent(event);
		}
		catch(error){
			result = error;
			viewSuccess = false;
			
			// Fire view error event
			event = new Djsango.Event('view_error', error);
			event.request = this;
			//event.matches = matches;
			//event.pattern = pattern;
			//event.view = view;
			context.dispatchEvent(event);
		}
		
		// Fire view complete event
		event = new Djsango.Event('view_complete', result);
		event.request = this;
		//event.matches = matches;
		//event.pattern = pattern;
		//event.view = view;
		event.success = viewSuccess;
		context.dispatchEvent(event);
		
		return true; //return !(result instanceof Error);
	}
	else {
		var event = new Djsango.Event('url_fail', this.url);
		Djsango.dispatchEvent(event);
	}
	return false;
};


//TODO
Djsango._Response = function(){
	throw Error("NOT IMPLEMENTED");
};



Djsango._previousURL = null; //DEPRECATED
Djsango._previousRequest = null;


Djsango.get = function(url, redirect){
	Djsango.request({
		url:url,
		redirect:redirect,
		method: 'GET',
		data:null
	});
};
Djsango.post = function(url, data){
	Djsango.request({
		url:url,
		redirect:redirect,
		method: 'GET',
		data:data
	});
};


/**
 * Load the view associated with the hash supplied; if empty, the
 * existing page's hash is used; otherwise, the history is changed
 * to the newly provided hash.
 * @returns {boolean} True if navigation succeeded: event handlers
 *                    didn't prevent and a URL matched.
 * @todo We need a way to emulate POST/PUT/DELETE requests.
 * @todo Replace this with Djsango.request()? And Djsango.get()?
 */
Djsango.request = function(url, method, data, redirect){
	
	var request = new Djsango.Request(url, method, data, redirect);
	return request.send();
	
	//method = method ? method.toUpperCase() : 'GET';
	//
	//var context = this;
	//var existingHash = window.location.hash.replace(/^#/, '');
	//
	//// Get existing url and use it if no argument url provided; strip out Ajax hash shebang (fragment sigil)
	//if(url === undefined && existingHash.substr(0, Djsango.fragmentSigil.length) == Djsango.fragmentSigil){
	//	//var wasURL = url;
	//	url = existingHash.substr(Djsango.fragmentSigil.length);
	//}
	//
	//// If can't discern the URL, then just use empty string
	//if(!url)
	//	url = '';
	//
	//// If a GET request and data is provided, append to URL
	//if(method == 'GET' && data){
	//	//TODO
	//	//If string, just urlencode it; if object, then serialize it
	//}
	//
	//// Fire navigate event so that plugins can modify the hash or
	//// abort the navigation completely
	//var event = new Djsango.Event('navigate', url);
	//event.previousTarget = Djsango._previousURL;
	//if(!this.dispatchEvent(event))
	//	return false;
	//url = event.target;
	//Djsango._previousURL = url;
	//
	//// Update window location if url isn't the existing one
	//var newLocationHash = '#' + Djsango.fragmentSigil + url;
	//if(arguments.length && newLocationHash != window.location.hash){
	//	Djsango._onhashchange.suppressCount++;
	//	if(replace)
	//		window.location.replace(newLocationHash);
	//	else
	//		window.location.href = newLocationHash;
	//}
	//
	////TODO: Put this above for a new 'request' event replacing 'navigate'
	//var request = new Djsango.Request(url, method, data);
	//
	////NOTE: In order for this to work, the app needs to be tied to the view; currying?
	//
	//
	//var matchResult = this.routes.match(request.path);
	//if(matchResult){
	//	if(!(matchResult.urlPattern instanceof Djsango.Route))
	//		throw TypeError("Assertion fail");
	//	request.match = matchResult;
	//	
	//	//var pattern = matchResult.urlPattern.pattern;
	//	//var view = matchResult.urlPattern.view;
	//	
	//	// Update the context for the view and events
	//	if(matchResult.app){
	//		context = matchResult.app;
	//	}
	//	
	//	var event = new Djsango.Event('url_success', url);
	//	event.request = request;
	//	//event.matches = matchResult;
	//	//event.pattern = pattern;
	//	//event.view = view;
	//	if(!context.dispatchEvent(event))
	//		return false;
	//	
	//	var result;
	//	var viewSuccess;
	//	try {
	//		// Dispatch the view
	//		var args = matchResult.matches;
	//		args[0] = request; //replace the entire string match with the request object
	//		result = matchResult.urlPattern.view.apply(context, args);
	//		viewSuccess = true;
	//		
	//		// Fire view success event
	//		event = new Djsango.Event('view_success', result);
	//		event.request = request;
	//		//event.matches = matches;
	//		//event.pattern = pattern;
	//		//event.view = view;
	//		context.dispatchEvent(event);
	//	}
	//	catch(error){
	//		result = error;
	//		viewSuccess = false;
	//		
	//		// Fire view error event
	//		event = new Djsango.Event('view_error', error);
	//		event.request = request;
	//		//event.matches = matches;
	//		//event.pattern = pattern;
	//		//event.view = view;
	//		context.dispatchEvent(event);
	//	}
	//	
	//	// Fire view complete event
	//	event = new Djsango.Event('view_complete', result);
	//	event.request = request;
	//	//event.matches = matches;
	//	//event.pattern = pattern;
	//	//event.view = view;
	//	event.success = viewSuccess;
	//	context.dispatchEvent(event);
	//	
	//	return true; //return !(result instanceof Error);
	//}
	//else {
	//	var event = new Djsango.Event('url_fail', url);
	//	context.dispatchEvent(event);
	//}
	//return false;
};




//TODO: Djsango.watchLocation(); Djsango.unwatchLocation();	