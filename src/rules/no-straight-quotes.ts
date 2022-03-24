import { AST } from "vue-eslint-parser"
import { JSXText, Node as BaseNode } from "@babel/types"
import { Literal, Node, TemplateElement } from "estree"
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
    function handleNode(
      node: AST.Node | BaseNode | Node,
      includesStringDelimiters: boolean
    ) {
      const text = context.getSourceCode().getText(node as Node)

      const textStart = includesStringDelimiters ? 1 : 0
      const textEnd = includesStringDelimiters ? text.length - 1 : text.length

      const textSubstring = text.substring(textStart, textEnd)
      if (!textSubstring.includes("'") && !textSubstring.includes('"')) return

      context.report({
        node: node as Node,
        messageId: "preferCurlyQuotes",
        fix(fixer) {
          let fixedText = replaceQuotes(
            text,
            textStart,
            textEnd,
            "'",
            context.options[0]?.["single-opening"] ?? "‘",
            context.options[0]?.["single-closing"] ?? "’"
          )
          fixedText = replaceQuotes(
            fixedText,
            textStart,
            textEnd,
            '"',
            context.options[0]?.["double-opening"] ?? "“",
            context.options[0]?.["double-closing"] ?? "”"
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
          Literal: (node: AST.ESLintLiteral) => handleNode(node, true),
          TemplateElement: (node: AST.ESLintTemplateElement) =>
            handleNode(node, true),
          VLiteral: (node: AST.VLiteral) => handleNode(node, true),
          VText: (node: AST.VText) => handleNode(node, false),
        },
        // Event handlers for <script> or scripts.
        {
          JSXText: (node: JSXText) => handleNode(node, false),
          Literal: (node: AST.ESLintLiteral) => handleNode(node, true),
          TemplateElement: (node: AST.ESLintTemplateElement) =>
            handleNode(node, true),
        }
      )
    }

    return {
      JSXText: (node: JSXText) => handleNode(node, false),
      Literal: (node: Literal) => handleNode(node, true),
      TemplateElement: (node: TemplateElement) => handleNode(node, true),
    }
  },
}

export default rule
