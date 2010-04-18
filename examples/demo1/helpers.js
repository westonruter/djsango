
/**
 * Basic template processor; replace with your template engine of choice
 */
function render_to_response(dom_template, params){
	
	// Clone the template and then 
	template = jQuery(dom_template).clone(true);
	template.removeAttr('id').removeAttr('hidden');
	for(var key in params){
		if(params.hasOwnProperty(key)){
			template.find('.' + key).text(params[key]);
			template.find(':input[name=' + key + ']').val(params[key]);
		}
	}
	
	// Handle form submissions within the context of Djsango
	template.find('form').submit(function(e){
		var sigilPos = this.action.indexOf('#' + Djsango.fragmentSigil);
		if(sigilPos != -1){
			e.preventDefault();
			//BTW: this.checkValidity()
			var url = this.action.toString().substr(sigilPos + 1 + Djsango.fragmentSigil.length);
			url += "?" + $(this).serialize();
			Djsango.navigate(url);
		}
	});
	return template;
}





/**
 * MIDDLEWARE:
 * Tie into the Djsango events (signals) to handle the URLs and views
 */

// Handle a successful response
Djsango.addEventListener("view_success", function(event, response){
	jQuery('#content').empty().append(response);
});

// Handle an error that happened in a view
Djsango.addEventListener("view_error", function(event, error){
	jQuery('#content').text("500 Error: " + error.message);
});

// Handle a 404 error
Djsango.addEventListener("url_fail", function(event, url){
	jQuery('#content').text("404 Error: couldn't find " + url);
});