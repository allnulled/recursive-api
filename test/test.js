const { recursiveRequire } = require(__dirname + "/../index.js");
const inspect = require("util").inspect;
const see = (o, opts = {}) => console.log(inspect(o, { ...opts, colors: true }));
const affirmations = [];
const FORCE_CONTINUE = false;
const affirm = function(positive = undefined, condition) {
	if(condition) {
		const affirmation = positive || "✓ [affirmation n." + affirm.length+1 + "]";
		console.log(affirmation)
		affirmations.push(affirmation);
	} else {
		if(FORCE_CONTINUE) {
			console.error(" ERROR IN: " + positive)
		} else throw new Error(" ERROR IN: " + positive);
	}
};

(async function() {
	try {
		const mod1 = await recursiveRequire(__dirname + "/module", {}, {debug:true});
		const mod2 = await recursiveRequire(__dirname + "/module2.js");
		affirm("✓ Can recursiveRequire a folder", typeof mod1 === "object");
		affirm("✓ Can recursiveRequire a file", mod2 === "Hola!");
		affirm("✓ Can create functions using index.js file", typeof mod1.classes.ClassA === "function");
		const itemA = new mod1.classes.ClassA();
		const itemB = new mod1.classes.ClassB();
		const itemC = new mod1.classes.ClassC();
		affirm("✓ Can create static function properties", itemA.constructor.STATIC_ID === "Static ID");
		affirm("✓ Can avoid non-js files", (Object.keys(mod1).length === 3) && (typeof mod1.classes === "object"));
		const canUseNoadd = typeof mod1.classes.ClassD === "function" && typeof mod1.classes.ClassE === "function" && typeof mod1.classes.ClassF === "function" && typeof mod1.classes.ClassG === "undefined" && typeof mod1.classes.ClassH === "undefined" && typeof mod1.classes.ClassI === "undefined";
		affirm("✓ Can understand <_noadd> rules in files", canUseNoadd);
		affirm("✓ Can understand <_norun> rules in files", typeof global.XXX === "undefined");
		mod1.classes.ClassA.X = 5;
		const mod1_cached = await recursiveRequire(__dirname + "/module", {}, {debug:true, cache: true});
		affirm("✓ Can recursiveRequire with cache", mod1_cached.classes.ClassA.X === 5);
		const mod1_uncached = await recursiveRequire(__dirname + "/module", {}, {debug:true});
		affirm("✓ Can recursiveRequire without cache", mod1_uncached.classes.ClassA.X === undefined);
		mod1_uncached.classes.ClassA.X = 5;
		const mod1_uncached_2 = await recursiveRequire(__dirname + "/module", {}, {debug:true});
		affirm("✓ Can recursiveRequire without cache 2", mod1_uncached_2.classes.ClassA.X === undefined);
		affirm("✓ Can load json data too", typeof mod1.settings.conf === "object" && mod1.settings.conf.message === "wonderful");
		affirm("✓ Can understand <_norun> rules in folders", Object.keys(mod1.settings).length === 3 && typeof mod1.settings.norun === "object" && typeof mod1.settings.norun.realProperty === "string");
		affirm("✓ Can understand <_noadd> rules in folders", Object.keys(mod1.settings).length === 3 && typeof mod1.settings.noadd === "object" && typeof mod1.settings.noadd.realProperty2 === "string");
		/*
		affirm("✓ Can understand <_object> rules in folders", typeof(mod1.meta.projects) === "object");
		affirm("✓ Can understand <_array> rules in folders", Array.isArray(mod1.meta.events));
		//*/
		console.log(require("util").inspect(mod1, {colors: true, depth: 10}));
		console.log("✓✓✓ Test passed successfully!");
	} catch (error) {
		console.error("[ERROR] Test failed: ", error);
		throw error;
	}
})();