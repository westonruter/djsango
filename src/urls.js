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
