/*

JaJa Lab Tool

ROADMAP:


Release 0.1.1:
x	- Compile and on ctrl-enter or XXXms delay
x	- Validate datasource on ctrl-enter and XXX delay
x	- Run code when compiled code and datasource is valid 
x	- Show success or error messages
x	- Show compiled version of code
x	- Add labels and instructions
x	- Save to cookies
x	- provide defaut data and expression
	- Render current lab input as a test suite entry

Release 0.1.2:
	- Use a jquery timeout plugin instead of standard setTimeout
	- Setup mock console in parent site

Release 0.1.3:
	- Option to dynamicaly reload Jaja library and re-run code on "window.focus" 
	- Option to load datasource from external source

Release 0.1.4:
	- Render "test metadata"  to be included in the testSuite and paste in clipboard

*/
/*
jslint white: true, devel: true, debug: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 100
*/
(function ($) {

	var defaultOptions = {};

	var jajaLabPlugin = function(paramOptions) {
		return this.each(jajaLab);
	}

	var jajaLab = function(paramOptions) {

		//Todo: overlaod options

		var $jajaLab = this,
			options = {},
			$root,
			$codeInput,
			$compiledCode,
			$messages,
			$dataInput,
			$testLabel,
			$testOutput,
			$testExpectedResult,
			compileTimeoutId,
			compileTimeoutCallback,
			setDataTimeoutId,
			setDataTimeoutCallback,
			compiledCode,
			data,
			dataException,
			compilationException; // The scope data to be used during code execution

		this.init = function () {
			$root = $(this);

			$.extend(options, defaultOptions, paramOptions);

			// Setup the compilation input delayed callback
			compileTimeoutCallback = "compileTimeoutCallback-" + $jajaLab.id
			window[compileTimeoutCallback] = function() {
				$jajaLab.compile();
			};

			// Setup the data input delayed callback
			setDataTimeoutCallback = "setDataTimeoutCallback-" + $jajaLab.id
			window[setDataTimeoutCallback] = function() {
				$jajaLab.setData();
			};

			this.bindUI();

			this.setData();
			this.compile();
			this.tryRun();

		};

		this.bindUI = function () {

			$testLabel = $(".testLabel", $root);
			if ($testLabel.val() === "") {
				$testLabel.val($.jCookie("defaultTestLabel") || options.defaultTestLabel);
			}

			$testExpectedResult = $(".testExpectedResult", $root);
			if ($testExpectedResult.val() === "") {
				$testExpectedResult.val($.jCookie("defaultExpectedResult") || options.defaultExpectedResult);
			}

			$testOutput = $(".testOutput", $root);

			$codeInput = $(".codeInput", $root);
			$codeInput.val($.jCookie("defaultCode") || options.defaultCode);


			if ($codeInput.val() === "") {
				$codeInput.val($.jCookie("defaultCode") || options.defaultCode);
			}
			$dataInput = $(".dataInput", $root);
			if ($dataInput.val() === "") {
				$dataInput.val($.jCookie("defaultData") || options.defaultData); 
			}

			$compiledCode = $(".compiled", $root);
			$messages = $(".messages", $root);

			$codeInput.keypress(function (e) {
				if (e.which === 13 && e.ctrlKey) {
					$jajaLab.compileAfterDelay(1);
				} else {
					$jajaLab.compileAfterDelay(500);
				};
			});

			$dataInput.keypress(function (e) {
				if (e.which === 13 && e.ctrlKey) {
					$jajaLab.setDataAfterDelay(1);
				} else {
					$jajaLab.setDataAfterDelay(500);
				};
			});

		};

		this.compile = function () {
			var code = $codeInput.val();
			$.jCookie("defaultCode", code);
			var failedMessage = "Compilation failed!";
			compilationException = null;
			try {
				compiledCode = jaja.compile(code);
			} catch(e) {
				compiledCode = "";
				compilationException = e;
			}
			$compiledCode.html("<div>" + compiledCode + "</div>").show();
			$jajaLab.tryRun();
		}

		this.compileAfterDelay = function (delay) {
			if (compileTimeoutId) {
				clearTimeout(compileTimeoutId);
			};
			compileTimeoutId = setTimeout("window['" + compileTimeoutCallback + "']()", delay);
		}

		this.setData = function () {
			var dataStr = $dataInput.val();
			$.jCookie("defaultData", dataStr);
			dataException = null;
			try {
				data = eval("[" + dataStr + "]")[0];
			} catch(e) {
				data = null;
				dataException = e;
			}
			//console.log("data: ", data);
			$jajaLab.tryRun();
		}
/*
				{
					label: "Exponent notation - positive",
					code: "1.0e+3",
					value: 1.0e3,
					unsupported: true,
					note: "Support planned for future releases."
				},
*/
		this.setTest = function () {
			var test = '';
			test = '{\n'
				+ '\tlabel: "' + $testLabel.val() + '",\n'
				+ '\tcode: "' + $codeInput.val() + '",\n'
				+ '\tvalue: ' + $testExpectedResult.val() + ',\n'
				+ '\tdata: ' + $dataInput.val() + ',\n'
				+ '},';
			$testOutput.html(test);
		}


		this.tryRun = function () {
			var val,
				code = $codeInput.val(),
				referenceVal,
				referenceFunction;
			this.clearMessages();
			this.setTest();
			if (!dataException && !compilationException) {
				hasError = false;
				try {
					referenceFunction = new Function("var x = (" + compiledCode + "); return x;");
					//console.log("referenceFunction: ", referenceFunction.toString());
				} catch(e) {
					this.addMessage("<strong>Failed : </strong>" + e.message, true);
					hasError = true;
				}
				if (!hasError) {
					try {
						val = jaja.eval(code, data);
						this.addMessage("<strong>JaJa output : </strong>" + val);
					} catch(e) {
						this.addMessage("<strong>JaJa eval failed : </strong>" + e.message);
						hasError = true;
					}
				}
				try {
					referenceVal = referenceFunction.call(data);
					this.addMessage("<strong>Standard output : </strong>" + referenceVal);
				} catch(e) {
					this.addMessage("<strong>Standard eval failed : </strong>" + e.message);
					hasError = true;
				}
				if (!hasError) {
					if (referenceVal == val) {
						this.addMessage("<strong>Outputs are identical.</strong>");
					} else {
						this.addMessage("<strong>Outputs differ.</strong>");
						hasError = true;
					}
				}
				if (!hasError) {
					this.addMessage("<strong>Success!</strong>", false);
				} else {
					this.addMessage("<strong>Failed!</strong>", true);
				}
			} else {
				if (dataException) {
					this.addMessage("<strong>Data contains error: </strong>" + dataException.message, true);
				}
				if (compilationException) {
					this.addMessage("<strong>Exception occured: </strong>" + compilationException.message, true);
				}
			}
		}

		this.setDataAfterDelay = function (delay) {
			if (setDataTimeoutId) {
				clearTimeout(setDataTimeoutId);
			};
			setDataId = setTimeout("window['" + setDataTimeoutCallback + "']()", delay);
		}

		this.addMessage = function (message, isError) {
			if (isError) {
				$messages.addClass("isFailed").removeClass("isSuccess");
			} else {
				$messages.addClass("isSuccess").removeClass("isFailed");
			}
			$messages.append("<div class='message'>" + message + "</div>").show();
			return this;
		}

		this.clearMessages = function (message) {
			$messages.empty();
			return this;
		}

		this.init();

	}

	$.fn.extend({
		jajaLab: jajaLab
	});

}(jQuery));


