import type { AST } from "vue-eslint-parser"
import type {
  JSXText,
  Node as BaseNode,
  JSXAttribute,
  JSXOpeningElement,
  CallExpression,
  NewExpression,
} from "@babel/types"
import type { Literal, Node, TemplateLiteral } from "estree"
import type { Rule } from "eslint"
import type { RuleOptions } from "../types"
import getIgnoredIndexRanges from "../lib/getIgnoredIndexRanges"
import replaceQuotes from "../lib/replaceQuotes"

const defaultOptions: RuleOptions = {
  "single-opening": "‘",
  "single-closing": "’",
  "double-opening": "“",
  "double-closing": "”",
  "ignored-jsx-elements": ["script", "style"],
  "ignored-jsx-attributes": ["className", "id", "key", "style"],
  "ignored-function-calls": [
    "document.querySelector",
    "document.querySelectorAll",
    "Error",
    "RegExp",
  ],
  // TODO: `ignored-object-properties` option
  // TODO: `ignored-vue-attributes` & `ignored-vue-elements` options
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce the use of curly quotes",
    },
    messages: {
      preferCurlyQuotes: "Prefer the use of curly quotes",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          "single-opening": {
            type: "string",
            description: "Single opening typographic quotation mark",
          },
          "single-closing": {
            type: "string",
            description: "Single closing typographic quotation mark",
          },
          "double-opening": {
            type: "string",
            description: "Double opening typographic quotation mark",
          },
          "double-closing": {
            type: "string",
            description: "Double closing typographic quotation mark",
          },
          "ignored-jsx-elements": {
            type: "array",
            items: { type: "string" },
            description: "JSX elements to ignore",
          },
          "ignored-jsx-attributes": {
            type: "array",
            items: { type: "string" },
            description: "JSX attributes to ignore",
          },
          "ignored-function-calls": {
            type: "array",
            items: { type: "string" },
            description: "Function calls to ignore",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: context => {
    const options: RuleOptions = {
      ...defaultOptions,
      ...(context.options[0] ?? {}),
    }

    const jsxElementsToIgnore = options["ignored-jsx-elements"]
    const jsxAttributesToIgnore = options["ignored-jsx-attributes"]
    const functionCallsToIgnore = options["ignored-function-calls"]

    let jsxElementStack: string[] = []
    let jsxAttributeStack: string[] = []
    let callStack: string[] = []

    function handleNode(
      node: AST.Node | BaseNode | Node,
      textTrimValue: number
    ) {
      // Skip text replacement if the node is inside a JSX element that should be ignored.
      if (
        jsxElementsToIgnore.length > 0 &&
        jsxElementStack.length > 0 &&
        jsxElementStack.some(attributeName =>
          jsxElementsToIgnore.includes(attributeName)
        )
      ) {
        return
      }

      // Skip text replacement if the node is inside a JSX attribute that should be ignored.
      if (
        jsxAttributesToIgnore.length > 0 &&
        jsxAttributeStack.length > 0 &&
        jsxAttributeStack.some(attributeName =>
          jsxAttributesToIgnore.includes(attributeName)
        )
      ) {
        return
      }

      // Skip text replacement if the node is inside a function call that should be ignored.
      if (
        functionCallsToIgnore.length > 0 &&
        callStack.length > 0 &&
        callStack.some(functionName =>
          functionCallsToIgnore.includes(functionName)
        )
      ) {
        return
      }

      const text = context.sourceCode.getText(node as Node)
      const ignoredIndexRanges = getIgnoredIndexRanges(node as Node) // e.g. expressions in template literals (`${expression}`)

      // Check if text includes straight quotes.
      const textWithoutIgnoredIndexRanges = text
        .split("")
        .filter((_char, index) => {
          if (ignoredIndexRanges === null) return true
          return ignoredIndexRanges.every(
            range => index < range[0] || range[1] <= index
          )
        })
        .join("")
      const textWithoutDelimiters = textWithoutIgnoredIndexRanges.substring(
        textTrimValue,
        text.length - textTrimValue
      )
      const includesStraightQuotes =
        textWithoutDelimiters.includes("'") ||
        textWithoutDelimiters.includes('"')
      if (!includesStraightQuotes) return

      if (ignoredIndexRanges === null) {
        return context.report({
          node: node as Node,
          messageId: "preferCurlyQuotes",
          // No fix provided to avoid replacing quotes in expressions.
        })
      }

      return context.report({
        node: node as Node,
        messageId: "preferCurlyQuotes",
        fix(fixer) {
          let fixedText = replaceQuotes(
            text,
            textTrimValue,
            "'",
            options["single-opening"],
            options["single-closing"],
            ignoredIndexRanges
          )
          fixedText = replaceQuotes(
            fixedText,
            textTrimValue,
            '"',
            options["double-opening"],
            options["double-closing"],
            ignoredIndexRanges
          )
          return fixer.replaceText(node as Node, fixedText)
        },
      })
    }

    //#region Visitors

    const vueVisitor = {
      VLiteral: (node: AST.VLiteral) => handleNode(node, 1),
      VText: (node: AST.VText) => handleNode(node, 0),
      // TODO: Handle VAttribute and VElement
    }

    const jsxVisitor = {
      JSXText: (node: JSXText) => handleNode(node, 0),
      JSXAttribute: (node: JSXAttribute) => {
        if (node.name.type === "JSXIdentifier") {
          jsxAttributeStack.push(node.name.name)
        } else {
          // JSXNamespacedName (e.g. xlink:href)
          jsxAttributeStack.push(
            node.name.namespace.name + ":" + node.name.name.name
          )
        }
      },
      "JSXAttribute:exit": () => {
        jsxAttributeStack.pop()
      },
      JSXOpeningElement: (node: JSXOpeningElement) => {
        if (!node.selfClosing) {
          jsxElementStack.push(
            node.name.type === "JSXIdentifier"
              ? node.name.name
              : node.name.type === "JSXMemberExpression"
              ? node.name.property.name
              : // JSXNamespacedName (e.g. xlink:href)
                node.name.namespace.name + ":" + node.name.name.name
          )
        }
      },
      JSXClosingElement: () => {
        jsxElementStack.pop()
      },
    }

    const scriptVisitor = {
      Literal: (node: Literal) => {
        if ("regex" in node && functionCallsToIgnore.includes("RegExp")) {
          return
        }
        return handleNode(node, 1)
      },
      TemplateLiteral: (node: TemplateLiteral) => {
        const parent = (node as unknown as { parent: Node }).parent
        const hasTag =
          parent.type === "TaggedTemplateExpression" && node === parent.quasi
        if (hasTag) return
        return handleNode(node, 1)
      },
      CallExpression: (node: CallExpression) => {
        if (node.callee.type === "Identifier") callStack.push(node.callee.name)
        if (node.callee.type === "MemberExpression") {
          let propertyNames = []
          let currentNode: AST.Node | BaseNode | Node = node.callee
          while (
            currentNode.type === "MemberExpression" &&
            currentNode.property.type === "Identifier"
          ) {
            propertyNames.push(currentNode.property.name)
            currentNode = currentNode.object
          }
          if (currentNode.type === "Identifier") {
            propertyNames.push(currentNode.name)
          }
          if (propertyNames.length > 0) {
            callStack.push(propertyNames.reverse().join("."))
          }
        }
      },
      "CallExpression:exit": (node: CallExpression) => {
        if (node.callee.type === "Identifier") callStack.pop()
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" // Check that the while loop above ran at least once.
        ) {
          callStack.pop()
        }
      },
      NewExpression: (node: NewExpression) => {
        if (node.callee.type === "Identifier") callStack.push(node.callee.name)
      },
      "NewExpression:exit": (node: NewExpression) => {
        if (node.callee.type === "Identifier") callStack.pop()
      },
    }

    //#endregion

    // Vue.js
    if (context.sourceCode.parserServices?.defineTemplateBodyVisitor) {
      return context.sourceCode.parserServices.defineTemplateBodyVisitor(
        // Event handlers for <template>.
        {
          ...scriptVisitor,
          ...vueVisitor,
        },
        // Event handlers for <script> or scripts.
        {
          ...scriptVisitor,
          ...jsxVisitor,
        }
      )
    }

    return {
      ...scriptVisitor,
      ...jsxVisitor,
    }
  },
}

export default rule
