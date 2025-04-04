export type RuleOptions = {
  "single-opening": string
  "single-closing": string
  "double-opening": string
  "double-closing": string
  "ignored-elements": string[]
  "ignored-jsx-elements"?: string[] | undefined // Deprecated
  "ignored-attributes": string[]
  "ignored-jsx-attributes"?: string[] | undefined // Deprecated
  "ignored-function-calls": string[]
  "ignored-object-properties": string[]
}

export type IgnoredIndexRange = [number, number]
