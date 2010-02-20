function lambdaTests() {

	var expression,
		result,
		lambda = window.lambda;

	lambda.compile = false;

	var data = {
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

	test("Lambda expression evaluation", function() {
		var lambdas;

		/*
		Lambda: "foo"
		*/
		lambdas = [
			["val", ["foo"]]
		];
		equals(lambda.run(lambdas, data), "bar", "foo = bar");

		/*
		Lambda: "getBananas(5)"
		*/
		lambdas = [
			["val", ["getBananas"]],
			["call", [[["num", ["3"]]]]]
		];
		equals(lambda.run(lambdas, data), "3 bananas!", "foo = bar");

		/*
		Lambda: "animalFactories.dog(5)"
		*/
		lambdas = [
			["val",["animalFactories"]],
			["get",["dog"]],
			["call", [[["num", ["5"]]]]]
		];
		equals(lambda.run(lambdas, data), "5 dogs!", "Lambda: animalFactories.dog(5) - Using getMember");

		/*
		Lambda: "getAnimalFactory("dog")(7)"
		*/
		lambdas = [
			["val",["getAnimalFactory"]],
			["call", [[["str", ["dog"]]]]],
			["call", [[["num", ["7"]]]]]
		];
		equals(lambda.run(lambdas, data), "7 dogs!", "7 dogs in an array");

	});

	module("Multi level lambda tree");

	test("2 level lambda", function() {

		/*
		Lambda: "uppercase(getAnimalFactory("dog")(7))"
		*/

		lambdas = [
			["val", ["uppercase"]],
			["call",
				[
					[ // new lambda chain as the first parameter
						["val", ["getAnimalFactory"]],
						["call", [[["str", ["dog"]]]]],
						["call", [[["num", ["7"]]]]]
					]
				]
			]
		];
		// PERFORMANCE NOTE: 
		// On netbook VIA C7 Processor this benchmarked at:
		// 50,000 evaluation in about 6600 milliseconds
		var val;
		var count = 1;
		for (var i = count; i; i--) {
			val = lambda.run(lambdas, data);
		};
		equals(val, "7 DOGS!", "7 dogs in an array");
	});


	module("Expression to lambda tree");

	test("expression inside expression", function() {

		expression = "uppercase(getAnimalFactory('dog')(7))"
		lambdas = [
			["val", ["uppercase"]],
			["call", [
				[ // new lambda chain as the first parameter
					["val", ["getAnimalFactory"]],
					["call", [[["str", "dog"]]]],
					["call", [[["num", "7"]]]]
				]
			]]
		];
		// PERFORMANCE NOTE: 
		// On netbook VIA C7 Processor this benchmarked at:
		// 50,000 evaluation in about 6600 milliseconds
		var l = lambda.lambda(expression);
//		console.log("This:");
//		console.dir(l.lambdas);
//		console.log("Should be:");
//		console.dir(lambdas);
		equals(l.lambdas.toString(), lambdas.toString(), "7 dogs in an array");
	});



	test("basic expression", function() {
		expression = "uppercase('yata!')";
		lambdas = [
			["val", ["uppercase"]],
			["call", [["str", ["yata!"]]]]
		];
		// PERFORMANCE NOTE: 
		// On netbook VIA C7 Processor this benchmarked at:
		// 50,000 evaluation in about 6600 milliseconds
		var l = lambda.lambda(expression);
//		console.log("This:");
//		console.dir(l.lambdas);
//		console.log("Should be:");
//		console.dir(lambdas);
		equals(l.lambdas.toString(), lambdas.toString(), "7 dogs in an array");
	});


	test("basic chained expressions", function() {
		expression = "uppercase('yata!').split(3)";
		lambdas = [
			["val", ["uppercase"]],
			["call",[["str", ["yata!"]]]],
			["get", ["split"]],
			["call",[["num", ["3"]]]],
		];
		// PERFORMANCE NOTE: 
		// On netbook VIA C7 Processor this benchmarked at:
		// 50,000 evaluation in about 6600 milliseconds
		var l = lambda.lambda(expression);
//		console.log("This:");
//		console.dir(l.lambdas);
//		console.log("Should be:");
//		console.dir(lambdas);
		equals(l.lambdas.toString(), lambdas.toString(), "7 dogs in an array");
	});


	module("Complete expression evaluation");

	test("basic expressions ", function() {
		expression = "uppercase('1234', 'abcde', '4321').substring(3, 10)";
		result =  "4ABCDE4";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});

	test("Single property", function() {
		equals(lambda.eval("foo", data), "bar", "foo is bar indeed.");
		equals(lambda.eval("fruits.banana", data), "A banana!", "The banana test");
		equals(lambda.eval("uppercase(fruits.banana)", data), "A BANANA!", "uppercase banana!");
	});

	test("5 parameters function", function() {
		expression = "fiveParamConcat('A1', 'B2', 'C3', 'D4', 'E5')";
		result = "A1,B2,C3,D4,E5";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});

	test("5 parameters with mixed Double and Single quote strings", function() {
		expression = "fiveParamConcat('A1', \"B2\", 'C3', \"D4\", 'E5')";
		result = "A1,B2,C3,D4,E5";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});

	test("Array as a simple value", function() {
		expression = "['123', 'abc', '456', 'def'].join()";
		result = "123,abc,456,def";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});

	test("Array as a function parameter", function() {
		expression = "joinArray(['123', 'abc', '456', 'def'])";
		result = "123,abc,456,def";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});


	test("Adressing an array", function() {
		expression = "abcde[2]";
		result = "c";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});

	test("Adressing a string as an array", function() {
		expression = "'vwxyz'[3]";
		result = "y";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});

	test("Adressing a multi-dimension array", function() {
		expression = "numberMatrix[2,2].join(', ')";
		result = "two zero, two one, two two, two three";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});

	test("Adressing a multi-dimension array", function() {
		expression = "numberMatrix[2][2]";
		result = "two two";
		equals(lambda.eval(expression, data), result, expression + " === " + result);
	});

};
