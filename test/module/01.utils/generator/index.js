module.exports = {
	recursiveapi: true,
	build: async function(context) {
		context.modulos.push("generator");
		this.tracer.trace(__filename);
		return {};
	}
}