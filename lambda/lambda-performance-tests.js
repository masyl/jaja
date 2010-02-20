function lambdaTests() {

	var lambda = window.lambda;
	lambda.compile = true;

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
		uppercase: function uppercase(str) {
			return str.toUpperCase();
		}
	};

	module("Performance comparisons without expression caching");

	var count = 1000;

	test(count + " bananas with lambda.eval", function() {
		console.log("Performance comparisons without expression caching");
		var val;
		console.time(count + " - bananas with lambda.eval");
		for (var i=0; i <= count; i = i + 1) {
			val = lambda.eval("uppercase('"+i+" Bananas')" , data);
		}
		console.timeEnd(count + " - bananas with lambda.eval");
		equals(val, count + " BANANAS", "uppercase banana!");
	});

	test(count + " bananas with eval", function() {
		var val;
		console.time(count + " - bananas with evil eval");
		for (var i=0; i <= count; i = i + 1) {
			val = eval('data.uppercase("'+i+' Bananas")');
		}
		console.timeEnd(count + " - bananas with evil eval");
		equals(val, count + " BANANAS", "uppercase banana!");
	});


	module("Performance comparisons with expression caching");
	var count = 1000;

	test(count + " bananas with lambda.eval", function() {
		console.log("Performance comparisons with expression caching");
		var val;
		console.time(count + " - bananas with lambda.eval");
		for (var i=0; i <= count; i = i + 1) {
			val = lambda.eval("uppercase(fruits.banana)" , data);
		}
		console.timeEnd(count + " - bananas with lambda.eval");
		equals(val, "A BANANA!", "uppercase banana!");
	});

	test(count + " bananas with eval", function() {
		var val;
		console.time(count + " - bananas with evil eval");
		for (var i=0; i <= count; i = i + 1) {
			val = eval('data.uppercase(data.fruits.banana)');
		}
		console.timeEnd(count + " - bananas with evil eval");
		equals(val, "A BANANA!", "uppercase banana!");
	});



};
