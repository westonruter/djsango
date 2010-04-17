<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="pragma" content="no-cache">
    <title>Djsango Tests</title>
	<style>
	.pass {
		background-color:#A3FFA7;
	}
	.fail {
		background-color:#FFCCCC;
	}
	.assertions li {
		padding:3px;
		padding-left:10px;
		font-size:12px;	
	}
	li.run iframe {
		display:block;
		float:right;
		visibility:hidden;
		width:200px;
		height:2em;
		background-color:#DDD;
		border:solid 1px black;
	}
	iframe {
		display:none;
		clear:right;
		visibility:hidden;
		/*position:fixed;*/
		/*right:0;*/
		/*top:0;*/
		/*bottom:0;*/
		/*height:100%;*/
		/*width:50%;*/
		/*border:0;*/
		/*border-left:solid 2px black;*/
		/*background:#DDD;*/
	}
	li:target iframe {
		visibility:visible;
		float:none;
		margin-bottom:0.5em;
		width:600px;
		height:100px;
	}
	li.target,
	li:target {
		outline:solid 1px yellow;
	}
	body > hr {
		clear:both;
		margin-top:1em;
	}
	#totalPass {
		color:green;
	}
	#totalFail {
		color:red;
	}
	</style>
</head>
<body>
    <h1><a href="http://github.com/westonruter/djsango">Djsango</a> Tests: <span id='totalPass'>0</span>/<span id='totalFail'>0</span></h1>
	
	<form action="./" method="get">
		<button type=submit name="autorun" value="on">Run All</button>
	</form>
	
	<ul id="tests">
	<?php
	$testfiles = glob("*.html");
	foreach($testfiles as $testfile): $name = basename($testfile, '.html');
	?>
		<li id="<?php echo $name ?>">
			<a href="./#<?php echo $name ?>"><?php echo $name; ?></a>
			<iframe class="container" src="about:blank"></iframe>
			<ol class='assertions'></ol>
		</li>
	<?php endforeach; ?>
	</ul>
	
	<script>
	function isAutorun(){
		if(location.search.indexOf('autorun') == -1)
			return false;
		var hash = location.hash.substr(1);
		return !document.getElementById(hash);
	}
	
	function run(testname){
		var li = document.getElementById(testname);
		if(!li)
			throw Error("No test named '" + name + "'");
		li.className += " run";
		
		var assertions = li.querySelector('.assertions');
		assertions.innerHTML = '';
		
		var iframe = li.querySelector('iframe');
		iframe.onload = function(){
			if(isAutorun() && li.nextElementSibling){
				run(li.nextElementSibling.id);
			}
		};
		iframe.src = testname + ".html";
	}
	
	function completetest(testname, assertion, success, error){
		var li = document.getElementById(testname);
		var asserts = li.querySelector('.assertions');
		var assert = document.createElement('li');
		assert.appendChild(document.createTextNode(assertion));
		assert.className = success ? "pass" : "fail";
		asserts.appendChild(assert);
	}
	
	var totalPass = 0;
	function pass(testname, assertion){
		totalPass++;
		document.getElementById('totalPass').innerHTML = totalPass;
		completetest(testname, assertion, true);
	}
	var totalFail = 0;
	function fail(testname, assertion, error){
		totalFail++;
		document.getElementById('totalFail').innerHTML = totalPass;
		completetest(testname, assertion, false, error);
	}
	//function pass(name, assertion){
	//	
	//	
	//	document.getElementById(name).className += ' pass';
	//	next();
	//}
	//function fail(name, assertion, error){
	//	var el = document.getElementById(name);
	//	el.className += ' fail';
	//	el.querySelector('.message').textContent = error.toString();
	//	next();
	//}
	
	//var alltestlinks = document.querySelectorAll('#tests a');
	//var curr;
	//function next(){
	//	if(!isNaN(curr)){
	//		// Iterate to the next
	//		curr++;
	//		if(curr >= alltestlinks.length){
	//			curr = 0;
	//			return false;
	//		}
	//		
	//		run(alltestlinks[curr].pathname.replace(/.+\//, '').replace(/\.html.*/, ''));
	//		return true;
	//	}
	//	return false;
	//}
	
	/**
	 * Save the activated test
	 */
	document.getElementById('tests').addEventListener('click', function(e){
		if(e.target.href){
			var hash = e.target.pathname.replace(/.+\//, '').replace(/\.html.*/, '');
			location.href = "#" + hash;
		}
	}, false);
	
	function hashchange(e){
		var currentHash = location.hash.substr(1);
		if(document.getElementById(currentHash)){
			run(currentHash);
			return true;
		}
		return false;
	}
	
	//Run all!
	if(isAutorun()){
		run(document.querySelector('#tests li:first-child').id);
	}
	else {
		var hash = location.hash.substr(1);
		if(hash)
			run(hash);
		//return !document.getElementById(hash);
	}
	
	window.addEventListener('hashchange', hashchange, false);
	</script>
	
	
	<hr>
	<footer>
		<address><a href="http://weston.ruter.net/" rel="author">Weston Ruter</a> @
		<a href="http://shepherdinteractive.com/">Shepherd Interactive</a></address>
		<time>2010-04-15</time>
	</footer>
</body>
</html>
