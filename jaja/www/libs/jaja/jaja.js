/*
	JaJa - Javascript in Javascript

	JaJa is a meta-interpreter. In other words, JaJa is a javascript
	interpreter built in javasript. It parses javascript code and converts
	it to a symbolic structure called a lambda tree. From there, it can
	re-compile it or execute as "managed code". When code goes through JaJa
	it can undergo various transformation in order to control its capabilities.

	"Javascript is good enough for itself!", Mathieu Sylvain 2010

	VARIOUS TODOS:
		- Release the website
		- Start logging bugs and issues
		- Fill github wiki
		- Convert all project files to UTF 8
		- Add "Evil is Eval" rationnal in the web documentation
		- Review documentation for typos
		- Add a download page in the web documenation
		- Add a contribute page in the web documenation
		- Add a roadmap page in the web documenation


Dont try to render or execute empty statements;

HANDLE CLOSING PARENS WHEN HANDLING ARRAYS

*/
// This little helper routine is usefull when strugling with
// loops caused by broken recursive routines

/*
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
*/
"use strict";
/*
jslint white: true, devel: true, debug: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 100
*/
/*
global console
*/
(function (global) {

/* **********************************************************************
	Lambda Tree Generation
*/


/* **********************************************************************
	Lambda Tree Evaluation
*/

	/*
	LambdaFactory()
	The lambdaFactory contains the state and methods necessary to create a
	lambdaTree piece by piece while an parser is analyzing an expression.
	The lambda tree also keeps a list of scope variables.
	*/
	// TODO: "Arg" should probably changed to "Seq" for Sequence 
	function LambdasFactory() {
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
					this.stack.pop();
					last = this.stack[this.stack.length-1];
				}
			}
			// Pop the found sequence out of the stack
			this.stack.pop();
			this.latestSequence = this.stack[this.stack.length-1][0];
		};
	};


/* **********************************************************************
	Public object and methods
*/

	function JaJa() {

		var cachedExpressions = {}; // Collection of expressions previously cached

		// The collection of interpreters available to run the parsed code.
		// By default, the core library has none.
		this.interpreters = {};

		// The collection of parsers available to tranform source code
		// into a lambda tree model
		this.parsers = {};

		// This empty parser constructor is a placeholder for an external module
		this.Parser = function() {};

		// Todo: The taxonomy parse/run/compile/evaluate methods should be 
		// revised in order to allow multiple parsers and interpreters

		// function to create a lambda structure from an expressino
		this.parse = function (exp) {
			// TODO: Javascript is currently the default, but this should be configurable soon
			var parser = new this.Parser(this.parsers.javascript)
			return parser.parse(exp, LambdasFactory);
		};

		// Runs a lambda sequence within a provided scope to obtain a value
		this.run = function (lambdaArray, baseScope) {
			if (!this.compile) {
				var runner = new this.interpreters.runner();
				// Todo: Find a better/simpler way to start the evaluation process
				return runner.evalNextLambda(lambdaArray, 1, null, [baseScope]);
			} else {
				var compiler,
					code,
					func,
					value;
				compiler = new this.interpreters.compiler();
				// Todo: Find a better/simpler way to start the evaluation process
				code = compiler.evalNextLambda(lambdaArray, 1, "", [baseScope]);
				var scope = {
					"get" : function(varName) {
						return baseScope[varName];
					}
				};
				//console.log(code);
				var preCode = "var scope = this;";
				// Todo: The Function constructor should be externalized from the core library
				func = new Function(preCode + code + "return out;");
				value = func.call(scope);
				//console.log("value: ", value);
				return value;
			}
		};

		// Compiles javascript into javascript
		this.compile = function (expression) {
			var compiler,
				code,
				lambdaTree = cachedExpressions[expression];
			if (!lambdaTree) {
				// If the expression isn't in the cache, it parses it and then cache it
				lambdaTree = this.jaja(expression).lambdas;
				cachedExpressions[expression] = lambdaTree;
			}
			compiler = new this.interpreters.compiler();
			code = compiler.evalNextLambda(lambdaTree, 1, "");
			return code;
		};

		// Evaluate an textual expression within a provided scope to obtain a value
		this.evaluate = function (expression, data) {
			// Try to find the expression from the cache before generating its tree
			var lambdaTree = cachedExpressions[expression];
			if (!lambdaTree) {
				// If the expression isn't in the cache, it parses it and then cache it
				lambdaTree = this.parse(expression).lambdas;
				cachedExpressions[expression] = lambdaTree;
			}
			// Start executing the tree
			return this.run(lambdaTree, data);
		};

	}

	// Create the main jaja variable in the global scope
	global.jaja = new JaJa();

}(this));
