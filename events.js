

Djsango._initializers.push(function(){
	this._eventListeners = {};
});


//Djsango.prototype._initEvents = function(){
//	this._eventListeners = {};
//}

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
	return "DjsangoEvent<" + this.type + ">( " + this.target.toString() + " )";
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
Djsango.prototype.addEventListener = function(type, handler, index){
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
 */
Djsango.prototype.dispatchEvent = function(event, target){
	if(typeof event == "string"){
		event = new Djsango.Event(event);
	}
	else if(!event.type){  //falsy
		throw new Error("Event object missing 'type' property.");
	}
	
	if(target !== undefined){
		event.target = target;
	}
	
	// Invoke each of the event handlers with the event object,
	// each which can preventDefault, or modify the event target
	// (akin to WordPress filters).
	if(this._eventListeners[event.type] instanceof Array){
		var listeners = this._eventListeners[event.type];
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
	return !event.defaultPrevented;
};


/**
 * Remove a previously assigned event callback
 */
Djsango.prototype.removeEventListener = function(type, handler){
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
