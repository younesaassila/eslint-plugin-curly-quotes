import type { Node } from "estree"
import type { IgnoredIndexRange } from "../types"

/**
 * Returns an array of character index ranges to ignore (e.g. expressions in template literals).
 * Returns null if an error occurs.
 * @param node
 * @returns
 */
export default function getIgnoredIndexRanges(
  node: Node
): IgnoredIndexRange[] | null {
  let ignoredIndexRanges: IgnoredIndexRange[] = []

  // Ignore expressions in template literals.
  // Example: `Hello ${"world"}!` will ignore the range of "world".
  if (node.type === "TemplateLiteral") {
    for (const expression of node.expressions) {
      if (!expression.range || !node.range) return null // Error
      const range = [
        expression.range[0] - node.range[0],
        expression.range[1] - node.range[0],
      ] as IgnoredIndexRange
      ignoredIndexRanges.push(range)
    }
  }

  return ignoredIndexRanges
}
