var parser = require('./lib/parser');
var ejs = require('ejs');

var html = '<body>\n\n{{#template navigationMenu}}\n\n  {{#var heading}}<h3>{{#template icon}} {{#var which}}twitter{{/var}}{{/template}} This is a heading </h3>{{/var}}\n\n  {{#list nav}}\n\n    {{#object}}\n      {{#var href}}/index{{/var}}\n      {{#var name}}Home{{/var}}\n    {{/object}}\n\n    {{#object}}\n      {{#var href}}/blog{{/var}}\n      {{#var name}}Blog{{/var}}\n    {{/object}}\n\n  {{/list}}\n\n{{/template}}\n\n</body>';

var navigationMenu = '\n<header>\n\n<div><%= heading %></div>\n\n<nav>\n\n  <ul><% nav.forEach(function (item) { %>\n    <a href="<%= item.href %>"><%= item.name %></a>\n<% }); %>\n  </ul>\n\n</nav>\n\n</header>';

var icon = '\n<span class="fa fa-<%= which %>"></span>\n';

var templates = {};

parseText = function (template, callback) {
  var parsed;

  try {
    parsed = parser.parse(template);
  } catch (err) {
    if (callback) return callback(err); else throw err;
  }

  if (callback) return callback(undefined, parsed); else return parsed;
};

var printObject = function (obj, prefix, comma) {
  var name;
  comma = (comma) ? "," : "";
  if (!prefix) prefix = "";
  if (Array.isArray(obj)) {
    console.log(prefix + "[");
    obj.forEach(function (item, i) {
      printObject(item, prefix + "  ", i < obj.length-1);
    });
    console.log(prefix + "]" + comma);
  } else if (typeof(obj) == "Object") {
    console.log(prefix + "{");
    for (name in obj) {
      printObject(obj[name], prefix + "  ", true);
    }
    console.log(prefix + "}" + comma);
  } else {
    console.log(prefix + '"'+obj+'"' + comma);
  }
}

var printTokens = function (token) {
  if (token[0] == 'multi') {
    token.forEach(function (tk, i) {
      if (i > 0) {
        printTokens(tk);
      }
    });
  } else if (token[0] == 'mustache') {
    console.log('Open ' + token[1] + ': ' + token[2]);
    console.log(token);
    printTokens(token[4]);
    console.log('Close '+ token[2]);
  }
};

var getData = function (token, data, ignoreSpace) {
  if (token[0] == 'multi') {
    token.forEach(function (tk, i) {
      if (i > 0) {
        getData(tk, data, ignoreSpace);
      }
    });
  } else if (token[0] == 'mustache') {
    switch (token[1]) {
      case 'var':
        var strArr = [];

        getData(token[4], strArr);
        var str = strArr.join('');

        if (data.push) data.push(str);
        else data[token[5]] = str;
        break;
      case 'list':
        var arr = [];

        getData(token[4], arr, true);

        if (data.push) data.push(arr);
        else data[token[5]] = arr;
        break;
      case 'object':
        var obj = {};

        getData(token[4], obj);

        if (data.push) data.push(obj);
        else data[token[5]] = obj;

        break;
      case 'template':
        var obj = {};

        getData(token[4], obj);

        data.push(ejs.render(templates[token[5]], obj));

//        data.push('template ('+token[5]+') data: '+JSON.stringify(obj));

        break;
      default:
        console.error('Not a var, list, object, or template: '+token[1]);
    }
  } else { // token[0] == 'static'
    if (data.push && !ignoreSpace) data.push(token[1]);
  }
};

parseText(html, function (err, compiled) {
  if (err) {
    console.error('ERROR');
    console.error(err);
  }

  templates.icon =icon;
  templates.navigationMenu = navigationMenu;

//  mu2.renderText(icon, {"which":"twitter"})
//    .on('data', function (chunk) {
//      console.log(chunk.toString());
//  });
//
//  mu2.renderText(navigationMenu, {"heading":"<h3> This is a heading </h3>","nav":[{"href":"/index","name":"Home"},{"href":"/blog","name":"Blog"}]})
//    .on('data', function (chunk) {
//      console.log(chunk.toString());
//  });

  var data = [];
  getData(compiled.tokens, data);
  console.log(data.join(''));
});
