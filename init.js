/*!
 * Yes, this project has an awesome name. It's Django but for JavaScript frontend applications.
 * MIT/GPL license.
 */

var Djsango;

//(function($, window, document, undefined){

//if($ == undefined)
//	throw Error("Djsango requires jQuery");

Djsango = function(name){
	this.name = name;
	//var app = this;
	
	//app.views = {}; //app.views = [];
	//app.models = {};
	//app.templates = {};
	
	
	//this._initEvents();
	Djsango._initializers.forEach(function(init){
		init.apply(this);
	}, this);
	
	
	//app.urls = [];
	//app.urls.add = function(regexp, view){
	//	if(typeof regexp == 'string')
	//		regexp = new RegExp(regexp);
	//	return this.push([regexp, view]);
	//};
	
};
Djsango._initializers = [];

Djsango.prototype.toString = function(){
	return "Djsango<" + this.name + ">";
};








//Djsango.doView = function(){
//	
//};






Djsango.prototype.start = function(){
	var ret = this.dispatchEvent('start');
	this.navigate();
	
	
	//this.urlMatch(location.href);
	
	
	
	
};




//Djsango.prototype.createModel = function(name, properties, toString, valueOf){
//	var app = this;
//	
//	var model = function(properties){
//		this.app = app;
//		this.name = name;
//		this.properties = properties || {};
//	};
//	
//	if(!toString){
//		toString = function(){
//			return this.name + "<" + JSON.stringify(this.properties) + ">";
//		};
//	}
//	model.prototype.toString = toString;
//	if(!valueOf){
//		valueOf = function(){
//			return this.properties;
//		};
//	}
//	model.prototype.valueOf = valueOf;
//	
//	//var model = new Djsango.Model(this, name, properties);
//	//if(toString){
//	//	model.prototype.toString = toString;
//	//	if(!valueOf)
//	//		valueOf = toString;
//	//}
//	//if(valueOf){
//	//	model.prototype.valueOf = valueOf;
//	//}
//	
//	this.models[name] = model;
//	return model;
//};

//Djsango.Model = function(app, name, properties){
//	this.app = app;
//	this.name = name;
//	this.properties = properties || {};
//};



//Djsango.Model.prototype.toString = function(){
//	return this.name + "<" + JSON.stringify(this.properties) + ">";
//};
//
//Djsango.Model.prototype.valueOf = function(){
//	return this.properties;
//};





//})(jQuery, window, document);