export type RuleOptions = {
  "single-opening": string
  "single-closing": string
  "double-opening": string
  "double-closing": string
  "ignored-elements": RawIgnoreOption
  "ignored-jsx-elements"?: string[] // Deprecated
  "ignored-attributes": RawIgnoreOption
  "ignored-jsx-attributes"?: string[] // Deprecated
  "ignored-function-calls": RawIgnoreOption
  "ignored-object-properties": RawIgnoreOption
}

export type IgnoredIndexRange = [number, number]
export type ParsedIgnoreOption = { regex: RegExp; cascades: boolean }[]
export type RawIgnoreOption = (
  | string
  | { text: string; caseInsensitive?: boolean; cascades?: boolean }
)[]
