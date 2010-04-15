/*!
 * Djsango URLs
 */

//if(!Djsango.Event)
//	throw Error("Expected Djsango.Event");


/**
 * Hash change handler; this will get called at least once
 * @param {Object} e Event object if invoked as hashchange
 * @private
 */
Djsango._onhashchange = function(e){
	var onhashchange = Djsango._onhashchange;
	
	// Prevent this hashchange handler if temporarily suppressed (i.e. navigate() was called by code)
	if(onhashchange.suppressCount > 0){
		onhashchange.suppressCount--;
		return;
	}
	
	// Defer to native hashchange event
	if(!e)
		e = window.event;
	if(onhashchange.intervalTimerID && e && e.type && e.type.indexOf('hashchange') != -1){
		window.clearInterval(onhashchange.intervalTimerID);
		onhashchange.intervalTimerID = null;
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
Djsango._URLPatternList.prototype.add = function(/*...*/){
	function add(pattern, /*app,*/ view, position){
		//QUESTION: Should it always be a string like Django? And only get JIT compiled?
		//          To do URLConf unclude
		if(typeof pattern == 'string')
			pattern = new RegExp(pattern);
		else if(!(pattern instanceof RegExp))
			throw TypeError("The 'pattern' argument must be a RegExp.");
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
		for(var i = 0, len = arguments.length; i < len; i++){
			add.call(this,
				arguments[i][0], //pattern
				arguments[i][1], //view
				arguments[i][2]  //position
			)
		}
		//var that = this;
		//Array.forEach.call(arguments, function(arg){
		//	add.call(that,
		//		arg[0], //pattern
		//		arg[1], //view
		//		arg[2]  //position
		//	);
		//});
	}
	// Only a single pattern set is passed in
	else {
		add.call(this,
			arguments[0], //pattern
			arguments[1], //view
			arguments[2]  //position
		)
	}
	
};

Djsango._URLPatternList.prototype.include = function(basePattern, app, position){
	//TODO: Django include(<module or pattern_list>)
	//TODO: Naming URL Patterns, url(regex, view, kwargs=None, name=None, prefix='')
	
	if(typeof basePattern == 'string')
		basePattern = new RegExp(basePattern);
	else if(!(basePattern instanceof RegExp))
		throw TypeError("The 'basePattern' argument must be a RegExp.");
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
			}
		}
		else if(item instanceof Djsango._URLPatternListInclusion){
			var suburl = url;
			var urlMatches = url.match(item.basePattern);
			if(urlMatches && url.indexOf(urlMatches[0]) === 0){
				suburl = url.substr(urlMatches[0].length);
			}
			//Ensure that tested URLs never begin with slash
			if(suburl.substr(0, 1) == '/')
				suburl = suburl.substr(1);
			matches = item.app.urlPatterns.match(suburl);
		}
		else {
			throw TypeError("Unexpected member in urlPatterns: " + this[i]);
		}
		
		if(matches)
			break;
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
 * Load the view associated with the hash supplied; if empty, the
 * existing page's hash is used; otherwise, the history is changed
 * to the newly provided hash.
 * @returns {boolean} True if navigation succeeded: event handlers
 *                    didn't prevent and a URL matched.
 */
Djsango.navigate = function(url, replace){
	var context = this;
	//TODO: Strip out query parameters
	
	// Strip out Ajax hash shebang
	if(url)
		url = url.replace(/.*#!/, '');
	
	// Get existing url and use it if no argument url provided
	var existingURL = '';
	if(window.location.hash.indexOf('#!') == 0)
		existingURL = window.location.hash.replace(/^#?!/, '');
	if(url === undefined)
		url = existingURL;
	
	// Fire navigate event so that plugins can modify the hash or
	// abort the navigation completely
	var event = new Djsango.Event('navigate', url);
	event.previousTarget = existingURL;
	if(!this.dispatchEvent(event))
		return false;
	url = event.target;
	
	// Update window location if url isn't the existing one
	if(url != existingURL){
		onhashchange.suppressCount++;
		if(replace)
			window.location.replace("#!" + url);
		else
			window.location.href = "#!" + url;
	}
	
	//NOTE: In order for this to work, the app needs to be tied to the view; currying?
	
	var matches = this.urlPatterns.match(url);
	if(matches){
		if(!(matches.urlPattern instanceof Djsango._URLPattern))
			throw TypeError("Assertion fail");
		var pattern = matches.urlPattern.pattern;
		var view = matches.urlPattern.view;
		
		// Update the context for the view and events
		if(matches.urlPattern.app){
			context = matches.urlPattern.app;
		}
		
		var event = new Djsango.Event('url_match', matches);
		event.url = url;
		event.pattern = pattern;
		event.view = view;
		if(!context.dispatchEvent(event))
			return false;
		
		var result;
		var success;
		try {
			// Execute the view
			result = matches.urlPattern.view.call(context, matches);
			success = true;
			
			// Fire view success event
			event = new Djsango.Event('view_success', result);
			event.url = url;
			event.urlMatches = matches;
			event.pattern = pattern;
			event.view = view;
			context.dispatchEvent(event);
		}
		catch(error){
			result = error;
			success = false;
			
			// Fire view error event
			event = new Djsango.Event('view_error', error);
			event.url = url;
			event.urlMatches = matches
			event.pattern = pattern;
			event.view = view;
			context.dispatchEvent(event);
		}
		
		// Fire view complete event
		event = new Djsango.Event('view_complete', result);
		event.url = url;
		event.urlMatches = matches;
		event.pattern = pattern;
		event.view = view;
		event.success = success;
		context.dispatchEvent(event);
		
		return true; //return !(result instanceof Error);
	}
	var event = new Djsango.Event('url_fail', url);
	context.dispatchEvent(event);
	
	return false;
};


