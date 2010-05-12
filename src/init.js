
/**
 * Django-style framework for client-side JavaScript web applications.
 */
function Djsango(name, routes){
	this.name = name;
	
	this.routes = new Djsango.RouteList();
	this.routes.app = this;
	//this.urls = this.routes; //Alias
	
	if(routes){
		this.routes.add.apply(this.routes, routes);
	}
	
	// Initialize each of the modules
	//this._constructors.forEach(function(init){
	//	init.apply(this);
	//}, this);
	
	this.dispatchEvent('construct');
};
Djsango.version = '$Version$';
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
Djsango.init = function(initialURL){
	
	// Initialize each of the modules
	this._initializers.forEach(function(init){
		init.apply(this);
	}, this);
	this._initializers = []; //Make sure these are only run once
	
	// By having an 'init' event handler return false, it allows us to
	// asynchronously initialize to load content, and then once loaded to run
	// Djsango.init() again.
	if(!this.dispatchEvent('init'))
		return false;
	
	if(initialURL)
		this.request(initialURL);
	else
		this.request();
	
	return true;
};

/**
 * Other Djsango components located in other .js files append functions
 * to this list which set up their respective functionalities.
 */
Djsango._initializers = []; //We probably don't need this

