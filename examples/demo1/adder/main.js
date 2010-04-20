// Power app: raise a number to a power via a form
var powerApp = new Djsango("Power");
powerApp.urlPatterns.add(/^$/, function(request){
	var params = {
		exponent: request.queryDict.exponent || 2,
		base: request.queryDict.base || 2
	};
	params.result = Math.pow(params.base, params.exponent);
	
	return render_to_response( //function located in helpers.js
		document.getElementById('powerAppTemplate'),
		params
	)
});



