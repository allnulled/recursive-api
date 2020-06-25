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
const STRING_NOADD_RULE = "noadd";
const STRING_NORUN_RULE = "norun";
const STRING_OBJECT_RULE = "object";
const STRING_ARRAY_RULE = "array";
const STRING_FUNCTION_RULE = "function";
const REGEX_ATTRIBUTES = /^(_norun|_noadd|_default|_object|_array|_function)($|\.)/gi;
const REGEX_ATTRIBUTE_PREFIX = /^_/g;
const REGEX_FINAL_DOT = /\.$/g;
const REGEX_SORTER = /^([0-9]+)(\.[0-9]+)*($|\.)/g;
const REGEX_EXTENSION = /\.js(on)?$/gi;
const utils = {
	strings: {
		extractId(filename) {
			return filename
				.replace(REGEX_SORTER, "")
				.replace(REGEX_ATTRIBUTES, "")
				.replace(REGEX_EXTENSION, "");
		},
		extractAttributes(filename) {
			let filenamePivot = filename;
			filenamePivot = filenamePivot.replace(REGEX_SORTER, "");
			filenamePivot = filenamePivot.replace(REGEX_EXTENSION, "");
			const matches = filenamePivot.match(REGEX_ATTRIBUTES);
			if (matches && matches.length) {
				return matches.map(m => m
						.replace(REGEX_ATTRIBUTE_PREFIX, "")
						.replace(REGEX_FINAL_DOT, ""));
			}
			return [];
		}
	},
	js: {
		requireModule: function(filename, parameters = {}, context = {}) {
			const filepath = require.resolve(filename);
			let output = undefined;
			if(context.cache === true) {
				output = require(filepath);
			} else {
				const filecache = require.cache[filepath];
				delete require.cache[filepath];
				output = require(filepath);
			}
			return output;
		},
		assignAttributesToContext: function(attributes, context) {
			for(let index=0; index < attributes.length; index++) {
				const attribute = attributes[index];
				context[attribute] = true;
			}
			return;
		},
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
			const { selector = [] } = context;
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
		recursiveRequire: function(nodeP, contextP = {}, parametersP = undefined) {
			return utils.js.requireAny(nodeP, contextP, parametersP);
		},
		requireAny: async function(nodeP, contextP = {}, parameters = undefined) {
			try {
				const context = Object.assign({}, { root: {}, selector: [], cache: parameters && parameters.cache ? parameters.cache : false }, contextP);
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
				if (!nodeName.match(REGEX_EXTENSION)) return;
				const nodeAttributes = utils.strings.extractAttributes(nodeName);
				utils.js.assignAttributesToContext(nodeAttributes, context);
				if(context.norun) {
					delete context.norun;
					return;
				}
				const nodeModule = utils.js.requireModule(nodePath, context, parameters);
				const nodeValue = await utils.js.adaptModule(nodeModule, context, parameters);
				if(context.noadd) {
					delete context.noadd;
					return;
				}
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
				utils.js.assignAttributesToContext(nodeAttributes, context);
				// 1. Prevent from running:
				if(context.norun) {
					delete context.norun;
					return;
				}
				// 2. Assign value to module holder:
				if (nodeIndexPosition === -1) {
					utils.js.setValue(context, {});
				} else {
					await utils.js.requireFile(nodeIndexPath, context, parameters);
					nodeChildren.splice(nodeIndexPosition, 1);
				}
				// 3. Assign children:
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