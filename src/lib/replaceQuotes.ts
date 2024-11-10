import type { IgnoredIndexRange } from "../types"

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
  ignoredIndexRanges: IgnoredIndexRange[] = []
): string {
  const quoteRegex = new RegExp(straightCharacter, "g")
  const matches = [
    ...text
      .substring(textTrimValue, text.length - textTrimValue)
      .matchAll(quoteRegex),
  ]
  const indices = matches
    .map(match => match.index + textTrimValue)
    .filter(index =>
      ignoredIndexRanges.every(range => index < range[0] || range[1] <= index)
    )

  let textChars = text.split("")
  let openedQuotes = 0
  let escapedQuotesIndices: number[] = []

  const setOpeningCharacter = (index: number, updateOpenedQuotes = true) => {
    textChars[index] = openingCharacter
    if (updateOpenedQuotes) openedQuotes += 1
  }
  const setClosingCharacter = (index: number, updateOpenedQuotes = true) => {
    textChars[index] = closingCharacter
    if (updateOpenedQuotes) openedQuotes -= 1
  }

  // Adapted from https://stackoverflow.com/questions/509685/ideas-for-converting-straight-quotes-to-curly-quotes
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i]
    const previousChar = index > 0 ? textChars[index - 1] : ""
    const nextChar = index < textChars.length - 1 ? textChars[index + 1] : ""

    const isOpeningCharacter =
      isWhitespaceOrEmpty(previousChar) && !isWhitespaceOrEmpty(nextChar)
    const isClosingCharacter =
      !isWhitespaceOrEmpty(previousChar) && isWhitespaceOrEmpty(nextChar)
    const isApostrophe =
      straightCharacter === "'" &&
      ((!isWhitespaceOrEmpty(previousChar) && index !== textTrimValue) || // Is not at beginning of text nor preceded by whitespace character
        text.length - 2 * textTrimValue === 1) // Is only character

    if (isOpeningCharacter) setOpeningCharacter(index)
    else if (isClosingCharacter) setClosingCharacter(index)
    else if (isApostrophe) setClosingCharacter(index, false)
    else {
      if (openedQuotes === 0) setOpeningCharacter(index)
      else setClosingCharacter(index)
    }

    const segmentStart = i > 0 ? indices[i - 1] : 0
    const segment = text.substring(segmentStart, index)
    if (isEscapedQuote(segment)) {
      escapedQuotesIndices.push(index - 1)
    }
  }

  // Remove unnecessary backslashes before replaced quotes.
  if (escapedQuotesIndices.length > 0) {
    for (let i = escapedQuotesIndices.length - 1; i >= 0; i--) {
      textChars.splice(escapedQuotesIndices[i], 1)
    }
  }

  return textChars.join("")
}

function isWhitespaceOrEmpty(character: string): boolean {
  return /^\s?$/.test(character)
}

function isEscapedQuote(segment: string): boolean {
  // A quote is escaped if it is preceded by an odd number of backslashes.
  const match = segment.match(/\\+$/)
  if (!match) return false
  return match[0].length % 2 === 1
}
