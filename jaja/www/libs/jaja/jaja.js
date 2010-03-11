/*
	jaja v0.7.0

	Read "release-notes.txt" for more details.

	"Javascript is good enough for itself!", Mathieu Sylvain 2010

	VARIOUS TODOS:
		- Convrrt all project files to UTF 8
		- Add "Evil is Eval" rationnal in the web documentation
		- Review documentation for typos
		- Add a download page in the web documenation
		- Add a contribute page in the web documenation
		- Add a roadmap page in the web documenation


Dont try to render or execute empty statements;


*/
// This little helper routine is usefull when strugling with
// loops caused by broken recursive routines
window.maxLoop = 100;
function loopOk() {
//	console.log("maxLoop: ", window.maxLoop);
	window.maxLoop = window.maxLoop - 1;
	if (window.maxLoop===0) {
		var e = new Error("Too many loops!")
		console.error(e);
		throw e;
	}
}
/*
*/
"use strict";
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
		jaja, // function to create a lambda structure from an expressino
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
	function runParsers(exp) {
		var cursor,
			lambdas;
		lambdas = new LambdasFactory();
		lambdas.addLambda("root", []);
		lambdas.intoArgs();
		lambdas.newArg();
		cursor = {
			pos : 0,
			char : 1,
			line : 1
		};
		parseNext(exp, cursor, lambdas, "");
		return lambdas;
	};
	// Note: exceptions param is used for breaking out of recursion in arguments based lamdas such as parens and arrays
	// The cursor param is an object containing mutliple cursor values
	// cursor.pos / cursor.char / cursor.line
	function parseNext(exp, cursor, lambdas, exceptions) {
		var nextParser,
			currentChar;
		for (; cursor.pos < exp.length; cursor.pos++) {
//			console.log("cursor.pos", cursor.pos, lambdas.lambdas);
			nextParser = parsers.empty;
			currentChar = exp[cursor.pos];
			// Keep a cursor of line and char position for throwing meaningfull errors
			if (currentChar === "\n") {
				cursor.line++;
				cursor.char = 1;
			} else {
				cursor.char++;
			}
			if (exceptions.indexOf(currentChar) >= 0) {
				// change order of conditionnal statement to make the return needless
				return;
			} else {
				nextParser = parserLookup[currentChar];
				if (nextParser) {
					nextParser.handler(exp, cursor, lambdas);
				} else {
					// Otherwise, character is simply ignored
					throw("Syntax error. Unparsable char at " + cursor.line + "-" + cursor.char + " : " + currentChar);
				};
			}
		}
	};

	parsers = {
		empty: function (exp, cursor, lambdas) {
		},
		"white" : function (exp, cursor, lambdas) {
		},
		"var" : function (exp, cursor, lambdas) {
			//console.log.apply(this, arguments);
			var i,
				varName,
				inChars = "_$" + ALPHA,
				keepChars = inChars + NUMERIC;
			for (i = cursor.pos; i < exp.length; i = i + 1) {
				if (keepChars.indexOf(exp[i]) < 0) {
					break;
				}
			}
			varName = exp.substring(cursor.pos, i);
			// Add this variable the root scope, overwrite it if it already exist
			// Todo: better scope management, not just a root scope
			lambdas.lambdas.scope[varName] = {};
			lambdas.addLambda("val", [varName]);
			cursor.pos = i-1;
		},
		"get" : function (exp, cursor, lambdas) {
			var i,
				keepChars = "._" + ALPHA;
			for (i = cursor.pos; i < exp.length; i = i + 1) {
				if (keepChars.indexOf(exp[i]) < 0) {
					break;
				}
			}
			lambdas.addLambda("get", [exp.substring(cursor.pos + 1, i)]);
			cursor.pos = i-1;
		},
		"parens" : function (exp, cursor, lambdas) {
			var sequence,
				char;
			while (cursor.pos < exp.length) {
				char = exp[cursor.pos];
				if (char === "(") {
					// Check if this new lambda is the first in the current lambda sequence
					if (lambdas.latestSequence.length) {
						lambdas.addLambda("call", []);
					} else {
						lambdas.addLambda("sub", []);
					}
					sequence = lambdas.intoArgs();
					lambdas.newArg();
				} else if (char === ",") {
					lambdas.newArg(sequence);
				} else if (char === ")") {
					lambdas.exitArgs(sequence);
				}
				cursor.pos++;
				// Todo: Ever since the cursor became an object, this re-assignement is not necessary
				// It should be removed everywhere
				 parseNext(exp, cursor, lambdas, ",)");
			}
		},
		"arr" : function (exp, cursor, lambdas) {
			var sequence,
				char;
			while (cursor.pos < exp.length) {
				char = exp[cursor.pos];
				if (char === "[") {
					// Check if this new lambda is the first in the current lambda sequence
					if (lambdas.latestSequence.length) {
						lambdas.addLambda("arrGet", []);
					} else {
						lambdas.addLambda("arrVal", []);
					}
					sequence = lambdas.intoArgs();
					lambdas.newArg();
				} else if (char === ",") {
					lambdas.newArg(sequence);
				} else if (char === "]") {
					lambdas.exitArgs(sequence);
				}
				cursor.pos++;
				parseNext(exp, cursor, lambdas, ",]")
			}
		},
		"str" : function (exp, cursor, lambdas) {
			var i,
				// If match the double or single quote
				outChar = exp[cursor.pos];
			for (i = cursor.pos + 1; i < exp.length; i = i + 1) {
				if (outChar.indexOf(exp[i]) >= 0) {
					break;
				}
			}
			lambdas.addLambda("str", [exp.substring(cursor.pos + 1, i)]);
			cursor.pos = i;
		},
		// Numeric parser
		"num" : function (exp, cursor, lambdas) {
			var i,
				keepChars = NUMERIC + ".xabcdefXABCDEF";
			for (i = cursor.pos; i < exp.length; i = i + 1) {
				if (keepChars.indexOf(exp[i]) < 0) {
					break;
				}
			}
			lambdas.addLambda("num", [exp.substring(cursor.pos, i)]);
			cursor.pos = i-1;
		},
		// Statement End Parser
		"end" : function (exp, cursor, lambdas) {
			lambdas.newArg();
		},
		// Operator parser
		"oper" : function (exp, cursor, lambdas) {
			// Todo: As operators support grows, this sequence of if will
			// need to be replaced by a hash map pattern
			var chr = exp[cursor.pos];
			if (chr==="+") {
				lambdas.addLambda("oper-add", []);
			} else if (chr==="-") {
				lambdas.addLambda("oper-substract", []);
			} else if (chr==="*") {
				lambdas.addLambda("oper-multiply", []);
			} else if (chr==="/") {
				lambdas.addLambda("oper-divide", []);
			} else if (chr==="%") {
				lambdas.addLambda("oper-modulo", []);
			};
			lambdas.intoArgs();
			lambdas.newArg();
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
		["_$"+ALPHA, parsers["var"]],
		[" ", parsers["white"]],
		[".", parsers["get"]],
		[";", parsers["end"]],
		["(", parsers["parens"]],
		["[", parsers["arr"]],
		["'\"", parsers["str"]],
		["+-/*%?&|^~><", parsers["oper"]],
		[NUMERIC, parsers["num"]],
	]);


