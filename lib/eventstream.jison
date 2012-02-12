%lex
%%

^\uFEFF					/* skip leading byte order mark */
\u0020					return 'space';
":"							return 'colon';
(\u000D\u000A|\u000D|\u000A) return 'eol';
[\u0000-\u0009\u000B-\u000C\u000E-\u0019\u0021-\u0039\u003B-\u10FFFF]	return 'char';
<<EOF>>					return 'EOF';
.								return 'INVALID';

/lex

%start expressions

%% /* language grammar */

expressions
	: events EOF
		{ return $$; }
	;

events
	: events event eol
		{ $$ = $events; $$.push($event); }
	| event eol
		{ $$ = [$event]; }
	;

event
	: event row
		{{
			$$ = $event;
	 		if ($row.name == 'comment') $$.comments.unshift($row.value);
	 		else if ($row.name == 'data') $$.data += $row.value + '\n';
	 		else if ($row.name == 'event') $$.event = $row.value;
	 		else if ($row.name == 'id') $$.id = $row.value;
	 		else if ($row.name == 'retry') $$.field = $row.value;
		}}
	| row
		{{
	 		$$ = {
	 			comments: [],
	 			data: '',
	 		};
	 		if ($row.name == 'comment') $$.comments.unshift($row.value);
	 		else if ($row.name == 'data') $$.data += $row.value + '\n';
	 		else if ($row.name == 'event') $$.event = $row.value;
	 		else if ($row.name == 'id') $$.id = $row.value;
	 		else if ($row.name == 'retry') $$.field = $row.value;
		}}
	;

row
	: field
	| comment
	;

comment
	: colon any-string eol
		{ $$ = { name: 'comment', value: $3 } }
	| colon eol
		{ $$ = { name: 'comment', value: '' } }
	;

field
	: name-string colon any-string eol
		{ $$ = { name: $1, value: $3[0] === ' ' ? $3.slice(1) : $3 } }
	| name-string colon eol
		{ $$ = { name: $1, value: '' } }
	| name-string eol
		{ $$ = { name: $1, value: '' } }
	;

any-string
	: any-char
	| any-string any-char
		{ $$ = $1 + $2; }
	;

name-string
	: name-char
	| name-string name-char
		{ $$ = $1 + $2; }
	;

any-char
	: colon
	| char
	| space
	;

name-char
	: char
	| space
	;
