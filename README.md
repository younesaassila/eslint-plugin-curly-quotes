# eslint-plugin-curly-quotes

<a href="https://github.com/younesaassila/eslint-plugin-curly-quotes/issues">
  <img alt="GitHub issues" src="https://img.shields.io/github/issues/younesaassila/eslint-plugin-curly-quotes">
</a>
<a href="https://github.com/younesaassila/eslint-plugin-curly-quotes/stargazers">
  <img alt="GitHub stars" src="https://img.shields.io/github/stars/younesaassila/eslint-plugin-curly-quotes">
</a>
<a href="https://github.com/younesaassila/eslint-plugin-curly-quotes">
  <img alt="GitHub license" src="https://img.shields.io/github/license/younesaassila/eslint-plugin-curly-quotes">
</a>

Enforce the use of curly quotes and apostrophes.

✨ **Simple** and **customizable** 🔧 Compatible with JavaScript, TypeScript, **JSX** and **Vue**!

**Fixable:** This rule is automatically fixable using the `--fix` flag on the command line.

> **CAUTION**
>
> The plugin replaces quotes used in query selector or stringified JSON strings when using the `--fix` flag on the command line. To ignore a specific string:
>
> Use tagged template literals:
>
> ```js
> String.raw`{"foo": "bar"}`
> ```
>
> Or disable the rule for the line:
>
> ```js
> const data = '{"foo": "bar"}' // eslint-disable-line curly-quotes/no-straight-quotes
> ```

## Installation

Install [ESLint](https://www.npmjs.com/package/eslint):

```sh
npm i --save-dev eslint
```

Install [`eslint-plugin-curly-quotes`](https://www.npmjs.com/package/eslint-plugin-curly-quotes):

```sh
npm i --save-dev eslint-plugin-curly-quotes
```

## Usage

Add `eslint-plugin-curly-quotes` to the `plugins` section of your `.eslintrc` configuration file:

```json
{
  "plugins": ["curly-quotes"]
}
```

Then add the `no-straight-quotes` rule to the `rules` section:

```json
{
  "rules": {
    "curly-quotes/no-straight-quotes": "warn"
  }
}
```

You may customize the characters used to replace straight quotes:

```json
{
  "rules": {
    "curly-quotes/no-straight-quotes": [
      "warn",
      {
        "single-opening": "‘",
        "single-closing": "’", // This character is also used to replace apostrophes.
        "double-opening": "“",
        "double-closing": "”"
      }
    ]
  }
}
```

## Acknowledgements

- Plugin inspired by [`eslint-plugin-prefer-smart-quotes`](https://github.com/totallymoney/eslint-plugin-prefer-smart-quotes)
- Algorithm adapted from [“Ideas for converting straight quotes to curly quotes”](https://stackoverflow.com/questions/509685/ideas-for-converting-straight-quotes-to-curly-quotes) by [ShreevatsaR](https://stackoverflow.com/users/4958/shreevatsar) on Stack Overflow
