import regexpEscape from "regexp.escape"

export function parseIgnoreOption(items: string[]): RegExp[] {
  return items.map(
    item => new RegExp(`^${item.split(/\*+/).map(regexpEscape).join(".*")}$`)
  )
}

export function ignoreOptionIncludes(
  ignoreOption: RegExp[],
  text: string
): boolean {
  return ignoreOption.some(x => x.test(text))
}
