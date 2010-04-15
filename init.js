/*!
 * Djsango: A Django-esque framework for client-side web applications.
 * By @westonruter; http://weston.ruter.net/
 * Project URL: http://github.com/westonruter/djsango
 * MIT/GPL license.
 */


/**
 * Django-style framework for client-side JavaScript web applications.
 */
function Djsango(name){
	this.name = name;
	
	this.urlPatterns = new Djsango._URLPatternList();
	this.urlPatterns.app = this;
	
	// Initialize each of the modules
	//this._constructors.forEach(function(init){
	//	init.apply(this);
	//}, this);
	
	this.dispatchEvent('construct');
};
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
Djsango.init = function(){
	//this.dispatchEvent('init');
	//Djsango.navigate();
	
	// Initialize each of the modules (we probably don't need this?)
	this._initializers.forEach(function(init){
		init.apply(this);
	}, this);
	
	//NOTE: When
	
	//NOW WE NEED TO START
	this.dispatchEvent('init');
	this.navigate();
	
};

/**
 * Other Djsango components located in other .js files append functions
 * to this list which set up their respective functionalities.
 */
Djsango._initializers = []; //We probably don't need this

