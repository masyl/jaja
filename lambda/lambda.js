"use strict";
/*

	lambda.eval v0.5.0

	Eval minus the evil

OVERVIEW

	This library enales you to evaluate simple javascript expresions without the usual risks
	associated with the standard javascript "eval" method.

	Expression are evaluated securelly by first deconstructing them into a more primitive
	lamda tree structure and then executed in a "managed" way. At no point is the interpreted
	code allowed to access anything outside of the scope you specificlly provide for it. Expressions
	can either be "interpreted" in real-time or compiled to anonymous functions.

	For example, the expression cant cant find out about the window object unless you voluntarally
	add the window to the execution scope.

	This library was originally built to be used in a javascript templating engine, but I invite you
	to find other original use for it.


USAGE

	Refer to the test suite found in lambda-tests.html for sample usage.


WHY IS EVAL CONSIDERED EVIL

	While you might have heard the "eval is evil" expression before, you might be curious to know
	the full rationnal behind this statement. Here is the list of arguments I have heard:
		- Eval can lead to sloppy code .... explain....
		- Eval can open your app or library to unforseen code injection hacks ...explain...
		- Eval something something something ....


FEATURES OVERVIEW:

	- Syntax support for strings, numbers, arrays, function calls
	- Evaluate simple functionnal expression (without operators)
	- Secure execution by use of an explicit and restricted scope
	- Choice between using a compiler or interpreter to evaluate the expressions
	- Caching of parsed expressions


KNOWN LIMITATIONS

	General limitations with planned support in the roadmap:
		- Limited exception handling and error messages

	Specific javascript syntax limitation:
		- No support for the "+" and "-" characters in exponent notation for numbers (NO TEST YET!)
		- No support for operators (NO TEST YET!)
		- No support for object literal syntax (NO TEST YET!)

	Limitations being considered for roadmap:
		- Only expressions, no actual code sequences
			Workaround: Function calls can contain any code you wish. With function call chaining
			such as Query does, something similar to sequences statement could be achieved.  But
			phylosophically, expressions should only compute values, not run logic.

	Limitations not currently in roamap:
		- No access to primitive objects such as Math, Function, String, etc.
			Workaround: Can be provided with scope injection
		- No support for statements such as function, var, typeof, etc.
			Workaround: Can be provided by creating function equivalents and scope injection
		- No support for native regexp syntax
			Workaround: Can be provided with scope injection


RELEASE HISTORY

	Release 0.5.0:
		- Added a compiler. Expressions can either be interpreted through the Runner or compiled to anonymous functions.

	Release 0.4.1:
		- Optimization and more accurate array parsing

	Release 0.4:
		- Support for both single and double quote strings
		- Support for arrays primitives: [1, 2, 3]
		- Support for adressing arrays: var[i]

	Release 0.3:
		- Support for multiple arguments.

	Release 0.2:
		- Evaluate simple functionnal expression (without operators) 
		- Secure execution by use of an explicit scope
		- Caching of parsed expressions
		- Parsing of expression to a lambda tree and ability to execute the tree


ROADMAP

	Release 0.5.1:
		- Support for more numbers notations
		- Added a negative test suite for unsupported features 
		- Added tests for unsupported number notations

	Release 0.5.2:
		- Cache the resulting function from compiled expression 

	Release 0.6.0:
		- Ability to specify prohibited objects (by reference) such as document, eval, window, etc..

	Release 0.7.0:
		- Support for "precedence-less" arythmetic operators: + -

	Release 0.8.0:
		- Support for object literals

	Release 0.9.0: OPERATORS
		- Adequate exception handling and error messages
		- Support for operators with precedence: / *
		- Support operators such as : ==, ===, ||, etc...

	Release 1.0.0:
		- Tests with negative tests results for exceptions handling
		- More complete test suite and performance benchmarks
		- Support for sub-expression precedence parens: (x + b)


Additionnal test cases and code scenarios to support 

	Support for basic parenteticals
		function foo() {};
		a=(10+4); // Should be 14

	Support for multi argument parentetical
		function foo() {};
		a = (foo(), 4, 7, 9); // Should be 9
		a = ( foo ( ), 4, 7, 9 ) ; // Should be 9



*/
/*
// This little helper routine is usefull when strugling with
// loops caused by broken recursive routines
function loopOk() {
	window.maxLoop = window.maxLoop-- || 100;
	if (!window.maxLoop) {
		var e = new Error("Too many loops!")
		console.error(e);
		throw e;
	};
}
*/
/*
jslint white: true, devel: true, debug: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 100
*/
(function () {

	var NUMERIC = "0123456789", // Constant used for expression parsing
		ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",  // Constant used for expression parsing
		parsers, // The collection of parser function used to transform the expresison into lambdas
		LambdasFactory, // Instantiate a single lambda object
		cachedExpressions = {}, // Collection of expressions previously cached
		parserCollection = {}, // Collection of registered parsers
		parserLookup = {}, // A lookup table between chars and registered parsers
		lambda, // function to create a lambda structure from an expressino
		run, // Runs a lambda sequence within a provided scope to obtain a value
		lesserEval; // Evaluate an textual expression within a provided scope to obtain a value

/* **********************************************************************
	Lambda Tree Generation
*/

	/*
	todo: RECURSIVE PARSERS
		Currently, it is a fluke of luck and conjecture that makes this code work.
		The "," is always handled by the "arr" parser because it is the last in the
		set of "if". As exceptions are found, parsing might need to become recursive
		and contextual to each sequence sntaxes. ie.: () [] {}
		NOTE: Refer to the parser approach used in jLexer

	todo : Refactor all parser related functions a ojects into a more cohesive structure with
		its own set of local vars
		Ex.: parser.parsers / parser.charLookup / parser.run / parser.register
	*/
	/*
	runParsers()
	Takes a string expression and runs it through a parsing routine. In this routines
	the expression is treated as a queue of chars that is handed out to individual
	parsers depending on which char is at the last index. Each parsers then modifies the
	lambda stack.
	*/
	function runParsers(exp, cursor, token, lambdas) {
		var i,
			nextParser,
			currentChar;
		for (i = 0; i < exp.length; i = i + 1) {
			nextParser = parsers.empty;
			currentChar = exp[i];
			nextParser = parserLookup[currentChar];
			if (nextParser) {
				i = nextParser.handler(exp, i, token, lambdas);
			}; // Otherwise, character is simply ignored
		}
		return lambdas;
	};

	parsers = {
		// root parser
		empty: function (exp, cursor, token, lambdas) {
			return cursor;
		},
		// variable token parser
		"var" : function (exp, cursor, token, lambdas) {
			//console.log.apply(this, arguments);
			var i,
				inChars = "_" + ALPHA,
				keepChars = inChars + NUMERIC;
			for (i = cursor; i < exp.length; i = i + 1) {
				if (keepChars.indexOf(exp[i]) < 0) {
					break;
				}
			}
			lambdas.addLambda("val", [exp.substring(cursor, i)]);
			return i - 1;
		},
		// member token parser
		"get" : function (exp, cursor, token, lambdas) {
			//console.log.apply(this, arguments);
			var i,
				keepChars = "._" + ALPHA;
			for (i = cursor; i < exp.length; i = i + 1) {
				if (keepChars.indexOf(exp[i]) < 0) {
					break;
				}
			}
			lambdas.addLambda("get", [exp.substring(cursor + 1, i)]);
			return i - 1;
		},
		"args" : function (exp, cursor, token, lambdas) {
			var char = exp[cursor];
			//console.log("args: ", char);
			if (char === "(") {
				lambdas.addLambda("call", []);
				lambdas.intoArgs();
				lambdas.newArg();
				//parsers.root(exp, cursor+1, token, lambdas)
			} else if (char === ")") {
				lambdas.exitArgs();
				//parsers.root(exp, cursor+1, token, lambdas)
			} else if (char === ",") {
				lambdas.newArg();
			}
			return cursor;
		},
		"arr" : function (exp, cursor, token, lambdas) {
			var char = exp[cursor];
			if (char === "[") {
				// Check if this new lambda is the first in the current lambda sequence
				if (lambdas.latestSequence.length) {
					// Array syntax as a value
					lambdas.addLambda("arrGet", []);
				} else {
					// Array syntax as a getter
					lambdas.addLambda("arrVal", []);
				}
				lambdas.intoArgs();
				lambdas.newArg();
			} else if (char === "]") {
				lambdas.exitArgs();
			} else if (char === ",") {
				lambdas.newArg();
			}
			return cursor;
		},
		// String token parser
		"str" : function (exp, cursor, token, lambdas) {
			var i,
				// If match the double or single quote
				outChar = exp[cursor];
			for (i = cursor + 1; i < exp.length; i = i + 1) {
				if (outChar.indexOf(exp[i]) >= 0) {
					break;
				}
			}
			lambdas.addLambda("str", [exp.substring(cursor + 1, i)]);
			return i;
		},
		// Numeric token parser
		"num" : function (exp, cursor, token, lambdas) {
			var i,
				keepChars = NUMERIC + ".xabcdefXABCDEF";
			// todo: Support for the "+" and "-" in exponent notation
			for (i = cursor; i < exp.length; i = i + 1) {
				if (keepChars.indexOf(exp[i]) < 0) {
					break;
				}
			}
			lambdas.addLambda("num", [exp.substring(cursor, i)]);
			return i - 1;
		}
	};

	/*
	registerParsers()
	Registers new parsers to the parsers collection to later be used by runParsers
	*/
	function registerParsers(parsers) {
		var parser,
			parserReg,
			iParser,
			iChar,
			chars,
			handler;
		for (iParser in parsers) {
			parser = parsers[iParser];
			chars = parser[0];
			handler = parser[1];
			parserReg = {
				chars: chars,
				handler: handler
			};
			parserCollection[iParser] = parserReg;
			for (iChar in chars) {
				parserLookup[chars[iChar]] = parserReg;
			}
		}
	};

	registerParsers([
		["_"+ALPHA, parsers["var"]],
		[".", parsers["get"]],
		["(,)", parsers["args"]],
		["[,]", parsers["arr"]],
		["'\"", parsers["str"]],
		[NUMERIC, parsers["num"]],
	]);




/* **********************************************************************
	Lambda Tree Evaluation
*/

	/*
	LambdaFactory()
	The lambdaFactory contains the state and methods necessary to create a
	lambdaTree piece by piece while an parser is analyzing an expression.
	*/
	LambdasFactory = function () {
		this.lambdas = [];
		this.latestLambda = null;
		this.latestSequence = this.lambdas;
		this.stack = [this.latestSequence];
		this.addLambda = function (id, args) {
			// Create a new lambda
			this.latestLambda = [id, args];
			//console.log("addLambda stack: ", this.stack);
			//console.log("addLambda lambdas: ", this.lambdas);
			// Add the new lambda to the current sequence
			this.latestSequence.push(this.latestLambda);
		};
		this.intoArgs = function () {
			//console.log("INTO ARGS: ", this.latestLambda);
			this.latestSequence = this.latestLambda[1];
			this.stack.push(this.latestSequence);
		};
		this.newArg = function () {
			//this.stack.pop();
			var parentSequence = this.stack[this.stack.length-1]
			this.latestSequence = [];
			parentSequence.push(this.latestSequence);
			//console.log("parentSequence", parentSequence);
		};
		this.exitArgs = function () {
			this.stack.pop();
			this.latestSequence = this.stack[this.stack.length-1]
		};
	};

	/*
	Runner
	The class used to evaluate/execute a lambda tree 
	*/
	function Runner() {

		// lambdas: The collection of lambda handlers used to execute a lambda tree
		//lambdas = {
		this.lambdas = {
			// Get a property from the global scope
			"str": function (value, scope, args) {
				return String(args[0]);
			},
			"num": function (value, scope, args) {
				return Number(args[0]);
			},
			"val": function (value, scope, args) {
				// TODO: To save space and adressing/lookup time, should content o
				// the scope be sent as parameters instead of an object ?
				return scope[0][args[0]];
			},
			// Get a member property from the current expresion value
			"get": function (value, scope, args) {
				return value[args[0]];
			},
			"call": function (value, scope, args) {
				return value.apply(this, args);
			},
			// todo: Find better handler names than arrGet and arrVal 
			"arrGet": function (value, scope, args) {
				var val;
				val = value;
				val	= val[args[args.length-1]];
				return val;
			},
			"arrVal": function (value, scope, args) {
				return new Array(args);
			}
		};
	
		this.callLambda = function (id, value, scope, args, parentValue) {
			// todo: figure out what "this" should be
			return this.lambdas[id].apply(parentValue, [value, scope, args]);
		};
	
		/*
		Start evaluating a chain of lambda operation to output a final value
		*/
		this.evalNextLambda = function (lambdaArray, index, value, scope, parentValue) {
			//console.log("evalNextLambda", lambdaArray, index, value, scope);
			var lambda,
				newValue;
			lambda = lambdaArray[index - 1];
			// Iterate across the list of arguments for this lambda
			// If an argument is an array object, it is recursed back into evalNextLambda
			// Reload into the scope object the cached value of this part of the expression
			// Execute and return the current lambda expression 
			newValue = this.callLambda(lambda[0], value, scope, this.evalArguments(lambda[1], value, scope, parentValue), parentValue);
			// If the lambda chain still has items to evaluate the next item is evaluated
			if (index < lambdaArray.length) {
				newValue = this.evalNextLambda(lambdaArray, index + 1, newValue, scope, value);
			}
			return newValue;
		};

		this.evalArguments = function (args, value, scope, parentValue) {
			//console.log("args, value, scope", args, value, scope);
			var i,
				arg,
				argValues = [];
			if (args) {
				for (i = 0; i < args.length; i = i + 1) {
					arg = args[i];
					//console.log("arg", arg);
					//console.log("arg.length", arg.length);
					// If the item is a 2 member array it is deemed to be a lambda
					// Todo: test performance impact of this type of detection
					// Todo: See if this procludes the use of arrays as values...
					if (arg.sort && arg.length > 0) {
						// Note that when evaluating each arguments, the "value" argument is set to null
						// because each arg is a fresh expression in itself
						argValues.push(this.evalNextLambda(arg, 1, null, scope, parentValue));
					} else {
						argValues.push(arg);
					}
				}
			}
			//console.log("Arguments that have been parsed.... argValue = ");
			//console.dir(argValues);
			return argValues;
		};

	};



	/*
	Compiler
	The class used to compile a lambda tree into a function
	*/
	function Compiler() {

		// lambdas: The collection of lambda handlers used to execute a lambda tree
		//lambdas = {
		this.lambdas = {
			// Get a property from the global scope
			"str": function (value, scope, args) {
				value = value + '"' + String(args[0]) + '"';
				return value;
			},
			"num": function (value, scope, args) {
				value = value + Number(args[0]);
				return value;
			},
			"val": function (value, scope, args) {
				// TODO: To save space and adressing/lookup time, should content o
				// the scope be sent as parameters instead of an object ?
				value = value + "scope." + args[0];
				return value;
			},
			// Get a member property from the current expresion value
			"get": function (value, scope, args) {
				return value + "." + args[0];
			},
			"call": function (value, scope, args) {
				return value + "(" + args.join() + ")";
			},
			// todo: Find better handler names than arrGet and arrVal 
			"arrGet": function (value, scope, args) {
				return value + "[" + args.join() + "]";
			},
			"arrVal": function (value, scope, args) {
				return value + "[" + args.join() + "]";
			}
		};

		this.callLambda = function (id, value, scope, args, parentValue) {
			// todo: figure out what "this" should be
			return this.lambdas[id].apply(parentValue, [value, scope, args]);
		};

		/*
		Start evaluating a chain of lambda operation to output a final value
		*/
		this.evalNextLambda = function (lambdaArray, index, value, scope, parentValue) {
			var lambda,
				newValue;
			lambda = lambdaArray[index - 1];
			// Iterate across the list of arguments for this lambda
			// If an argument is an array object, it is recursed back into evalNextLambda
			// Reload into the scope object the cached value of this part of the expression
			// Execute and return the current lambda expression 
			newValue = this.callLambda(lambda[0], value, scope, this.evalArguments(lambda[1], value, scope, parentValue), parentValue);
			// If the lambda chain still has items to evaluate the next item is evaluated
			if (index < lambdaArray.length) {
				newValue = this.evalNextLambda(lambdaArray, index + 1, newValue, scope, value);
			}
			return newValue;
		};

		this.evalArguments = function (args, value, scope, parentValue) {
			var i,
				arg,
				argValues = [];
			if (args) {
				for (i = 0; i < args.length; i = i + 1) {
					arg = args[i];
					// Todo: test performance impact of this type of detection
					// Todo: See if this procludes the use of arrays as values...
					if (arg.sort && arg.length > 0) {
						// Note that when evaluating each arguments, the "value" argument is set to null
						// because each arg is a fresh expression in itself
						argValues.push(this.evalNextLambda(arg, 1, "", scope, parentValue));
					} else {
						argValues.push(arg);
					}
				}
			}
			return argValues;
		};

	};

/* **********************************************************************
	Public object and methods
*/

	lambda = function (exp) {
		var lambdas = new LambdasFactory();
		return runParsers(exp, 0, "", lambdas);
	};

	// Start executing the lambda tree starting from the root
	// Start executing the lambda tree starting from the root
	run = function (lambdaArray, baseScope) {
		if (!this.compile) {
			var runner = new Runner();
			return runner.evalNextLambda(lambdaArray, 1, null, [baseScope]);
		} else {
			var compiler,
				code,
				func,
				value;
			compiler = new Compiler();
			code = compiler.evalNextLambda(lambdaArray, 1, "", [baseScope]);
			//console.log("code: ", code);
			func = new Function("scope", "return " + code + ";");
			//console.log("func: ", func.toString());
			value = func(baseScope);
			//console.log("value: ", value);
			return value;
		}
	};

	lesserEval = function (expression, data) {
		// Try to find the expression from the cache before generating its tree
		var lambdaTree = cachedExpressions[expression];
		if (!lambdaTree) {
			// If the expression isn't in the cache, it parses it and then cache it
			lambdaTree = lambda(expression).lambdas;
			cachedExpressions[expression] = lambdaTree;
		}
		//console.log("lambdaTree");
		//console.dir(lambdaTree);
		// Start executing the tree
		return run(lambdaTree, data);
	};

	this.lambda = {
		"compile": false,
		"eval": lesserEval,
		"run": run,
		"lambda": lambda
	};

}());
