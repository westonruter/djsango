// Adder app: raise a number to a power via a form
var adderApp = new Djsango("Adder");

adderApp.urlPatterns.add(/^$/, function(request){
	return render_to_response( //function located in helpers.js
		document.getElementById('adderAppIndexTemplate')
	);
});

adderApp.urlPatterns.add(/^(-?\d+);(-?\d+)$/, function(request, addend1, addend2){
	return render_to_response( //function located in helpers.js
		document.getElementById('adderAppSummerTemplate'),
		{
			addend1: addend1,
			addend2: addend2,
			sum: parseFloat(addend1) + parseFloat(addend2)
		}
	);
});


