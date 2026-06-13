import type { ParsedIgnoreOption, RawIgnoreOption } from "../types"
import regexpEscape from "regexp.escape"

/**
 * Parses the given ignore option into an array of regex patterns and cascade flags.
 * @param items
 * @returns
 */
export function parseIgnoreOption(items: RawIgnoreOption): ParsedIgnoreOption {
  return items.map(item => {
    const pattern = `^${(typeof item === "string" ? item : item.text)
      .split(/\*+/)
      .map(regexpEscape)
      .join(".*")}$`
    if (typeof item === "string") {
      return { regex: new RegExp(pattern), cascades: true }
    } else {
      return {
        regex: new RegExp(pattern, item.caseInsensitive ? "i" : ""),
        cascades: item.cascades ?? true,
      }
    }
  })
}

/**
 * Checks if the given value matches any of the regex patterns in the ignore option.
 * @param ignoreOption
 * @param value
 * @returns
 */
export function ignoreOptionIncludes(
  ignoreOption: ParsedIgnoreOption,
  value: string | string[]
): boolean {
  const stack = typeof value === "string" ? [value] : value
  return ignoreOption.some(parsedItem => {
    return parsedItem.cascades
      ? stack.some(stackItem => parsedItem.regex.test(stackItem))
      : parsedItem.regex.test(stack[stack.length - 1])
  })
}
