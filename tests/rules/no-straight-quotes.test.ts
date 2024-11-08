import { RuleTester } from "eslint"
import rule from "../../src/rules/no-straight-quotes"

const ruleTester = new RuleTester({
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

ruleTester.run("curly-quotes", rule, {
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
    {
      code: 'throw new Error("Shouldn\'t have quotes " + upperCase("replaced \\"\\":)"));',
    },
  ],
  invalid: [
    /**
     * Apostrophes
     */
    {
      code: '"I\'m enthusiastic about writing tests!"',
      output: '"I’m enthusiastic about writing tests!"',
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    {
      code: '"🎅🏻🎅🏽🎅🏿 I\'m Santa Claus! 🎅🏿🎅🏽🎅🏻"',
      output: '"🎅🏻🎅🏽🎅🏿 I’m Santa Claus! 🎅🏿🎅🏽🎅🏻"',
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    /**
     * Single Quotes
     */
    {
      code: "\"A Straight-Quote User Once Said: 'I use eslint-plugin-no-smart-quotes'\"",
      output:
        '"A Straight-Quote User Once Said: ‘I use eslint-plugin-no-smart-quotes’"',
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    {
      code: "\"I don't know how to properly write ' quotes ' , sorry!\"",
      output: '"I don’t know how to properly write ‘ quotes ’ , sorry!"',
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    {
      code: "\"Fish 'n' Chips\"",
      output: '"Fish ‘n’ Chips"', // Opening quote is expected in order to match Microsoft Word's behavior.
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    {
      code: "\"''\"",
      output: '"‘’"',
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    {
      code: '"\'"',
      output: '"’"',
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    /**
     * Double Quotes
     */
    {
      code: "'Writing \" quotes \" is fun!'",
      output: "'Writing “ quotes ” is fun!'",
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    {
      code: "'\"\"'",
      output: "'“”'",
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
    /**
     * Template Literals
     */
    {
      code: "var str = `The correct answer is \"${'banana'}\".`",
      output: "var str = `The correct answer is “${'banana'}”.`",
      errors: [{ messageId: "preferCurlyQuotes", type: "TemplateLiteral" }],
    },
    /**
     * JSX
     */
    {
      code: '<Component>I\'m a "web developer"</Component>',
      output: "<Component>I’m a “web developer”</Component>",
      errors: [{ messageId: "preferCurlyQuotes", type: "JSXText" }],
    },
    {
      code: '<Component>"Hello, world!"</Component>',
      output: "<Component>“Hello, world!”</Component>",
      errors: [{ messageId: "preferCurlyQuotes", type: "JSXText" }],
    },
    {
      code: "<Component name=\"I'm a 'web developer'\"></Component>",
      output: '<Component name="I’m a ‘web developer’"></Component>',
      errors: [{ messageId: "preferCurlyQuotes", type: "Literal" }],
    },
  ],
})
