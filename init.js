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
	
	// Initialize each of the modules
	Djsango._initializers.forEach(function(init){
		init.apply(this);
	}, this);
};
Djsango.prototype.toString = function(){
	return "Djsango<" + this.name + ">";
};


/**
 * Other Djsango components located in other .js files append functions
 * to this list which set up their respective functionalities.
 */
Djsango._initializers = [];


/**
 * Load the initial view based on the location.hash and
 * get everything going!
 */
Djsango.prototype.start = function(){
	this.dispatchEvent('start');
	this.navigate();
};

