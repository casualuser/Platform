(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Provides base protocol and behavior for rendering a stream preview.
 * Should be combined with a tool on the same element that will actually
 * manage and render the interface.
 * @class Streams preview
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} options.publisherId The publisher's user id.
 *   @required
 *   @param {String} [options.streamName] If empty, and "creatable" is true, then this can be used to add new related streams.
 *   @param {Object} [options.related] , Optional information to add a relation from the newly created stream to another one. Can include:
 *   @param {String} [options.related.publisherId] the id of whoever is publishing the related stream
 *   @param {String} [options.related.streamName] the name of the related stream
 *   @param {Mixed} [options.related.type] the type of the relation
 *   @param {Object} [options.related] A hash with properties "publisherId" and "streamName", and usually "type" and "weight". Usually set by a "Streams/related" tool.
 *   @param {Boolean|Array} [options.editable=true] Set to false to avoid showing even authorized users an interface to replace the image or text. Or set to an array naming only certain fields, which the rendering method would hopefully recognize.
 *   @param {Boolean} [options.removable=true] Set to false to avoid showing even authorized users an option to remove (or close) this stream
 *   @param {Object} [options.creatable] Optional fields you can override in case if streamName = "", 
 *     @param {String} [options.creatable.title="New Image"] Optional title for the case when streamName = "", i.e. the image composer
 *     @param {Boolean} [options.creatable.clickable=true] Whether the image composer image is clickable
 *     @param {Number} [options.creatable.addIconSize=100] The size in pixels of the square add icon
 *   @param {Object} [options.imagepicker] Any options to pass to the Q/imagepicker jquery plugin -- see its options.
 *   @uses Q imagepicker
 *   @param {Object} [options.actions] Any options to pass to the Q/actions jquery plugin -- see its options.
 *   @uses Q actions
 *   @param {Object} [options.sizes] If passed, uses this instead of Q.Streams.image.sizes for the sizes
 *   @param {Object} [options.overrideShowSize]  A hash of {icon: size} pairs to override imagepicker.showSize when the icon is a certain string. The empty string matches all icons.
 *   @param {String} [options.throbber="plugins/Q/img/throbbers/loading.gif"] The url of an image to use as an activity indicator when the image is loading
 *   @param {Number} [options.cacheBust=null] Number of milliseconds to use for combating the re-use of cached images when they are first loaded.
 *   @param {Q.Event} [options.beforeCreate] An event that occurs right before a creatable preview issue request to create a new stream
 *   @param {Q.Event} [options.onCreate] An event that occurs after a new stream is created by a creatable preview
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *   The fields passed to the template include "alt", "titleTag" and "titleClass"
 *     @param {Object} [options.templates.create]
 *       @param {String} [options.templates.create.name]
 *       @default 'Streams/preview/create'
 *       @param {Object} [options.templates.create.fields]
 *         @param {String} [options.templates.create.fields.alt]
 *         @param {String} [options.templates.create.fields.titleClass]
 *         @param {String} [options.templates.create.fields.titleTag]
 */