/* **********************************************************************
	Lambda Tree Evaluation
*/

	/*
	LambdaFactory()
	The lambdaFactory contains the state and methods necessary to create a
	lambdaTree piece by piece while an parser is analyzing an expression.
	The lambda tree also keeps a list of scope variables.
	*/
	LambdasFactory = function () {
		this.lambdas = [];
		this.lambdas.scope = {};
		this.latestLambda = null;
		this.latestSequence = this.lambdas;
		this.stack = [this.latestSequence];
 		this.addLambda = function (id, args) {
			// Create a new lambda
			this.latestLambda = [id, args];
			this.latestLambda.root = this.lambdas;
			this.latestSequence.push(this.latestLambda);
		};
		this.intoArgs = function () {
			//console.log("INTO ARGS: ", this.latestLambda);
			this.latestSequence = this.latestLambda[1];
			this.stack.push(this.latestSequence);
			return this.latestSequence;
		};
		this.newArg = function (sequence) {
			var last;
			if (sequence) {
				last = this.stack[this.stack.length-1];
				while (last && last !== sequence) {
					this.stack.pop();
					last = this.stack[this.stack.length-1];
				}
			}
			var parentSequence = this.stack[this.stack.length-1];
			this.latestSequence = [];
			parentSequence.push(this.latestSequence);
		};
		this.exitArgs = function (sequence) {
			// Roll back stack to the reference sequence
			var last;
			if (sequence) {
				last = this.stack[this.stack.length-1];
				while (last && last !== sequence) {
//					console.log("pop seq:", this.stack[this.stack.length-1]);
					this.stack.pop();
					last = this.stack[this.stack.length-1];
				}
			}
			// Pop the found sequence out of the stack
			this.stack.pop();

//			console.log("pop", this.stack[this.stack.length-1]);
			this.latestSequence = this.stack[this.stack.length-1][0];

//			this.latestSequence = this.stack[this.stack.length-1]; // Works for get, not for 
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
			"root": function (value, scope, args) {
				return args[args.length];
			},
			"oper-add": function (value, scope, args) {
				return value + args[0];
			},
			"oper-substract": function (value, scope, args) {
				return value - args[0];
			},
			"oper-divide": function (value, scope, args) {
				return value / args[0];
			},
			"oper-multiply": function (value, scope, args) {
				return value * args[0];
			},
			"oper-modulo": function (value, scope, args) {
				return value % args[0];
			},
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
			"sub": function (value, scope, args) {
				return args[args.length-1];
			},
			// todo: Find better handler names than arrGet and arrVal 
			"arrGet": function (value, scope, args) {
				return value[args[args.length-1]];
			},
			"arrVal": function (value, scope, args) {
				return new Array(args);
			}
		};

		this.callLambda = function (id, value, scope, args, parentValue) {
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
			"root": function (value, scope, args, lambdaMeta) {
				// todo: find a bullet proof way to name the buffer var of the last statement
				var code = "",
					varCode = [],
					iVar,
					lastStatement = "var out = " + args.pop() + ";";
				// Render root scope variables
				for (iVar in lambdaMeta.root.scope) {
					varCode.push(iVar + " = scope.get('" + iVar + "')");
				};
				if (varCode.length) {
					code = code + "var " + varCode.join(",\r\n") + ";\r\n";
				}
				// Render the list of root statements
				code = code + args.join(";\r\n") + ";\r\n" + lastStatement;
				return code;
			},
			"oper-add": function (value, scope, args, lambdaMeta) {
				value = value + ' + ' + String(args[0]);
				return value;
			},
			"oper-substract": function (value, scope, args, lambdaMeta) {
				value = value + ' - ' + String(args[0]);
				return value;
			},
			"oper-multiply": function (value, scope, args, lambdaMeta) {
				value = value + ' * ' + String(args[0]);
				return value;
			},
			"oper-divide": function (value, scope, args, lambdaMeta) {
				value = value + ' / ' + String(args[0]);
				return value;
			},
			"oper-modulo": function (value, scope, args, lambdaMeta) {
				value = value + ' % ' + String(args[0]);
				return value;
			},
			// Get a property from the global scope
			"str": function (value, scope, args, lambdaMeta) {
				value = value + '"' + String(args[0]) + '"';
				return value;
			},
			"num": function (value, scope, args, lambdaMeta) {
				value = value + Number(args[0]).toString();
				return value;
			},
			"val": function (value, scope, args, lambdaMeta) {
				// TODO: To save space and adressing/lookup time, should content o
				// the scope be sent as parameters instead of an object ?
				value = value + args[0].toString();
				return value;
			},
			// Get a member property from the current expresion value
			"get": function (value, scope, args, lambdaMeta) {
				return value + "." + args[0].toString();
			},
			"call": function (value, scope, args, lambdaMeta) {
				return value + "(" + args.join(", ") + ")";
			},
			"sub": function (value, scope, args, lambdaMeta) {
				return value + "(" + args.join(", ") + ")";
			},
			// todo: Find better handler names than arrGet and arrVal 
			"arrGet": function (value, scope, args, lambdaMeta) {
				return value + "[" + args.join(", ") + "]";
			},
			"arrVal": function (value, scope, args, lambdaMeta) {
				return value + "[" + args.join(", ") + "]";
			}
		};

		this.callLambda = function (id, value, scope, args, lambdaMeta) {
//			console.log("callLambda: ", id);
			return this.lambdas[id].apply(this, [value, scope, args, lambdaMeta]);
		};

		/*
		Start evaluating a chain of lambda operation to output a final value
		*/
		this.evalNextLambda = function (lambdaArray, index, value, scope) {
			var lambda,
				newValue;
			lambda = lambdaArray[index - 1];
			// Iterate across the list of arguments for this lambda
			// If an argument is an array object, it is recursed back into evalNextLambda
			// Reload into the scope object the cached value of this part of the expression
			// Execute and return the current lambda expression 
//			console.log("lambda: ", lambdaArray);
//			console.log("lambda: ", lambdaArray, lambda, index);
//			console.dir(lambda);
			newValue = this.callLambda(lambda[0], value, scope, this.evalArguments(lambda[1], value, scope), lambda);
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

	jaja = function (exp) {
		return runParsers(exp);
	};

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
			var scope = {
				"get" : function(varName) {
					return baseScope[varName];
				}
			};
			//console.log(code);
			var preCode = "var scope = this;"
			func = new Function(preCode + code + "return out;");
			value = func.call(scope);
			//console.log("value: ", value);
			return value;
		}
	};

	compile = function (expression) {
		var compiler,
			code,
			lambdaTree = cachedExpressions[expression];
		if (!lambdaTree) {
			// If the expression isn't in the cache, it parses it and then cache it
			lambdaTree = jaja(expression).lambdas;
			cachedExpressions[expression] = lambdaTree;
		}
//		console.log("lambdaTree");
//		console.dir(lambdaTree);
		compiler = new Compiler();
		code = compiler.evalNextLambda(lambdaTree, 1, "");
		return code;
	};

	jajaEval = function (expression, data) {
		// Try to find the expression from the cache before generating its tree
		var lambdaTree = cachedExpressions[expression];
		if (!lambdaTree) {
			// If the expression isn't in the cache, it parses it and then cache it
			lambdaTree = jaja(expression).lambdas;
			cachedExpressions[expression] = lambdaTree;
		}
//		console.log("lambdaTree");
//		console.dir(lambdaTree);
		// Start executing the tree
		return run(lambdaTree, data);
	};

	this.jaja = {
		"useCompiler": false,
		"compile": compile,
		"eval": jajaEval,
		"run": run
	};

}());
