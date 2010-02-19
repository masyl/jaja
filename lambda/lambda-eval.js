/*global console */
"use strict";
(function(window) {


	var evalLambda = function evalLambda(exp, data) {
		var tree = lambdaToTree(exp);
		console.dir(tree);
	};

	var states = {
		"string" : {
			id: "string",
			step: function (char, stateStack) {
				return this;
			}
			// if anything other than " continue state
			// else stop state
			/*
			step: function (currentToken, nextChar) {
			}
			*/
		},
		"numeric" : {
			id: "numeric",
			step: function (char, stateStack) {
				return this;
			}
			// if num or . continue state
			// else stop state
		},
		"member" : {
			id: "member",
			step: function (char, stateStack) {
				if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_.".indexOf(char.toUpperCase()) + 1) {
					return this;
				} else {
					return states.base;
				}
			}
			// if alphanum continue state
			// if ( switch to function state
			// if . ???
			// else stop state
		},
		"base" : {
			id: "base",
			step: function (char) {
				if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ_".indexOf(char.toUpperCase()) + 1) {
					return states.member;
				} else if ('"'.indexOf(char) + 1) {
					return states.string;
				} else if ('('.indexOf(char) + 1) {
					return states.string;
				} else if ("1234567890".indexOf(char) + 1) {
					return states.numeric;
				}
				throw ("unknown state change!");
			}
			// if alpha	set member state
			// if numeric set numeric state
			// if " set string state
			// else throw error
		}
	};


	var lambdaToTree = function lambdaToTree(exp) {
		var i,
			token = "",
			state,
			nextState,
			char,
			tree;

		state = states.base;
		nextState = state;
		tree = {
		};
		console.log("exp:", exp);

		var closeState = function closeState(state, token, tree) {
		};

		for (i = 0; i < exp.length; i = i + 1) {
			char = exp[i];
			nextState = state.step(char);
			if (state === nextState) {
				token = token + char;
				console.log(char + " = state not changed", state, token);
			} else {
				console.log(char + " = state change from ", state, "to", nextState, token);
				i = i - 1;
				//token = char;
				state = nextState;
			}
			//console.log("nextState :", nextState, char);
		}
		if (token.length > 0) {
			closeState(state, token, tree);
		}
		return tree;

		/*
		var charsets = {};
		charsets.alpha = {
				chars: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
			},
			"num": {
				chars: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456"
			},
			"alphanum": {
				chars: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
			},
		}
		*/
	};


})(this);
