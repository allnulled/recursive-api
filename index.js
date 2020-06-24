const fs = require("fs");
const path = require("path");
const asynchandler = function(ok, fail) {
	return function(error, data) {
		if (error) {
			fail(error);
			return;
		}
		ok(data);
		return;
	}
};
//*
global.dd = (...args) => {
	console.log(...args);
	process.exit(9);
}
//*/
const REGEX_SORTER = /^([0-9]+)(\.[0-9]+)*($|\.)/g;
const REGEX_ATTRIBUTES = /^(norun|noadd)($|\.)/gi;
const REGEX_EXTENSION = /\.js$/gi;
const utils = {
	strings: {
		extractId(filename) {
			return filename
				.replace(REGEX_SORTER, "")
				.replace(REGEX_ATTRIBUTES, "")
				.replace(REGEX_EXTENSION, "");
		},
		extractAttributes(filename) {
			let filenameTmp = filename;
			filenameTmp = filenameTmp.replace(REGEX_SORTER, "");
			filenameTmp = filenameTmp.replace(REGEX_EXTENSION, "");
			const matches = filenameTmp.match(REGEX_ATTRIBUTES);
			if (matches && matches.length) {
				return matches.map(m => m.replace(/\.$/gi, ""));
			}
			return [];
		}
	},
	js: {
		adaptModule: async function(nodeModule, context, parameters) {
			try {
				let output = undefined;
				if (typeof nodeModule === "object" && nodeModule.recursiveapi === true) {
					if (typeof nodeModule.build === "function") {
						output = await nodeModule.build.call(nodeModule, context, parameters);
					} else {
						output = nodeModule.build;
					}
				} else {
					output = nodeModule;
				}
				return output;
			} catch (error) {
				console.error(error);
				throw error;
			}
		},
		setValue: function(context, value = undefined) {
			if (context.noadd === true) {
				return;
			}
			let { selector = [] } = context;
			if (context.debug) {
				console.log("Setting value by selector: ", selector, value);
			}
			if (selector.length === 0) {
				context.root = value;
				return;
			}
			let rootPivot = context.root;
			for (let index = 0; index < selector.length; index++) {
				const selectorRule = selector[index];
				if (index === selector.length - 1) {
					if (typeof rootPivot[selectorRule] === "undefined") {
						rootPivot[selectorRule] = value;
					}
				} else {
					rootPivot = rootPivot[selectorRule];
				}
			}
			return;
		},
		recursiveRequire: function(nodeP, parameters = undefined, context = {}) {
			return utils.js.requireAny(nodeP, parameters, context);
		},
		requireAny: async function(nodeP, parameters = undefined, contextP = {}) {
			try {
				const context = Object.assign({}, { root: {}, selector: [] }, contextP);
				const nodePath = utils.fs.resolve(nodeP);
				const nodeStat = await utils.fs.stats(nodePath);
				const nodeIsFile = nodeStat.isFile();
				await utils.js[nodeIsFile ? "requireFile" : "requireDirectory"](nodePath, context, parameters);
				return context.root;
			} catch (error) {
				console.error(error);
			}
		},
		requireFile: async function(nodeP, context, parameters = undefined) {
			try {
				const nodePath = utils.fs.resolve(nodeP);
				const nodeName = path.basename(nodePath);
				if (!nodeName.endsWith(".js")) return;
				const nodeAttributes = utils.strings.extractAttributes(nodeName);
				if (context.debug) {
					//console.log("Including file: " + nodePath + " (" + nodeAttributes.join(", ") + ")");
				}
				const nodeHasNoAddRule = nodeAttributes.indexOf("noadd") !== -1;
				const nodeHasNoRunRule = nodeAttributes.indexOf("norun") !== -1;
				if (nodeHasNoRunRule) return;
				const nodeModule = require(nodePath);
				const nodeValue = await utils.js.adaptModule(nodeModule, context, parameters);
				if (nodeHasNoAddRule) return;
				utils.js.setValue(context, nodeValue);
			} catch (error) {
				console.error(error);
			}
		},
		requireDirectory: async function(nodeP, context, parameters = undefined) {
			try {
				const nodePath = utils.fs.resolve(nodeP);
				const nodeName = path.basename(nodePath);
				const nodeChildren = await utils.fs.list(nodePath);
				const nodeIndexPosition = nodeChildren.indexOf("index.js");
				const nodeIndexPath = utils.fs.resolve(nodePath, "index.js");
				const nodeAttributes = utils.strings.extractAttributes(nodeName);
				const nodeHasNoAddRule = nodeAttributes.indexOf("noadd") !== -1;
				const nodeHasNoRunRule = nodeAttributes.indexOf("norun") !== -1;
				if (nodeHasNoRunRule) return;
				if (nodeHasNoAddRule) context = Object.assign({}, context, { noadd: true });
				if (nodeIndexPosition === -1) {
					utils.js.setValue(context, {});
				} else {
					await utils.js.requireFile(nodeIndexPath, context, parameters);
					nodeChildren.splice(nodeIndexPosition, 1);
				}
				for (let index = 0; index < nodeChildren.length; index++) {
					const nodeChildName = nodeChildren[index];
					const nodeChildId = utils.strings.extractId(nodeChildName);
					const nodeChildPath = utils.fs.resolve(nodePath, nodeChildName);
					const nodeStat = await utils.fs.stats(nodeChildPath);
					const nodeIsDirectory = nodeStat.isDirectory();
					const nodeChildSelector = nodeChildId ? [...context.selector, nodeChildId] : [...context.selector];
					const nodeChildContext = Object.assign({}, context, { selector: nodeChildSelector });
					if (nodeIsDirectory) {
						await utils.js.requireDirectory(nodeChildPath, nodeChildContext, parameters);
					} else {
						await utils.js.requireFile(nodeChildPath, nodeChildContext, parameters);
					}
				}
			} catch (error) {
				console.error(error);
			}
		}
	},
	fs: {
		resolve: (...args) => path.resolve(...args),
		exists: (node) => new Promise(ok => fs.exists(node, ok)),
		stats: (node) => new Promise((ok, fail) => fs.lstat(node, asynchandler(ok, fail))),
		list: (node) => new Promise((ok, fail) => fs.readdir(node, asynchandler(ok, fail))),
	}
}

const framework = {
	recursiveRequire: utils.js.recursiveRequire,
	utils,
};

module.exports = framework;