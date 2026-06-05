import { RuleTester } from "eslint"
import pluginVue from "eslint-plugin-vue"
import { RuleOptions } from "../../src/types"
import rule from "../../src/rules/no-straight-quotes"

const scriptRuleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
})
const jsxRuleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
})
const vueRuleTester = new RuleTester(
  Object.assign({}, ...pluginVue.configs["flat/base"])
)

const options: [RuleOptions] = [
  {
    "single-opening": "‘",
    "single-closing": "’",
    "double-opening": "“",
    "double-closing": "”",
    "ignored-elements": ["script", "style"],
    "ignored-attributes": ["className", "id", "key", "style"],
    "ignored-function-calls": [
      "document.querySelector",
      "document.querySelectorAll",
      "Error",
      "RegExp",
    ],
    "ignored-object-properties": ["Content-Disposition"],
  },
]

scriptRuleTester.run("curly-quotes", rule, {
  valid: [
    {
      code: '"No quotes"',
    },
    {
      code: '"A Wise Man Once Said: “Jam a Man of Fortune, and J must seek my Fortune”"',
    },
    {
      code: "'‘The people who are crazy enough to think they can change the world are the ones who do.’'",
    },
    {
      code: "'I don’t like tomatoes.'",
    },
    {
      code: "var str = `Hello, ${'world'}!`",
    },
    {
      code: "String.raw`Hello, 'world'`",
    },
    {
      code: 'throw new Error("Shouldn\'t have quotes " + upperCase("replaced \\"\\":)"));',
    },
    {
      code: 'new RegExp("Shouldn\'t have quotes replaced", "g");',
    },
    {
      code: "/Shouldn't have quotes replaced/g;",
    },
    {
      code: "/''/g",
    },
    {
      code: `var obj = { "Content-Disposition": 'Hello' }`,
    },
    {
      code: `var obj = { "Content-Disposition": 'attachment; filename="hello.txt"' }`,
    },
    {
      code: `var obj = { "Content-Disposition": { whatever: 'attachment; filename="hello.txt"' } }`,
    },
  ].map(caseItem => ({ ...caseItem, options })),
  invalid: [
    /**
     * Apostrophes
     */
    {
      code: '"I\'m enthusiastic about writing tests!"',
      output: '"I’m enthusiastic about writing tests!"',
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: '"🎅🏻🎅🏽🎅🏿 I\'m Santa Claus! 🎅🏿🎅🏽🎅🏻"',
      output: '"🎅🏻🎅🏽🎅🏿 I’m Santa Claus! 🎅🏿🎅🏽🎅🏻"',
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    /**
     * Single Quotes
     */
    {
      code: "\"A Straight-Quote User Once Said: 'I use eslint-plugin-no-smart-quotes'\"",
      output:
        '"A Straight-Quote User Once Said: ‘I use eslint-plugin-no-smart-quotes’"',
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: "\"I don't know how to properly write ' quotes ' , sorry!\"",
      output: '"I don’t know how to properly write ‘ quotes ’ , sorry!"',
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: "\"Fish 'n' Chips\"",
      output: '"Fish ‘n’ Chips"', // Opening quote is expected in order to match Microsoft Word's behavior.
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: "\"''\"",
      output: '"‘’"',
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: '"\'"',
      output: '"’"',
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    /**
     * Double Quotes
     */
    {
      code: "'Writing \" quotes \" is fun!'",
      output: "'Writing “ quotes ” is fun!'",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: "'\"\"'",
      output: "'“”'",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    /**
     * Template Literals
     */
    {
      code: "var str = `The correct answer is \"${'banana'}\".`",
      output: "var str = `The correct answer is “${'banana'}”.`",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    /**
     * Unnecessary backslashes
     */
    {
      code: String.raw`"Let\'s go!"`,
      output: String.raw`"Let’s go!"`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: String.raw`"Let\\'s go!"`,
      output: String.raw`"Let\\’s go!"`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: String.raw`"Let\\\'s go!"`,
      output: String.raw`"Let\\’s go!"`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    /**
     * Object Properties
     */
    {
      code: String.raw`var obj = { name: 'I\'m a "web developer"' }`,
      output: String.raw`var obj = { name: 'I’m a “web developer”' }`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: String.raw`var obj = { "Content-Type": 'attachment; filename="hello.txt"' }`,
      output: String.raw`var obj = { "Content-Type": 'attachment; filename=“hello.txt”' }`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: String.raw`var obj = { "Content-Type": 'attachment; filename="hello.txt"', "Content-Disposition": 'inline' }`,
      output: String.raw`var obj = { "Content-Type": 'attachment; filename=“hello.txt”', "Content-Disposition": 'inline' }`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
  ].map(caseItem => ({ ...caseItem, options })),
})

jsxRuleTester.run("curly-quotes", rule, {
  valid: [
    {
      code: "<style>{\".heading::after { content: ''; }\"}</style>",
    },
    {
      code: "<script>var a = '';</script>",
    },
    {
      code: "<div className=\"after:contents-[''] before:contents-['']\" />",
    },
    {
      code: "<div className={clsx(\"after:contents-['']\", \"before:contents-['']\")} />",
    },
  ].map(caseItem => ({ ...caseItem, options })),
  invalid: [
    {
      code: '<Component>I\'m a "web developer"</Component>',
      output: "<Component>I’m a “web developer”</Component>",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: '<Component>"Hello, world!"</Component>',
      output: "<Component>“Hello, world!”</Component>",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: "<Component name=\"I'm a 'web developer'\"></Component>",
      output: '<Component name="I’m a ‘web developer’"></Component>',
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
  ].map(caseItem => ({ ...caseItem, options })),
})

vueRuleTester.run("curly-quotes", rule, {
  // Note: `eslint-plugin-vue` doesn't support fixing style tags (https://github.com/vuejs/eslint-plugin-vue/issues/1997).
  valid: [
    {
      code: `<template>{{ 'No quotes' }}</template>`,
    },
    {
      code: "<template>{{ /''/g }}</template>",
    },
    {
      code: "<script>let a = { name: 'Hello' };</script>",
    },
    {
      code: `<template><div data-text="Hello World"></div></template>`,
    },
    {
      code: `<template><div :data-text="'Hello World'"></div></template>`,
    },
  ].map(caseItem => ({ ...caseItem, options, filename: "test.vue" })),
  invalid: [
    {
      code: "<template>I don't know how to properly write ' quotes ' , sorry!</template>",
      output:
        "<template>I don’t know how to properly write ‘ quotes ’ , sorry!</template>",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: "<template>{{ 'I\\'m enthusiastic about writing tests!' }}</template>",
      output:
        "<template>{{ 'I’m enthusiastic about writing tests!' }}</template>",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: "<template>{{ `${'I\\'m enthusiastic about writing tests!'}` }}</template>",
      output:
        "<template>{{ `${'I’m enthusiastic about writing tests!'}` }}</template>",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: "<script>let a = { name: 'I\\'m a \"web developer\"' };</script>",
      output: "<script>let a = { name: 'I’m a “web developer”' };</script>",
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: `<template><div data-text="I'm a web dev"></div></template>`,
      output: `<template><div data-text="I’m a web dev"></div></template>`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: `<template><div :data-text="'I\\'m a web dev'"></div></template>`,
      output: `<template><div :data-text="'I’m a web dev'"></div></template>`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
    {
      code: `<template><div>Hello <img />' World</div></template>`,
      output: `<template><div>Hello <img />‘ World</div></template>`,
      errors: [{ messageId: "preferCurlyQuotes" }],
    },
  ].map(caseItem => ({ ...caseItem, options, filename: "test.vue" })),
})
