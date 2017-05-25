String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}		//http://stackoverflow.com/a/1026087
function isJson(str) {
	try { JSON.parse(str); } catch (e) { return false; }
	return true;
}		//http://stackoverflow.com/a/9804835