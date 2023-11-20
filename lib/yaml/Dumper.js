import { Utils } from './Utils.js';
import { Inline } from './Inline.js';

export const Dumper = class Dumper {
  // Dumps a JavaScript value to YAML.

  // @param [Object]   input                   The JavaScript value
  // @param [Integer]  inline                  The level where you switch to inline YAML
  // @param [Integer]  indent                  The level of indentation (used internally)
  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
  // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise

  // @return [String]  The YAML representation of the JavaScript value

  dump(input, inline = 0, indent = 0, exceptionOnInvalidType = false, objectEncoder = null) {
    var i, key, len, output, prefix, value, willBeInlined;
    output = '';
    if (typeof input === 'function') {
      return output;
    }
    prefix = (indent ? Utils.strRepeat(' ', indent) : '');
    if (inline <= 0 || typeof input !== 'object' || input instanceof Date || Utils.isEmpty(input)) {
      output += prefix + Inline.dump(input, exceptionOnInvalidType, objectEncoder);
    } else {
      if (input instanceof Array) {
        for (i = 0, len = input.length; i < len; i++) {
          value = input[i];
          willBeInlined = inline - 1 <= 0 || typeof value !== 'object' || Utils.isEmpty(value);
          output += prefix + '-' + (willBeInlined ? ' ' : "\n") + this.dump(value, inline - 1, (willBeInlined ? 0 : indent + this.indentation), exceptionOnInvalidType, objectEncoder) + (willBeInlined ? "\n" : '');
        }
      } else {
        for (key in input) {
          value = input[key];
          willBeInlined = inline - 1 <= 0 || typeof value !== 'object' || Utils.isEmpty(value);
          output += prefix + Inline.dump(key, exceptionOnInvalidType, objectEncoder) + ':' + (willBeInlined ? ' ' : "\n") + this.dump(value, inline - 1, (willBeInlined ? 0 : indent + this.indentation), exceptionOnInvalidType, objectEncoder) + (willBeInlined ? "\n" : '');
        }
      }
    }
    return output;
  }

};

// The amount of spaces to use for indentation of nested nodes.
Dumper.indentation = 4;
