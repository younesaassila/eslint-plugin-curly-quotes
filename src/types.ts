export type RuleOptions = {
  "single-opening": string
  "single-closing": string
  "double-opening": string
  "double-closing": string
  "ignored-jsx-elements": string[]
  "ignored-jsx-attributes": string[]
  "ignored-function-calls": string[]
}

export type IgnoredIndexRange = [number, number]
