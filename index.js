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

const utils = {
	strings: {
		obtainFilename: function(file) {
			let str = path.basename(file);
			str = utils.strings.removeFilenameRules(str);
			str = utils.strings.removeFilenameSorter(str);
			str = utils.strings.removeFilenameExtension(str);
			return str;
		},
		removeFilenameRules: function(file) {
			return path.basename(file).replace(/^(norun|noadd)\.?/g, "")
		},
		removeFilenameSorter: function(file) {
			return path.basename(file)
				.replace(/^[0-9]+\.([0-9]+\.)* */g, "")
				.replace(/^[0-9]+$/g, "")
		},
		removeFilenameExtension: function(file) {
			return path.basename(file)
				.replace(/\.js$/g, "")
				.replace(/^js$/g, "");
		}
	},
	js: {
		requireAny: async function(nodeP, context = {}) {
			try {
				const node = utils.fs.resolve(nodeP);
				const nodeExists = await utils.fs.exists(node);
				if (!nodeExists) {
					throw new Error("Imported file <node> does not exist: " + node)
				}
				const nodeStats = await utils.fs.stats(node);
				if (nodeStats.isFile()) {
					if(!node.endsWith(".js")) {
						return undefined;
					}
					return await utils.js.requireFile(node, context);
				} else if (nodeStats.isDirectory()) {
					return await utils.js.requireDirectory(node, context);
				} else {
					throw new Error("Imported file <node> is not a file or a directory");
				}
			} catch (error) {
				console.error(error);
			}
		},
		requireFile: async function(fileP, contextP = {}) {
			try {
				const file = utils.fs.resolve(fileP);
				const modulo = require(file);
				const context = Object.assign({}, contextP);
				if (typeof modulo === "object" && modulo.recursiveapi === true && typeof modulo.build === "function") {
					return await modulo.build.call(context.parent, context, framework, modulo, file);
				} else {
					return modulo;
				}
			} catch (error) {
				console.error(error);
			}
		},
		requireDirectory: async function(directoryP, contextP = {}) {
			try {
				let output = undefined;
				const directory = utils.fs.resolve(directoryP);
				const filenames = await utils.fs.list(directory);
				const filepaths = filenames.map(file => utils.fs.resolve(directory, file));
				// 0. Sort files:
				// 1. Import index file:
				let indexSource = undefined;
				for (let index = 0; index < filepaths.length; index++) {
					const filepath = filepaths[index];
					if (filepath.endsWith("/index.js")) {
						const lstatFile = await utils.fs.stats(filepath);
						if (lstatFile.isFile()) {
							indexSource = { file: filepath, index };
						}
					}
				}
				const context = Object.assign({}, contextP);
				if (indexSource) {
					output = await utils.js.requireAny(indexSource.file, context);
					// 2. Remove index file from list of files:
					filepaths.splice(indexSource.index, 1);
				} else {
					output = {};
				}
				if (!context.root) {
					context.root = output;
				}
				// 3. Import the rest of the directory:
				ImportingDirectory:
					for (let index = 0; index < filepaths.length; index++) {
						const filepath = filepaths[index];
						const filename1 = utils.strings.removeFilenameSorter(filepath);
						const filename = utils.strings.removeFilenameExtension(filename1);
						const filestats = await utils.fs.stats(filepath);
						const isDirectory = filestats.isDirectory();
						let fileContext = undefined;
						/////////////////////////////
						/////////////////////////////
						/////////////////////////////
						if (filename === "") {
							if (isDirectory) {
								fileContext = context;
							} else {
								fileContext = Object.assign({}, context, { parent: output });
							}
						} else {
							fileContext = Object.assign({}, context, { parent: output });
						}
						if (filename.match(/^norun($|\.?)/gi)) {
							continue ImportingDirectory;
						}
						if(!isDirectory && !filepath.endsWith(".js")) {
							// @NOTHING with a non-js file
						} else {
							const value = await utils.js.requireAny(filepath, fileContext);
							if (filename === "") {
								continue ImportingDirectory;
							}
							if (filename.match(/^noadd($|\.?)/gi)) {
								continue ImportingDirectory;
							}
							output[filename] = value;
						}
						/////////////////////////////
						/////////////////////////////
						/////////////////////////////
					}
				return output;
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
	importNode: utils.js.requireAny,
	utils,
};

module.exports = framework;