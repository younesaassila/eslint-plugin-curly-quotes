import type { AST } from "vue-eslint-parser"
import type {
  Node as BaseNode,
  JSXText,
  JSXAttribute,
  JSXOpeningElement,
} from "@babel/types" // Only used for JSX types.
import type {
  Node,
  Literal,
  TemplateLiteral,
  CallExpression,
  NewExpression,
  Property,
} from "estree"
import type { Rule } from "eslint"
import type { RuleOptions } from "../types"
import getIgnoredIndexRanges from "../lib/getIgnoredIndexRanges"
import replaceQuotes from "../lib/replaceQuotes"

const defaultOptions: RuleOptions = {
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
  "ignored-object-properties": [],
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
          "ignored-elements": {
            type: "array",
            items: { type: "string" },
            description: "JSX/Vue elements to ignore",
          },
          "ignored-jsx-elements": {
            type: "array",
            items: { type: "string" },
            description: "JSX elements to ignore",
            deprecated: true,
          },
          "ignored-attributes": {
            type: "array",
            items: { type: "string" },
            description: "JSX/Vue attributes to ignore",
          },
          "ignored-jsx-attributes": {
            type: "array",
            items: { type: "string" },
            description: "JSX attributes to ignore",
            deprecated: true,
          },
          "ignored-function-calls": {
            type: "array",
            items: { type: "string" },
            description: "Function calls to ignore",
          },
          "ignored-object-properties": {
            type: "array",
            items: { type: "string" },
            description: "Object properties to ignore",
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
    // TODO: Remove this in the next major version.
    if (
      options["ignored-jsx-elements"] !== undefined &&
      options["ignored-jsx-elements"].length > 0
    ) {
      options["ignored-elements"] = options["ignored-jsx-elements"]
    }
    if (
      options["ignored-jsx-attributes"] !== undefined &&
      options["ignored-jsx-attributes"].length > 0
    ) {
      options["ignored-attributes"] = options["ignored-jsx-attributes"]
    }

    const elementsToIgnore = options["ignored-elements"]
    const attributesToIgnore = options["ignored-attributes"]
    const functionCallsToIgnore = options["ignored-function-calls"]
    const objectPropertiesToIgnore = options["ignored-object-properties"]

    let elementStack: string[] = []
    let attributeStack: string[] = []
    let callStack: string[] = []
    let objectPropertyStack: string[] = []

    function handleNode(
      node: AST.Node | BaseNode | Node,
      textTrimValue: number
    ) {
      // Skip text replacement if the node is inside a JSX/Vue element that should be ignored.
      if (
        elementsToIgnore.length > 0 &&
        elementStack.length > 0 &&
        elementStack.some(attributeName =>
          elementsToIgnore.includes(attributeName)
        )
      ) {
        return
      }

      // Skip text replacement if the node is inside a JSX/Vue attribute that should be ignored.
      if (
        attributesToIgnore.length > 0 &&
        attributeStack.length > 0 &&
        attributeStack.some(attributeName =>
          attributesToIgnore.includes(attributeName)
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

      // Skip text replacement if the node is inside an object property that should be ignored.
      if (
        objectPropertiesToIgnore.length > 0 &&
        objectPropertyStack.length > 0 &&
        objectPropertyStack.some(propertyName =>
          objectPropertiesToIgnore.includes(propertyName)
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
      VAttribute: (node: AST.VAttribute | AST.VDirective) => {
        if (node.key.type === "VIdentifier") {
          attributeStack.push(node.key.name)
        } else if (
          node.key.type === "VDirectiveKey" && // e.g. v-bind:href
          node.key.argument?.type === "VIdentifier"
        ) {
          attributeStack.push(node.key.argument.name)
        }
      },
      "VAttribute:exit": (node: AST.VAttribute | AST.VDirective) => {
        if (node.key.type === "VIdentifier") {
          attributeStack.pop()
        } else if (
          node.key.type === "VDirectiveKey" &&
          node.key.argument?.type === "VIdentifier"
        ) {
          attributeStack.pop()
        }
      },
      VElement: (node: AST.VElement) => {
        elementStack.push(node.name)
      },
      "VElement:exit": () => {
        elementStack.pop()
      },
    }

    const jsxVisitor = {
      JSXText: (node: JSXText) => handleNode(node, 0),
      JSXAttribute: (node: JSXAttribute) => {
        if (node.name.type === "JSXIdentifier") {
          attributeStack.push(node.name.name)
        } else {
          // JSXNamespacedName (e.g. xlink:href)
          attributeStack.push(
            node.name.namespace.name + ":" + node.name.name.name
          )
        }
      },
      "JSXAttribute:exit": () => {
        attributeStack.pop()
      },
      JSXOpeningElement: (node: JSXOpeningElement) => {
        if (!node.selfClosing) {
          elementStack.push(
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
        elementStack.pop()
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
        if (node.callee.type === "Identifier") {
          callStack.push(node.callee.name)
        } else if (node.callee.type === "MemberExpression") {
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
        if (node.callee.type === "Identifier") {
          callStack.pop()
        } else if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" // Check that the while loop above ran at least once.
        ) {
          callStack.pop()
        }
      },
      NewExpression: (node: NewExpression) => {
        if (node.callee.type === "Identifier") {
          callStack.push(node.callee.name)
        }
      },
      "NewExpression:exit": (node: NewExpression) => {
        if (node.callee.type === "Identifier") {
          callStack.pop()
        }
      },
      Property: (node: Property) => {
        if ("name" in node.key && node.key.name) {
          objectPropertyStack.push(node.key.name)
        } else if ("value" in node.key && node.key.value) {
          objectPropertyStack.push(node.key.value.toString())
        }
      },
      "Property:exit": (node: Property) => {
        if ("name" in node.key && node.key.name) {
          objectPropertyStack.pop()
        } else if ("value" in node.key && node.key.value) {
          objectPropertyStack.pop()
        }
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
