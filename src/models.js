/*!
 * Djsango Models
 */

// http://impel.simulacre.org/

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