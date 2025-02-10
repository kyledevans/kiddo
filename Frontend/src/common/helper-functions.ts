/** @file Helpful, stateless functions that are frequently used throughout projects. */

/**
 * Similar to the .Net String.IsNullOrWhitespace() method.  Returns true if the input is a string, contains non-whitespace characters, and is not empty.
 * @param input
 */
export function isNullOrWhitespace(input: string | null | undefined): boolean {
  return !input || !input.trim(); // Copied from: https://stackoverflow.com/a/32800728
}

/**
 * Provides TypeScript safety when validating string input.  Internally uses isNullOrWhitespace() to provide compiler/intellisense validation.
 * @param input
 */
export function isNonEmptyString(input: string | null | undefined): input is string {
  return !isNullOrWhitespace(input);  // Intentionally negate the input.
}

/**
 * Parse the string and return an integer.  If parse fails this will throw an exception.
 * @param input
 * @param errorMsg
 */
export function parseIntStrict(input: string | null | undefined, errorMsg: string): number {
  if (isNonEmptyString(input)) {
    let parsed = parseInt(input, 10);

    if (isNaN(parsed)) {
      throw new Error(errorMsg);
    } else {
      return parsed;
    }
  } else {
    throw new Error(errorMsg);
  }
}

/**
 * Iterate through an array of numbers and find the minimum.  Returns null if the array is empty.
 * @param arr
 */
export function arrayMin(arr: number[]): number | null {
  var len = arr.length, min = Infinity;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min === Infinity ? null : min;
};

/**
 * Iterate through an array of numbers and find the maximum.  Returns null if the array is empty.
 * @param arr
 */
export function arrayMax(arr: number[]): number | null {
  let len = arr.length, max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max === -Infinity ? null : max;
};

/**
 * Move an item from an array from an index to the specified index.  This modifies the input array.
 * @param arr
 * @param fromIndex
 * @param toIndex
 */
export function arrayMove(arr: any[], fromIndex: number, toIndex: number): void {
  let element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}

/**
 * Simple awaitable sleep method.  This is really only intended to be used for debug purposes.
 * @param milliseconds Number of milliseconds to sleep;
 */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Find all of the unique characters in the string.
 * @param str
 */
export function findUnique(str: string): string {
  return str.split("").filter(function (item, i, ar) { return ar.indexOf(item) === i; }).join("");
}
