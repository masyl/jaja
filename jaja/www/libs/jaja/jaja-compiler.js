(function (jaja) {
	/*
	Compiler
	The class used to compile a lambda tree into a function
	*/
	if (jaja) {
		jaja.interpreters.compiler = function() {
	
			// lambdas: The collection of lambda handlers used to execute a lambda tree
			//lambdas = {
			this.lambdas = {
				"root": function (value, scope, args, lambdaMeta) {
					// todo: find a bullet proof way to name the buffer var of the last statement
					var code = "",
						varCode = [],
						iVar;
					// Render root scope variables
					for (iVar in lambdaMeta.root.scope) {
						if (lambdaMeta.root.scope.hasOwnProperty(iVar)) {
							varCode.push(iVar + " = scope.get('" + iVar + "')");
						}
					}
					if (varCode.length) {
						code = code + "var " + varCode.join(",\r\n") + ";\r\n";
					}
					// set the sequence "out" to the last not-empty statement
					for (var i=args.length; i>0; i--) {
						if (args[i-1].length) {
							args[i-1] = "var out = " + args[i-1];
							break;
						}
					}
					// Render the list of root statements
					code = code + args.join(";\r\n") + ";\r\n";
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
	
		}
	}
}(this.jaja));
