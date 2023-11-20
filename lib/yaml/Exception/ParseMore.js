export class ParseMore extends Error {
  constructor(message, parsedLine, snippet) {
    super(message);
    this.message = message;
    this.parsedLine = parsedLine;
    this.snippet = snippet;
  }

  toString() {
    if ((this.parsedLine != null) && (this.snippet != null)) {
      return '<ParseMore> ' + this.message + ' (line ' + this.parsedLine + ': \'' + this.snippet + '\')';
    } else {
      return '<ParseMore> ' + this.message;
    }
  }
};
