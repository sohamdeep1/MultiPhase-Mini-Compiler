/**
 * src/parser/parser.js
 * Phase 2 -- Syntax Analysis (Recursive Descent Parser)
 *
 * Consumes a token stream and builds an Abstract Syntax Tree (AST).
 *
 * Expression precedence (low to high):
 *   assign -> or -> and -> equality -> comparison
 *   -> addition -> multiplication -> unary -> postfix -> primary
 *
 * Usage:
 *   var result = parser(tokens);
 *   result.ast         -- the root Program node
 *   result.parseErrors -- array of {msg, line} for parse failures
 */

function parser(tokens) {
  /* Strip comments -- they carry no structural meaning */
  var toks = tokens.filter(function(t) { return t.type !== 'COMMENT'; });
  var pos = 0;
  var parseErrors = [];

  /* -- Cursor helpers -- */
  function peek(offset) { return toks[pos + (offset || 0)] || { type: 'EOF', value: '<EOF>' }; }
  function consume()    { return toks[pos++] || { type: 'EOF', value: '<EOF>' }; }

  function expect(type, val) {
    var t = peek();
    if ((type && t.type !== type) || (val && t.value !== val)) {
      parseErrors.push({ msg: "Expected '" + (val || type) + "' but got '" + t.value + "'", line: t.line });
      return null;
    }
    return consume();
  }

  function match(type, val) {
    var t = peek();
    if ((type ? t.type === type : true) && (val ? t.value === val : true)) { consume(); return true; }
    return false;
  }

  function isType() {
    return ['int','float','string','bool','void','char'].indexOf(peek().value) !== -1;
  }

  /* -- Program (top-level) -- */
  function parseProgram() {
    var node = { type: 'Program', children: [] };
    while (peek().type !== 'EOF') {
      var d = parseDeclaration();
      if (d) node.children.push(d);
      else consume(); /* skip unrecognised token to prevent infinite loop */
    }
    return node;
  }

  /* -- Declarations -- */
  function parseDeclaration() {
    if (isType()) {
      var retType = consume().value;
      var name    = peek().type === 'IDENTIFIER' ? consume().value : '?';
      if (peek().value === '(') return parseFunctionDecl(retType, name);
      return parseVarDeclRest(retType, name);
    }
    return parseStatement();
  }

  function parseFunctionDecl(retType, name) {
    var node = { type: 'FunctionDecl', name: name, retType: retType, params: [], body: null };
    expect('PUNCTUATION', '(');
    while (peek().value !== ')' && peek().type !== 'EOF') {
      if (peek().value === ',') { consume(); continue; }
      var pType = consume().value;
      var pName = peek().type === 'IDENTIFIER' ? consume().value : '?';
      node.params.push({ type: 'Param', pType: pType, pName: pName });
    }
    expect('PUNCTUATION', ')');
    if (peek().value === '{') node.body = parseBlock();
    return node;
  }

  function parseVarDeclRest(typeName, name) {
    var node = { type: 'VarDecl', typeName: typeName, name: name, init: null, line: peek().line };
    if (match('OPERATOR', '=')) node.init = parseExpr();
    match('PUNCTUATION', ';');
    return node;
  }

  /* -- Statements -- */
  function parseBlock() {
    var node = { type: 'Block', stmts: [] };
    expect('PUNCTUATION', '{');
    while (peek().value !== '}' && peek().type !== 'EOF') {
      var s = parseStatement();
      if (s) node.stmts.push(s);
    }
    expect('PUNCTUATION', '}');
    return node;
  }

  function parseStatement() {
    var t = peek();
    if (isType()) {
      var typ = consume().value;
      var nm  = peek().type === 'IDENTIFIER' ? consume().value : '?';
      return parseVarDeclRest(typ, nm);
    }
    if (t.value === 'if')       return parseIf();
    if (t.value === 'while')    return parseWhile();
    if (t.value === 'for')      return parseFor();
    if (t.value === 'return')   return parseReturn();
    if (t.value === 'print')    return parsePrint();
    if (t.value === '{')        return parseBlock();
    if (t.value === 'break' || t.value === 'continue') {
      var n = { type: consume().value };
      match('PUNCTUATION', ';');
      return n;
    }
    var expr = parseExpr();
    match('PUNCTUATION', ';');
    return { type: 'ExprStmt', expr: expr };
  }

  function parseIf() {
    consume(); /* if */
    var node = { type: 'IfStmt', cond: null, then: null, else: null };
    expect('PUNCTUATION', '('); node.cond = parseExpr(); expect('PUNCTUATION', ')');
    node.then = parseStatement();
    if (peek().value === 'else') { consume(); node.else = parseStatement(); }
    return node;
  }

  function parseWhile() {
    consume(); /* while */
    var node = { type: 'WhileStmt', cond: null, body: null };
    expect('PUNCTUATION', '('); node.cond = parseExpr(); expect('PUNCTUATION', ')');
    node.body = parseStatement();
    return node;
  }

  function parseFor() {
    consume(); /* for */
    var node = { type: 'ForStmt', init: null, cond: null, update: null, body: null };
    expect('PUNCTUATION', '(');
    node.init   = parseStatement();
    node.cond   = parseExpr();  match('PUNCTUATION', ';');
    node.update = parseExpr();
    expect('PUNCTUATION', ')');
    node.body = parseStatement();
    return node;
  }

  function parseReturn() {
    consume(); /* return */
    var node = { type: 'ReturnStmt', value: null };
    if (peek().value !== ';') node.value = parseExpr();
    match('PUNCTUATION', ';');
    return node;
  }

  function parsePrint() {
    consume(); /* print */
    var node = { type: 'PrintStmt', arg: null };
    expect('PUNCTUATION', '('); node.arg = parseExpr(); expect('PUNCTUATION', ')');
    match('PUNCTUATION', ';');
    return node;
  }

  /* -- Expressions (precedence climbing via recursive descent) -- */
  function parseExpr() { return parseAssign(); }

  function parseAssign() {
    var left = parseOr();
    if (peek().type === 'OPERATOR' && ['=','+=','-=','*=','/='].indexOf(peek().value) !== -1) {
      var op = consume().value;
      return { type: 'Assign', op: op, left: left, right: parseAssign() };
    }
    return left;
  }

  function parseOr() {
    var l = parseAnd();
    while (peek().value === '||') { var op = consume().value; l = { type:'BinOp', op:op, left:l, right:parseAnd() }; }
    return l;
  }

  function parseAnd() {
    var l = parseEquality();
    while (peek().value === '&&') { var op = consume().value; l = { type:'BinOp', op:op, left:l, right:parseEquality() }; }
    return l;
  }

  function parseEquality() {
    var l = parseComparison();
    while (peek().value === '==' || peek().value === '!=') { var op = consume().value; l = { type:'BinOp', op:op, left:l, right:parseComparison() }; }
    return l;
  }

  function parseComparison() {
    var l = parseAddition();
    while (['<','>','<=','>='].indexOf(peek().value) !== -1) { var op = consume().value; l = { type:'BinOp', op:op, left:l, right:parseAddition() }; }
    return l;
  }

  function parseAddition() {
    var l = parseMultiplication();
    while (peek().value === '+' || peek().value === '-') { var op = consume().value; l = { type:'BinOp', op:op, left:l, right:parseMultiplication() }; }
    return l;
  }

  function parseMultiplication() {
    var l = parseUnary();
    while (['*','/','%'].indexOf(peek().value) !== -1) { var op = consume().value; l = { type:'BinOp', op:op, left:l, right:parseUnary() }; }
    return l;
  }

  function parseUnary() {
    if (['!','-','++','--'].indexOf(peek().value) !== -1) {
      var op = consume().value;
      return { type: 'UnaryOp', op: op, operand: parseUnary() };
    }
    return parsePostfix();
  }

  function parsePostfix() {
    var node = parsePrimary();
    while (true) {
      if (peek().value === '(') {
        consume();
        var args = [];
        while (peek().value !== ')' && peek().type !== 'EOF') {
          args.push(parseExpr());
          if (peek().value === ',') consume();
        }
        consume();
        node = { type: 'CallExpr', callee: node, args: args };
      } else if (peek().value === '[') {
        consume();
        var idx = parseExpr();
        consume();
        node = { type: 'IndexExpr', obj: node, index: idx };
      } else break;
    }
    return node;
  }

  function parsePrimary() {
    var t = peek();
    if (t.type === 'INTEGER')    { consume(); return { type: 'IntLiteral',    value: parseInt(t.value),   line: t.line }; }
    if (t.type === 'FLOAT')      { consume(); return { type: 'FloatLiteral',  value: parseFloat(t.value), line: t.line }; }
    if (t.type === 'STRING')     { consume(); return { type: 'StringLiteral', value: t.value,             line: t.line }; }
    if (t.type === 'BOOL')       { consume(); return { type: 'BoolLiteral',   value: t.value === 'true',  line: t.line }; }
    if (t.type === 'IDENTIFIER') { consume(); return { type: 'Identifier',    name:  t.value,             line: t.line }; }
    if (t.value === '(') {
      consume();
      var expr = parseExpr();
      expect('PUNCTUATION', ')');
      return { type: 'GroupExpr', expr: expr };
    }
    if (t.type !== 'EOF') { consume(); return { type: 'Unknown', value: t.value }; }
    return { type: 'EOF' };
  }

  return { ast: parseProgram(), parseErrors: parseErrors };
}
