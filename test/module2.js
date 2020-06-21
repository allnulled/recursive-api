module.exports = {
	recursiveapi: true,
	build: async function(context) {
		try {
			context.modulos.push("module2.js");
			return await new Promise((ok, fail) => {
				setTimeout(() => {
					ok("Hola!");
				}, 200);
			});
		} catch(error) {
			console.error(error);
			throw error;
		}
	}
}