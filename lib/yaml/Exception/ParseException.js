export class ParseException extends Error {
  constructor(message, parsedLine, snippet) {
    super(message);
    this.message = message;
    this.parsedLine = parsedLine;
    this.snippet = snippet;
  }

  toString() {
    if ((this.parsedLine != null) && (this.snippet != null)) {
      return '<ParseException> ' + this.message + ' (line ' + this.parsedLine + ': \'' + this.snippet + '\')';
    } else {
      return '<ParseException> ' + this.message;
    }
  }
};
