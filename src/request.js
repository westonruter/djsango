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