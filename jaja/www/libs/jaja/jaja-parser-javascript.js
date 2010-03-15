/*
	Parser definition for Javascript for the JaJa Meta Interpreter

	Note: Handlers are called with the parser object as the "this"
*/
(function (jaja) {
	var handlers,
		NUMERIC = "0123456789", // Constant used for expression parsing
		ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";  // Constant used for expression parsing

	if (jaja) {

		handlers = {
			empty: function (exp, cursor, lambdas) {
			},
			"white" : function (exp, cursor, lambdas) {
			},
			"variable" : function (exp, cursor, lambdas) {
				//console.log.apply(this, arguments);
				var i,
					varName,
					// Todo: Lookup the real rules in the Javascript RFC
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
				//loopOk();
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
						return;
					}
					cursor.pos++;
					this.next(exp, cursor, lambdas, ",)");
				}
			},
			"arr" : function (exp, cursor, lambdas) {
				//loopOk();
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
						return;
					}
					cursor.pos++;
					this.next(exp, cursor, lambdas, ",]");
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
					isExponent = false,
					keepChars = NUMERIC + ".xabcdefXABCDEF";
				for (i = cursor.pos; i < exp.length; i = i + 1) {
					if (exp[i].toUpperCase() === "E") {
						isExponent = true;
						keepChars = keepChars + "+-";
					}
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
				}
				lambdas.intoArgs();
				lambdas.newArg();
			}
		};

		jaja.parsers.javascript = {
			handlers: [
				["_$"+ALPHA, handlers.variable],
				[" ", handlers.white],
				[".", handlers.get],
				[";", handlers.end],
				["(", handlers.parens],
				["[", handlers.arr],
				["'\"", handlers.str],
				["+-/*%?&|^~><", handlers.oper],
				[NUMERIC, handlers.num]
			]
		};

	}
}(this.jaja));
