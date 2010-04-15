
Function.prototype.bind = function(o) {
    // Save the this and arguments values
    var self = this, boundArgs = arguments;
    return function() {
        // Build up an argument list
        var args = [], i;
        for(i = 1; i < boundArgs.length; i++)
            args.push(boundArgs[i]);
        for(i = 0; i < arguments.length; i++)
            args.push(arguments[i]);
        // Now invoke self as a method of o
        return self.apply(o, args);
    };
};




var blogApp = new Djsango("Blog", [
	[/^help/, function(){ console.info(this, 'HELP') }]
]);

blogApp.urlPatterns.add(/^$/, function(){
	console.info(this, "INDEX")
});

blogApp.urlPatterns.add(/^post(?:\/(\d+))?$/, function(matches, queryParams){
	console.info(this, "Post", matches)
});

blogApp.urlPatterns.add(
	[/^feed\/?$/,
		function(matches){ console.info(this, "Post", matches); }
	],
	[/^archive\/?$/,
		function(matches){ console.info(this, "Post", matches); }
	]
);

Djsango.addEventListener('before_event', function(e){
	switch(e.target.type){
		case 'url_fail':
		case 'error':
			console.warn("Event: " + e.target.type, this)
			break;
		default:
			console.info("Event: " + e.target.type, this)
	}
	
})


function viewAboutMe(matches){
	//Note that this is not inside of an app at all! So it will get called in the context of Djsango
	console.info(this, 'viewAboutMe', matches)
}

//PROBLEM: Even if the view is bound to the app, Djssango won't be able to see what the app is in order to fire events properly
//Djsango.urls.add(/^entries\//, blogApp, viewEntries); //This works just fine, but could get wordy?

//Each app can add their own URLs as desired: BUT then we don't have control over them! We do need an inclusion mechanism
//Djsango.urlPatterns.add(/^about\/?$/, metaApp, viewAboutMe);

Djsango.urlPatterns.add(/^about\/?$/, viewAboutMe);
Djsango.urlPatterns.include(/^blog/, blogApp);

//Djsango.urls.add(/^entries\//, blogApp, viewEntries); //This works just fine, but could get wordy?
//Djsango.urls.add(/^entries\//, viewEntries.bind(blogApp)); //This would work if the view is bound to the application
//Djsango.urls.add(/^entries\//, blogApp.adoptView(viewEntries)); //this simply does a function.bind
//Djsango.urls.add(/^entries\//, blogApp.views.viewEntries); //This will not work because it doesn't keep context

console.info(Djsango.urlPatterns)
Djsango.init([
	[/^temp/, function(){ console.info(this, 'TEMP') }]
]); //runs Djsango.navigate();

//TODO: We need an event for 