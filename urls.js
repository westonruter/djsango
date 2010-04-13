

Djsango._initializers.push(function(){
	this.urls = [];
	this.urls.add = function(regexp, view){
		if(typeof regexp == 'string')
			regexp = new RegExp(regexp);
		return this.push([regexp, view]);
	};
	//this.isHashSynchronized = true;
});


/**
 * Load the view associated with the hash supplied; if empty, the
 * existing page's hash is used; otherwise, the history is changed
 * to the newly provided hash.
 */
Djsango.prototype.navigate = function(hash, replace){
	if(hash)
		hash = hash.replace(/.*#!/, '');
	
	var existingHash = '';
	if(window.location.hash.indexOf('#!') == 0)
		existingHash = window.location.hash.replace(/^#!/, '');
	
	if(!hash)
		hash = existingHash;
	
	var event = new Djsango.Event('navigate', hash);
	if(!this.dispatchEvent(event))
		return false;
	hash = event.target;
	
	// Update window location
	if(hash != existingHash){
		onhashchange.suppressCount++;
		if(replace)
			window.location.replace("#!" + hash);
		else
			window.location.href = "#!" + hash;
	}
	
	for(var i = 0, len = this.urls.length; i < len; i++){
		var url = this.urls[i];
		var matches = hash.match(url[0]);
		if(matches){
			console.info(url[0], ' =~ ' + hash, matches);
			break;
		}
		else {
			console.warn(url[0], ' =~ ' + hash)
		}
	}
	
	
	//var hash = hashStartPos == -1 ? '' : url.substr(hashStartPos+2);
	
	//window.location.href
	return true;
};



/**
 * Hash change handler; this will get called at least once
 * @param {Object} e Event object if invoked as hashchange
 * @private
 */
var supportsOnHashChange = false;
var hashchangeTimerID;
var previousHash;
function onhashchange(e){
	//Prevent this hashchange handler if suppress
	if(onhashchange.suppressCount > 0){
		onhashchange.suppressCount--;
		return;
	}
	
	//Defer to native hashchange event
	if(!e)
		e = window.event;
	if(hashchangeTimerID && e && e.type.indexOf('hashchange') != -1){
		clearInterval(hashchangeTimerID);
		hashchangeTimerID = null;
	}
	
	//Stop if we've already handled this
	if(previousHash == window.location.hash)
		return;
	var thisPreviousHash = previousHash;
	previousHash = window.location.hash;
	
	//TODO
}
onhashchange.suppressCount = 0;


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

