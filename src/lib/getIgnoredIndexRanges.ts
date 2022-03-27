import { Node } from "estree"

/**
 * Returns a list of two element arrays [start, end] representing index ranges to ignore like expressions in template literals.
 * @param node
 * @returns
 */
export default function getIgnoredIndexRanges(node: Node) {
  let ignoredIndexRanges = []

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

  return ignoredIndexRanges
}
