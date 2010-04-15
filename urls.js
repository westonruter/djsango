/*!
 * Djsango URLs
 */

if(!Djsango.Event)
	throw Error("Expected Djsango.Event");

/*
Djsango._initializers.push(function(){
	var that = this;	
	
	// Set up URLs
	this.urlpatterns = [];
	this.urlpatterns.add = function(pattern, view){
		if(typeof pattern == 'string')
			pattern = new RegExp(pattern);
		return this.push(new Djsango._URLPattern(pattern, view));
	};
	

	/ **
	 * Hash change handler; this will get called at least once
	 * @param {Object} e Event object if invoked as hashchange
	 * @private
	 * /
	this._onhashchange = function(e){
		var onhashchange = that._onhashchange;
		
		//Prevent this hashchange handler if suppress
		if(onhashchange.suppressCount > 0){
			onhashchange.suppressCount--;
			return;
		}
		
		//Defer to native hashchange event
		if(!e)
			e = window.event;
		if(onhashchange.intervalTimerID && e && e.type && e.type.indexOf('hashchange') != -1){
			window.clearInterval(onhashchange.intervalTimerID);
			onhashchange.intervalTimerID = null;
		}
		
		//Stop if we've already handled this
		if(onhashchange.previousHash == window.location.hash)
			return;
		//var thisPreviousHash = onhashchange.previousHash;
		onhashchange.previousHash = window.location.hash;
		
		that.navigate();
	};
	this._onhashchange.intervalTimerID = null;
	this._onhashchange.intervalMS = 100;
	this._onhashchange.suppressCount = 0;
	this._onhashchange.previousHash = window.location.hash;
	
	// Start watching for hashchange events
	this.addEventListener('init', function(e){
		if(window.addEventListener){
			window.addEventListener('hashchange', this._onhashchange, false);
		}
		else if(window.attachEvent){
			window.attachEvent('onhashchange', this._onhashchange);
		}
		this._onhashchange.intervalTimerID = window.setInterval(
			this._onhashchange,
			this._onhashchange.intervalMS
		);
	});
});
*/


/**
 * Hash change handler; this will get called at least once
 * @param {Object} e Event object if invoked as hashchange
 * @private
 */
Djsango._onhashchange = function(e){
	var onhashchange = Djsango._onhashchange;
	
	//Prevent this hashchange handler if suppress
	if(onhashchange.suppressCount > 0){
		onhashchange.suppressCount--;
		return;
	}
	
	//Defer to native hashchange event
	if(!e)
		e = window.event;
	if(onhashchange.intervalTimerID && e && e.type && e.type.indexOf('hashchange') != -1){
		window.clearInterval(onhashchange.intervalTimerID);
		onhashchange.intervalTimerID = null;
	}
	
	//Stop if we've already handled this
	if(onhashchange.previousHash == window.location.hash)
		return;
	//var thisPreviousHash = onhashchange.previousHash;
	onhashchange.previousHash = window.location.hash;
	
	//Djsango.navigate(); //TODO!!!
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


Djsango._URLPatterns = function(urlpatterns){
	var that = this;
	if(urlpatterns instanceof Array){
		urls.forEach(function(urlpattern){
			that.push(urlpattern);
		});
	}
};
Djsango._URLPatterns.prototype = new Array();
Djsango._URLPatterns.prototype.add = function(pattern, view, position){
	if(typeof regexp == 'string')
		pattern = new RegExp(pattern);
	//return this.push(new Djsango._URLPattern(regexp, view));
	var urlpattern = new Djsango._URLPattern(pattern, view);
	if(position === undefined)
		position = this.length;
	this.splice(position, 0, urlpattern);
	return urlpattern;
};

//Djsango.urlpatterns = new Djsango._URLPatterns();



//Djsango.urlpatterns = [];
//Djsango.urlpatterns.add = function(pattern, view){
//	if(typeof pattern == 'string')
//		pattern = new RegExp(pattern);
//	return this.push(new Djsango._URLPattern(pattern, view));
//};


/**
 * Djsango URL object which associates a pattern (RegExp) with a view (function)
 */
Djsango._URLPattern = function(pattern, view){
	this.pattern = pattern;
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
 * Load the view associated with the hash supplied; if empty, the
 * existing page's hash is used; otherwise, the history is changed
 * to the newly provided hash.
 * @returns {boolean} True if navigation succeeded: event handlers
 *                    didn't prevent and a URL matched.
 */
Djsango.navigate = function(url, replace){
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
	
	// Find a view that matches the URL
	for(var i = 0, len = this.urlpatterns.length; i < len; i++){
		var urlObj = this.urlpatterns[i];
		var matches = urlObj.match(url); // url.match(urlObj.pattern);
		//var event = new Djsango.Event('navigate_url_matches', matches);
		//if(!this.dispatchEvent(event))
		//	return false;
		//matches = event.target;
		
		// If the URL matches, then invoke the assocated view
		if(matches){
			var event = new Djsango.Event('url_match', matches);
			event.url = url;
			event.pattern = urlObj.pattern;
			event.view = urlObj.view;
			if(!this.dispatchEvent(event))
				return false;
			
			var result;
			var success;
			try {
				// Execute the view
				result = urlObj.view.call(this, matches);
				success = true;
				
				// Fire view success event
				event = new Djsango.Event('view_success', result);
				event.url = url;
				event.urlMatches = matches;
				event.pattern = urlObj.pattern;
				event.view = urlObj.view;
				this.dispatchEvent(event);
			}
			catch(error){
				result = error;
				success = false;
				
				// Fire view error event
				event = new Djsango.Event('view_error', error);
				event.url = url;
				event.urlMatches = matches
				event.pattern = urlObj.pattern;
				event.view = urlObj.view;
				this.dispatchEvent(event);
			}
			
			// Fire view complete event
			event = new Djsango.Event('view_complete', result);
			event.url = url;
			event.urlMatches = matches;
			event.pattern = urlObj.pattern;
			event.view = urlObj.view;
			event.success = success;
			this.dispatchEvent(event);
			
			return true; //return !(result instanceof Error);
		}
	}
	var event = new Djsango.Event('url_fail', url);
	this.dispatchEvent(event);
	
	return false;
};



//Djsango.prototype.watchLocation = function(){
//	this.isHashSynchronized = true;
//	previousHash = window.location.hash;
//	
//};
//
//Djsango.prototype.unwatchLocation = function(){
//	this.isHashSynchronized = false;
//	window.clearInterval(hashchangeTimerID);
//	hashchangeTimerID = null;
//};

