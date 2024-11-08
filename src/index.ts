import { name, version } from "../package.json"
import noStraightQuotes from "./rules/no-straight-quotes"

export default {
  meta: {
    name,
    version,
  },
  rules: {
    "no-straight-quotes": noStraightQuotes,
  },
}
