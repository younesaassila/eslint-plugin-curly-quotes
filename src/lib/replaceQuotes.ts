/**
 * Converts all straight quotes to curly quotes in the given text.
 * @param text The text containing straight quotes.
 * @param textTrim The number of characters to ignore on each side of the text (used to ignore string delimiters, will usually be 1).
 * @param straightCharacter The straight quote character.
 * @param openingCharacter The replacing opening quote character.
 * @param closingCharacter The replacing closing quote character.
 * @param ignoredIndexRanges The index ranges to ignore.
 * @returns The text with straight quotes replaced by curly quotes.
 */
export default function replaceQuotes(
  text: string,
  textTrim: number,
  straightCharacter: "'" | '"',
  openingCharacter: string,
  closingCharacter: string,
  ignoredIndexRanges: number[][] = []
) {
  const quoteRegex = new RegExp(straightCharacter, "g")
  const matches = [
    ...text.substring(textTrim, text.length - textTrim).matchAll(quoteRegex),
  ]
  const indices = matches
    .map(match => match.index + textTrim)
    .filter(index => {
      for (const ignoredIndex of ignoredIndexRanges) {
        if (ignoredIndex[0] <= index && index < ignoredIndex[1]) return false
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
      ((!["\r", "\n", " "].includes(previousChar) && index !== textTrim) || // Is not at beginning of text nor preceded by whitespace character
        text.length - 2 * textTrim === 1) // Is only character

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
