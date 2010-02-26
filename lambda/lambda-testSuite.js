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
			label: "Arythmetic Operators",
			tests: [
				{
					label: "Additions",
					code: "1 + 1",
					value: 2
				},
				{
					label: "Substractions",
					code: "2 - 1",
					value: 1
				},
				{
					label: "Multiplications",
					code: "2 + 3",
					value: 6
				},
				{
					label: "Division",
					code: "6 / 3",
					value: 2
				},
				{
					label: "Modulus",
					code: "10 % 4",
					value: 2
				},
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
					unsupported: true,
					note: "Support planned for future releases."
				},
				{
					label: "Exponent notation - positive",
					code: "1.0e-3",
					value: 1.0e3,
					unsupported: true,
					note: "Support planned for future releases."
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
					label: "Constant: true",
					unsupported: true,
					code: "true",
					value: true,
					note: "Support planned for future releases."
				},
				{
					label: "Constant: false",
					unsupported: true,
					code: "false",
					value: false,
					note: "Support planned for future releases."
				},
				{
					label: "Object literals",
					unsupported: true,
					code: "{a:1, b:2, c:3}",
					value: {a:1, b:2, c:3},
					note: "Support planned for future releases."
				},
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
