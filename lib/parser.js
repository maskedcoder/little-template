/**
 * Copyright (C) 2012 Ray Morgan

 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var util   = require('util'),
    Buffer = require('buffer').Buffer,

    carriage = '__MU_CARRIAGE__',
    carriageRegExp = new RegExp(carriage, 'g'),
    newline = '__MU_NEWLINE__',
    newlineRegExp = new RegExp(newline, 'g');

/**
 * Parse a template
 *
 *@param {String}  template    Template to parse
 *@param {Object}  options     Parser options
 *@return {Array}
 */
exports.parse = function (template, options) {
  var parser = new Parser(template, options);
  return parser.tokenize();
}


/**
 * Parser
 *
 *@constructor
 *@param {String}  template    Template to parse
 *@param {Object}  options     Parser options
 *@private
 */
function Parser(template, options) {
  this.template = template.replace(/\r\n/g, carriage)
                          .replace(/\n/g, newline);
  this.options  = options || {};

  this.sections = [];
  this.tokens   = ['multi'];
  this.partials = [];
  this.buffer   = this.template;
  this.state    = 'static'; // 'static' or 'tag'
  this.currentLine = '';

  this.setTag(['{{', '}}']);
}

Parser.prototype = {

  /**
   * Begin parsing the template
   *
   *@return {Object}
   */
  tokenize: function () {
    while (this.buffer) {
      this.state === 'static' ? this.scanText() : this.scanTag();
    }

    if (this.sections.length) {
      throw new Error('Encountered an unclosed section.');
    }

    return {partials: this.partials, tokens: this.tokens};
  },

  /**
   * Update the token list in every active (non-closed) section with
   * text content
   *
   *@param {String}  content    Content to append to the parse tree
   */
  appendMultiContent: function (content) {
    for (var i = 0, len = this.sections.length; i < len; i++) {
      var multi = this.sections[i][1];
      multi = multi[multi.length - 1][3] += content;
    }
  },

  /**
   * Set the text to delimit tags
   *
   *@param {Array}  tags    The delimiters, in the format ['OPENING_DELIMITER', 'CLOSING_DELIMITER']
   */
  setTag: function (tags) {
    this.otag = tags[0] || '{{';
    this.ctag = tags[1] || '}}';
  },

  /**
   * Evaluate text, looking for tags
   */
  scanText: function () {
    var index = this.buffer.indexOf(this.otag);

    if (index === -1) {
      index = this.buffer.length;
    }

    var content = this.buffer.substring(0, index)
                             .replace(carriageRegExp, '\r\n')
                             .replace(newlineRegExp, '\n'),
        buffer  = new Buffer(Buffer.byteLength(content));

    if (content !== '') {
      buffer.write(content, 0, 'utf8');
      this.appendMultiContent(content);
      this.tokens.push(['static', content, buffer]);
    }

    var line = this.currentLine + content;

    this.currentLine = line.substring(line.lastIndexOf('\n') + 1, line.length);
    // console.log('line:', this.buffer.lastIndexOf(newline) + newline.length, index, '>', this.currentLine, '/end');
    this.buffer = this.buffer.substring(index + this.otag.length);
    this.state  = 'tag';
  },


  /**
   * Evaluate a tag
   */
  scanTag: function () {
    var ctag    = this.ctag,
        matcher =
      "^" +
      "\\s*" +                           // Skip any whitespace

      "(#|\\^|/|=|!|<|>|&|\\{)?" +       // Check for a tag type and capture it
      "\\s*" +                           // Skip any whitespace
      "(.+?)" +                          // Capture the text inside of the tag : non-greedy regex
      "\\s*" +                           // Skip any whitespace
      "=?\\}?" +                         // Skip balancing '}' or '=' if it exists
      e(ctag) +                          // Find the close of the tag

      "(.*)$"                            // Capture the rest of the string
      ;
    matcher = new RegExp(matcher);

    var match = this.buffer.match(matcher);

    if (!match) {
      throw new Error('Encountered an unclosed tag: "' + this.otag + this.buffer + '"');
    }

    var sigil     = match[1],
        content   = match[2].trim(),
        remainder = match[3],
        tagText   = this.otag + this.buffer.substring(0, this.buffer.length - remainder.length);


    switch (sigil) {
    case undefined:
      this.tokens.push(['mustache', 'etag', content]);
    this.appendMultiContent(tagText);
      break;

    case '>':
    case '<':
      this.tokens.push(['mustache', 'partial', content]);
      this.partials.push(content);
    this.appendMultiContent(tagText);
      break;

    case '{':
    case '&':
      this.tokens.push(['mustache', 'utag', content]);
    this.appendMultiContent(tagText);
      break;

    case '!':
      // Ignore comments
      break;

    case '=':
      util.puts("Changing tag: " + content)
      this.setTag(content.split(' '));
    this.appendMultiContent(tagText);
      break;

    case '#':
    case '^':
    this.appendMultiContent(tagText);
      var type = sigil === '#' ? 'section' : 'inverted_section',
          block = ['multi'],
          tagType = content.split(" ")[0],
          varName = content.split(" ")[1];

      this.tokens.push(['mustache', tagType, content, '', block, varName]);
      this.sections.push([tagType, this.tokens, varName]);
      this.tokens = block;
      break;

    case '/':
      var res    = this.sections.pop() || [],
          name   = res[0],
          tokens = res[1];

      this.tokens = tokens;
      if (!name) {
        throw new Error('Closing unopened ' + name);
      } else if (name !== content) {
        throw new Error("Unclosed section " + name);
      }
    this.appendMultiContent(tagText);
      break;
    }

    this.buffer = remainder;
    this.state  = 'static';
  }
}

/**
 * Escape RegExp string
 *
 *@param {String}  text    The RegExp string to escape
 */
function e(text) {
  // thank you Simon Willison
  if(!arguments.callee.sRE) {
    var specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];
    arguments.callee.sRE = new RegExp(
      '(\\' + specials.join('|\\') + ')', 'g'
    );
  }

  return text.replace(arguments.callee.sRE, '\\$1');
}
