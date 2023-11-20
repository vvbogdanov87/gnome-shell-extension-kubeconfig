import { Inline } from './Inline.js';
import { Pattern } from './Pattern.js';
import { Utils } from './Utils.js';
import { ParseException } from './Exception/ParseException.js';
import { ParseMore } from './Exception/ParseMore.js';

export const Parser = class Parser {
  // Constructor

  // @param [Integer]  offset  The offset of YAML document (used for line numbers in error messages)

  constructor(offset = 0) {
    this.offset = offset;
    this.lines = [];
    this.currentLineNb = -1;
    this.currentLine = '';
    this.refs = {};
  }

  // Parses a YAML string to a JavaScript value.

  // @param [String]   value                   A YAML string
  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
  // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise

  // @return [Object]  A JavaScript value

  // @throw [ParseException] If the YAML is not valid

  parse(value, exceptionOnInvalidType = false, objectDecoder = null) {
    var alias, allowOverwrite, block, c, context, data, e, first, i, indent, isRef, j, k, key, l, lastKey, len, len1, len2, len3, lineCount, m, matches, mergeNode, n, name, parsed, parsedItem, parser, ref, ref1, ref2, refName, refValue, val, values;
    this.currentLineNb = -1;
    this.currentLine = '';
    this.lines = this.cleanup(value).split("\n");
    data = null;
    context = this.CONTEXT_NONE;
    allowOverwrite = false;
    while (this.moveToNextLine()) {
      if (this.isCurrentLineEmpty()) {
        continue;
      }
      // Tab?
      if ("\t" === this.currentLine[0]) {
        throw new ParseException('A YAML file cannot contain tabs as indentation.', this.getRealCurrentLineNb() + 1, this.currentLine);
      }
      isRef = mergeNode = false;
      if (values = this.PATTERN_SEQUENCE_ITEM.exec(this.currentLine)) {
        if (this.CONTEXT_MAPPING === context) {
          throw new ParseException('You cannot define a sequence item when in a mapping');
        }
        context = this.CONTEXT_SEQUENCE;
        if (data == null) {
          data = [];
        }
        if ((values.value != null) && (matches = this.PATTERN_ANCHOR_VALUE.exec(values.value))) {
          isRef = matches.ref;
          values.value = matches.value;
        }
        // Array
        if (!(values.value != null) || '' === Utils.trim(values.value, ' ') || Utils.ltrim(values.value, ' ').indexOf('#') === 0) {
          if (this.currentLineNb < this.lines.length - 1 && !this.isNextLineUnIndentedCollection()) {
            c = this.getRealCurrentLineNb() + 1;
            parser = new Parser(c);
            parser.refs = this.refs;
            data.push(parser.parse(this.getNextEmbedBlock(null, true), exceptionOnInvalidType, objectDecoder));
          } else {
            data.push(null);
          }
        } else {
          if (((ref = values.leadspaces) != null ? ref.length : void 0) && (matches = this.PATTERN_COMPACT_NOTATION.exec(values.value))) {
            // This is a compact notation element, add to next block and parse
            c = this.getRealCurrentLineNb();
            parser = new Parser(c);
            parser.refs = this.refs;
            block = values.value;
            indent = this.getCurrentLineIndentation();
            if (this.isNextLineIndented(false)) {
              block += "\n" + this.getNextEmbedBlock(indent + values.leadspaces.length + 1, true);
            }
            data.push(parser.parse(block, exceptionOnInvalidType, objectDecoder));
          } else {
            data.push(this.parseValue(values.value, exceptionOnInvalidType, objectDecoder));
          }
        }
      } else if ((values = this.PATTERN_MAPPING_ITEM.exec(this.currentLine)) && values.key.indexOf(' #') === -1) {
        if (this.CONTEXT_SEQUENCE === context) {
          throw new ParseException('You cannot define a mapping item when in a sequence');
        }
        context = this.CONTEXT_MAPPING;
        if (data == null) {
          data = {};
        }
        // Force correct settings
        Inline.configure(exceptionOnInvalidType, objectDecoder);
        try {
          key = Inline.parseScalar(values.key);
        } catch (error) {
          e = error;
          e.parsedLine = this.getRealCurrentLineNb() + 1;
          e.snippet = this.currentLine;
          throw e;
        }
        if ('<<' === key) {
          mergeNode = true;
          allowOverwrite = true;
          if (((ref1 = values.value) != null ? ref1.indexOf('*') : void 0) === 0) {
            refName = values.value.slice(1);
            if (this.refs[refName] == null) {
              throw new ParseException('Reference "' + refName + '" does not exist.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }
            refValue = this.refs[refName];
            if (typeof refValue !== 'object') {
              throw new ParseException('YAML merge keys used with a scalar value instead of an object.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }
            if (refValue instanceof Array) {
              // Merge array with object
              for (i = j = 0, len = refValue.length; j < len; i = ++j) {
                value = refValue[i];
                if (data[name = String(i)] == null) {
                  data[name] = value;
                }
              }
            } else {
              // Merge objects
              for (key in refValue) {
                value = refValue[key];
                if (data[key] == null) {
                  data[key] = value;
                }
              }
            }
          } else {
            if ((values.value != null) && values.value !== '') {
              value = values.value;
            } else {
              value = this.getNextEmbedBlock();
            }
            c = this.getRealCurrentLineNb() + 1;
            parser = new Parser(c);
            parser.refs = this.refs;
            parsed = parser.parse(value, exceptionOnInvalidType);
            if (typeof parsed !== 'object') {
              throw new ParseException('YAML merge keys used with a scalar value instead of an object.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }
            if (parsed instanceof Array) {
              // If the value associated with the merge key is a sequence, then this sequence is expected to contain mapping nodes
              // and each of these nodes is merged in turn according to its order in the sequence. Keys in mapping nodes earlier
              // in the sequence override keys specified in later mapping nodes.
              for (l = 0, len1 = parsed.length; l < len1; l++) {
                parsedItem = parsed[l];
                if (typeof parsedItem !== 'object') {
                  throw new ParseException('Merge items must be objects.', this.getRealCurrentLineNb() + 1, parsedItem);
                }
                if (parsedItem instanceof Array) {
                  // Merge array with object
                  for (i = m = 0, len2 = parsedItem.length; m < len2; i = ++m) {
                    value = parsedItem[i];
                    k = String(i);
                    if (!data.hasOwnProperty(k)) {
                      data[k] = value;
                    }
                  }
                } else {
                  // Merge objects
                  for (key in parsedItem) {
                    value = parsedItem[key];
                    if (!data.hasOwnProperty(key)) {
                      data[key] = value;
                    }
                  }
                }
              }
            } else {
              // If the value associated with the key is a single mapping node, each of its key/value pairs is inserted into the
              // current mapping, unless the key already exists in it.
              for (key in parsed) {
                value = parsed[key];
                if (!data.hasOwnProperty(key)) {
                  data[key] = value;
                }
              }
            }
          }
        } else if ((values.value != null) && (matches = this.PATTERN_ANCHOR_VALUE.exec(values.value))) {
          isRef = matches.ref;
          values.value = matches.value;
        }
        if (mergeNode) {

          // Merge keys
        } else if (!(values.value != null) || '' === Utils.trim(values.value, ' ') || Utils.ltrim(values.value, ' ').indexOf('#') === 0) {
          // Hash
          // if next line is less indented or equal, then it means that the current value is null
          if (!(this.isNextLineIndented()) && !(this.isNextLineUnIndentedCollection())) {
            // Spec: Keys MUST be unique; first one wins.
            // But overwriting is allowed when a merge node is used in current block.
            if (allowOverwrite || data[key] === void 0) {
              data[key] = null;
            }
          } else {
            c = this.getRealCurrentLineNb() + 1;
            parser = new Parser(c);
            parser.refs = this.refs;
            val = parser.parse(this.getNextEmbedBlock(), exceptionOnInvalidType, objectDecoder);
            // Spec: Keys MUST be unique; first one wins.
            // But overwriting is allowed when a merge node is used in current block.
            if (allowOverwrite || data[key] === void 0) {
              data[key] = val;
            }
          }
        } else {
          val = this.parseValue(values.value, exceptionOnInvalidType, objectDecoder);
          // Spec: Keys MUST be unique; first one wins.
          // But overwriting is allowed when a merge node is used in current block.
          if (allowOverwrite || data[key] === void 0) {
            data[key] = val;
          }
        }
      } else {
        // 1-liner optionally followed by newline
        lineCount = this.lines.length;
        if (1 === lineCount || (2 === lineCount && Utils.isEmpty(this.lines[1]))) {
          try {
            value = Inline.parse(this.lines[0], exceptionOnInvalidType, objectDecoder);
          } catch (error) {
            e = error;
            e.parsedLine = this.getRealCurrentLineNb() + 1;
            e.snippet = this.currentLine;
            throw e;
          }
          if (typeof value === 'object') {
            if (value instanceof Array) {
              first = value[0];
            } else {
              for (key in value) {
                first = value[key];
                break;
              }
            }
            if (typeof first === 'string' && first.indexOf('*') === 0) {
              data = [];
              for (n = 0, len3 = value.length; n < len3; n++) {
                alias = value[n];
                data.push(this.refs[alias.slice(1)]);
              }
              value = data;
            }
          }
          return value;
        } else if ((ref2 = Utils.ltrim(value).charAt(0)) === '[' || ref2 === '{') {
          try {
            return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
          } catch (error) {
            e = error;
            e.parsedLine = this.getRealCurrentLineNb() + 1;
            e.snippet = this.currentLine;
            throw e;
          }
        }
        throw new ParseException('Unable to parse.', this.getRealCurrentLineNb() + 1, this.currentLine);
      }
      if (isRef) {
        if (data instanceof Array) {
          this.refs[isRef] = data[data.length - 1];
        } else {
          lastKey = null;
          for (key in data) {
            lastKey = key;
          }
          this.refs[isRef] = data[lastKey];
        }
      }
    }
    if (Utils.isEmpty(data)) {
      return null;
    } else {
      return data;
    }
  }

  // Returns the current line number (takes the offset into account).

  // @return [Integer]     The current line number

  getRealCurrentLineNb() {
    return this.currentLineNb + this.offset;
  }

  // Returns the current line indentation.

  // @return [Integer]     The current line indentation

  getCurrentLineIndentation() {
    return this.currentLine.length - Utils.ltrim(this.currentLine, ' ').length;
  }

  // Returns the next embed block of YAML.

  // @param [Integer]          indentation The indent level at which the block is to be read, or null for default

  // @return [String]          A YAML string

  // @throw [ParseException]   When indentation problem are detected

  getNextEmbedBlock(indentation = null, includeUnindentedCollection = false) {
    var data, indent, isItUnindentedCollection, newIndent, removeComments, removeCommentsPattern, unindentedEmbedBlock;
    this.moveToNextLine();
    if (indentation == null) {
      newIndent = this.getCurrentLineIndentation();
      unindentedEmbedBlock = this.isStringUnIndentedCollectionItem(this.currentLine);
      if (!(this.isCurrentLineEmpty()) && 0 === newIndent && !unindentedEmbedBlock) {
        throw new ParseException('Indentation problem.', this.getRealCurrentLineNb() + 1, this.currentLine);
      }
    } else {
      newIndent = indentation;
    }
    data = [this.currentLine.slice(newIndent)];
    if (!includeUnindentedCollection) {
      isItUnindentedCollection = this.isStringUnIndentedCollectionItem(this.currentLine);
    }
    // Comments must not be removed inside a string block (ie. after a line ending with "|")
    // They must not be removed inside a sub-embedded block as well
    removeCommentsPattern = this.PATTERN_FOLDED_SCALAR_END;
    removeComments = !removeCommentsPattern.test(this.currentLine);
    while (this.moveToNextLine()) {
      indent = this.getCurrentLineIndentation();
      if (indent === newIndent) {
        removeComments = !removeCommentsPattern.test(this.currentLine);
      }
      if (removeComments && this.isCurrentLineComment()) {
        continue;
      }
      if (this.isCurrentLineBlank()) {
        data.push(this.currentLine.slice(newIndent));
        continue;
      }
      if (isItUnindentedCollection && !this.isStringUnIndentedCollectionItem(this.currentLine) && indent === newIndent) {
        this.moveToPreviousLine();
        break;
      }
      if (indent >= newIndent) {
        data.push(this.currentLine.slice(newIndent));
      } else if (Utils.ltrim(this.currentLine).charAt(0) === '#') {

        // Don't add line with comments
      } else if (0 === indent) {
        this.moveToPreviousLine();
        break;
      } else {
        throw new ParseException('Indentation problem.', this.getRealCurrentLineNb() + 1, this.currentLine);
      }
    }
    return data.join("\n");
  }

  // Moves the parser to the next line.

  // @return [Boolean]

  moveToNextLine() {
    if (this.currentLineNb >= this.lines.length - 1) {
      return false;
    }
    this.currentLine = this.lines[++this.currentLineNb];
    return true;
  }

  // Moves the parser to the previous line.

  moveToPreviousLine() {
    this.currentLine = this.lines[--this.currentLineNb];
  }

  // Parses a YAML value.

  // @param [String]   value                   A YAML value
  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types false otherwise
  // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise

  // @return [Object] A JavaScript value

  // @throw [ParseException] When reference does not exist

  parseValue(value, exceptionOnInvalidType, objectDecoder) {
    var e, foldedIndent, matches, modifiers, pos, ref, ref1, val;
    if (0 === value.indexOf('*')) {
      pos = value.indexOf('#');
      if (pos !== -1) {
        value = value.substr(1, pos - 2);
      } else {
        value = value.slice(1);
      }
      if (this.refs[value] === void 0) {
        throw new ParseException('Reference "' + value + '" does not exist.', this.currentLine);
      }
      return this.refs[value];
    }
    if (matches = this.PATTERN_FOLDED_SCALAR_ALL.exec(value)) {
      modifiers = (ref = matches.modifiers) != null ? ref : '';
      foldedIndent = Math.abs(parseInt(modifiers));
      if (isNaN(foldedIndent)) {
        foldedIndent = 0;
      }
      val = this.parseFoldedScalar(matches.separator, this.PATTERN_DECIMAL.replace(modifiers, ''), foldedIndent);
      if (matches.type != null) {
        // Force correct settings
        Inline.configure(exceptionOnInvalidType, objectDecoder);
        return Inline.parseScalar(matches.type + ' ' + val);
      } else {
        return val;
      }
    }
    // Value can be multiline compact sequence or mapping or string
    if ((ref1 = value.charAt(0)) === '[' || ref1 === '{' || ref1 === '"' || ref1 === "'") {
      while (true) {
        try {
          return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
        } catch (error) {
          e = error;
          if (e instanceof ParseMore && this.moveToNextLine()) {
            value += "\n" + Utils.trim(this.currentLine, ' ');
          } else {
            e.parsedLine = this.getRealCurrentLineNb() + 1;
            e.snippet = this.currentLine;
            throw e;
          }
        }
      }
    } else {
      if (this.isNextLineIndented()) {
        value += "\n" + this.getNextEmbedBlock();
      }
      return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
    }
  }

  // Parses a folded scalar.

  // @param [String]       separator   The separator that was used to begin this folded scalar (| or >)
  // @param [String]       indicator   The indicator that was used to begin this folded scalar (+ or -)
  // @param [Integer]      indentation The indentation that was used to begin this folded scalar

  // @return [String]      The text value

  parseFoldedScalar(separator, indicator = '', indentation = 0) {
    var isCurrentLineBlank, j, len, line, matches, newText, notEOF, pattern, ref, text;
    notEOF = this.moveToNextLine();
    if (!notEOF) {
      return '';
    }
    isCurrentLineBlank = this.isCurrentLineBlank();
    text = '';
    // Leading blank lines are consumed before determining indentation
    while (notEOF && isCurrentLineBlank) {
      // newline only if not EOF
      if (notEOF = this.moveToNextLine()) {
        text += "\n";
        isCurrentLineBlank = this.isCurrentLineBlank();
      }
    }
    // Determine indentation if not specified
    if (0 === indentation) {
      if (matches = this.PATTERN_INDENT_SPACES.exec(this.currentLine)) {
        indentation = matches[0].length;
      }
    }
    if (indentation > 0) {
      pattern = this.PATTERN_FOLDED_SCALAR_BY_INDENTATION[indentation];
      if (pattern == null) {
        pattern = new Pattern('^ {' + indentation + '}(.*)$');
        Parser.prototype.PATTERN_FOLDED_SCALAR_BY_INDENTATION[indentation] = pattern;
      }
      while (notEOF && (isCurrentLineBlank || (matches = pattern.exec(this.currentLine)))) {
        if (isCurrentLineBlank) {
          text += this.currentLine.slice(indentation);
        } else {
          text += matches[1];
        }
        // newline only if not EOF
        if (notEOF = this.moveToNextLine()) {
          text += "\n";
          isCurrentLineBlank = this.isCurrentLineBlank();
        }
      }
    } else if (notEOF) {
      text += "\n";
    }
    if (notEOF) {
      this.moveToPreviousLine();
    }
    // Remove line breaks of each lines except the empty and more indented ones
    if ('>' === separator) {
      newText = '';
      ref = text.split("\n");
      for (j = 0, len = ref.length; j < len; j++) {
        line = ref[j];
        if (line.length === 0 || line.charAt(0) === ' ') {
          newText = Utils.rtrim(newText, ' ') + line + "\n";
        } else {
          newText += line + ' ';
        }
      }
      text = newText;
    }
    if ('+' !== indicator) {
      // Remove any extra space or new line as we are adding them after
      text = Utils.rtrim(text);
    }
    // Deal with trailing newlines as indicated
    if ('' === indicator) {
      text = this.PATTERN_TRAILING_LINES.replace(text, "\n");
    } else if ('-' === indicator) {
      text = this.PATTERN_TRAILING_LINES.replace(text, '');
    }
    return text;
  }

  // Returns true if the next line is indented.

  // @return [Boolean]     Returns true if the next line is indented, false otherwise

  isNextLineIndented(ignoreComments = true) {
    var EOF, currentIndentation, ret;
    currentIndentation = this.getCurrentLineIndentation();
    EOF = !this.moveToNextLine();
    if (ignoreComments) {
      while (!EOF && this.isCurrentLineEmpty()) {
        EOF = !this.moveToNextLine();
      }
    } else {
      while (!EOF && this.isCurrentLineBlank()) {
        EOF = !this.moveToNextLine();
      }
    }
    if (EOF) {
      return false;
    }
    ret = false;
    if (this.getCurrentLineIndentation() > currentIndentation) {
      ret = true;
    }
    this.moveToPreviousLine();
    return ret;
  }

  // Returns true if the current line is blank or if it is a comment line.

  // @return [Boolean]     Returns true if the current line is empty or if it is a comment line, false otherwise

  isCurrentLineEmpty() {
    var trimmedLine;
    trimmedLine = Utils.trim(this.currentLine, ' ');
    return trimmedLine.length === 0 || trimmedLine.charAt(0) === '#';
  }

  // Returns true if the current line is blank.

  // @return [Boolean]     Returns true if the current line is blank, false otherwise

  isCurrentLineBlank() {
    return '' === Utils.trim(this.currentLine, ' ');
  }

  // Returns true if the current line is a comment line.

  // @return [Boolean]     Returns true if the current line is a comment line, false otherwise

  isCurrentLineComment() {
    var ltrimmedLine;
    // Checking explicitly the first char of the trim is faster than loops or strpos
    ltrimmedLine = Utils.ltrim(this.currentLine, ' ');
    return ltrimmedLine.charAt(0) === '#';
  }

  // Cleanups a YAML string to be parsed.

  // @param [String]   value The input YAML string

  // @return [String]  A cleaned up YAML string

  cleanup(value) {
    var count, i, indent, j, l, len, len1, line, lines, smallestIndent, trimmedValue;
    if (value.indexOf("\r") !== -1) {
      value = value.split("\r\n").join("\n").split("\r").join("\n");
    }
    // Strip YAML header
    count = 0;
    [value, count] = this.PATTERN_YAML_HEADER.replaceAll(value, '');
    this.offset += count;
    // Remove leading comments
    [trimmedValue, count] = this.PATTERN_LEADING_COMMENTS.replaceAll(value, '', 1);
    if (count === 1) {
      // Items have been removed, update the offset
      this.offset += Utils.subStrCount(value, "\n") - Utils.subStrCount(trimmedValue, "\n");
      value = trimmedValue;
    }
    // Remove start of the document marker (---)
    [trimmedValue, count] = this.PATTERN_DOCUMENT_MARKER_START.replaceAll(value, '', 1);
    if (count === 1) {
      // Items have been removed, update the offset
      this.offset += Utils.subStrCount(value, "\n") - Utils.subStrCount(trimmedValue, "\n");
      value = trimmedValue;
      // Remove end of the document marker (...)
      value = this.PATTERN_DOCUMENT_MARKER_END.replace(value, '');
    }
    // Ensure the block is not indented
    lines = value.split("\n");
    smallestIndent = -1;
    for (j = 0, len = lines.length; j < len; j++) {
      line = lines[j];
      if (Utils.trim(line, ' ').length === 0) {
        continue;
      }
      indent = line.length - Utils.ltrim(line).length;
      if (smallestIndent === -1 || indent < smallestIndent) {
        smallestIndent = indent;
      }
    }
    if (smallestIndent > 0) {
      for (i = l = 0, len1 = lines.length; l < len1; i = ++l) {
        line = lines[i];
        lines[i] = line.slice(smallestIndent);
      }
      value = lines.join("\n");
    }
    return value;
  }

  // Returns true if the next line starts unindented collection

  // @return [Boolean]     Returns true if the next line starts unindented collection, false otherwise

  isNextLineUnIndentedCollection(currentIndentation = null) {
    var notEOF, ret;
    if (currentIndentation == null) {
      currentIndentation = this.getCurrentLineIndentation();
    }
    notEOF = this.moveToNextLine();
    while (notEOF && this.isCurrentLineEmpty()) {
      notEOF = this.moveToNextLine();
    }
    if (false === notEOF) {
      return false;
    }
    ret = false;
    if (this.getCurrentLineIndentation() === currentIndentation && this.isStringUnIndentedCollectionItem(this.currentLine)) {
      ret = true;
    }
    this.moveToPreviousLine();
    return ret;
  }

  // Returns true if the string is un-indented collection item

  // @return [Boolean]     Returns true if the string is un-indented collection item, false otherwise

  isStringUnIndentedCollectionItem() {
    return this.currentLine === '-' || this.currentLine.slice(0, 2) === '- ';
  }

};

// Pre-compiled patterns

Parser.prototype.PATTERN_FOLDED_SCALAR_ALL = new Pattern('^(?:(?<type>![^\\|>]*)\\s+)?(?<separator>\\||>)(?<modifiers>\\+|\\-|\\d+|\\+\\d+|\\-\\d+|\\d+\\+|\\d+\\-)?(?<comments> +#.*)?$');

Parser.prototype.PATTERN_FOLDED_SCALAR_END = new Pattern('(?<separator>\\||>)(?<modifiers>\\+|\\-|\\d+|\\+\\d+|\\-\\d+|\\d+\\+|\\d+\\-)?(?<comments> +#.*)?$');

Parser.prototype.PATTERN_SEQUENCE_ITEM = new Pattern('^\\-((?<leadspaces>\\s+)(?<value>.+?))?\\s*$');

Parser.prototype.PATTERN_ANCHOR_VALUE = new Pattern('^&(?<ref>[^ ]+) *(?<value>.*)');

Parser.prototype.PATTERN_COMPACT_NOTATION = new Pattern('^(?<key>' + Inline.REGEX_QUOTED_STRING + '|[^ \'"\\{\\[].*?) *\\:(\\s+(?<value>.+?))?\\s*$');

Parser.prototype.PATTERN_MAPPING_ITEM = new Pattern('^(?<key>' + Inline.REGEX_QUOTED_STRING + '|[^ \'"\\[\\{].*?) *\\:(\\s+(?<value>.+?))?\\s*$');

Parser.prototype.PATTERN_DECIMAL = new Pattern('\\d+');

Parser.prototype.PATTERN_INDENT_SPACES = new Pattern('^ +');

Parser.prototype.PATTERN_TRAILING_LINES = new Pattern('(\n*)$');

Parser.prototype.PATTERN_YAML_HEADER = new Pattern('^\\%YAML[: ][\\d\\.]+.*\n', 'm');

Parser.prototype.PATTERN_LEADING_COMMENTS = new Pattern('^(\\#.*?\n)+', 'm');

Parser.prototype.PATTERN_DOCUMENT_MARKER_START = new Pattern('^\\-\\-\\-.*?\n', 'm');

Parser.prototype.PATTERN_DOCUMENT_MARKER_END = new Pattern('^\\.\\.\\.\\s*$', 'm');

Parser.prototype.PATTERN_FOLDED_SCALAR_BY_INDENTATION = {};

// Context types

Parser.prototype.CONTEXT_NONE = 0;

Parser.prototype.CONTEXT_SEQUENCE = 1;

Parser.prototype.CONTEXT_MAPPING = 2;
