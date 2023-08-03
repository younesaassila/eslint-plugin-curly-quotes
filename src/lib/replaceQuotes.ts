/**
 * Converts all straight quotes to curly quotes and apostrophes in the given text.
 * @param text The text containing straight quotes.
 * @param textTrimValue The number of characters to ignore at the start and end of the text (to ignore string delimiters, will usually be 1).
 * @param straightCharacter The straight quote character to replace (`'` or `"`).
 * @param openingCharacter The replacing opening quote character.
 * @param closingCharacter The replacing closing quote character.
 * @param ignoredIndexRanges The char index ranges to ignore.
 * @returns The text with straight quotes replaced by curly quotes and apostrophes.
 */
export default function replaceQuotes(
  text: string,
  textTrimValue: number,
  straightCharacter: "'" | '"',
  openingCharacter: string,
  closingCharacter: string,
  ignoredIndexRanges: number[][] = []
): string {
  const quoteRegex = new RegExp(straightCharacter, "g")
  const matches = [
    ...text
      .substring(textTrimValue, text.length - textTrimValue)
      .matchAll(quoteRegex),
  ]
  const indices = matches
    .map(match => (match.index as number) + textTrimValue) // https://github.com/microsoft/TypeScript/issues/36788
    .filter(index => {
      for (const range of ignoredIndexRanges) {
        if (range[0] <= index && index < range[1]) return false
      }
      return true
    })

  let textChars = text.split("")
  let openedQuotes = 0

  const setOpeningCharacter = (index: number, updateOpenedQuotes = true) => {
    textChars[index] = openingCharacter
    if (updateOpenedQuotes) openedQuotes += 1
  }
  const setClosingCharacter = (index: number, updateOpenedQuotes = true) => {
    textChars[index] = closingCharacter
    if (updateOpenedQuotes) openedQuotes -= 1
  }

  // Adapted from https://stackoverflow.com/questions/509685/ideas-for-converting-straight-quotes-to-curly-quotes
  for (const index of indices) {
    const previousChar = textChars[index - 1]
    const nextChar = textChars[index + 1]

    const isOpeningCharacter =
      ["\n", " "].includes(previousChar) && !["\n", " "].includes(nextChar)
    const isClosingCharacter =
      !["\r", "\n", " "].includes(previousChar) &&
      ["\r", "\n", " "].includes(nextChar)
    const isApostrophe =
      straightCharacter === "'" &&
      ((!["\r", "\n", " "].includes(previousChar) && index !== textTrimValue) || // Is not at beginning of text nor preceded by whitespace character
        text.length - 2 * textTrimValue === 1) // Is only character

    if (isOpeningCharacter) setOpeningCharacter(index)
    else if (isClosingCharacter) setClosingCharacter(index)
    else if (isApostrophe) setClosingCharacter(index, false)
    else {
      if (openedQuotes === 0) setOpeningCharacter(index)
      else setClosingCharacter(index)
    }
  }

  return textChars.join("")
}
