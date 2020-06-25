# recursive-api

To import modules asynchronously and based on filesystem nodes.

No dependencies at all. Less than 200 lines of code.

## Install

```
$ npm i -s recursive-api
```

## Usage

```js
const moduleOne = await require("recursive-api").recursiveRequire(__dirname + "/module/one", {
    contextual: "parameters"
});
```

## Rules

- Every file and folder is a new property of the parent's structure.
- Every `index.js` file is used to describe the parent's structure.
  - If `index.js` file is not found, any directory will be a simple `{}`.
- Every file or folder can be named in this format: `{order}.{attributes}.{id}.{extension}`


# License

Okay, bitch. Do not you see that all my project are **DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE**? **WTFPL**, bitch, learn this words.







