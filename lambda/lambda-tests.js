/*
jslint white: true, devel: true, debug: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 100
*/
(function ($) {

	function testSuite() {

		var fixtures = {
			foo: "bar",
			getBananas: function getBananas(count) {
				return count + " bananas!";
			},
			animalFactories: {
				dog: function dog(count) {
					return count + " dogs!";
				}
			},
			getAnimalFactory: function getAnimalFactory(id) {
				return data.animalFactories[id];
			},
			getAnimalAsString: function getAnimalAsString(id) {
				return "Animal";
			},
			abcde: ["a", "b", "c", "d", "e"],
			numberMatrix: [
				["zero zero", "zero one", "zero two", "zero three"],
				["one zero", "one one", "one two", "one three"],
				["two zero", "two one", "two two", "two three"],
				["three zero", "three one", "three two", "three three"]
			],
			fruits: {
				banana: "A banana!",
				apple: "An apple!",
				raisin: "A raisin!"
			},
			numbers: [
				{id:1, label:"One"},
				{id:2, label:"Two"},
				{id:3, label:"Tree"}
			],
			// Concatenate all arguments into a single string and uppercase it.
			uppercase: function uppercase() {
				var i, str = "";
				for (i = 0; i < arguments.length; i++) {
					str = str + arguments[i];
				};
				return str.toUpperCase();
			},
			fiveParamConcat: function fiveParamConcat(a, b, c, d, e) {
				return [a, b, c, d, e].join();
			},
			joinArray: function concatArray(arr) {
				return arr.join();
			}
		};

		var testModules = [
			{
				label: "Basic expressions",
				tests: [
					{
						label: "Some test that must fail",
						code: "uppercase('1234', 'abcde', '4321').substring(3, 10)",
						value: "FORCED FAILED"
					},
					{
						label: "Two chained function call with multiple parameters",
						code: "uppercase('1234', 'abcde', '4321').substring(3, 10)",
						value: "4ABCDE4"
					},
					{
						label: "Simple value",
						code: "foo",
						value: "bar"
					},
					{
						label: "Simple attribute",
						code: "fruits.banana",
						value: "A banana!"
					},
					{
						label: "Function call with a single attribute",
						code: "uppercase(fruits.banana)",
						value: "A BANANA!"
					},
					{
						label: "Multiple parameters function call",
						code: "fiveParamConcat('A1', 'B2', 'C3', 'D4', 'E5')",
						value: "A1,B2,C3,D4,E5"
					},
					{
						label: "Single and double quotes strings as parameters",
						code: "fiveParamConcat('A1', \"B2\", 'C3', \"D4\", 'E5')",
						value: "A1,B2,C3,D4,E5"
					},
					{
						label: "Array as a value",
						code: "['123', 'abc', '456', 'def'].join()",
						value: "123,abc,456,def"
					},
					{
						label: "Array as a function parameter",
						code: "joinArray(['123', 'abc', '456', 'def'])",
						value: "123,abc,456,def"
					},
					{
						label: "Adressing an array",
						code: "abcde[2]",
						value: "c"
					},
					{
						label: "Adressing a string as an array",
						code: "'vwxyz'[3]",
						value: "y"
					},
					{
						label: "Adressing a multi-dimension array",
						code: "numberMatrix[2,2].join(', ')",
						value: "two zero, two one, two two, two three"
					},
					{
						label: "Adressing a multi-dimension array",
						code: "numberMatrix[2][2]",
						value: "two two"
					}
				],
			},
			{
				label: "Number notations",
				tests: [
					{
						label: "Integer",
						code: "255",
						value: 255
					},
					{
						label: "Octal notation",
						code: "0xFF",
						value: 0xFF
					},
					{
						label: "Exponent notation",
						code: "10e3",
						value: 10e3
					},
					{
						label: "Exponent notation - neutral",
						code: "1.0e3",
						value: 1.0e3
					},
					{
						label: "Exponent notation - negative",
						code: "1.0e-3",
						value: 1.0e3,
						unsupported: true
					},
					{
						label: "Exponent notation - positive",
						code: "1.0e-3",
						value: 1.0e3,
						unsupported: true
					},
					{
						label: "Fractions",
						code: "1.2",
						value: 1.2
					}
					/*
					{
						label: "",
						code: "",
						value: ""
					},
					*/
				],
			},
			{
				label: "Miscelaneous unsupported syntax",
				tests: [
					{
						label: "Parenteticals",
						unsupported: true,
						code: "(10+4)",
						value: 14,
						note: "Support planned for future releases."
					},
					{
						label: "Parenteticals with multiple arguments",
						unsupported: true,
						code: "(foo(), 4, 7, 9)",
						value: 9,
						note: "Support planned for future releases."
					}
				]
			}
		];

		return {
			testModules: testModules,
			fixtures: fixtures
		};

	};

	function runTestSuite(testSuite) {

		var $outContainer,
			$outTestList,
			$outResults,
			testModules = testSuite.testModules,
			fixtures = testSuite.fixtures;

		$outContainer = $("<div><h1>Lambda.eval Test Suite</h1><div class='testResults'></div></div>");
		$outResults = $(".testResults", $outContainer);
		$outContainer.appendTo($("body"));

		function runTest(test, fixtures) {
			var result,
				compilerOk,
				interpreterOk,
				$outTestItem,
				note,
				failedLabel;
			lambda.compile = true;
			try {
				result = lambda.eval(test.code, fixtures);
				if (result === test.value) {
					compilerOk = true;
				} else {
					compilerOk = false;
				};
			} catch (e) {
				compilerOk = false;
				if (!test.unsupported) {
					console.error(test.label, e);
				}
			};
			lambda.compile = false;
			try {
				result = lambda.eval(test.code, fixtures);
				if (result === test.value) {
					interpreterOk = true;
				} else {
					interpreterOk = false;
				};
			} catch (e) {
				interpreterOk = false;
				if (!test.unsupported) {
					console.error(test.label, e);
				}
			};
			if (test.unsupported) {
				failedLabel = "UNSUPPORTED";
			} else {
				failedLabel = "FAIL";
			}
			note = (test.note) ? "<a href='#' title='" + test.note + "'>?</a>" : "";
			$outTestItem = $("<tr class='" + ((test.unsupported) ? "isUnsupported " : "") + "'>"
				+ "<td class='testCell-label'>" + test.label + "</td>"
				+ "<td class='testCell-code'>" + test.code + "</td>"
				+ "<td class='testCell-value'>" + test.value + "</td>"
				+ "<td class='testCell-interpreted "
				+ ((test.unsupported) ? "isUnsupported " : "")
				+ ((interpreterOk) ? "isOk " : "isFailed ") + "' >"
				+ ((interpreterOk) ? "OK " : failedLabel) + "</td>"
				+ "<td class='testCell-compiled "
				+ ((test.unsupported) ? "isUnsupported " : "")
				+ ((compilerOk) ? "isOk " : "isFailed ") + "' >"
				+ ((compilerOk) ? "OK " : failedLabel) + "</td>"
				+ "<td class='testCell-note'>" + note + "</td>"
				+ "</tr>");

			return $outTestItem;
		};

		function runModule(module, fixtures) {
			var $outModuleItem,
				$outTestList,
				$outModuleContainer,
				test,
				tests,
				$testOut,
				countFailed = 0,
				countSuccess = 0,
				countUnsupported = 0;
			tests = module.tests;

			$outTestList = $(".testList tbody", $outModuleContainer);
			$outModuleContainer = $("'<div><h2><span class='label'>" + module.label + "</span><span class='testCount'></span></h2><table class='testList'><thead><tr><td>Test</td><td>Expression</td><td>Result</td><td>Interpreted</td><td>Compiled</td><td></td></tr><thead><tbody></tbody></table></div>");
			$testCount = $(".testCount", $outModuleContainer);
			$outModuleContainerBody = $("tbody", $outModuleContainer);

			$testCount.empty();
			$("<span>" + tests.length + " tests</span>").appendTo($testCount);

			for (var iTest = 0; iTest < tests.length; iTest++) {
				// Todo: the runTest method should return an object to render 
				// instead of returning a rendered output
				$testOut = runTest(tests[iTest], fixtures);
				$testOut.appendTo($outModuleContainerBody);
				console.log($(".isUnsupported", $testOut).length, $testOut.html());
				if ($(".isUnsupported", $testOut).length) {
					countUnsupported++;
				} else if ($(".isFailed", $testOut).length) {
					countFailed++;
				} else if ($(".isOk", $testOut).length) {
					countSuccess++;
				}
			};

			$("<span class='countOk " + ((countSuccess) ? "moreThanOne" : "") + "'>" + countSuccess + " success</span>").appendTo($testCount);
			$("<span class='countFailed " + ((countFailed) ? "moreThanOne" : "") + "'>" + countFailed + " failed</span>").appendTo($testCount);
			$("<span class='countUnsupported " + ((countUnsupported) ? "moreThanOne" : "") + "'>" + countUnsupported + " unsupported</span>").appendTo($testCount);

			return $outModuleContainer;
		};


		for (var iModule = 0; iModule < testModules.length; iModule++) {
			var $moduleOut = runModule(testModules[iModule], fixtures);
			$moduleOut.appendTo($outResults);
		};

	};

	window.testSuite = testSuite;
	window.runTestSuite = runTestSuite;

}(jQuery));
