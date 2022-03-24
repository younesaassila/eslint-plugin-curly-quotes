/**
 * Converts all straight quotes to curly quotes in the given text.
 * @param text The text containing straight quotes.
 * @param textStart The starting index (used to ignore string delimiters for Literal nodes)
 * @param textEnd The ending index (exclusive)
 * @param straightCharacter The straight quote character
 * @param openingCharacter The replacing opening quote character
 * @param closingCharacter The replacing closing quote character
 * @returns The text with straight quotes replaced by curly quotes.
 */
export default function replaceQuotes(
  text: string,
  textStart: number,
  textEnd: number,
  straightCharacter: "'" | '"',
  openingCharacter: string,
  closingCharacter: string
) {
  const quoteRegex = new RegExp(straightCharacter, "g")
  const matches = [...text.substring(textStart, textEnd).matchAll(quoteRegex)]
  const indices = matches.map(match => match.index + textStart)

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
      !["\r", "\n", " "].includes(previousChar) &&
      (index !== textStart || textEnd - textStart === 1)

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
