%lex
%%

^\uFEFF					/* skip leading byte order mark */
\u0020					return 'space';
\u000D?\u000A		return 'eol';
":"							return 'colon';
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
	: colon nullablespace any-string eol
		{ $$ = { name: 'comment', value: $3 } }
	;

field
	: name-string colon nullablespace any-string eol
		{ $$ = { name: $1, value: $4 } }
	| name-string eol
		{ $$ = { name: $1, value: '' } }
	;

any-string
	: colon
	| char
	| space
	| any-string colon
		{ $$ = $1 + $2; }
	| any-string char
		{ $$ = $1 + $2; }
	| any-string space
		{ $$ = $1 + $2; }
	;

name-string
	: char
	| space
	| name-string char
		{ $$ = $1 + $2; }
	| name-string space
		{ $$ = $1 + $2; }
	;

nullablespace
	: space
	|
	;
