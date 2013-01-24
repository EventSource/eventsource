/* Jison generated parser */
var eventstream = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"events":4,"EOF":5,"event":6,"eol":7,"row":8,"field":9,"comment":10,"colon":11,"any-string":12,"name-string":13,"any-char":14,"name-char":15,"char":16,"space":17,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"eol",11:"colon",16:"char",17:"space"},
productions_: [0,[3,2],[4,3],[4,2],[6,2],[6,1],[8,1],[8,1],[10,3],[10,2],[9,4],[9,3],[9,2],[12,1],[12,2],[13,1],[13,2],[14,1],[14,1],[14,1],[15,1],[15,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return this.$; 
break;
case 2: this.$ = $$[$0-2]; this.$.push($$[$0-1]); 
break;
case 3: this.$ = [$$[$0-1]]; 
break;
case 4:
			this.$ = $$[$0-1];
	 		if ($$[$0].name == 'comment') this.$.comments.unshift($$[$0].value);
	 		else if ($$[$0].name == 'data') this.$.data += $$[$0].value + '\n';
	 		else if ($$[$0].name == 'event') this.$.event = $$[$0].value;
	 		else if ($$[$0].name == 'id') this.$.id = $$[$0].value;
	 		else if ($$[$0].name == 'retry') this.$.field = $$[$0].value;
		
break;
case 5:
	 		this.$ = {
	 			comments: [],
	 			data: '',
	 		};
	 		if ($$[$0].name == 'comment') this.$.comments.unshift($$[$0].value);
	 		else if ($$[$0].name == 'data') this.$.data += $$[$0].value + '\n';
	 		else if ($$[$0].name == 'event') this.$.event = $$[$0].value;
	 		else if ($$[$0].name == 'id') this.$.id = $$[$0].value;
	 		else if ($$[$0].name == 'retry') this.$.field = $$[$0].value;
		
break;
case 8: this.$ = { name: 'comment', value: $$[$0] } 
break;
case 9: this.$ = { name: 'comment', value: '' } 
break;
case 10: this.$ = { name: $$[$0-3], value: $$[$0-1][0] === ' ' ? $$[$0-1].slice(1) : $$[$0-1] } 
break;
case 11: this.$ = { name: $$[$0-2], value: '' } 
break;
case 12: this.$ = { name: $$[$0-1], value: '' } 
break;
case 14: this.$ = $$[$0-1] + $$[$0]; 
break;
case 16: this.$ = $$[$0-1] + $$[$0]; 
break;
}
},
table: [{3:1,4:2,6:3,8:4,9:5,10:6,11:[1,8],13:7,15:9,16:[1,10],17:[1,11]},{1:[3]},{5:[1,12],6:13,8:4,9:5,10:6,11:[1,8],13:7,15:9,16:[1,10],17:[1,11]},{7:[1,14],8:15,9:5,10:6,11:[1,8],13:7,15:9,16:[1,10],17:[1,11]},{7:[2,5],11:[2,5],16:[2,5],17:[2,5]},{7:[2,6],11:[2,6],16:[2,6],17:[2,6]},{7:[2,7],11:[2,7],16:[2,7],17:[2,7]},{7:[1,17],11:[1,16],15:18,16:[1,10],17:[1,11]},{7:[1,20],11:[1,22],12:19,14:21,16:[1,23],17:[1,24]},{7:[2,15],11:[2,15],16:[2,15],17:[2,15]},{7:[2,20],11:[2,20],16:[2,20],17:[2,20]},{7:[2,21],11:[2,21],16:[2,21],17:[2,21]},{1:[2,1]},{7:[1,25],8:15,9:5,10:6,11:[1,8],13:7,15:9,16:[1,10],17:[1,11]},{5:[2,3],11:[2,3],16:[2,3],17:[2,3]},{7:[2,4],11:[2,4],16:[2,4],17:[2,4]},{7:[1,27],11:[1,22],12:26,14:21,16:[1,23],17:[1,24]},{7:[2,12],11:[2,12],16:[2,12],17:[2,12]},{7:[2,16],11:[2,16],16:[2,16],17:[2,16]},{7:[1,28],11:[1,22],14:29,16:[1,23],17:[1,24]},{7:[2,9],11:[2,9],16:[2,9],17:[2,9]},{7:[2,13],11:[2,13],16:[2,13],17:[2,13]},{7:[2,17],11:[2,17],16:[2,17],17:[2,17]},{7:[2,18],11:[2,18],16:[2,18],17:[2,18]},{7:[2,19],11:[2,19],16:[2,19],17:[2,19]},{5:[2,2],11:[2,2],16:[2,2],17:[2,2]},{7:[1,30],11:[1,22],14:29,16:[1,23],17:[1,24]},{7:[2,11],11:[2,11],16:[2,11],17:[2,11]},{7:[2,8],11:[2,8],16:[2,8],17:[2,8]},{7:[2,14],11:[2,14],16:[2,14],17:[2,14]},{7:[2,10],11:[2,10],16:[2,10],17:[2,10]}],
defaultActions: {12:[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:/* skip leading byte order mark */
break;
case 1:return 17;
break;
case 2:return 11;
break;
case 3:return 7;
break;
case 4:return 16;
break;
case 5:return 5;
break;
case 6:return 'INVALID';
break;
}
};
lexer.rules = [/^(?:^\uFEFF)/,/^(?:\u0020)/,/^(?::)/,/^(?:(\u000D\u000A|\u000D|\u000A))/,/^(?:[\u0000-\u0009\u000B-\u000C\u000E-\u0019\u0021-\u0039\u003B-\u10FFFF])/,/^(?:$)/,/^(?:.)/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = eventstream;
exports.Parser = eventstream.Parser;
exports.parse = function () { return eventstream.parse.apply(eventstream, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    var source, cwd;
    if (typeof process !== 'undefined') {
        source = require('fs').readFileSync(require('path').resolve(args[1]), "utf8");
    } else {
        source = require("file").path(require("file").cwd()).join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}