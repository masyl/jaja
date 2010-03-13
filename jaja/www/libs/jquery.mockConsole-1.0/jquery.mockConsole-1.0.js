/*
	Function jQuery.mockConsole

	If not console object is found, enables a mock console to prevent console call from breaking the prod environment

	Version:
		1.0

	Author:
		Mathieu Sylvain 2009 (mathieu@ti-coco.com)

	Parameters:

		config - configuration. Simple provide callback function with matching names to override the consoles behavior
*/
;(function($) {
	$.mockConsole = function(config) {
		if(typeof(window.console) === "undefined") {
			var console = {
				assert: function() {},
				clear: function() {},
				count: function() {},
				debug: function() {},
				dir: function() {},
				dirxml: function() {},
				error: function() {},
				group: function() {},
				groupCollapsed: function() {},
				groupEnd: function() {},
				info: function() {},
				log: function() {},
				profile: function() {},
				profileEnd: function() {},
				time: function() {},
				timeEnd: function() {},
				trace: function() {},
				warn: function() {}
			};
			$.extend(console, config);
			window.console = console;
		}
	};
})(jQuery);
