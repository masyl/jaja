/*
	jaja.Parser
	Code parser routines for the JaJa library

	Parser:
		The parser is responsible for transforming 
	Handler:
		A parser is composed of multiple parsing "handlers" which are each responsible to parse one feature of the syntax. Handlers are applied recursively by the parse.
	Cursor:
		The cursor object keeps track of where the parsing routine is positionned. The cursor is a statefull object and tracks the line number, char number and overall position.
*/
(function (jaja) {
	if (jaja) {
		jaja.Parser = function (parser) {

			var handlers = {}, // The collection of handlers used to parse the code
				handlerCollection = {}, // Collection of registered handlers
				handlerLookup = {}; // A lookup table between chars and registered handlers

			// Note: exceptions param is used for breaking out of recursion in arguments based lamdas such as parens and arrays
			// The cursor param is an object containing mutliple cursor values
			// cursor.pos / cursor.char / cursor.line
			this.next = function (exp, cursor, lambdas, exceptions) {
				//loopOk(); // Recursion failsafe
				var nextHandler,
					currentChar;
				for (; cursor.pos < exp.length; cursor.pos++) {
					nextHandler = handlers.empty;
					currentChar = exp[cursor.pos];
					// Keep a cursor of line and char position for throwing meaningfull errors
					if (currentChar === "\n") {
						cursor.line++;
						cursor.char = 1;
					} else {
						cursor.char++;
					}
					if (exceptions.indexOf(currentChar) < 0) {
						// No escape char found, parsing continues as usual
						nextHandler = handlerLookup[currentChar];
						if (nextHandler) {
							nextHandler.fn.call(this, exp, cursor, lambdas);
						} else {
							// Otherwise, character is simply ignored
							throw("Syntax error. Unparsable char at " + cursor.line + "-" + cursor.char + " : " + currentChar);
						}
					} else {
						// Return back to the previous handler
						return;
					}
				}
			}
	
			/*
			parse()
			Takes a string expression and runs it through a parsing routine. In this routines
			the expression is treated as a queue of chars that is handed out to individual
			handlers depending on which char is at the last index. Each handlers then modifies the
			lambda stack.
			*/
			this.parse = function (exp, LambdasFactory) {
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
				this.next(exp, cursor, lambdas, "");
				console.log("lambdas: ", lambdas);
				console.dir(lambdas.lambdas);
				return lambdas;
			}
	
			/*
			registerHandlers()
			Registers new handlers to the handlers collection to later be used by the parse method
			*/
			function registerHandlers(handlers) {
				var handler,
					handlerReg,
					iHandler,
					iChar,
					chars,
					handlerMedthod;
				for (iHandler in handlers) {
					if (handlers.hasOwnProperty(iHandler)) {
						handler = handlers[iHandler];
						chars = handler[0];
						handlerFn = handler[1];
						handlerReg = {
							chars: chars,
							fn: handlerFn
						};
						handlerCollection[iHandler] = handlerReg;
						for (iChar in chars) {
							if (chars.hasOwnProperty(iChar)) {
								handlerLookup[chars[iChar]] = handlerReg;
							}
						}
					}
				}
			}
			// Registers the parser definition supplied to the constructor
			registerHandlers(parser.handlers);
		}
	}
}(this.jaja));
