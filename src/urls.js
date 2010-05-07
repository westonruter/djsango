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
//Djsango._URLPattern.prototype.match = function(url){
//	if(typeof url != "string")
//		throw Error("Expected 'url' to be a string.");
//	return url.match(this.pattern);
//};


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
 * @todo Should match return an object {matches, app, item}; we don't want to override matches' properties
 */
Djsango._URLPatternList.prototype.match = function(url){
	var result = null;
	
	var matches, item;
	for(var i = 0, len = this.length; i < len; i++){
		item = this[i];
		if(item instanceof Djsango._URLPattern){
			matches = url.match(item.pattern);
			if(matches){
				result = {
					matches: matches,
					urlPattern: item,
					app: this.app
				};
			}
			//matches = url.match(item.pattern); //matches = item.match(url);
			//if(matches){
			//	matches.urlPattern = item;
			//	matches.app = this.app;
			//}
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
			result = item.app.urlPatterns.match(suburl);
		}
		else {
			throw TypeError("Unexpected member in urlPatterns: " + this[i]);
		}
		
		if(result){
			break;
		}
	}
	
	//return matches;
	return result;
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
	
	
	var matchResult = this.urlPatterns.match(request.path);
	if(matchResult){
		if(!(matchResult.urlPattern instanceof Djsango._URLPattern))
			throw TypeError("Assertion fail");
		request.match = matchResult;
		
		//var pattern = matchResult.urlPattern.pattern;
		//var view = matchResult.urlPattern.view;
		
		// Update the context for the view and events
		if(matchResult.app){
			context = matchResult.app;
		}
		
		var event = new Djsango.Event('url_success', url);
		event.request = request;
		//event.matches = matchResult;
		//event.pattern = pattern;
		//event.view = view;
		if(!context.dispatchEvent(event))
			return false;
		
		var result;
		var viewSuccess;
		try {
			// Dispatch the view
			var args = matchResult.matches;
			args[0] = request; //replace the entire string match with the request object
			result = matchResult.urlPattern.view.apply(context, args);
			viewSuccess = true;
			
			// Fire view success event
			event = new Djsango.Event('view_success', result);
			event.request = request;
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
			event.request = request;
			//event.matches = matches;
			//event.pattern = pattern;
			//event.view = view;
			context.dispatchEvent(event);
		}
		
		// Fire view complete event
		event = new Djsango.Event('view_complete', result);
		event.request = request;
		//event.matches = matches;
		//event.pattern = pattern;
		//event.view = view;
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