/**
 * src/parser/parser.js
 * Phase 2 -- Syntax Analysis (Recursive Descent Parser)
 *
 * Builds an Abstract Syntax Tree (AST) from the token stream.
 *
 * Precedence (low to high):
 *   assign -> or -> and -> equality -> comparison
 *   -> addition -> multiplication -> unary -> postfix -> primary
 */

function parser(tokens) {
  var toks = tokens.filter(function(t) { return t.type !== 'COMMENT'; });
  var pos = 0;
  var parseErrors = [];

  function peek(offset) { return toks[pos + (offset || 0)] || { type: 'EOF', value: '<EOF>' }; }
  function consume()    { return toks[pos++] || { type: 'EOF', value: '<EOF>' }; }

  function expect(type, val) {
    var t = peek();
    if ((type && t.type !== type) || (val && t.value !== val)) {
      parseErrors.push({ msg: "Expected '" + (val || type) + "' but found '" + t.value + "'", line: t.line });
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

  // --- Program ---
  function parseProgram() {
    var node = { type: 'Program', children: [] };
    while (peek().type !== 'EOF') {
      var decl = parseDeclaration();
      if (decl) node.children.push(decl);
      else consume();
    }
    return node;
  }