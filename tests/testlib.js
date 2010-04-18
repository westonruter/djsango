
var test = {
	expectedCount:0,
	actualCount:0,
	finalCheckDelay:1000
};


var name = location.pathname.replace(/.+\//, '').replace(/\.html.*/, '');
if(parent != self){
	//window.location = "./#"+name;
	test.pass = function(message){
		test.actualCount++;
		parent.pass(name, message);
	};
	test.fail = function(message){
		//test.actualCount++;
		console.warn(message);
		parent.fail(name, message);
	};
}
else {
	test.pass = function(message){
		test.actualCount++;
		console.info(message);
	};
	test.fail = function(message){
		//test.actualCount++;
		console.error(message);
	};
}

test.assert = function(msg, assertion){
	if(assertion)
		test.pass(msg);
	else
		test.fail(msg);
};

self.onload = function(){
	if(typeof Djsango == "undefined")
		throw Error("Please build Djsango first before running tests.");
	self.setTimeout(function(){
		if(test.expectedCount != test.actualCount){
			test.fail("the total expected number of tests were fired (expected " + test.expectedCount + "; actual " + test.actualCount + ")");
		}
	}, test.finalCheckDelay);
};