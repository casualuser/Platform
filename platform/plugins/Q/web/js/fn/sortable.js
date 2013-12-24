(function ($, window, document, undefined) {

Q.Tool.jQuery('Q/sortable',

function (options) {

	var $this = $(this);
	var dataLifted = 'Q/sortable dragging', mx, my, gx, gy, tLift, tScroll, iScroll, lifted, pressed;
	var $scrolling = null, ost = null, osl = null;
	
	$(document).on('keydown.Q_sortable', function (e) {
		if (lifted && e.keyCode == 27) { // escape key
			complete(true);
			return false;
		}
	});
	
	options.draggable = options.draggable || '*';
	$this.on([Q.Pointer.start, '.Q_sortable'], options.draggable, liftHandler);
	
	$('*', $this).css('-webkit-touch-callout', 'none');
	$this.on('dragstart.Q_sortable', options.draggable, function () {
		var state = $this.state('Q/sortable');
		if (state.draggable === '*' && this.parentNode !== $this[0]) {
			return;
		}
		return false;
	});

	function liftHandler(event) {	
		if (Q.Pointer.which(event) > 1) {
			return; // only left mouse button or touches
		}
		pressed = true;
		var state = $this.state('Q/sortable');
		if (state.draggable === '*' && this.parentNode !== $this[0]) {
			return;
		}
		var $item = $(this);
		this.preventSelections();
		Q.addEventListener(document, [Q.Pointer.cancel, Q.Pointer.leave], function leaveHandler() {
			Q.removeEventListener(document, [Q.Pointer.cancel, Q.Pointer.leave], leaveHandler);
			complete(true);
		});
		moveHandler.xStart = mx = Q.Pointer.getX(event);
		moveHandler.yStart = my = Q.Pointer.getY(event);
		var element = this;
		var sl = [], st = [];
		$(document).data(dataLifted, $(this))
			.on(Q.Pointer.move, moveHandler)
			.on(Q.Pointer.end, dropHandler);
		$item.on(Q.Pointer.move, moveHandler)
			.on(Q.Pointer.end, dropHandler)
			.parents().each(function () {
				sl.push(this.scrollLeft);
				st.push(this.scrollTop);
			});
		tLift = setTimeout(function () {
			var efp = Q.elementFromPoint(moveHandler.xStart, moveHandler.yStart), i=0, cancel = false;
			$item.parents().each(function () {
				if (this.scrollLeft !== sl[i] || this.scrollTop !== st[i]) {
					cancel = true;
					return false;
				}
				++i;
			});
			if (cancel || !pressed || !(element === efp || $.contains(element, efp))) {
				return;
			}
			lift.call(element, event);
		}, Q.info.isTouchscreen ? state.lift.delayTouchscreen : state.lift.delay);
	}
	
	function lift(event) {
		if (tLift) clearTimeout(tLift);
		
		Q.Pointer.cancelClick();
		
		if (Q.Pointer.touchCount(event) !== 1) {
			return;
		}
		
		var $item = $(this);
		this.preventSelections();
		this.cloned = this.cloneNode(true).copyComputedStyle(this);
		Q.find(this, null, function (element, options, shared, parent, i) {
			if (parent) {
				var children = parent.cloned.children || parent.cloned.childNodes;
				element.cloned = children[i].copyComputedStyle(element);
			}
		});
		var $placeholder = $(this.cloned).css({
			opacity: options.placeholderOpacity
		}).insertAfter($item); //.hide('slow');
		
		this.cloned = this.cloneNode(true).copyComputedStyle(this);
		Q.find(this, null, function (element, options, shared, parent, i) {
			if (parent) {
				var children = parent.cloned.children || parent.cloned.childNodes;
				element.cloned = children[i].copyComputedStyle(element);
			}
		});
		var state = $this.state('Q/sortable');
		
		var x = Q.Pointer.getX(event),
			y = Q.Pointer.getY(event),
			offset = $item.offset();
		
		gx = x - offset.left;
		gy = y - offset.top;
	
		var $dragged = $(this.cloned);
		$('*', $dragged).each(function () {
			$(this).css('pointerEvents', 'none');
		});
		
		$item.hide();
		$(this).data('Q/sortable', {
			$placeholder: $placeholder,
			$dragged: $dragged,
			parentNode: $placeholder[0].parentNode,
			nextSibling: $placeholder[0].nextSibling,
			position: $item.css('position'),
			left: $item.css('left'),
			top: $item.css('top'),
			zIndex: $item.css('z-index'),
		});
		$placeholder.css('pointer', 'move')
			.addClass('Q-sortable-placeholder');
		$dragged.prependTo('body')
			.css({
				opacity: options.draggedOpacity,
				position: 'absolute', 
				zIndex: $this.state('Q/sortable').zIndex,
				pointerEvents: 'none'
			}).css({ // allow a reflow to occur
				left: x - gx,
				top: y - gy
			}).addClass('Q-sortable-dragged');
		var factor = state.lift.zoom;
		if (factor != 1) {
			Q.Animation.play(function (x, y) {
				var f = factor*y+(1-y);
				$dragged.css({
					'-moz-transform': 'scale('+f+')',
					'-webkit-transform': 'scale('+f+')',
					'-o-transform': 'scale('+f+')',
					'-ms-transform': 'scale('+f+')',
					'transform': 'scale('+f+')'
				});
			}, state.lift.animate);
		}
		lifted = true;
		Q.handle(options.onLift, $this, [this, {
			event: event,
			$dragged: $dragged, 
			$placeholder: $placeholder
		}]);
	}

	function dropHandler(event, target) {
		pressed = false;
		if (!lifted) {
			return;
		}
		var x = Q.Pointer.getX(event),
		    y = Q.Pointer.getY(event),
			$target = getTarget(x, y),
			state = $this.state('Q/sortable');
		moveHandler.xStart = moveHandler.yStart = null;
		complete(!$target && state.requireDropTarget);
		return false;
	}
	
	function complete(revert) {
		if (tLift) clearTimeout(tLift);
		if (tScroll) clearTimeout(tScroll);
		if (iScroll) clearInterval(iScroll);
		var $item = $(document).data(dataLifted);
		if (!$item) return;
		
		var data = $item.data('Q/sortable');
		$(document).removeData(dataLifted)
			.off(Q.Pointer.move, moveHandler)
			.off(Q.Pointer.end, dropHandler);
		$item.off(Q.Pointer.move, moveHandler)
			.off(Q.Pointer.end, dropHandler);
		if (!data) return;
		
		var params = {
			$placeholder: data.$placeholder,
			$dragged: data.$dragged,
			$scrolling: $scrolling
		};
		
		if (revert) {
			$item.show();
			params.direction = 0;
		} else {
			if (data.$placeholder.next()[0] === $item[0]
			|| data.$placeholder.prev()[0] === $item[0]) {
				params.direction = 0;
			} else if ($item[0].isBefore(data.$placeholder[0])) {
				params.direction = 1;
			} else {
				params.direction = -1;
			}
		}
		
		lifted = false;
		if (revert && $scrolling) {
			$scrolling.scrollLeft(osl);
			$scrolling.scrollTop(ost);
		}
		$item.css({
			position: data.position, 
			zIndex: data.zIndex
		}).css({
			left: data.left,
			top: data.top
		});
		
		Q.handle(options.beforeDrop, $this, [$item, revert, params]);
		
		if (!revert) {
			$item.insertAfter(data.$placeholder).show();
		}
		data.$placeholder.hide();
		$item.removeData('Q/sortable');
		
		Q.handle(options.onDrop, $this, [$item, revert, params]);
		
		if (!revert) {
			Q.handle(options.onSuccess, $this, [$item, params]);
		}
		if (!data.$placeholder.retain) {
			data.$placeholder.remove();
		}
		if (!data.$dragged.retain) {
			data.$dragged.remove();
		}
		ost = osl = null;
		$scrolling = null;
	}
	
	function moveHandler(event) {
		var $item = $(document).data(dataLifted), x, y;
		if (!$item) {
			return;
		}
		if (Q.Pointer.touchCount(event) !== 1) {
			complete(true);
			return;
		}
		mx = x = Q.Pointer.getX(event), 
 		my = y = Q.Pointer.getY(event);
		if (!Q.info.isTouchscreen && !lifted) {
			if ((moveHandler.xStart !== undefined && Math.abs(moveHandler.xStart - x) > options.lift.threshhold)
			|| (moveHandler.yStart !== undefined && Math.abs(moveHandler.yStart - y) > options.lift.threshhold)) {
				lift.call($item[0], event);
			}
		}
		if ((moveHandler.x !== undefined && Math.abs(moveHandler.x - x) > options.scroll.threshhold)
		|| (moveHandler.y !== undefined && Math.abs(moveHandler.y - y) > options.scroll.threshhold)) {
			scrolling($item, x, y);
		}
		moveHandler.x = x;
		moveHandler.y = y;
		if (lifted) {
			move($item, x, y);
			return false;
		}
	}

	function move($item, x, y) {
		var data = $item.data('Q/sortable');
		data.$dragged.css({
			left: x - gx,
			top: y - gy
		});
		// remove text selection while dragging
		var sel = window.getSelection ? window.getSelection() : document.selection;
		if (sel) {
		    if (sel.removeAllRanges) {
		        sel.removeAllRanges();
		    } else if (sel.empty) {
		        sel.empty();
		    }
		}
		indicate($item, x, y);
	}
	
	function scrolling($item, x, y) {
		if (tScroll) clearTimeout(tScroll);
		if (!lifted) return;
		var state = $this.state('Q/sortable');
		var dx = 0, dy = 0, isWindow = false;
		var speed = state.scroll.speed;
		var beyond = false;
		$item.parents().each(function () {
			var $t = $(this);
			if ($t.css('overflow') === 'visible' && !$t.is('body')) {
				return;
			}
			if (!$t.is('body') && $t.width()) {
				if ($t.scrollLeft() > 0
				&& x < $t.offset().left + $t.width() * options.scroll.distance) {
					dx = -speed;
					beyond = (x < $t.offset().left);
				}
				if ($t.scrollLeft() + $t.innerWidth() < this.scrollWidth
				&& x > $t.offset().left + $t.width() * (1-options.scroll.distance)) {
					dx = speed;
					beyond = (x > $t.offset().left + $t.width());
				}
			}
			if (!$t.is('body') && $t.height()) {
				if ($t.scrollTop() > 0
				&& y < $t.offset().top + $t.height() * options.scroll.distance) {
					dy = -speed;
					beyond = (y < $t.offset().top);
				}
				if ($t.scrollTop() + $t.innerHeight() < this.scrollHeight
				&& y > $t.offset().top + $t.height() * (1-options.scroll.distance)) {
					dy = speed;
					beyond = (y > $t.offset().top + $t.height());
				}
			}
			var $w = $(window);
			if (x - document.body.scrollLeft < $w.innerWidth() * options.scroll.distanceWindow) {
				dx = -speed; isWindow = true;
			}
			if (x - document.body.scrollLeft > $w.innerWidth() * (1 - options.scroll.distanceWindow)) {
				dx = speed; isWindow = true;
			}
			if (y - document.body.scrollTop < $w.innerHeight() * options.scroll.distanceWindow) {
				dy = -speed; isWindow = true;
			}
			if (y - document.body.scrollTop > $w.innerHeight() * (1 - options.scroll.distanceWindow)) {
				dy = speed; isWindow = true;
			}
			if (dx || dy) {
				$scrolling = $t;
				osl = (osl === null) ? $scrolling.scrollLeft() : osl;
				ost = (ost === null) ? $scrolling.scrollTop() : ost;
				return false;
			}
		});
		if (!dx && !dy) {
			if (iScroll) clearInterval(iScroll);
			scrolling.accel = 0;
			return;
		}
		var delay = Q.info.isTouchscreen ? state.scroll.delayTouchscreen : state.scroll.delay;
		tScroll = setTimeout(function () {
			var draggable;
			if (iScroll) clearInterval(iScroll);
			iScroll = setInterval(function () {
				scrolling.accel = scrolling.accel || 0;
				scrolling.accel += state.scroll.acceleration;
				scrolling.accel = Math.min(scrolling.accel, 1);
				var $s = isWindow ? $(window) : $scrolling;
				if (dx) $s.scrollLeft($s.scrollLeft()+dx*scrolling.accel);
				if (dy) $s.scrollTop($s.scrollTop()+dy*scrolling.accel);
				move($item, x, y);
			}, 50);
		}, beyond ? 0 : delay);
	}
	
	function getDraggable(state) {
		return (state.draggable === '*') ? $this.children() : $(state.draggable, $this);
	}
	
	function getTarget(x, y) {
		var element = Q.elementFromPoint(x, y);
		var state = $this.state('Q/sortable');
		var $target = null;
		state.droppable = state.droppable || '*';
		var $jq = (state.droppable === '*')
			? $this.children(state.droppable)
			: $(state.droppable, $this);
		$jq.each(function () {
			var $t = $(this);
			if ($t.is(element) || $.contains(this, element)) {
				$target = $t;
				return false;
			}
		});
		return $target;
	}
	
	function indicate($item, x, y) {
		var $target = getTarget(x, y);
		var data = $item.data('Q/sortable')
		
		var element = Q.elementFromPoint(x, y);
		var pe = data.$dragged.css('pointer-events');
		var offset = $this.offset();
		if (x >= offset.left && x <= offset.left + $this.width()
		 && y >= offset.top && y <= offset.top + $this.height()) {
			if (pe !== 'none') {
				data.$dragged.css('pointer-events', 'none');
			}
		} else {
			if (pe !== 'auto') {
				data.$dragged.css('pointer-events', 'auto');
			}
		}
		
		var $placeholder = data.$placeholder;
		if (!$target) {
			var state = $this.state('Q/sortable');
			if (state.requireDropTarget) {
				$item.after($placeholder);
			}
			return;
		}
		if ($target.is($placeholder)) {
			return;
		}
		var direction;
		var $n = $target.next(), $p = $target.prev();
		while ($n.length && !$n.is(':visible')) {
			$n = $n.next();
		}
		while ($p.length && !$p.is(':visible')) {
			$p = $p.prev();
		}
		var tw = $target.width(),
		    th = $target.height(),
		    toff = $target.offset(),
			nh = $n.height(),
		    noff = $n.offset(),
			ph = $p.height(),
			poff = $p.offset();
		var condition = ((poff && poff.top + ph <= toff.top) || (noff && toff.top + th <= noff.top))
			? (y < toff.top + th/2)
			: (x < toff.left + tw/2);
		if (condition) {
			$target.before($placeholder);
			direction = 'before';
		} else {
			$target.after($placeholder);
			direction = 'after';
		}
		data.$prevTarget = $target;
		Q.handle(options.onIndicate, $this, [$item, {
			$target: $target,
			direction: direction,
			$placeholder: $placeholder,
			$dragged: data.$dragged,
			$scrolling: $scrolling
		}]);
	}
},

{	// default options:
	draggable: '*', // which elements can be draggable
	droppable: '*', // which elements can be moved
	zIndex: 999999,
	draggedOpacity: 0.8,
	placeholderOpacity: 0.1,
	lift: {
		delay: 300,
		delayTouchscreen: 300,
		threshhold: 10,
		zoom: 1.1,
		animate: 100
	},
	scroll: {
		delay: 300,
		delayTouchscreen: 300,
		threshhold: 0,
		distance: 0.15,
		distanceWindow: 0.1,
		speed: 30,
		acceleration: 0.1
	},
	drop: {
		duration: 300
	},
	requireDropTarget: true,
	onLift: new Q.Event(),
	onIndicate: new Q.Event(),
	beforeDrop: new Q.Event(),
	onDrop: new Q.Event(function ($item, revert, data) {
		var offset = $item.offset();
		var moreleft = 0, moretop = 0;
		var $scrolling = data.$scrolling;
		var duration = this.state('Q/sortable').drop.duration;
		if ($scrolling) {
			var so, il, it, ir, ib, sl, st, sr, sb, ssl, sst;
			so = $scrolling.offset();
			il = offset.left;
			it = offset.top;
			ir = il + $item.width();
			ib = it + $item.height();
			ssl = $scrolling.scrollLeft();
			sst = $scrolling.scrollTop();
			
			var found = false;
			$item.parents().each(function () {
				var $t = $(this);
				if ($t.css('overflow') !== 'visible' && !$t.is('body')) {
					found = true;
					return false;
				}
			});
			
			if (found) { // found a scrollable container
				sl = so.left;
				st = so.top;
				sr = so.left + $scrolling.width(),
				sb = so.top + $scrolling.height();
			} else {
				sl = ssl;
				st = sst;
				sr = ssl + $(window).innerWidth();
				sb = sst + $(window).innerHeight();
			}
			if (il < sl) {
				$scrolling.animate({'scrollLeft': ssl + il - sl}, duration);
				moreleft = sl - il;
			}
			if (it < st) {
				$scrolling.animate({'scrollTop': sst + it - st}, duration);
				moretop = st - it;
			}
			if (ir > sr) {
				$scrolling.animate({'scrollLeft': ssl + ir - sr}, duration);
				moreleft = sr - ir;
			}
			if (ib > sb) {
				$scrolling.animate({'scrollTop': sst + ib - sb}, duration);
				moretop = sb - ib;
			}
		}
		$item.css('opacity', 0).animate({'opacity': 1}, duration);
		data.$dragged.animate({
			opacity: 0,
			left: offset.left + moreleft,
			top: offset.top + moretop
		}, duration, function () {
			data.$dragged.remove(); // we have to do it ourselves since we retained it
		});
		data.$dragged.retain = true;
	}, 'Q/sortable'),
	onSuccess: new Q.Event()
},

{
	destroy: function () {
		// TODO: implement cleanup
		this.removeData('Q/sortable');
		this.off('.Q_sortable');
	}
}

);

})(window.jQuery, window, document);