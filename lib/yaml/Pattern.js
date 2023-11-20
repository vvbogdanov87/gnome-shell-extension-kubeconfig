// Pattern is a zero-conflict wrapper extending RegExp features
// in order to make YAML parsing regex more expressive.

export const Pattern = class Pattern {
  // Constructor

  // @param [String] rawRegex The raw regex string defining the pattern

  constructor(rawRegex, modifiers = '') {
    var _char, capturingBracketNumber, cleanedRegex, i, len, mapping, name, part, subChar;
    cleanedRegex = '';
    len = rawRegex.length;
    mapping = null;
    // Cleanup raw regex and compute mapping
    capturingBracketNumber = 0;
    i = 0;
    while (i < len) {
      _char = rawRegex.charAt(i);
      if (_char === '\\') {
        // Ignore next character
        cleanedRegex += rawRegex.slice(i, +(i + 1) + 1 || 9e9);
        i++;
      } else if (_char === '(') {
        // Increase bracket number, only if it is capturing
        if (i < len - 2) {
          part = rawRegex.slice(i, +(i + 2) + 1 || 9e9);
          if (part === '(?:') {
            // Non-capturing bracket
            i += 2;
            cleanedRegex += part;
          } else if (part === '(?<') {
            // Capturing bracket with possibly a name
            capturingBracketNumber++;
            i += 2;
            name = '';
            while (i + 1 < len) {
              subChar = rawRegex.charAt(i + 1);
              if (subChar === '>') {
                cleanedRegex += '(';
                i++;
                if (name.length > 0) {
                  // Associate a name with a capturing bracket number
                  if (mapping == null) {
                    mapping = {};
                  }
                  mapping[name] = capturingBracketNumber;
                }
                break;
              } else {
                name += subChar;
              }
              i++;
            }
          } else {
            cleanedRegex += _char;
            capturingBracketNumber++;
          }
        } else {
          cleanedRegex += _char;
        }
      } else {
        cleanedRegex += _char;
      }
      i++;
    }
    this.rawRegex = rawRegex;
    this.cleanedRegex = cleanedRegex;
    this.regex = new RegExp(this.cleanedRegex, 'g' + modifiers.replace('g', ''));
    this.mapping = mapping;
  }

  // Executes the pattern's regex and returns the matching values

  // @param [String] str The string to use to execute the pattern

  // @return [Array] The matching values extracted from capturing brackets or null if nothing matched

  exec(str) {
    var index, matches, name, ref;
    this.regex.lastIndex = 0;
    matches = this.regex.exec(str);
    if (matches == null) {
      return null;
    }
    if (this.mapping != null) {
      ref = this.mapping;
      for (name in ref) {
        index = ref[name];
        matches[name] = matches[index];
      }
    }
    return matches;
  }

  // Tests the pattern's regex

  // @param [String] str The string to use to test the pattern

  // @return [Boolean] true if the string matched

  test(str) {
    this.regex.lastIndex = 0;
    return this.regex.test(str);
  }

  // Replaces occurences matching with the pattern's regex with replacement

  // @param [String] str The source string to perform replacements
  // @param [String] replacement The string to use in place of each replaced occurence.

  // @return [String] The replaced string

  replace(str, replacement) {
    this.regex.lastIndex = 0;
    return str.replace(this.regex, replacement);
  }

  // Replaces occurences matching with the pattern's regex with replacement and
  // get both the replaced string and the number of replaced occurences in the string.

  // @param [String] str The source string to perform replacements
  // @param [String] replacement The string to use in place of each replaced occurence.
  // @param [Integer] limit The maximum number of occurences to replace (0 means infinite number of occurences)

  // @return [Array] A destructurable array containing the replaced string and the number of replaced occurences. For instance: ["my replaced string", 2]

  replaceAll(str, replacement, limit = 0) {
    var count;
    this.regex.lastIndex = 0;
    count = 0;
    while (this.regex.test(str) && (limit === 0 || count < limit)) {
      this.regex.lastIndex = 0;
      str = str.replace(this.regex, replacement);
      count++;
    }
    return [str, count];
  }

};

// @property [RegExp] The RegExp instance
Pattern.prototype.regex = null;

// @property [String] The raw regex string
Pattern.prototype.rawRegex = null;

// @property [String] The cleaned regex string (used to create the RegExp instance)
Pattern.prototype.cleanedRegex = null;

// @property [Object] The dictionary mapping names to capturing bracket numbers
Pattern.prototype.mapping = null;