Q.Tool.define("Streams/preview", function _Streams_preview(options) {
	var tool = this;
	var state = tool.state;
	if (!state.publisherId) {
		throw new Q.Error("Streams/preview tool: missing options.publisherId");
	}
	var si = state.imagepicker;
	if (!si || !si.showSize) {
		throw new Q.Error("Streams/preview tool: missing options.imagepicker.showSize");
	}
	if (!si.saveSizeName) {
		si.saveSizeName = {};
		si.saveSizeName[si.showSize] = si.showSize;
		Q.each(state.sizes || Q.Streams.image.sizes, function (i, size) {
			si.saveSizeName[size] = size;
		});
	}
	tool.element.addClass('Streams_preview');
	// default functionality for composer
	if (state.streamName) {
		tool.loading();
		tool.preview();
	} else {
		tool.composer();
	}
	// actual stream previews should be rendered by the derived tool's constructor
},

{
	related: null,
	editable: true,
	creatable: {
		title: null,
		clickable: true,
		addIconSize: 50,
		streamType: null
	},
	throbber: "plugins/Q/img/throbbers/loading.gif",
	
	imagepicker: {
		showSize: "50",
		fullSize: "200x"
	},
	sizes: null,
	overrideShowSize: {},
	cacheBust: null,
	cacheBustOnUpdate: 1000,

	actions: {
		position: 'mr'
	},
	
	beforeCreate: new Q.Event(),
	onCreate: new Q.Event(),
	onRefresh: new Q.Event(),
	onLoad: new Q.Event(),
	onRemove: new Q.Event(function () {
		this.$().hide(300, function () {
			$(this).remove();
		});
	}, 'Streams/preview'),
	onError: new Q.Event(function (err) {
		var fem = Q.firstErrorMessage(err);
		var position = this.$().css('position');
		this.$().css({
			'pointer-events': 'none',
			'position': (position === 'static' ? 'relative' : position),
			'overflow': 'hidden'
		})
		.append($("<div />").css({
			'opacity': '0.8',
			'font-size': '12px',
			'background': 'red',
			'position': 'absolute',
			'top': '0px',
			'left': '0px',
			'line-height': '12px',
			'opacity': 0
		}).text(err).animate({opacity: 0.5}, 3000));
	}, 'Streams/preview'),
	
	templates: {
		create: {
			name: 'Streams/preview/create',
			fields: { alt: 'new', titleClass: '', titleTag: 'h2' }
		}
	}
},

{
	create: function (evt) {
		function _proceed(overrides) {
			if (overrides != undefined && !Q.isPlainObject(overrides)) {
				return;
			}
			var fields = Q.extend({
				publisherId: state.publisherId,
				type: state.creatable.streamType || "Streams/text/small"
			}, overrides);
			state.beforeCreate.handle.call(tool);
			tool.loading();
			Q.Streams.retainWith(tool)
			.create(fields, tool, function Streams_preview_afterCreate(err, stream, extra) {
				if (err) {
					state.onError.handle.call(tool, err);
					return err;
				}
				var r = state.related;
				state.related.weight = Q.getObject(['related', 'weight'], extra);
				state.publisherId = this.fields.publisherId;
				state.streamName = this.fields.name;
				tool.stream = this;
				tool.stream.refresh(function Streams_preview_afterCreateRefresh(r) {
					state.onCreate.handle.call(tool, tool.stream);
					tool.preview();
				}, {messages: true, unlessSocket: true});
			}, state.related);
		}
		var tool = this;
		var state = tool.state;
		if (state.creatable && state.creatable.preprocess) {
			Q.handle(state.creatable.preprocess, this, [_proceed, tool, evt]);
		} else {
			_proceed();
		}
	},
	composer: function _composer () {
		var tool = this;
		var state = tool.state;
		var f = state.template && state.template.fields;
		var fields = Q.extend({}, state.templates.create.fields, f, {
			src: Q.url('plugins/Streams/img/actions/add.png'),
			alt: state.creatable.title || "New Item",
			title: state.creatable.title || "New Item"
		});
		tool.element.addClass('Streams_preview_create');
		Q.Template.render(
			'Streams/preview/create',
			fields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				tool.element.removeClass('Streams_preview_create');
				var parts = state.imagepicker.showSize.split('x');
				var w = parts[0] || state.creatable.addIconSize;
				var h = parts[0] || state.creatable.addIconSize;
				w = h = Math.min(w, h);
				if (w && h) {
					tool.$('.Streams_preview_add').width(w).height(h);
				}
				var container = tool.$('.Streams_preview_container');
				container.css('display', 'inline-block');
				if (state.creatable.clickable) {
					var clo = (typeof state.creatable.clickable === 'object')
						? state.creatable.clickable
						: {};
					container.plugin('Q/clickable', clo);
				}
				container.on(Q.Pointer.click, tool, tool.create.bind(tool));
			},
			state.templates.create
		);
	},
	loading: function _loading() {
		var tool = this;
		var state = tool.state;
		var img = document.createElement('img');
		img.setAttribute('alt', 'loading');
		img.setAttribute('src', Q.url(state.throbber));
		img.setAttribute('class', 'Streams_preview_loading');
		tool.element.innerHTML = '';
		tool.element.appendChild(img);
	},
	preview: function _preview() {
		var tool = this;
		var state = tool.state;
		Q.Streams.retainWith(tool).get(state.publisherId, state.streamName,
		function (err) {
			// handle error messages
			if (err) {
				state.onError.handle.call(tool, err);
				var fem = Q.firstErrorMessage(err);
				return console.warn("Streams/preview: " + fem);
			}
			// trigger the refresh when it's ready
			tool.stream = this;
			state.onRefresh.handle.call(tool, this, state.onLoad.handle);
			setTimeout(function () {
				tool.actions();
			}, 0);
		});
		Q.Streams.Stream.onFieldChanged(state.publisherId, state.streamName)
		.set(function (fields, updated) {
			tool.stream = this;
			setTimeout(function () {
				for (var i=0, l=fields.length; i<l; ++i) {
					tool.stateChanged('stream.fields.'+field[i]);
				}
			});
		}, tool);
	},
	/**
	 * @method icon
	 * @param {HTMLElement} element
	 * @param {Function} onLoad 
	 * @param {Object} [options]
	 * @param {String} [options.defaultIcon='default']
	 * @param {String} [options.cacheBust=null]
	 */
	icon: function _icon (element, onLoad, options) {
		var tool = this;
		var state = tool.state;
		options = options || {};
		Q.Streams.get(state.publisherId, state.streamName, function () {
			tool.stream = this;
			// icon and imagepicker
			var oss = state.overrideShowSize;
			var fields = this.fields;
			var si = state.imagepicker;
			var sfi = options.icon || fields.icon;
			var size = si.saveSizeName[si.showSize];
			var attributes = options.attributes || fields.attributes;
			attributes = attributes && JSON.parse(attributes);
			if (attributes.sizes
			&& attributes.sizes.indexOf(state.imagepicker.showSize) < 0) {
				for (var i=0; i<attributes.sizes.length; ++i) {
					size = attributes.sizes[i];
					var parts1 = attributes.sizes[i].toString().split('x');
					var parts2 = si.showSize.toString().split('x');
					if (parts1.length === 1) parts1[1] = parts1[0];
					if (parts2.length === 2) parts2[1] = parts2[0];
					if (parseInt(parts1[0]||0) >= parseInt(parts2[0]||0)
					 && parseInt(parts1[1]||0) >= parseInt(parts2[1]||0)) {
						break;
					}
				}
			}
			var file = (oss && (oss[sfi] || oss['']))
				|| size
				|| Q.first(si.saveSizeName, {nonEmptyKey: true});
			var full = si.saveSizeName[si.fullSize] || file;
			var size = si.saveSizeName[si.showSize];
			var attributes = this.fields.attributes && JSON.parse(this.fields.attributes);
			var defaultIcon = (options.defaultIcon) || 'default';
			var icon = (sfi && sfi !== 'default') ? sfi : defaultIcon;
			element.src = Q.url(
				Q.Streams.iconUrl(icon, file), null, 
				{cacheBust: options.cacheBust && state.cacheBustOnUpdate}
			);
			element.setAttribute('data-fullsize', Q.url(
				Q.Streams.iconUrl(icon, full), null, 
				{cacheBust: options.cacheBust && state.cacheBustOnUpdate}
			));
			// check if we should add the imagepicker
			var se = state.editable;
			if (element && se && (se === true || se.indexOf('icon') >= 0)
			&& this.testWriteLevel('suggest')) {
				$(element).off('load.Streams-preview')
				.on('load.Streams-preview', function () {
					// add imagepicker
					var ipo = Q.extend({}, si, {
						preprocess: function (callback) {
							var subpath;
							var parts = tool.stream.iconUrl(40).split('/');
							var iconUrl = parts.slice(0, parts.length-1).join('/')
								.substr(Q.info.baseUrl.length+1);
							if (parts[1] === 'Users') {
								// uploading a user icon
								path = 'uploads/Users';
								subpath = state.publisherId + '/icon';
							} else { // uploading a regular stream icon
								path = 'uploads/Streams';
								subpath = state.publisherId + '/'
									+ state.streamName + '/icon';
							}
							subpath += '/'+Math.floor(Date.now()/1000);
							callback({ path: path, subpath: subpath });
						},
						onSuccess: {'Streams/preview': function (data, key) {
							tool.stream.refresh(null, {messages: true, changed: {icon: true}});
							return false;
						}}
					});
					$(this).plugin('Q/imagepicker', ipo, function () {
						Q.handle(onLoad, tool, [element]);
					});
				});
			}
		});
		Q.Streams.Stream.onFieldChanged(state.publisherId, state.streamName, 'icon')
		.set(function (fields) {
			tool.icon(element, onLoad, Q.extend({}, options, {
				attributes: fields.attributes,
				cacheBust: true,
				icon: fields.icon
			}));
		}, this);
		return this;
	},
	actions: function _actions () {
		var tool = this;
		var state = tool.state;
		// check if we should add this behavior
		if (!state.actions
		|| state.removable === false
		|| !tool.stream.testWriteLevel('close')) {
			return false;
		}
		// add some actions
		var ao = Q.extend({}, state.actions, {
			actions: {
				'delete': function () {
					tool.stream.remove(function (err) {
						if (err) return;
						tool.state.onRemove.handle.call(tool);
					});
				}
			}
		});
		tool.$().plugin('Q/actions', ao);
		return this;
	},
	remove: function _remove() {
		var tool = this;
		var state = tool.state;
		tool.stream.remove(function (err) {
			if (err) {
				alert(err);
				return;
			}
			state.onRemove.handle.call(tool);
		});
	},
	Q: {
		onLayout: new Q.Event(function () {
			var iconWidth = this.$('.Streams_preview_icon').outerWidth(true);
			this.$('.Streams_preview_title').width(
				$(this.element).innerWidth() - iconWidth
			);
		}, 'Streams/preview')
	}
}

);

Q.Template.set('Streams/preview/create',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img src="{{& src}}" alt="{{alt}}" class="Streams_preview_add">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '</div></div>'
);

})(Q, jQuery, window);