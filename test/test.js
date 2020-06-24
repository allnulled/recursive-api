const { recursiveRequire } = require(__dirname + "/../index.js");
const inspect = require("util").inspect;
const see = (o, opts = {}) => console.log(inspect(o, { ...opts, colors: true }));

(async function() {
	try {
		const mod1 = await recursiveRequire(__dirname + "/module", {}, {debug:true});
		const mod2 = await recursiveRequire(__dirname + "/module2.js");
		if(typeof mod1 === "object") console.log("✓ Can export data");
		else throw new Error("Cannot export data");
		if(typeof mod1.classes.ClassA === "function") console.log("✓ Can create functions using index.js file");
		else throw new Error("Cannot create functions using index.js file");
		const itemA = new mod1.classes.ClassA();
		const itemB = new mod1.classes.ClassB();
		const itemC = new mod1.classes.ClassC();
		if(itemA.constructor.STATIC_ID === "Static ID") console.log("✓ Can create static function properties");
		else throw new Error("Cannot create static function properties");
		if((Object.keys(mod1).length === 1) && (typeof mod1.classes === "object")) console.log("✓ Can avoid non-js files");
		else throw new Error("Cannot avoid non-js files");
		if(typeof mod1.classes.ClassD === "function"
			&& typeof mod1.classes.ClassE === "function"
			&& typeof mod1.classes.ClassF === "function"
			&& typeof mod1.classes.ClassG === "undefined"
			&& typeof mod1.classes.ClassH === "undefined"
			&& typeof mod1.classes.ClassI === "undefined"
		) console.log("✓ Can understand <noadd> rules in files");
		else throw new Error("Cannot understand <noadd> rules in files");
		if(typeof global.XXX === "undefined") console.log("✓ Can understand <norun> rules in files");
		else throw new Error("Cannot understand <norun> rules in files");
		console.log("✓✓✓ Test passed successfully!");
	} catch (error) {
		console.error("[ERROR] Test failed: ", error);
		throw error;
	}
})();