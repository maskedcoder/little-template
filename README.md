# Little Template
#### Server-side static HTML template engine

Little Template lets you generate static HTML using data specified *in* your HTML. Here's an example:

```
<!-- Omitting HTML -->

{{#template navigationMenu}}

  {{#var heading}}Navigation{{/var}}

  {{#list nav}}
    {{#object}}
      {{#var href}}/index{{/var}}
      {{#var name}}Home{{/var}}
    {{/object}}

    {{#object}}
      {{#var href}}/blog{{/var}}
      {{#var name}}Blog{{/var}}
    {{/object}}
  {{/list}}

{{/template}}
```
First of all, this references a template named `navigationMenu`. Next is the data that will be used to provide a context for that template. `{{var heading}}` declares a variable named `heading`. The contents of the `{{var heading}}` tag is placed in that variable.

After this is a variable named `nav`. Note that the tag starts with `list` instead of `var`. That means that `nav` will be an array. Inside the `{{list nav}}` element are two `{{object}}`s. Each of these objects contains two variables `href` and `name`.

Translated into JSON, the data stored in the template would be:

```
{
  "heading": "Navigation",
    "nav": [
      { "href": "/index", "name": "Home" },
      { "href": "/blog", "name": "Blog" }
    ]
}
```

The actual template that the data will be supplied to could be anything: [Handlebars](http://github.com/wycats/handlebars.js/), [EJS](https://github.com/tj/ejs), [Jade](https://github.com/jadejs/jade), etc. **Little Template is concerned only with the data, not actual templating**.

## Why would I use this?

Little Template was created to separate markup and content. It's sort of like DocPad. But very different.

The basic use case is for creating reusable UI Components. Using Sass and BEM, styling for different components can be isolated in an orderly, reusable fashion. But the markup has to be edited by hand. If a component needs to change, you'll have to change the markup everywhere the component is used. To solve this, Little Template allows you to store the markup for the component in a single place, while keeping your content in the HTML.

Little Template is for generating static HTML. If your site stores content in a database (or in the file system) and uses server-side code to fill out templates, then this isn't for you.

## Usage

```Javascript
var template = require('little-template');
var fs = require('fs');
var jade = require('jade'); // Could be any template engine

var input = fs.readFileSync('index.html');
var outputHTML = template(input, function (templateName, context) {
  return jade.renderFile(templateName, context);
});
```

## API

#### template(string, function)

Render all templates embedded in the HTML `string`. Because Little Template is template engine agnostic, you must provide a `function` to handle rendering the templates, of the form `function (string templateName, object context) -> string`. Little Template will give the function the name of the template to fill out and the data to fill the template with.

## Language Reference

Little Template is based on the [mu2 parser](https://github.com/raycmorgan/Mu/blob/master/lib/mu/parser.js), so it's sort of like a subset of Mustache, with modifications.

All tags take the form `{{#tagType [optionalName]}}<!-- content -->{{/tagType}}`. There are four types of tags.

#### {{#template templateName}}

This indicates a template, specified by `templateName`. All tags enclosed in this tag are used to create a context. After all the enclosed tags are resolved, Little Template will call the supplied render function with the template name and the data gathered. The `{{#template}}` tag and everything enclosed is then replaced with the output of the render function.

Little Template allows you to embed templates in variables (in other templates). Basically, the template is rendered into text, and the result is stored in the variable, and *that* is then used to render the enclosing template.

#### {{#var variableName}}

This creates a variable with text content. The `variableName` is ignored if the variable is in a list. Otherwise, it is required.

Variables generally contain only text. If there is a template in the middle of the text inside the `{{#var}}`, Little Template will first render it into text before setting the variable.

#### {{#list variableName}}

This creates a variable with Array-like content. The `variableName` is ignored if the variable is in a list. Otherwise, it is required.

Lists may contain any other sort of variable (var, list, or object).

```
{{#list specialList}}
  {{#var}}String{{/var}}
  {{#object}}
    {{#var str}}String{{/var}}
  {{/object}}
  {{#list}}
    {{#var}}String{{/var}}
  {{/list}}
{{/list}}
```

will create the data

```
"specialList": [
  "String",
  {"str": "String"},
  ["String"]
]
```

#### {{#object variableName}}

This creates a variable with object data (`key -> value`). The `variableName` is ignored if the variable is in a list. Otherwise, it is required.

Objects hold other variables. All variables nested directly in objects must have names specified.

## License (MIT)

Copyright (c) 2015 Andrew Myers.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
