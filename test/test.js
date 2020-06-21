const { importNode } = require(__dirname + "/../index.js");
const inspect = require("util").inspect;
const see = (o, opts = {}) => console.log(inspect(o, { ...opts, colors: true }));

(async function() {
	try {
		const modulos = [];
		const modulo = await importNode(__dirname + "/module", { modulos });
		const modulo2 = await importNode(__dirname + "/module2.js", { modulos });
		const sc = new modulo.utils.classes.SuperClass("NEW MESSAGE HERE");
		if (sc.getMessage() !== "Default message is now: NEW MESSAGE HERE") throw new Error("check 0001");
		if (modulo2 !== "Hola!") throw new Error("check 0002");
		console.log("Test passed successfully!");
		see(modulo);
	} catch (error) {
		console.error("[ERROR] Test failed: ", error);
	}
})();