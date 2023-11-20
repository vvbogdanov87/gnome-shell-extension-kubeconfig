import { Pattern } from './Pattern.js';
import { Unescaper } from './Unescaper.js';
import { Escaper } from './Escaper.js';
import { Utils } from './Utils.js';
import { ParseException } from './Exception/ParseException.js';
import { ParseMore } from './Exception/ParseMore.js';
import { DumpException } from './Exception/DumpException.js';

var indexOf = [].indexOf;

export const Inline = class Inline {
  // Configure YAML inline.

  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
  // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise

  static configure(exceptionOnInvalidType = null, objectDecoder = null) {
    // Update settings
    this.settings.exceptionOnInvalidType = exceptionOnInvalidType;
    this.settings.objectDecoder = objectDecoder;
  }

  // Converts a YAML string to a JavaScript object.

  // @param [String]   value                   A YAML string
  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
  // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise

  // @return [Object]  A JavaScript object representing the YAML string

  // @throw [ParseException]

  static parse(value, exceptionOnInvalidType = false, objectDecoder = null) {
    var context, result;
    // Update settings from last call of Inline.parse()
    this.settings.exceptionOnInvalidType = exceptionOnInvalidType;
    this.settings.objectDecoder = objectDecoder;
    if (value == null) {
      return '';
    }
    value = Utils.trim(value);
    if (0 === value.length) {
      return '';
    }
    // Keep a context object to pass through static methods
    context = {
      exceptionOnInvalidType,
      objectDecoder,
      i: 0
    };
    switch (value.charAt(0)) {
      case '[':
        result = this.parseSequence(value, context);
        ++context.i;
        break;
      case '{':
        result = this.parseMapping(value, context);
        ++context.i;
        break;
      default:
        result = this.parseScalar(value, null, ['"', "'"], context);
    }
    // Some comments are allowed at the end
    if (this.PATTERN_TRAILING_COMMENTS.replace(value.slice(context.i), '') !== '') {
      throw new ParseException('Unexpected characters near "' + value.slice(context.i) + '".');
    }
    return result;
  }

  // Dumps a given JavaScript variable to a YAML string.

  // @param [Object]   value                   The JavaScript variable to convert
  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
  // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise

  // @return [String]  The YAML string representing the JavaScript object

  // @throw [DumpException]

  static dump(value, exceptionOnInvalidType = false, objectEncoder = null) {
    var ref, result, type;
    if (value == null) {
      return 'null';
    }
    type = typeof value;
    if (type === 'object') {
      if (value instanceof Date) {
        return value.toISOString();
      } else if (objectEncoder != null) {
        result = objectEncoder(value);
        if (typeof result === 'string' || (result != null)) {
          return result;
        }
      }
      return this.dumpObject(value);
    }
    if (type === 'boolean') {
      return (value ? 'true' : 'false');
    }
    if (Utils.isDigits(value)) {
      return (type === 'string' ? "'" + value + "'" : String(parseInt(value)));
    }
    if (Utils.isNumeric(value)) {
      return (type === 'string' ? "'" + value + "'" : String(parseFloat(value)));
    }
    if (type === 'number') {
      return (value === 2e308 ? '.Inf' : (value === -2e308 ? '-.Inf' : (isNaN(value) ? '.NaN' : value)));
    }
    if (Escaper.requiresDoubleQuoting(value)) {
      return Escaper.escapeWithDoubleQuotes(value);
    }
    if (Escaper.requiresSingleQuoting(value)) {
      return Escaper.escapeWithSingleQuotes(value);
    }
    if ('' === value) {
      return '""';
    }
    if (Utils.PATTERN_DATE.test(value)) {
      return "'" + value + "'";
    }
    if ((ref = value.toLowerCase()) === 'null' || ref === '~' || ref === 'true' || ref === 'false') {
      return "'" + value + "'";
    }
    // Default
    return value;
  }

  static dumpObject(value, exceptionOnInvalidType, objectSupport = null) {
    var j, key, len1, output, val;
    // Array
    if (value instanceof Array) {
      output = [];
      for (j = 0, len1 = value.length; j < len1; j++) {
        val = value[j];
        output.push(this.dump(val));
      }
      return '[' + output.join(', ') + ']';
    } else {
      // Mapping
      output = [];
      for (key in value) {
        val = value[key];
        output.push(this.dump(key) + ': ' + this.dump(val));
      }
      return '{' + output.join(', ') + '}';
    }
  }

  // Parses a scalar to a YAML string.

  // @param [Object]   scalar
  // @param [Array]    delimiters
  // @param [Array]    stringDelimiters
  // @param [Object]   context
  // @param [Boolean]  evaluate

  // @return [String]  A YAML string

  // @throw [ParseException] When malformed inline YAML string is parsed

  static parseScalar(scalar, delimiters = null, stringDelimiters = ['"', "'"], context = null, evaluate = true) {
    var i, joinedDelimiters, match, output, pattern, ref, ref1, strpos, tmp;
    if (context == null) {
      context = {
        exceptionOnInvalidType: this.settings.exceptionOnInvalidType,
        objectDecoder: this.settings.objectDecoder,
        i: 0
      };
    }
    ({ i } = context);
    if (ref = scalar.charAt(i), indexOf.call(stringDelimiters, ref) >= 0) {
      // Quoted scalar
      output = this.parseQuotedScalar(scalar, context);
      ({ i } = context);
      if (delimiters != null) {
        tmp = Utils.ltrim(scalar.slice(i), ' ');
        if (!(ref1 = tmp.charAt(0), indexOf.call(delimiters, ref1) >= 0)) {
          throw new ParseException('Unexpected characters (' + scalar.slice(i) + ').');
        }
      }
    } else {
      // "normal" string
      if (!delimiters) {
        output = scalar.slice(i);
        i += output.length;
        // Remove comments
        strpos = output.indexOf(' #');
        if (strpos !== -1) {
          output = Utils.rtrim(output.slice(0, strpos));
        }
      } else {
        joinedDelimiters = delimiters.join('|');
        pattern = this.PATTERN_SCALAR_BY_DELIMITERS[joinedDelimiters];
        if (pattern == null) {
          pattern = new Pattern('^(.+?)(' + joinedDelimiters + ')');
          this.PATTERN_SCALAR_BY_DELIMITERS[joinedDelimiters] = pattern;
        }
        if (match = pattern.exec(scalar.slice(i))) {
          output = match[1];
          i += output.length;
        } else {
          throw new ParseException('Malformed inline YAML string (' + scalar + ').');
        }
      }
      if (evaluate) {
        output = this.evaluateScalar(output, context);
      }
    }
    context.i = i;
    return output;
  }

  // Parses a quoted scalar to YAML.

  // @param [String]   scalar
  // @param [Object]   context

  // @return [String]  A YAML string

  // @throw [ParseMore] When malformed inline YAML string is parsed

  static parseQuotedScalar(scalar, context) {
    var i, match, output;
    ({ i } = context);
    if (!(match = this.PATTERN_QUOTED_SCALAR.exec(scalar.slice(i)))) {
      throw new ParseMore('Malformed inline YAML string (' + scalar.slice(i) + ').');
    }
    output = match[0].substr(1, match[0].length - 2);
    if ('"' === scalar.charAt(i)) {
      output = Unescaper.unescapeDoubleQuotedString(output);
    } else {
      output = Unescaper.unescapeSingleQuotedString(output);
    }
    i += match[0].length;
    context.i = i;
    return output;
  }

  // Parses a sequence to a YAML string.

  // @param [String]   sequence
  // @param [Object]   context

  // @return [String]  A YAML string

  // @throw [ParseMore] When malformed inline YAML string is parsed

  static parseSequence(sequence, context) {
    var e, i, isQuoted, len, output, ref, value;
    output = [];
    len = sequence.length;
    ({ i } = context);
    i += 1;
    // [foo, bar, ...]
    while (i < len) {
      context.i = i;
      switch (sequence.charAt(i)) {
        case '[':
          // Nested sequence
          output.push(this.parseSequence(sequence, context));
          ({ i } = context);
          break;
        case '{':
          // Nested mapping
          output.push(this.parseMapping(sequence, context));
          ({ i } = context);
          break;
        case ']':
          return output;
        case ',':
        case ' ':
        case "\n":
          break;
        default:
          // Do nothing
          isQuoted = ((ref = sequence.charAt(i)) === '"' || ref === "'");
          value = this.parseScalar(sequence, [',', ']'], ['"', "'"], context);
          ({ i } = context);
          if (!isQuoted && typeof value === 'string' && (value.indexOf(': ') !== -1 || value.indexOf(":\n") !== -1)) {
            try {
              // Embedded mapping?
              value = this.parseMapping('{' + value + '}');
            } catch (error) {
              e = error;
            }
          }
          // No, it's not
          output.push(value);
          --i;
      }
      ++i;
    }
    throw new ParseMore('Malformed inline YAML string ' + sequence);
  }

  // Parses a mapping to a YAML string.

  // @param [String]   mapping
  // @param [Object]   context

  // @return [String]  A YAML string

  // @throw [ParseMore] When malformed inline YAML string is parsed

  static parseMapping(mapping, context) {
    var done, i, key, len, output, shouldContinueWhileLoop, value;
    output = {};
    len = mapping.length;
    ({ i } = context);
    i += 1;
    // {foo: bar, bar:foo, ...}
    shouldContinueWhileLoop = false;
    while (i < len) {
      context.i = i;
      switch (mapping.charAt(i)) {
        case ' ':
        case ',':
        case "\n":
          ++i;
          context.i = i;
          shouldContinueWhileLoop = true;
          break;
        case '}':
          return output;
      }
      if (shouldContinueWhileLoop) {
        shouldContinueWhileLoop = false;
        continue;
      }
      // Key
      key = this.parseScalar(mapping, [':', ' ', "\n"], ['"', "'"], context, false);
      ({ i } = context);
      // Value
      done = false;
      while (i < len) {
        context.i = i;
        switch (mapping.charAt(i)) {
          case '[':
            // Nested sequence
            value = this.parseSequence(mapping, context);
            ({ i } = context);
            // Spec: Keys MUST be unique; first one wins.
            // Parser cannot abort this mapping earlier, since lines
            // are processed sequentially.
            if (output[key] === void 0) {
              output[key] = value;
            }
            done = true;
            break;
          case '{':
            // Nested mapping
            value = this.parseMapping(mapping, context);
            ({ i } = context);
            // Spec: Keys MUST be unique; first one wins.
            // Parser cannot abort this mapping earlier, since lines
            // are processed sequentially.
            if (output[key] === void 0) {
              output[key] = value;
            }
            done = true;
            break;
          case ':':
          case ' ':
          case "\n":
            break;
          default:
            // Do nothing
            value = this.parseScalar(mapping, [',', '}'], ['"', "'"], context);
            ({ i } = context);
            // Spec: Keys MUST be unique; first one wins.
            // Parser cannot abort this mapping earlier, since lines
            // are processed sequentially.
            if (output[key] === void 0) {
              output[key] = value;
            }
            done = true;
            --i;
        }
        ++i;
        if (done) {
          break;
        }
      }
    }
    throw new ParseMore('Malformed inline YAML string ' + mapping);
  }

  // Evaluates scalars and replaces magic values.

  // @param [String]   scalar

  // @return [String]  A YAML string

  static evaluateScalar(scalar, context) {
    var cast, date, exceptionOnInvalidType, firstChar, firstSpace, firstWord, objectDecoder, raw, scalarLower, subValue, trimmedScalar;
    scalar = Utils.trim(scalar);
    scalarLower = scalar.toLowerCase();
    switch (scalarLower) {
      case 'null':
      case '':
      case '~':
        return null;
      case 'true':
        return true;
      case 'false':
        return false;
      case '.inf':
        return 2e308;
      case '.nan':
        return 0 / 0;
      case '-.inf':
        return 2e308;
      default:
        firstChar = scalarLower.charAt(0);
        switch (firstChar) {
          case '!':
            firstSpace = scalar.indexOf(' ');
            if (firstSpace === -1) {
              firstWord = scalarLower;
            } else {
              firstWord = scalarLower.slice(0, firstSpace);
            }
            switch (firstWord) {
              case '!':
                if (firstSpace !== -1) {
                  return parseInt(this.parseScalar(scalar.slice(2)));
                }
                return null;
              case '!str':
                return Utils.ltrim(scalar.slice(4));
              case '!!str':
                return Utils.ltrim(scalar.slice(5));
              case '!!int':
                return parseInt(this.parseScalar(scalar.slice(5)));
              case '!!bool':
                return Utils.parseBoolean(this.parseScalar(scalar.slice(6)), false);
              case '!!float':
                return parseFloat(this.parseScalar(scalar.slice(7)));
              case '!!timestamp':
                return Utils.stringToDate(Utils.ltrim(scalar.slice(11)));
              default:
                if (context == null) {
                  context = {
                    exceptionOnInvalidType: this.settings.exceptionOnInvalidType,
                    objectDecoder: this.settings.objectDecoder,
                    i: 0
                  };
                }
                ({ objectDecoder, exceptionOnInvalidType } = context);
                if (objectDecoder) {
                  // If objectDecoder function is given, we can do custom decoding of custom types
                  trimmedScalar = Utils.rtrim(scalar);
                  firstSpace = trimmedScalar.indexOf(' ');
                  if (firstSpace === -1) {
                    return objectDecoder(trimmedScalar, null);
                  } else {
                    subValue = Utils.ltrim(trimmedScalar.slice(firstSpace + 1));
                    if (!(subValue.length > 0)) {
                      subValue = null;
                    }
                    return objectDecoder(trimmedScalar.slice(0, firstSpace), subValue);
                  }
                }
                if (exceptionOnInvalidType) {
                  throw new ParseException('Custom object support when parsing a YAML file has been disabled.');
                }
                return null;
            }
            break;
          case '0':
            if ('0x' === scalar.slice(0, 2)) {
              return Utils.hexDec(scalar);
            } else if (Utils.isDigits(scalar)) {
              return Utils.octDec(scalar);
            } else if (Utils.isNumeric(scalar)) {
              return parseFloat(scalar);
            } else {
              return scalar;
            }
            break;
          case '+':
            if (Utils.isDigits(scalar)) {
              raw = scalar;
              cast = parseInt(raw);
              if (raw === String(cast)) {
                return cast;
              } else {
                return raw;
              }
            } else if (Utils.isNumeric(scalar)) {
              return parseFloat(scalar);
            } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
              return parseFloat(scalar.replace(',', ''));
            }
            return scalar;
          case '-':
            if (Utils.isDigits(scalar.slice(1))) {
              if ('0' === scalar.charAt(1)) {
                return -Utils.octDec(scalar.slice(1));
              } else {
                raw = scalar.slice(1);
                cast = parseInt(raw);
                if (raw === String(cast)) {
                  return -cast;
                } else {
                  return -raw;
                }
              }
            } else if (Utils.isNumeric(scalar)) {
              return parseFloat(scalar);
            } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
              return parseFloat(scalar.replace(',', ''));
            }
            return scalar;
          default:
            if (date = Utils.stringToDate(scalar)) {
              return date;
            } else if (Utils.isNumeric(scalar)) {
              return parseFloat(scalar);
            } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
              return parseFloat(scalar.replace(',', ''));
            }
            return scalar;
        }
    }
  }

};

// Quoted string regular expression
Inline.REGEX_QUOTED_STRING = '(?:"(?:[^"\\\\]*(?:\\\\.[^"\\\\]*)*)"|\'(?:[^\']*(?:\'\'[^\']*)*)\')';

// Pre-compiled patterns

Inline.PATTERN_TRAILING_COMMENTS = new Pattern('^\\s*#.*$');

Inline.PATTERN_QUOTED_SCALAR = new Pattern('^' + Inline.REGEX_QUOTED_STRING);

Inline.PATTERN_THOUSAND_NUMERIC_SCALAR = new Pattern('^(-|\\+)?[0-9,]+(\\.[0-9]+)?$');

Inline.PATTERN_SCALAR_BY_DELIMITERS = {};

// Settings
Inline.settings = {};
