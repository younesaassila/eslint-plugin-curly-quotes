import type { AST } from "vue-eslint-parser"
import {
  type JSXText,
  type Node as BaseNode,
  type JSXAttribute,
  type JSXOpeningElement,
  type CallExpression,
  type NewExpression,
} from "@babel/types"
import type { Literal, Node, TemplateLiteral } from "estree"
import type { Rule } from "eslint"
import getIgnoredIndexRanges from "../lib/getIgnoredIndexRanges"
import replaceQuotes from "../lib/replaceQuotes"

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
    let jsxElementStack: string[] = []
    let jsxAttributeStack: string[] = []
    let callStack: string[] = []

    function handleNode(
      node: AST.Node | BaseNode | Node,
      textTrimValue: number
    ) {
      // Skip text replacement if the node is inside a JSX element that should be ignored.
      const jsxElementsToIgnore = context.options[0]?.[
        "ignored-jsx-elements"
      ] ?? ["script", "style"]
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
      const jsxAttributesToIgnore = context.options[0]?.[
        "ignored-jsx-attributes"
      ] ?? ["className"]
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
      const functionCallsToIgnore = context.options[0]?.[
        "ignored-function-calls"
      ] ?? ["Error"]
      if (
        functionCallsToIgnore.length > 0 &&
        callStack.length > 0 &&
        callStack.some(functionName =>
          functionCallsToIgnore.includes(functionName)
        )
      ) {
        return
      }

      const text = context.getSourceCode().getText(node as Node)
      const ignoredIndexRanges = getIgnoredIndexRanges(node as Node) // e.g. expressions in template literals

      // Filter out unwanted characters (e.g. expressions in template literals).
      const filteredText = text
        .split("")
        .filter((_char, index) => {
          if (ignoredIndexRanges === null) return true
          return ignoredIndexRanges.every(
            range => index < range[0] || range[1] <= index
          )
        })
        .join("")

      // Trim text to ignore string delimiters.
      const trimmedText = filteredText.substring(
        textTrimValue,
        text.length - textTrimValue
      )

      const includesStraightQuotes =
        trimmedText.includes("'") || trimmedText.includes('"')

      if (!includesStraightQuotes) return

      if (ignoredIndexRanges === null) {
        // Not providing a fixer to avoid replacing quotes in expressions.
        context.report({
          node: node as Node,
          messageId: "preferCurlyQuotes",
        })
      } else {
        context.report({
          node: node as Node,
          messageId: "preferCurlyQuotes",
          fix(fixer) {
            let fixedText = replaceQuotes(
              text,
              textTrimValue,
              "'",
              context.options[0]?.["single-opening"] ?? "‘",
              context.options[0]?.["single-closing"] ?? "’",
              ignoredIndexRanges
            )
            fixedText = replaceQuotes(
              fixedText,
              textTrimValue,
              '"',
              context.options[0]?.["double-opening"] ?? "“",
              context.options[0]?.["double-closing"] ?? "”",
              ignoredIndexRanges
            )

            return fixer.replaceText(node as Node, fixedText)
          },
        })
      }
    }

    // Vue.js
    if (context.parserServices?.defineTemplateBodyVisitor) {
      return context.parserServices.defineTemplateBodyVisitor(
        // Event handlers for <template>.
        {
          Literal: (node: AST.ESLintLiteral) => handleNode(node, 1),
          TemplateLiteral: (node: AST.ESLintTemplateLiteral) =>
            handleNode(node, 1),
          VLiteral: (node: AST.VLiteral) => handleNode(node, 1),
          VText: (node: AST.VText) => handleNode(node, 0),
        },
        // Event handlers for <script> or scripts.
        {
          JSXText: (node: JSXText) => handleNode(node, 0),
          Literal: (node: AST.ESLintLiteral) => handleNode(node, 1),
          TemplateLiteral: (node: AST.ESLintTemplateLiteral) => {
            const parent = (node as unknown as { parent: AST.Node }).parent
            const hasTag =
              parent.type === "TaggedTemplateExpression" &&
              node === parent.quasi
            if (hasTag) return
            return handleNode(node, 1)
          },
        }
      )
    }

    return {
      JSXText: (node: JSXText) => handleNode(node, 0),
      Literal: (node: Literal) => handleNode(node, 1),
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
      CallExpression: (node: CallExpression) => {
        if (node.callee.type === "Identifier") callStack.push(node.callee.name)
      },
      "CallExpression:exit": (node: CallExpression) => {
        if (node.callee.type === "Identifier") callStack.pop()
      },
      NewExpression: (node: NewExpression) => {
        if (node.callee.type === "Identifier") callStack.push(node.callee.name)
      },
      "NewExpression:exit": (node: NewExpression) => {
        if (node.callee.type === "Identifier") callStack.pop()
      },
      TemplateLiteral: (node: TemplateLiteral) => {
        const parent = (node as unknown as { parent: Node }).parent
        const hasTag =
          parent.type === "TaggedTemplateExpression" && node === parent.quasi
        if (hasTag) return
        return handleNode(node, 1)
      },
    }
  },
}

export default rule
