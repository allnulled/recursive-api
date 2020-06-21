# recursive-api

Import (nested) files and folders to compose a Node.js tree of values (asynchronously or not).

No dependencies, at all. Less than 200 lines of game-changer code. Most free license ([WTFPL or What The Fuck Public License](#)).


## What?

The `recursive-api` module is a handy and free tool to create Node.js APIs from files and folders disposition.

For example, given a file structure like this (presuposing that any `*.js` is a file):

```
/SuperAPI
/SuperAPI/01.utils
/SuperAPI/01.utils/customMethod.js
/SuperAPI/02.classes
/SuperAPI/02.classes/Initialization
/SuperAPI/02.classes/Initialization/prototype
/SuperAPI/02.classes/Initialization/prototype/index.js
/SuperAPI/02.classes/Initialization/prototype/initState.js
/SuperAPI/02.classes/Initialization/prototype/initAuthentication.js
/SuperAPI/02.classes/Initialization/prototype/initInternationalization.js
/SuperAPI/02.classes/Initialization/prototype/initialize.js
/SuperAPI/02.classes/Initialization/initialize.js
/SuperAPI/03.api
/SuperAPI/03.api/app
/SuperAPI/03.api/app/get/
/SuperAPI/03.api/app/get/authentication.js
/SuperAPI/03.api/app/get/authorization.js
/SuperAPI/03.api/app/get/internationalization.js
/SuperAPI/03.api/app/get/menuItems.js
/SuperAPI/03.api/app/get/statistics.js
/SuperAPI/03.api/app/get/state.js
/SuperAPI/03.api/app/post/menuItem.js
/SuperAPI/03.api/app/post/statistic.js
/SuperAPI/03.api/app/post/state.js
/SuperAPI/03.api/app/post/internationalization.js
/SuperAPI/03.noadd.initialization.js
```

And importing the root folder:

```js
const output = await require("recursive-api").importNode("./SuperAPI");
```

We would get something like this:

```
{
	utils: {
		customMethod: undefined
	},
	api: {
		get: {
			authentication: undefined,
			authorization: undefined,
			internationalization: undefined,
			menuItems: undefined,
			statistics: undefined,
			state: undefined,
		},
		post: {
			menuItem: undefined,
			statistic: undefined,
			state: undefined,
			internationalization: undefined,
		}
	}
}
```

## How?

The main point of this library is that any of these files, concerned with the API, can now:
  - Extend the structure with new properties, just creating a new file or folder
  - Extend the execution (asynchronously or not) at any point, transparently, just creating a new file or folder

We name the files with 3 types of data in the same name of the file:
  - **Order**: the numbers at the begining of the file. They can be separated by dots. These numbers are to give order to the files.
  - **Attributes**: labels that will alter the way the framework loads every file or folder.
     - `noadd`: runs the contents, but it does not attach them to the parent.
     - `norun`: does not run any file nor read any folder from this node.
  - **Identifier**: name of the property of the parent in the tree that this file is representing.

As you can see, we use the names of the files and folder to:
  - To put sequential order to the contents of the folder.
  - To define what this file or folder is for:
     - `noadd` represents a block of code that is not a property, but that should be executed.
     - `norun` represents files and folders that are not related to `recursive-api`.
  - To set the name of the property that a given file represents in the parent (unless you set `noadd`).


## Why?

- To save time designing
   - To develop structures safer and faster and more comfortably.
   - To develop better public Node.js APIs
- To save time coding
   - To save some repeatitive and reusable part of code
   - To save time thinking about **how to expose an API**
- To save time documenting
   - To create better standards of development
   - To intuitively allow others to understand a project by an overview

For all this reasons, it has sense to develop this module. The function of `require` available in Node.js is powerful, but it is not thought to import data recursively (by default), while this module is.

## Installation

`$ npm i -s recursive-api`

## Usage

Having our `fancy-module` located at `./fancy-module`, we can simply:

```js
require("recursive-api").importNode("./fancy-module").then(fancy => ...);
```

We can use also `async/await`:

```js
const fancy = await require("recursive-api").importNode("./fancy-module");
```

## Rules

### Introduction

When one imports a module, there are 2 moments in the execution we can play with:

   - `Load-time`: the moment in which the module is importing nestedly all the properties recursively.
      - Here, we define all the utilities, classes, etc. our Node.js API contains.
   - `Execution-time`: the moment after the whole module has been loaded.
      - Here, we can call the functions we defined at `load-time`.

### All the rules

0. Name files and folders following this pattern: `[sorter].[attributes].[id]`
   - You can provide any of: sorter, attributes, identifier.
   - `sorter`: numbers to set an order to items inside a folder.
   - `attributes`: at the moment:
      - `noadd` or `norun`:
         - `noadd`: the module is imported, but not attached to the parent.
         - `norun`: the module is not imported.
   - `id`: the identifier property of that file in the parent.
1. Files have to end with `.js` to be taken into account.
2. The `index.js` file defines the first value acquired by the object represented by any folder.
3. When `index.js` is not defined, a plain object `{}` becomes the base object of the folder.
4. The files inside a folder represent:
   - Properties of the parent node, when the `identifier` is set in the filename.
   - A `load-time` execution, when the `identifier` is not set.
5. When a (`*.js`) file exports an object with a `recursiveapi` property set to `true`:
   - The file, when (recursively) required, will return what is found under the `build` property of itself, and:
      - When the `build` property holds a `function`, it is resolved to find out the value of the module.
      - When the `build` property holds an `async function`, it is *asynchronously* resolved to find out the value of the module.

## To sum up

- You create a tree of files and folders.
- You play with the filenames using: 
   - the numbers at the begining, to sort them.
   - the `noadd` and `norun` attributes, to avoid inclusion or recursion.
   - the name, to create properties (in the parent, at `load-time`).
- You can play with the `index.js` files to setup different structures for a given folder.
- You can play with `{recursiveapi: true, build: undefined}` modules to load data asynchronously.


# License

Okay, bitch. Do not you see that all my project are **DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE**? **WTFPL**, bitch, learn this words.







