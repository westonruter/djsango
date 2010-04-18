/*!
 * Djsango: A Django-esque framework for client-side web applications
 * By @westonruter; http://weston.ruter.net/
 * Project URL: http://github.com/westonruter/djsango
 * MIT/GPL license.
 * Developed at Shepherd Interactive <http://shepherdinteractive.com/>
 * Version: 0.1
 * Date: Sun, 18 Apr 2010 15:37:37 +0000
 */


/**
 * Django-style framework for client-side JavaScript web applications.
 */
function Djsango(name, urlPatterns){
	this.name = name;
	
	this.urlPatterns = new Djsango._URLPatternList();
	this.urlPatterns.app = this;
	if(urlPatterns){
		this.urlPatterns.add.apply(this.urlPatterns, urlPatterns);
	}
	
	// Initialize each of the modules
	//this._constructors.forEach(function(init){
	//	init.apply(this);
	//}, this);
	
	this.dispatchEvent('construct');
};
Djsango.version = '0.1';
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
	
	// Initialize each of the modules (we probably don't need this?)
	this._initializers.forEach(function(init){
		init.apply(this);
	}, this);
	
	//NOW WE NEED TO START
	this.dispatchEvent('init');
	if(initialURL)
		this.navigate(initialURL, true);
	else
		this.navigate();
	
};

/**
 * Other Djsango components located in other .js files append functions
 * to this list which set up their respective functionalities.
 */
Djsango._initializers = []; //We probably don't need this




// File: events.js ###########################################

/*!
 * Djsango Events
 *
 * @todo Events need to be dispatched from Djsango, not from the instance: how can the instances listen to 
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
	return "Djsango.Event<" + this.type + ">( " + this.target.toString() + " )";
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
//TODO: implement Djsango.prototype.addEventListener which restrict listener to an app


/**
 * Fire a new event and invoke all of the callbacks with
 * the event type and target passed in. Context is the application.
 * @returns {mixed} The target after potentially being modified by callbacks
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
 */
//Djsango.prototype.removeEventListener
Djsango.removeEventListener = function(type, handler){
	if(this._eventListeners[type] instanceof Array){
		var listeners = this._eventListeners[type];
		for(var i = 0, len = listeners.length; i < len; i++){
			if(listeners[i] == handler){
				listeners.splice(i,1);
				return true;
			}
		}
	}
	return false;
};



// File: urls.js ###########################################

/*!
 * Djsango URLs
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
	
	Djsango.navigate();
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
Djsango._URLPattern = function(pattern, /*app,*/ view){
	//TODO: Allow name parameter http://docs.djangoproject.com/en/dev/topics/http/urls/#id2
	this.pattern = pattern;
	//this.app = app;
	this.view = view;
};
//Djsango._URLPattern.prototype.app = null;
Djsango._URLPattern.prototype.toString = function(){
	return "Djsango._URLPattern<" + this.pattern + ">";
};
Djsango._URLPattern.prototype.match = function(url){
	if(typeof url != "string")
		throw Error("Expected 'url' to be a string.");
	return url.match(this.pattern);
};


/**
 * Representation of a URLPatternList included from another app
 */
Djsango._URLPatternListInclusion = function(basePattern, app){
	this.basePattern = basePattern;
	this.app = app;
};
Djsango._URLPatternListInclusion.prototype.toString = function(){
	return "Djsango._URLPatternListInclusion<" + this.basePattern + ", " + this.app + ">";
};


/**
 * i.e. Django's django.conf.urls.defaults.patterns
 */
