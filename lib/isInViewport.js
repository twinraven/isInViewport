/**
 * @author  Mudit Ameta
 * @license https://github.com/zeusdeux/isInViewport/blob/master/license.md MIT
 */
(function($, window) {

  // polyfilling trim for ie < 9. sigh ;-;
  if (!String.prototype.hasOwnProperty('trim')) {
    String.prototype.trim = function() {
      return this.replace(/^\s*(.*?)\s*$/, '$1');
    };
  }

  //lets you chain any arbitrary function or an array of functions and returns a jquery object
  var run = function(args) {
    if (arguments.length === 1 && typeof args === 'function')
      args = [args];

    if (!(args instanceof Array))
      throw new SyntaxError('isInViewport: Argument(s) passed to .do/.run should be a function or an array of functions');

    for (var i = 0; i < args.length; i++) {
      if (typeof args[i] !== 'function') {
        console.warn('isInViewport: Argument(s) passed to .do/.run should be a function or an array of functions');
        console.warn('isInViewport: Ignoring non-function values in array and moving on');
        continue;
      }
      for (var j = 0; j < this.length; j++)
        args[i].call($(this[j]));
    }
    return this;
  };

  //do is a reserved word and hence using it as a property throws on some browsers
  //it is now aliased as $.fn.run
  $.fn['do'] = function(args) {
    console.warn('isInViewport: .do causes issues in IE and some browsers since its a reserved. Use $.fn.run instead i.e., $(el).run(fn).');
    return run(args);
  };
  $.fn.run = run;

  //gets the width of the scrollbar
  function getScrollbarWidth(viewport) {
    var scrollBarWidth;

    //append a div that has 100% width to get true width of viewport
    var el = $('<div></div>').css({
      'width': '100%'
    });
    viewport.append(el);

    //subtract true width from the viewport width which is inclusive
    //of scrollbar by default
    scrollBarWidth = viewport.width() - el.width();

    //remove our element from DOM
    el.remove();
    return scrollBarWidth;
  }

  function isInViewport(element, options) {
    var boundingRect  = element.getBoundingClientRect();
    var top           = boundingRect.top;
    var bottom        = boundingRect.bottom;
    var left          = boundingRect.left;
    var right         = boundingRect.right;
    var settings      = $.extend({
      'tolerance': 0,
      'selection': 'single', // 'single' / 'all'
      'viewport': window
    }, options);
    var isVisibleFlag = false;
    var $viewport     = settings.viewport.jquery ? settings.viewport : $(settings.viewport);

    if (!$viewport.length) {
      console.warn('isInViewport: The viewport selector you have provided matches no element on page.');
      console.warn('isInViewport: Defaulting to viewport as window');
      $viewport = $(window);
    }

    var $viewportHeight = $viewport.height();
    var $viewportWidth  = $viewport.width();
    var typeofViewport  = $viewport.get(0).toString();

    //if the viewport is other than window recalculate the top,
    //bottom,left and right wrt the new viewport
    //the [object DOMWindow] check is for window object type in PhantomJS
    if ($viewport[0] !== window && typeofViewport !== '[object Window]' && typeofViewport !== '[object DOMWindow]') {
      // Use getBoundingClientRect() instead of $.Offset()
      // since the original top/bottom positions are calculated relative to browser viewport and not document
      var viewportRect = $viewport.get(0).getBoundingClientRect();

      //recalculate these relative to viewport
      top    = top - viewportRect.top;
      bottom = bottom - viewportRect.top;
      left   = left - viewportRect.left;
      right  = right - viewportRect.left;

      //get the scrollbar width from cache or calculate it
      isInViewport.scrollBarWidth = isInViewport.scrollBarWidth || getScrollbarWidth($viewport);

      //remove the width of the scrollbar from the viewport width
      $viewportWidth -= isInViewport.scrollBarWidth;
    }

    //handle falsy, non-number and non-integer tolerance value
    //same as checking using isNaN and then setting to 0
    //bitwise operators deserve some love too you know
    settings.tolerance = ~~Math.round(parseFloat(settings.tolerance));

    // set default values
    settings.viewportStart = 0;
    settings.viewportEnd = $viewportHeight;

    // if the tolerance is negative,
    // i.e. we want to crop our custom viewport from the bottom,
    // contract the viewport height by the tolerance value from the bottom
    if (settings.tolerance < 0) {
      settings.viewportEnd = $viewportHeight + settings.tolerance;

      // if we only want to select one value at a time
      if (settings.selection === 'single') {
        settings.viewportStart = settings.viewportEnd;
      }
    }

    // if the tolerance is positive,
    // i.e. we want to crop our custom viewport from the top,
    // move the viewport start value to the tolerance value
    if (settings.tolerance > 0) {
      settings.viewportStart = settings.tolerance;

      // if we only want to select one value at a time
      if (settings.single === 'single') {
        settings.viewportEnd = settings.viewportStart;
      }
    }

    //the element is NOT in viewport iff it is completely out of
    //viewport laterally or if it is completely out of the tolerance
    //region. Therefore, if it is partially in view then it is considered
    //to be in the viewport and hence true is returned. Because we have adjusted
    //the left/right positions relative to the viewport, we should check the
    //element's right against the viewport's 0 (left side), and the element's
    //left against the viewport's width to see if it is outside of the viewport.

    if (right <= 0 || left >= $viewportWidth)
      return isVisibleFlag;

    //if the element is bound to some tolerance
    isVisibleFlag = !!(bottom > settings.viewportStart && top <= settings.viewportEnd);

    return isVisibleFlag;
  }

  $.extend($.expr[':'], {
    'in-viewport': function(currObj, index, meta) {
      if (!!meta[3]) {
        var args = meta[3].split(',');

        //when user only gives viewport and no tolerance
        if (args.length === 1 && isNaN(args[0])) {
          args[1] = args[0];
          args[0] = void 0;
        }

        return isInViewport(currObj, {
          tolerance: args[0] ? args[0].trim() : void 0,
          selection: args[1] ? args[1].trim() : void 0,
          viewport: args[2] ? args[2].trim() : void 0
        });
      }
      else
        return isInViewport(currObj);
    }
  });
})(jQuery, window);
