module.exports = {
	recursiveapi: true,
	build: function(context) {
		context.modulos.push("getMessage.js");
		return function() {
			return this.message;
		}
	}
}