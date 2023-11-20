import { Utils } from './Utils.js';
import { Pattern } from './Pattern.js';

export const Unescaper = class Unescaper {
  static unescapeSingleQuotedString(value) {
    return value.replace(/\'\'/g, '\'');
  }

  // Unescapes a double quoted string.

  // @param [String]       value A double quoted string.

  // @return [String]      The unescaped string.

  static unescapeDoubleQuotedString(value) {
    if (this._unescapeCallback == null) {
      this._unescapeCallback = (str) => {
        return this.unescapeCharacter(str);
      };
    }
    // Evaluate the string
    return this.PATTERN_ESCAPED_CHARACTER.replace(value, this._unescapeCallback);
  }

  // Unescapes a character that was found in a double-quoted string

  // @param [String]       value An escaped character

  // @return [String]      The unescaped character

  static unescapeCharacter(value) {
    var ch;
    ch = String.fromCharCode;
    switch (value.charAt(1)) {
      case '0':
        return ch(0);
      case 'a':
        return ch(7);
      case 'b':
        return ch(8);
      case 't':
        return "\t";
      case "\t":
        return "\t";
      case 'n':
        return "\n";
      case 'v':
        return ch(11);
      case 'f':
        return ch(12);
      case 'r':
        return ch(13);
      case 'e':
        return ch(27);
      case ' ':
        return ' ';
      case '"':
        return '"';
      case '/':
        return '/';
      case '\\':
        return '\\';
      case 'N':
        // U+0085 NEXT LINE
        return ch(0x0085);
      case '_':
        // U+00A0 NO-BREAK SPACE
        return ch(0x00A0);
      case 'L':
        // U+2028 LINE SEPARATOR
        return ch(0x2028);
      case 'P':
        // U+2029 PARAGRAPH SEPARATOR
        return ch(0x2029);
      case 'x':
        return Utils.utf8chr(Utils.hexDec(value.substr(2, 2)));
      case 'u':
        return Utils.utf8chr(Utils.hexDec(value.substr(2, 4)));
      case 'U':
        return Utils.utf8chr(Utils.hexDec(value.substr(2, 8)));
      default:
        return '';
    }
  }

};

// Regex fragment that matches an escaped character in
// a double quoted string.
Unescaper.PATTERN_ESCAPED_CHARACTER = new Pattern('\\\\([0abt\tnvfre "\\/\\\\N_LP]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})');
