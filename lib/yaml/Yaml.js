import { Parser } from './Parser.js';
import { Dumper } from './Dumper.js';
import { Utils } from './Utils.js';

// Yaml offers convenience methods to load and dump YAML.
export class Yaml {
  // Parses YAML into a JavaScript object.

  // The parse method, when supplied with a YAML string,
  // will do its best to convert YAML in a file into a JavaScript object.

  //  Usage:
  //     myObject = Yaml.parse('some: yaml');
  //     console.log(myObject);

  // @param [String]   input                   A string containing YAML
  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types, false otherwise
  // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise

  // @return [Object]  The YAML converted to a JavaScript object

  // @throw [ParseException] If the YAML is not valid

  static parse(input, exceptionOnInvalidType = false, objectDecoder = null) {
    return new Parser().parse(input, exceptionOnInvalidType, objectDecoder);
  }

  // Parses YAML from file path into a JavaScript object.

  // The parseFile method, when supplied with a YAML file,
  // will do its best to convert YAML in a file into a JavaScript object.

  //  Usage:
  //     myObject = Yaml.parseFile('config.yml');
  //     console.log(myObject);

  // @param [String]   path                    A file path pointing to a valid YAML file
  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types, false otherwise
  // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise

  // @return [Object]  The YAML converted to a JavaScript object or null if the file doesn't exist.

  // @throw [ParseException] If the YAML is not valid

  static parseFile(path, callback = null, exceptionOnInvalidType = false, objectDecoder = null) {
    var input;
    if (callback != null) {
      // Async
      return Utils.getStringFromFile(path, (input) => {
        var result;
        result = null;
        if (input != null) {
          result = this.parse(input, exceptionOnInvalidType, objectDecoder);
        }
        callback(result);
      });
    } else {
      // Sync
      input = Utils.getStringFromFile(path);
      if (input != null) {
        return this.parse(input, exceptionOnInvalidType, objectDecoder);
      }
      return null;
    }
  }

  // Dumps a JavaScript object to a YAML string.

  // The dump method, when supplied with an object, will do its best
  // to convert the object into friendly YAML.

  // @param [Object]   input                   JavaScript object
  // @param [Integer]  inline                  The level where you switch to inline YAML
  // @param [Integer]  indent                  The amount of spaces to use for indentation of nested nodes.
  // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
  // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise

  // @return [String]  A YAML string representing the original JavaScript object

  static dump(input, inline = 2, indent = 4, exceptionOnInvalidType = false, objectEncoder = null) {
    var yaml;
    yaml = new Dumper();
    yaml.indentation = indent;
    return yaml.dump(input, inline, 0, exceptionOnInvalidType, objectEncoder);
  }

  // Alias of dump() method for compatibility reasons.

  static stringify(input, inline, indent, exceptionOnInvalidType, objectEncoder) {
    return this.dump(input, inline, indent, exceptionOnInvalidType, objectEncoder);
  }

  // Alias of parseFile() method for compatibility reasons.

  static load(path, callback, exceptionOnInvalidType, objectDecoder) {
    return this.parseFile(path, callback, exceptionOnInvalidType, objectDecoder);
  }

};
