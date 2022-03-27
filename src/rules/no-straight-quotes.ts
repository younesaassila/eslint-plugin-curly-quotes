import { AST } from "vue-eslint-parser"
import { JSXText, Node as BaseNode } from "@babel/types"
import { Literal, Node, TemplateLiteral } from "estree"
import { Rule } from "eslint"
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
    function handleNode(node: AST.Node | BaseNode | Node, textTrim: number) {
      const text = context.getSourceCode().getText(node as Node)

      const textSubstring = text.substring(textTrim, text.length - textTrim)
      if (!textSubstring.includes("'") && !textSubstring.includes('"')) return

      context.report({
        node: node as Node,
        messageId: "preferCurlyQuotes",
        fix(fixer) {
          const ignoredIndexRanges = []
          // Ignore expressions in template literals.
          if (node.type === "TemplateLiteral") {
            for (const expression of node.expressions) {
              const range = [
                expression.range[0] - node.range[0],
                expression.range[1] - node.range[0],
              ]
              ignoredIndexRanges.push(range)
            }
          }

          let fixedText = replaceQuotes(
            text,
            textTrim,
            "'",
            context.options[0]?.["single-opening"] ?? "‘",
            context.options[0]?.["single-closing"] ?? "’",
            ignoredIndexRanges
          )
          fixedText = replaceQuotes(
            fixedText,
            textTrim,
            '"',
            context.options[0]?.["double-opening"] ?? "“",
            context.options[0]?.["double-closing"] ?? "”",
            ignoredIndexRanges
          )

          return fixer.replaceText(node as Node, fixedText)
        },
      })
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
          TemplateLiteral: (node: AST.ESLintTemplateLiteral) =>
            handleNode(node, 1),
        }
      )
    }

    return {
      JSXText: (node: JSXText) => handleNode(node, 0),
      Literal: (node: Literal) => handleNode(node, 1),
      TemplateLiteral: (node: TemplateLiteral) => handleNode(node, 1),
    }
  },
}

export default rule
