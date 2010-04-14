/*!
 * Yes, this project has an awesome name. It's Django but for JavaScript frontend applications.
 * MIT/GPL license.
 */


/**
 * Django-style framework for client-side JavaScript web applications.
 */
function Djsango(name){
	this.name = name;
	
	//app.views = {}; //app.views = [];
	//app.models = {};
	//app.templates = {};
	
	Djsango._initializers.forEach(function(init){
		init.apply(this);
	}, this);
};
Djsango.prototype.toString = function(){
	return "Djsango<" + this.name + ">";
};
Djsango._initializers = [];


/**
 * Load the initial view based on the location.hash
 */
Djsango.prototype.start = function(){
	this.dispatchEvent('start');
	this.navigate();
};
