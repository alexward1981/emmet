var assert = require('assert');
var editor = require('./stubs/editor');
var action = require('../lib/action/expandAbbreviation');
var prefs = require('../lib/assets/preferences');

describe('Filters', function() {
	function expand(abbr) {
		editor.replaceContent(abbr);
		editor.setCaretPos(abbr.length);
		action.expandAbbreviationAction(editor);
	}

	describe('Yandex BEM2 (bem)', function() {
		it('should work', function() {
			expand('.b_m1._m2|bem');
			assert.equal(editor.getContent(), '<div class="b b_m1 b_m2"></div>');
			
			expand('.b._mod|bem');
			assert.equal(editor.getContent(), '<div class="b b_mod"></div>');
		});
	});
	
	describe('Yandex BEM (bem)', function() {
		it('should work', function() {
			expand('.b_m|bem');
			assert.equal(editor.getContent(), '<div class="b b_m"></div>');
			
			expand('.b_m1._m2|bem');
			assert.equal(editor.getContent(), '<div class="b b_m1 b_m2"></div>');
			
			expand('.b>._m|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b b_m"></div>\n</div>');
			
			expand('.b>._m1>._m2|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b b_m1">\n\t\t<div class="b b_m2"></div>\n\t</div>\n</div>');
			
			expand('.b>.__e|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b__e"></div>\n</div>');
			
			expand('.b>.-e|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b__e"></div>\n</div>');
			
			expand('.b>.__e>.__e|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b__e">\n\t\t<div class="b__e"></div>\n\t</div>\n</div>');
			
			expand('.b>.__e1>.____e2|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b__e1">\n\t\t<div class="b__e2"></div>\n\t</div>\n</div>');
			
			expand('.b>.-e1>.-e2|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b__e1">\n\t\t<div class="b__e2"></div>\n\t</div>\n</div>');
			
			expand('.b1>.b2_m1>.__e1+.____e2_m2|bem');
			assert.equal(editor.getContent(), '<div class="b1">\n\t<div class="b2 b2_m1">\n\t\t<div class="b2__e1"></div>\n\t\t<div class="b1__e2 b1__e2_m2"></div>\n\t</div>\n</div>');
			
			expand('.b>.__e1>.__e2|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b__e1">\n\t\t<div class="b__e2"></div>\n\t</div>\n</div>');
			
			expand('.b>.__e1>.____e2|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b__e1">\n\t\t<div class="b__e2"></div>\n\t</div>\n</div>');
			
			expand('.b._mod|bem');
			assert.equal(editor.getContent(), '<div class="b b_mod"></div>');
			
			// test custom separators
			prefs._startTest();
			prefs.define('bem.shortElementPrefix', '');
			prefs.define('bem.modifierSeparator', '--');
			
			expand('.b>.-e1|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="-e1"></div>\n</div>', 'Short notation disabled');
			
			expand('.b>.--m1>.--m2|bem');
			assert.equal(editor.getContent(), '<div class="b">\n\t<div class="b b--m1">\n\t\t<div class="b b--m2"></div>\n\t</div>\n</div>', 'Custom modifier separator');
			
			prefs._stopTest();
		});
	});
	
	describe('Comment (c)', function() {
		it('should work', function() {
			expand('#a>#b.c>i|c');
			assert.equal(editor.getContent(), '<div id="a">\n\t<div id="b" class="c"><i></i></div>\n\t<!-- /#b.c -->\n</div>\n<!-- /#a -->', 'Applied `c` filter');
		});
	});
	
	describe('Escape (e)', function() {
		it('should work', function() {
			expand('a>b|e');
			assert.equal(editor.getContent(), '&lt;a href=""&gt;&lt;b&gt;&lt;/b&gt;&lt;/a&gt;', 'Applied `e` filter');
		});
	});
	
	describe('Formatting and HTML filter (html)', function() {
		it('should work', function() {
			expand('div>p|html');
			assert.equal(editor.getContent(), '<div>\n\t<p></p>\n</div>', 'Output block tags');
			
			expand('span>i|html');
			assert.equal(editor.getContent(), '<span><i></i></span>', 'Output inline elements');
			
			expand('select>option*3|html');
			assert.equal(editor.getContent(), '<select name="" id="">\n\t<option value=""></option>\n\t<option value=""></option>\n\t<option value=""></option>\n</select>', 'Special case for `select>option`');
			
			expand('div>i+p+b|html');
			assert.equal(editor.getContent(), '<div>\n\t<i></i>\n\t<p></p>\n\t<b></b>\n</div>', 'Mixin inline and block elements');
			
			expand('div>i*3|html');
			assert.equal(editor.getContent(), '<div>\n\t<i></i>\n\t<i></i>\n\t<i></i>\n</div>', 'Special case for many inline elements');
		});
	});
	
	describe('HAML (haml)', function() {
		it('should work', function() {
			expand('#header>ul.nav>li[title=test$]*2|haml');
			assert.equal(editor.getContent(), '#header \n\t%ul.nav \n\t\t%li{:title => "test1"} \n\t\t%li{:title => "test2"} ', 'Applied `haml` filter');
		});
	});
	
	describe('Single line (s)', function() {
		it('should work', function() {
			expand('div>p|s');
			assert.equal(editor.getContent(), '<div><p></p></div>', 'Applied `s` filter');
		});
	});
	
	describe('Trim list symbols (t)', function() {
		it('should work', function() {
			expand('{1. test}|t');
			assert.equal(editor.getContent(), 'test', 'Removed `1.`');
			
			expand('{ 1 test}|t');
			assert.equal(editor.getContent(), 'test', 'Removed ` 1`');
			
			expand('{ * test}|t');
			assert.equal(editor.getContent(), 'test', 'Removed `*`');
		});
	});
	
	describe('XSL (xsl)', function() {
		it('should work', function() {
			var oldSyntax = editor.getSyntax();
			var oldProfile = editor.getProfileName();
			editor.setSyntax('xsl');
			editor.setProfileName('xml');
			
			expand('vare|xsl');
			assert.equal(editor.getContent(), '<xsl:variable name="" select=""/>', 'Expanded variable template, no attribute removal');
			
			expand('vare>p|xsl');
			assert.equal(editor.getContent(), '<xsl:variable name="">\n\t<p></p>\n</xsl:variable>', 'Expanded variable template, "select" attribute removed');
			
			editor.setSyntax(oldSyntax);
			editor.setProfileName(oldProfile);
		});
	});
});