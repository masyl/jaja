/*

JaJa Testing Tools

This library is unit testing tool for the JaJa library. It has been custom built to support the
exact nature of JaJa. It includes :
	- Tests are "expression based" and written in a declarative format
	- Test both interpreted and compiled expressions
	- Exposes compiled code
	- Differentiate between failures with wrong output vs exceptions
	- Can be used to document/expose "unsupported" features of the library
	- Tests can also be considered a kind of documentation or "sample usage"
	- Provide notes and descriptions for features status
	- Planned to be used to generate comparative benchmarks between releases and standard "evil eval" and the Function constructor

*/
/*
jslint white: true, devel: true, debug: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 100
*/
(function ($) {

	function runTestSuite(testSuite) {

		var $outContainer,
			$outTestList,
			$outResults,
			testModules = testSuite.testModules,
			fixtures = testSuite.fixtures,
			hasFailedAtLeastOnce = false;

		$outContainer = $("<div><div class='testResults'></div></div>");
		$outResults = $(".testResults", $outContainer);
		$outContainer.appendTo($("#testSuiteReport"));

		function runTest(test, fixtures) {
			var result = {
					compiler: {},
					interpreter: {}
				},
				resultValue,
				compilerOk,
				interpreterOk,
				$outTestItem,
				note,
				failedLabel,
				err = {};
			jaja.useCompiler = true;
			try {
				result.compiler.result = jaja.eval(test.code, fixtures);
				if (result.compiler.result === test.value) {
					result.compiler.ok = true;
				} else {
					result.compiler.ok = false;
					err.message = "Unexpected output from compiled execution";
					err.description = 'Expected "' + test.value + '" but instead received "' + result.compiler.result + '"';
				};
				err.compiledCode = jaja.compile(test.code);
			} catch (e) {
				result.compiler.ok = false;
				if (!test.unsupported) {
					if (console) console.error(test.label, e);
				}
				err.message = "Exception occured while evaluating";
				err.description = e.name + ' - ' + e.message + ' - Refer to console for details';
			};
			jaja.useCompiler = false;
			try {
				result.interpreter.result = jaja.eval(test.code, fixtures);
				if (result.interpreter.result === test.value) {
					result.interpreter.ok = true;
				} else {
					result.interpreter.ok = false;
					err.message = "Unexpected output from interpreted execution";
					err.description = 'Expected "' + test.value + '" but instead received "' + result.interpreter.result + '"';
				};
			} catch (e) {
				result.interpreter.ok = false;
				if (!test.unsupported) {
					if (console) console.error(test.label, e);
				}
				err.message = "Exception occured while evaluating";
				err.description = e.name + ' - ' + e.message + ' - Refer to console for details';
			};

			return {
				result: result,
				err: err
			};
		};

		function runModule(module, fixtures) {
			var $outModuleItem,
				$outTestList,
				$outModuleContainer,
				$testOut,
				test,
				tests,
				testResult,
				countFailed = 0,
				countSuccess = 0,
				countUnsupported = 0,
				note,
				failedLabel,
				hasFailedAnchor;

			tests = module.tests;
//			console.log("module", module);

			$outTestList = $(".testList tbody", $outModuleContainer);
			$outModuleContainer = $("'<div><h2><span class='label'>" + module.label + "</span><span class='testCount'></span></h2><table class='testList'><thead><tr><td></td><td style='width: 75%' >Test</td><td>Result</td><td>Interpreted</td><td>Compiled</td></tr><thead><tbody></tbody></table></div>");
			$testCount = $(".testCount", $outModuleContainer);
			$outModuleContainerBody = $("tbody", $outModuleContainer);

			$testCount.empty();
			$("<span>" + tests.length + " tests</span>").appendTo($testCount);

			$(tests).each(function() {
				var test = this,
					$compiledCode;
				testResult = runTest(test, fixtures);
				if (test.unsupported) {
					failedLabel = "UNSUPPORTED";
				} else {
					failedLabel = "FAIL";
				}
				if (testResult.err.message && !test.unsupported) {
					hasFailedAnchor = "<a name='isFailed'></a>";
					hasFailedAtLeastOnce = true;
				} else {
					hasFailedAnchor = "";
				}
				note = (test.note) ? "<a href='#' title='" + test.note + "'>?</a>" : "";
				$testOut = $("<tr class='" + ((test.unsupported) ? "isUnsupported " : "") + "'>"
					+ "<td class='testCell-note'>" + note + "</td>"
					+ "<td class='testCell-label'>" + hasFailedAnchor + test.label + ":"
					+ "<br/><a href='#'>" + test.code + "</a></td>"
					+ "<td class='testCell-value'>" + test.value + "</td>"
					+ "<td class='testCell-interpreted "
					+ ((test.unsupported) ? "isUnsupported " : "")
					+ ((testResult.result.interpreter.ok) ? "isOk " : "isFailed ") + "' >"
					+ ((testResult.result.interpreter.ok) ? "OK " : failedLabel) + "</td>"
					+ "<td class='testCell-compiled "
					+ ((test.unsupported) ? "isUnsupported " : "")
					+ ((testResult.result.compiler.ok) ? "isOk " : "isFailed ") + "' >"
					+ ((testResult.result.compiler.ok) ? "OK " : failedLabel) + "</td>"
					+ "</tr>");
				//Todo: Use delegation instead
				$testOut.appendTo($outModuleContainerBody);

				if (testResult.err.compiledCode) {
					$compiledCode = $("<tr class='compiledCodeRow'><td></td><td colspan='4'><div class='compiledCode'>Compiled code:<br/>" + testResult.err.compiledCode + "</div></td><td></td></tr>").appendTo($outModuleContainerBody);
				} else {
					$compiledCode = $("<tr class='compiledCodeRow'><td></td><td colspan='4'><div class='compiledCode'>Compilation failed.</div></td><td></td></tr>").appendTo($outModuleContainerBody);
				}

				if (testResult.err.message && !test.unsupported) {
					$("<tr><td></td><td colspan='4'><div class='errorMessage'>" + testResult.err.message + "<br/>" + testResult.err.description + "</div></td><td></td></tr>").appendTo($outModuleContainerBody);
				}

				$(".testCell-code a", $testOut).click(function(e){
				 	console.log($compiledCode, e);
					e.preventDefault();
					$compiledCode.toggle();
				});

				if ($(".isUnsupported", $testOut).length) {
					countUnsupported++;
				} else if ($(".isFailed", $testOut).length) {
					countFailed++;
				} else if ($(".isOk", $testOut).length) {
					countSuccess++;
				}
			});

			$("<span class='countOk " + ((countSuccess) ? "moreThanOne" : "") + "'>" + countSuccess + " success</span>").appendTo($testCount);
			$("<span class='countFailed " + ((countFailed) ? "moreThanOne" : "") + "'>" + countFailed + " failed</span>").appendTo($testCount);
			$("<span class='countUnsupported " + ((countUnsupported) ? "moreThanOne" : "") + "'>" + countUnsupported + " unsupported</span>").appendTo($testCount);

			// Todo: This should return a model, not rendered output
			// Maybe the test results could be attached directly on the test hierarchy ???
			return $outModuleContainer;
		};

		// Todo: hasFailedAtLeastOnce should not a wide scope var... use "tests" or
		// a new "testResults" complex object instead ?
		hasFailedAtLeastOnce = false;

		for (var iModule = 0; iModule < testModules.length; iModule++) {
			var $moduleOut = runModule(testModules[iModule], fixtures);
			$moduleOut.appendTo($outResults);
		};

		if (hasFailedAtLeastOnce) {
			window.location = "#isFailed"
		} else {
			window.location = "#isSuccess"
		}

	};

	window.runTestSuite = runTestSuite;

}(jQuery));
