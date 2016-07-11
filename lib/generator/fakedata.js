/**
 * "Fake Data" text generator. Matches <code>fakedata(type)?</code> abbreviation.
 * This code is based on the current lipsum generator contain in this project:

 * <br><br>
 * Examples to test:<br>
 * <code>fakename</code> – generates random first and last name.<br>
 * <code>fakename*1</code> – generates random first name.<br>
 * <code>fakename*2</code> – generates random last name.<br>
 * <code>fakeemail</code> – generates random fake email address.<br>
 * <code>fakephone</code> – generates random uk formatted phone number.<br>
 * <code>fakephoneus</code> – generates random us formatted phone number.<br>
 * Each paragraph phrase is unique.
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var prefs = require('../assets/preferences');

	var langs = {
		en: {
			first_names: ['john', 'paul', 'ringo', 'matthew', 'mark', 'luke', 'john', 'alex', 'colette', 'peter', 'django', 'lando', 'han', 'leah', 'elizabeth', 'kara', 'mary', 'stuart', 'andrea', 'kezia', 'sarah', 'sophie', 'jackie', 'sally', 'steve', 'basil', 'lisa', 'irena', 'charlotte', 'lucy', 'emily', 'sharon', 'clara', 'claire', 'amy', 'rory', 'matt', 'marty', 'emmett', 'julius', 'marcus', 'david'],
			last_names: ['star', 'smith', 'thrace', 'ward', 'martell', 'lannister', 'adama', 'mcfly', 'edmonson', 'peters', 'parker', 'calrissian', 'solo', 'comstock', 'berry', 'ramsey', 'luquesi', 'wedgewood', 'hewitt', 'walker', 'brown', 'sparrow', 'spencer', 'fox', 'adamson', 'clarkeson', 'pinkerton', 'pilgrim', 'osbourne', 'oswald', 'benett', 'frasier', 'williams', 'mcconnell', 'pointer', 'pond', 'ceaser'],
            domains: ['strikertiger', 'alabamawhirly', 'battlestarpegasus', 'redkeep', 'chickenking', 'abbagold', 'thatsmymamma', 'smashinggoodtime', 'sharkpasta', 'randommagpiesongs'],
            domain_suffix: ['com', 'co.uk', 'au', 'org', 'net', 'co.nz', 'email']
		}
	};

	/**
	 * Returns random integer between <code>from</code> and <code>to</code> values
	 * @param {Number} from
	 * @param {Number} to
	 * @returns {Number}
	 */
	function randint(from, to) {
		return Math.round(Math.random() * (to - from) + from);
	}

	/**
	 * @param {Array} arr
	 * @param {Number} count
	 * @returns {Array}
	 */
	function sample(arr, count) {
		var len = arr.length;
		var iterations = Math.min(len, count);
		var result = [];
		while (result.length < iterations) {
			var randIx = randint(0, len - 1);
			if (!~result.indexOf(randIx)) {
				result.push(randIx);
			}
		}

		return result.map(function(ix) {
			return arr[ix];
		});
	}

	function choice(val) {
		if (typeof val === 'string')
			return val.charAt(randint(0, val.length - 1));

		return val[randint(0, val.length - 1)];
	}

	function sentence(words, end) {
		if (words.length) {
			words[0] = words[0].charAt(0).toUpperCase() + words[0].substring(1);
		}

		return words.join(' ') + (end || choice('?!...')); // more dots than question marks
	}

	/**
	 * Insert commas at randomly selected words. This function modifies values
	 * inside <code>words</code> array
	 * @param {Array} words
	 */
	function insertCommas(words) {
		var len = words.length;

		if (len < 2) {
			return;
		}

		var totalCommas = 0;
		if (len > 3 && len <= 6) {
			totalCommas = randint(0, 1);
		} else if (len > 6 && len <= 12) {
			totalCommas = randint(0, 2);
		} else {
			totalCommas = randint(1, 4);
		}

		for (var i = 0, pos, word; i < totalCommas; i++) {
			pos = randint(0, words.length - 2);
			word = words[pos];
			if (word.charAt(word.length - 1) !== ',') {
				words[pos] += ',';
			}
		}
	}

	/**
	 * Generate a paragraph of "Lorem ipsum" text
	 * @param {Number} wordCount Words count in paragraph
	 * @param {Boolean} startWithCommon Should paragraph start with common
	 * "lorem ipsum" sentence.
	 * @returns {String}
	 */
	function paragraph(lang, wordCount, startWithCommon) {
		var data = langs[lang];
		if (!data) {
			return '';
		}

		var result = [];
		var totalWords = 0;
		var words;

		wordCount = parseInt(wordCount, 10);

		if (startWithCommon && data.common) {
			words = data.common.slice(0, wordCount);
			if (words.length > 5) {
				words[4] += ',';
			}
			totalWords += words.length;
			result.push(sentence(words, '.'));
		}

		while (totalWords < wordCount) {
			words = sample(data.words, Math.min(randint(2, 30), wordCount - totalWords));
			totalWords += words.length;
			insertCommas(words);
			result.push(sentence(words));
		}

		return result.join(' ');
	}

	return {
		/**
		 * Adds new language words for Lorem Ipsum generator
		 * @param {String} lang Two-letter lang definition
		 * @param {Object} data Words for language. Maight be either a space-separated
		 * list of words (String), Array of words or object with <code>text</code> and
		 * <code>common</code> properties
		 */
		addLang: function(lang, data) {
			if (typeof data === 'string') {
				data = {
					words: data.split(' ').filter(function(item) {
						return !!item;
					})
				};
			} else if (Array.isArray(data)) {
				data = {words: data};
			}

			langs[lang] = data;
		},
		preprocessor: function(tree) {
			var re = /^(?:lorem|lipsum)([a-z]{2})?(\d*)$/i, match;
			var allowCommon = !prefs.get('lorem.omitCommonPart');

			/** @param {AbbreviationNode} node */
			tree.findAll(function(node) {
				if (node._name && (match = node._name.match(re))) {
					var wordCound = match[2] || 30;
					var lang = match[1] || prefs.get('lorem.defaultLang') || 'en';

					// force node name resolving if node should be repeated
					// or contains attributes. In this case, node should be outputed
					// as tag, otherwise as text-only node
					node._name = '';
					node.data('forceNameResolving', node.isRepeating() || node.attributeList().length);
					node.data('pasteOverwrites', true);
					node.data('paste', function(i) {
						return paragraph(lang, wordCound, !i && allowCommon);
					});
				}
			});
		}
	};
});
