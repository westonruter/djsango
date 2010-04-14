

Djsango._initializers.push(function(){
	var that = this;	
	
	// Set up URLs
	this.urls = [];
	this.urls.add = function(regexp, view){
		if(typeof regexp == 'string')
			regexp = new RegExp(regexp);
		return this.push([regexp, view]);
	};
	

	/**
	 * Hash change handler; this will get called at least once
	 * @param {Object} e Event object if invoked as hashchange
	 * @private
	 */
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
	this.addEventListener('start', function(e){
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


/**
 * Load the view associated with the hash supplied; if empty, the
 * existing page's hash is used; otherwise, the history is changed
 * to the newly provided hash.
 * @returns {boolean} True if navigation succeeded: event handlers
 *                    didn't prevent and a URL matched.
 */
Djsango.prototype.navigate = function(hash, replace){
	// Strip out Ajax shebang
	if(hash)
		hash = hash.replace(/.*#!/, '');
	
	// Get existing hash and use it if no argument hash provided
	var existingHash = '';
	if(window.location.hash.indexOf('#!') == 0)
		existingHash = window.location.hash.replace(/^#?!/, '');
	if(hash === undefined)
		hash = existingHash;
	
	// Fire navigate event so that plugins can modify the hash or
	// abort the navigation completely
	var event = new Djsango.Event('navigate', hash);
	event.previousTarget = existingHash;
	if(!this.dispatchEvent(event))
		return false;
	hash = event.target;
	
	// Update window location if hash isn't the existing one
	if(hash != existingHash){
		onhashchange.suppressCount++;
		if(replace)
			window.location.replace("#!" + hash);
		else
			window.location.href = "#!" + hash;
	}
	
	// Find a view that matches the URL
	for(var i = 0, len = this.urls.length; i < len; i++){
		var url = this.urls[i];
		var matches = hash.match(url[0]);
		var event = new Djsango.Event('navigate_url_matches', matches);
		if(!this.dispatchEvent(event))
			return false;
		matches = event.target;
		
		// If the URL matches, then invoke the assocated view
		if(matches){
			var event = new Djsango.Event('navigate_success', matches);
			if(!this.dispatchEvent(event))
				return false;
			try {
				url[1].call(this, matches);
			}
			catch(error){
				var event = new Djsango.Event('navigate_error', error);
				error.urlMatches = matches
				this.dispatchEvent(error);
			}
			return true;
		}
	}
	var event = new Djsango.Event('navigate_failure', hash);
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

