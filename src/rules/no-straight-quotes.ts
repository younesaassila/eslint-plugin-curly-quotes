import type { AST } from "vue-eslint-parser"
import type { JSXText, Node as BaseNode } from "@babel/types"
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
        },
        additionalProperties: false,
      },
    ],
  },
  create: context => {
    function handleNode(
      node: AST.Node | BaseNode | Node,
      textTrimValue: number
    ) {
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
    if (context.parserServices.defineTemplateBodyVisitor) {
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
