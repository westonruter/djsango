
var blogApp = new Djsango("Blog");

//function viewHome(matches){
//	
//}
//Djsango.urlpatterns.add([
//	[/^$/, viewHome]
//]);

function viewEntries(matches){
	console.info(this, 'viewEntries', matches)
}
//Djsango.urlpatterns.add(/^entries\//, viewEntries);



Djsango.init();