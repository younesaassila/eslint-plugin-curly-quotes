import { name, version } from "../package.json"
import noStraightQuotes from "./rules/no-straight-quotes"

export default {
  meta: {
    name,
    version,
    schema: [
      {
        type: "object",
        properties: {
          "single-opening": { type: "string" },
          "single-closing": { type: "string" },
          "double-opening": { type: "string" },
          "double-closing": { type: "string" },
          "ignored-jsx-elements": { type: "array", items: { type: "string" } },
          "ignored-jsx-attributes": {
            type: "array",
            items: { type: "string" },
          },
          "ignored-function-calls": {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  rules: {
    "no-straight-quotes": noStraightQuotes,
  },
}
