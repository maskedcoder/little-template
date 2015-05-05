var should = require('should');
var template = require('../index');
var mustache = require('./lib/mustache');


var templates = {
  navigationMenu: '<header>' +
                    '<div>{{{ heading }}}</div>' +
                    '<nav>' +
                      '<ul>' +
                        '{{#nav}}' +
                          '<li><a href="{{{ href }}}">{{{ name }}}</a></li>' +
                        '{{/nav}}' +
                      '</ul>' +
                    '</nav>' +
                  '</header>',
  icon: '<span class="fa fa-{{{ which }}}"></span>'
};

var mustacheRender = function (templateName, context) {
  return mustache.render(templates[templateName], context);
};



describe('Little Template', function () {
  it('should not change plain html', function () {
    var plainHtml = '<html>\n\n\t<!-- \n\t\tThis has no templates\n\r \n\t-->\n\n\t<body>\n\t\t<h1>Heading</h1>\n\t</body>\n</html>',
        blankHtml = '';

    template(plainHtml, mustacheRender).should.equal(plainHtml);
    template(blankHtml, mustacheRender).should.equal(blankHtml);
  });

  it('should render a simple template', function () {
    var smallTemplate = '{{#template icon}} {{#var which}}tree{{/var}} {{/template}}',
        expected = '<span class="fa fa-tree"></span>';

    template(smallTemplate, mustacheRender).should.equal(expected);
  });

  it('should render an embedded template', function () {
    var html = '<body>' +
              '{{#template navigationMenu}}' +
                '{{#var heading}}<h3>{{#template icon}} {{#var which}}twitter{{/var}}{{/template}} This is a heading </h3>{{/var}}' +
                '{{#list nav}}' +
                  '{{#object}}' +
                    '{{#var href}}/index{{/var}}' +
                    '{{#var name}}Home{{/var}}' +
                  '{{/object}}' +
                  '{{#object}}' +
                    '{{#var href}}/blog{{/var}}' +
                    '{{#var name}}Blog{{/var}}' +
                  '{{/object}}' +
                '{{/list}}' +
              '{{/template}}' +
            '</body>',
      expected = '<body>' +
                    '<header>' +
                      '<div><h3><span class="fa fa-twitter"></span> This is a heading </h3></div>' +
                      '<nav>' +
                        '<ul>' +
                          '<li><a href="/index">Home</a></li>' +
                          '<li><a href="/blog">Blog</a></li>' +
                        '</ul>' +
                      '</nav>' +
                    '</header>' +
                  '</body>';

    template(html, mustacheRender).should.equal(expected);
  });

  it('should fail when a variable name is missing', function () {
    var invalidTemplate1 = '{{#template icon}} {{#var}}tree{{/var}} {{/template}}',
        invalidTemplate2 = '<body>' +
                          '{{#template navigationMenu}}' +
                            '{{#var heading}}<h3>Heading</h3>{{/var}}' +
                            '{{#list}}' + // List missing a name
                              '{{#object}}' +
                                '{{#var href}}/index{{/var}}' +
                                '{{#var name}}Home{{/var}}' +
                              '{{/object}}' +
                              '{{#object}}' +
                                '{{#var href}}/blog{{/var}}' +
                                '{{#var name}}Blog{{/var}}' +
                              '{{/object}}' +
                            '{{/list}}' +
                          '{{/template}}' +
                        '</body>';

    should.throws(function () {
      template(invalidTemplate1, mustacheRender)
    });
    should.throws(function () {
      template(invalidTemplate2, mustacheRender)
    });
  });

  it('should fail when a variable name is out of place', function () {
    var invalidTemplate = '<body>' +
                          '{{#var wrong}}wrong{{/var}}' + // Variable outside a template
                          '{{#template navigationMenu}}' +
                            '{{#var heading}}<h3>Heading</h3>{{/var}}' +
                            '{{#list}}' +
                              '{{#object}}' +
                                '{{#var href}}/index{{/var}}' +
                                '{{#var name}}Home{{/var}}' +
                              '{{/object}}' +
                              '{{#object}}' +
                                '{{#var href}}/blog{{/var}}' +
                                '{{#var name}}Blog{{/var}}' +
                              '{{/object}}' +
                            '{{/list}}' +
                          '{{/template}}' +
                        '</body>';

    should.throws(function () {
      template(invalidTemplate, mustacheRender)
    });
  });

  it('should fail when a template declaration is out of place', function () {
    var invalidTemplate1 = '<body>' +
                          '{{#template navigationMenu}}' +
                            '{{#var heading}}<h3>Heading</h3>{{/var}}' +
                            '{{#list}}' +
                              // Template needs to be inside a var!
                              '{{#template icon}} {{#var which}}twitter{{/var}} {{/template}}' +
                              '{{#object}}' +
                                '{{#var href}}/index{{/var}}' +
                                '{{#var name}}Home{{/var}}' +
                              '{{/object}}' +
                              '{{#object}}' +
                                '{{#var href}}/blog{{/var}}' +
                                '{{#var name}}Blog{{/var}}' +
                              '{{/object}}' +
                            '{{/list}}' +
                          '{{/template}}' +
                        '</body>',
        invalidTemplate2 = '<body>' +
                          '{{#template navigationMenu}}' +
                            '{{#var heading}}<h3>Heading</h3>{{/var}}' +
                            '{{#list}}' +
                              '{{#object}}' +
                                // Template needs to be inside a var!
                                '{{#template icon}} {{#var which}}twitter{{/var}} {{/template}}' +
                                '{{#var href}}/index{{/var}}' +
                                '{{#var name}}Home{{/var}}' +
                              '{{/object}}' +
                              '{{#object}}' +
                                '{{#var href}}/blog{{/var}}' +
                                '{{#var name}}Blog{{/var}}' +
                              '{{/object}}' +
                            '{{/list}}' +
                          '{{/template}}' +
                        '</body>';

    should.throws(function () {
      template(invalidTemplate1, mustacheRender)
    });
    should.throws(function () {
      template(invalidTemplate2, mustacheRender)
    });
  });
});