Djsango._URLPatternList = function(){
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

Djsango._URLPatternList.prototype = new Array();
Djsango._URLPatternList.prototype.app = null; //keep track of who we belong to


/**
 * Splice in either a single URL Pattern or multiple URL Patterns.
 */
Djsango._URLPatternList.prototype.add = function(/*...*/){
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
	
		var urlPattern = new Djsango._URLPattern(pattern, view);
		if(position === undefined)
			position = this.length;
		this.splice(position, 0, urlPattern);
		return urlPattern;
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

Djsango._URLPatternList.prototype.include = function(basePattern, app, position){
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
	var patternInclusion = new Djsango._URLPatternListInclusion(
		basePattern,
		app
	);
	this.splice(position, 0, patternInclusion);
};


/**
 * 
 * This needs to return the URLPattern that matched as well as the matches
 */
Djsango._URLPatternList.prototype.match = function(url){
	var matches;
	for(var i = 0, len = this.length; i < len; i++){
		var item = this[i];
		if(item instanceof Djsango._URLPattern){
			matches = item.match(url);
			if(matches){
				matches.urlPattern = item;
				matches.app = this.app;
			}
		}
		else if(item instanceof Djsango._URLPatternListInclusion){
			var suburl = url;
			// Strip off base pattern from the URL if it was supplied
			if(item.basePattern){
				var urlMatches = url.match(item.basePattern);
				if(urlMatches && url.indexOf(urlMatches[0]) === 0){
					suburl = url.substr(urlMatches[0].length);
				}
			}
			// Ensure that tested URLs never begin with slash
			if(suburl.substr(0, 1) == '/')
				suburl = suburl.substr(1);
			matches = item.app.urlPatterns.match(suburl);
		}
		else {
			throw TypeError("Unexpected member in urlPatterns: " + this[i]);
		}
		
		if(matches){
			break;
		}
	}
	
	return matches;
};


//Djsango._initializers.push(function(){
//	if(!this.urlPatterns)
//		this.urlPatterns = new Djsango._URLPatternList();
//});

//Djsango.urlPatterns = new Djsango._URLPatternList();
//Djsango.prototype._constructors.push(function(){
//	this.urlPatterns = new Djsango._URLPatternList(); //why not just put this in the constructor?
//});


/**
 * Allow URLPatterns to be assigned via simple array
 */
//Djsango.__defineSetter__('urlPatterns', function(list){
//	if(!(list instanceof Array))
//		throw TypeError("Only assignment by list is permitted.");
//	
//	if(list instanceof Array){
//		item.forEach(function(list){
//			that.add.apply(that, item);
//		});
//	}
//});

Djsango.urlPatterns = new Djsango._URLPatternList();

/**
 * Request object similar to Django's; instead of GET, POST, REQUEST
 * members being instances of QueryDict, there is only one member `queryDict`
 * that has the GET parameters, as obviously POST isn't possible.
 */
Djsango._Request = function(url){
	this.url = url;
	var parsedUrl = url.match(/^(.*?)(?:\?(.*?))?(?:#(.*))?$/);
	if(!parsedUrl)
		throw SyntaxError("Unable to parse URL: " + url);
	
	this.path = parsedUrl[1];
	this.query = parsedUrl[2];
	this.fragment = parsedUrl[3];
	
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
};
Djsango._Request.prototype.toString = function(){
	return "Djsango._Request<" + this.url + ">";
};


//TODO
Djsango._Response = function(){
	throw Error("NOT IMPLEMENTED");
};




//Djsango._Request.prototype.path = null;
//Djsango._Request.prototype.query = null;
//Djsango._Request.prototype.fragment = null;
//Djsango._Request.prototype.toString = function(){
//	return this.raw;
//	//var url = this.path;
//	//if(this.query)
//	//	url += "?" + this.query;
//	//if(this.fragment)
//	//	url += "?" + this.fragment;
//	//return url;
//};

Djsango._previousURL = null;

/**
 * Load the view associated with the hash supplied; if empty, the
 * existing page's hash is used; otherwise, the history is changed
 * to the newly provided hash.
 * @returns {boolean} True if navigation succeeded: event handlers
 *                    didn't prevent and a URL matched.
 */
Djsango.navigate = function(url, replace){
	var context = this;
	var existingHash = window.location.hash.replace(/^#/, '');
	
	// Get existing url and use it if no argument url provided; strip out Ajax hash shebang (fragment sigil)
	if(url === undefined && existingHash.substr(0, Djsango.fragmentSigil.length) == Djsango.fragmentSigil){
		//var wasURL = url;
		url = existingHash.substr(Djsango.fragmentSigil.length);
	}
	
	// If can't discern the URL, then just use empty string
	if(!url)
		url = '';
	if(url)
		url = url.replace(/^\//, '');
	
	// Fire navigate event so that plugins can modify the hash or
	// abort the navigation completely
	var event = new Djsango.Event('navigate', url);
	event.previousTarget = Djsango._previousURL;
	if(!this.dispatchEvent(event))
		return false;
	url = event.target;
	Djsango._previousURL = url;
	
	// Update window location if url isn't the existing one
	var newLocationHash = '#' + Djsango.fragmentSigil + url;
	if(arguments.length && newLocationHash != window.location.hash){
		Djsango._onhashchange.suppressCount++;
		if(replace)
			window.location.replace(newLocationHash);
		else
			window.location.href = newLocationHash;
	}
	
	var request = new Djsango._Request(url);
	
	//NOTE: In order for this to work, the app needs to be tied to the view; currying?
	
	
	var matches = this.urlPatterns.match(request.path);
	if(matches){
		if(!(matches.urlPattern instanceof Djsango._URLPattern))
			throw TypeError("Assertion fail");
		
		var pattern = matches.urlPattern.pattern;
		var view = matches.urlPattern.view;
		
		// Update the context for the view and events
		if(matches.app){
			context = matches.app;
		}
		
		var event = new Djsango.Event('url_success', url);
		event.request = request;
		event.matches = matches;
		event.pattern = pattern;
		event.view = view;
		if(!context.dispatchEvent(event))
			return false;
		
		var result;
		var viewSuccess;
		try {
			// Dispatch the view
			var args = matches;
			args[0] = request;
			result = matches.urlPattern.view.apply(context, args);
			viewSuccess = true;
			
			// Fire view success event
			event = new Djsango.Event('view_success', result);
			event.request = request;
			event.matches = matches;
			event.pattern = pattern;
			event.view = view;
			context.dispatchEvent(event);
		}
		catch(error){
			result = error;
			viewSuccess = false;
			
			// Fire view error event
			event = new Djsango.Event('view_error', error);
			event.request = request;
			event.matches = matches;
			event.pattern = pattern;
			event.view = view;
			context.dispatchEvent(event);
		}
		
		// Fire view complete event
		event = new Djsango.Event('view_complete', result);
		event.request = request;
		event.matches = matches;
		event.pattern = pattern;
		event.view = view;
		event.success = viewSuccess;
		context.dispatchEvent(event);
		
		return true; //return !(result instanceof Error);
	}
	else {
		var event = new Djsango.Event('url_fail', url);
		context.dispatchEvent(event);
	}
	return false;
};




//TODO: Djsango.watchLocation(); Djsango.unwatchLocation();	