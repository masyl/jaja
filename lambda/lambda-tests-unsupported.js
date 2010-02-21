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

	test("Unsupported number notations", function() {
		equals(lambda.eval("1.2e+3"), 1.2e+3, "Positive exponent notation: 1.2");
		equals(lambda.eval("1.23-3"), 1.2e-3, "Negative exponent notation: 1.2");
		equals(lambda.eval("-255"), -255, "Negative numbers: -255");
		equals(lambda.eval("- + - + - 255"), - + - + - 255, "Positive and negative permutations: + - + - 255");
		equals(lambda.eval("0377"), 0377, "Octal notation: 0377");
	});

};
