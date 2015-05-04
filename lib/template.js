var parser = require('./parser');

/**
 * Render a string of HTML
 *
 *@param {String}  source              HTML string
 *@param {Object|Function}  options    Parse options, or a function to use to render templates. If options are specified, the option 'render' must be a function to handle rendering templates.
 *@return {String}
 */
module.exports = function (source, options) {
  var parsed = parser.parse(source, options),
      render = (typeof options == 'function') ? options : options.render,
      /**
       * Recursively process a parse tree
       *
       *@param {Array}  token            The parse tree or a portion of the parse tree
       *@param {Object|Array}  data      The data to append further data to
       *@param {String}  type            The type of the current element's parent node
       *@private
       */
      renderHelper = function (token, data, type) {
        var message, obj, stringArray, template;
        if (!type) type = 'text';

        if (token[0] == 'multi') {
          token.forEach(function (tk, i) {
            if (i > 0) { // First array item is the string 'multi'
              renderHelper(tk, data, type);
            }
          });
        } else if (token[0] == 'mustache') {
          switch (token[1]) {
            case 'var':
              stringArray = [];

              renderHelper(token[4], stringArray, 'text');
              obj = stringArray.join('');

              break;
            case 'list':
              obj = [];

              renderHelper(token[4], obj, 'list');

              break;
            case 'object':
              obj = {};

              renderHelper(token[4], obj, 'object');

              break;
            case 'template':
              obj = {};

              renderHelper(token[4], obj, 'template');

              // Process the template
              template = render(token[5], obj);

              if (type == 'text') {
                data.push(template);
              } else {
                message = '\'{{#'+token[2]+'}}\' is nested directly in a '+type+'. Templates may only be inside {{#var}}s or plain HTML.';
                throw new SyntaxError(message);
              }

              // Return to avoid going through the same process as variables
              return;

              break;
            default:
              message = 'Not a var, list, object, or template: '+token[1];
              throw new SyntaxError(message);
          }

          // Process variable data
          if (type == 'object' || type == 'template') {
            if (!token[5]) {
              message = 'Unnamed variable: {{#'+token[2]+'}}';
              throw new SyntaxError(message);
            }
            data[token[5]] = obj;
          } else if (type == 'list') {
            data.push(obj);
            if (token[5]) {
              message = 'Ignoring name \''+token[5]+'\' for a list item. For a variable to have a name, place it inside a template or object instead.'
              console.warn(message);
            }
          } else if (type == 'text') {
            message = '\'{{#'+token[2]+'}}\' must be inside a template, list, or object'
            throw new SyntaxError(message);
          }

        } else { // token[0] == 'static'
          if (type == 'text') data.push(token[1]);
        }
      };

  var data = [];
  renderHelper(parsed.tokens, data, 'text');
  return data.join('');
};
