(function (jaja) {
	/*
	Runner
	The class used to evaluate/execute a lambda tree 
	*/
	if (jaja) {
		jaja.interpreters.runner = function () {
	
			// lambdas: The collection of lambda handlers used to execute a lambda tree
			this.lambdas = {
				"root": function (value, scope, args) {
					for (var i=args.length; i>0; i--) {
						if (typeof(args[i-1]) !== "undefined") {
							return args[i-1];
						}
					}
					return undefined;
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
				"oper-equal": function (value, scope, args) {
					return value == args[0];
				},
				"oper-assign": function (value, scope, args) {
					return value = args[0];
				},
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
						// If the item is a 2 member array it is deemed to be a lambda
						// Todo: This sort of silly detection is a good argument for using an richer object instead
						// of an array to represent the lambda tree
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
		}
	}
}(jaja));
