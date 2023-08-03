import type { Node } from "estree"

type IgnoredIndexRange = [number, number]

/**
 * Returns an array of two-element arrays [start, end] representing char index ranges to ignore (e.g. expressions in template literals).
 * @param node
 * @returns
 */
export default function getIgnoredIndexRanges(node: Node): IgnoredIndexRange[] {
  let ignoredIndexRanges: IgnoredIndexRange[] = []

  // Ignore expressions in template literals.
  if (node.type === "TemplateLiteral") {
    if (!node.range) return ignoredIndexRanges
    for (const expression of node.expressions) {
      if (!expression.range) continue
      const range = [
        expression.range[0] - node.range[0],
        expression.range[1] - node.range[0],
      ] as IgnoredIndexRange
      ignoredIndexRanges.push(range)
    }
  }

  return ignoredIndexRanges
}
