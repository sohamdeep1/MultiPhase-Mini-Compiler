/**
 * src/lexer/lexer.js
 * Phase 1 -- Lexical Analysis
 *
 * Converts raw source code into a flat stream of tokens.
 * Each token: { type, value, line, col }
 *
 * Token types:
 *   KEYWORD | IDENTIFIER | INTEGER | FLOAT | STRING | BOOL
 *   OPERATOR | PUNCTUATION | COMMENT | EOF | UNKNOWN
 *
 * Usage:
 *   var tokens = lexer(sourceString);
 */

/* Token type descriptors used by the renderer */
var TOKEN_TYPES = {
  KEYWORD:     { label: 'KEYWORD',   color: '#569cd6' },
  IDENTIFIER:  { label: 'IDENT',     color: '#4fc1ff' },
  INTEGER:     { label: 'INT_LIT',   color: '#b5cea8' },
  FLOAT:       { label: 'FLOAT_LIT', color: '#b5cea8' },
  STRING:      { label: 'STR_LIT',   color: '#ce9178' },
  BOOL:        { label: 'BOOL_LIT',  color: '#c586c0' },
  OPERATOR:    { label: 'OPERATOR',  color: '#d4d4d4' },
  PUNCTUATION: { label: 'PUNCT',     color: '#7a8897' },
  COMMENT:     { label: 'COMMENT',   color: '#6a9955' },
  EOF:         { label: 'EOF',       color: '#3d4450' },
  UNKNOWN:     { label: 'UNKNOWN',   color: '#f44747' },
};

/* Language keyword, operator, and punctuation sets */
var KEYWORDS = new Set([
  'int','float','string','bool','void','char',
  'if','else','while','for','return','print',
  'true','false','break','continue','null'
]);

var OPERATORS = new Set([
  '+','-','*','/','%',
  '=','==','!=','<','>','<=','>=',
  '&&','||','!','++','--',
  '+=','-=','*=','/='
]);

var PUNCTUATIONS = new Set(['{','}','(',')','[',']',';',',','.','->']);

var MULTI_CHAR_OPS = [
  '==','!=','<=','>=','&&','||',
  '++','--','+=','-=','*=','/=','->'
];

/**
 * lexer(source) -> Token[]
 *
 * Scans the source string left-to-right and emits tokens.
 * Whitespace is silently skipped.
 * Comments (// and block) are captured as COMMENT tokens.
 */
function lexer(source) {
  var tokens = [];
  var i = 0, line = 1, col = 1;

  function peek(offset) { return source[i + (offset || 0)]; }
  function advance() {
    var ch = source[i++];
    if (ch === '\n') { line++; col = 1; } else { col++; }
    return ch;
  }

  while (i < source.length) {
    var startLine = line, startCol = col;
    var ch = peek();

    // Single-line comment //
    if (ch === '/' && peek(1) === '/') {
      var val = '';
      while (i < source.length && peek() !== '\n') val += advance();
      tokens.push({ type: 'COMMENT', value: val.trim(), line: startLine, col: startCol });
      continue;
    }

    // Block comment (slash-star ... star-slash)
    if (ch === '/' && peek(1) === '*') {
      advance(); advance();
      var val = '';
      while (i < source.length && !(peek() === '*' && peek(1) === '/')) val += advance();
      if (i < source.length) { advance(); advance(); }
      tokens.push({ type: 'COMMENT', value: val.trim(), line: startLine, col: startCol });
      continue;
    }

    // Whitespace -- silently skip
    if (/\s/.test(ch)) { advance(); continue; }

    // String literal "..."
    if (ch === '"') {
      advance();
      var val = '';
      while (i < source.length && peek() !== '"') {
        if (peek() === '\\') { advance(); val += '\\' + advance(); }
        else val += advance();
      }
      if (peek() === '"') advance();
      tokens.push({ type: 'STRING', value: '"' + val + '"', line: startLine, col: startCol });
      continue;
    }

    // Numeric literal (integer or float)
    if (/[0-9]/.test(ch)) {
      var val = '';
      while (i < source.length && /[0-9]/.test(peek())) val += advance();
      if (peek() === '.' && /[0-9]/.test(peek(1))) {
        val += advance();
        while (i < source.length && /[0-9]/.test(peek())) val += advance();
        tokens.push({ type: 'FLOAT', value: val, line: startLine, col: startCol });
      } else {
        tokens.push({ type: 'INTEGER', value: val, line: startLine, col: startCol });
      }
      continue;
    }

    // Identifier, keyword, or boolean literal
    if (/[a-zA-Z_]/.test(ch)) {
      var val = '';
      while (i < source.length && /[a-zA-Z0-9_]/.test(peek())) val += advance();
      if (val === 'true' || val === 'false')
        tokens.push({ type: 'BOOL',       value: val, line: startLine, col: startCol });
      else if (KEYWORDS.has(val))
        tokens.push({ type: 'KEYWORD',    value: val, line: startLine, col: startCol });
      else
        tokens.push({ type: 'IDENTIFIER', value: val, line: startLine, col: startCol });
      continue;
    }

    // Multi-character operators (==, !=, <=, >=, &&, ||, ++, --, +=, etc.)
    var twoChar = source.substr(i, 2);
    if (MULTI_CHAR_OPS.indexOf(twoChar) !== -1) {
      tokens.push({ type: 'OPERATOR', value: twoChar, line: startLine, col: startCol });
      advance(); advance();
      continue;
    }

    // Single-character operator
    if (OPERATORS.has(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch, line: startLine, col: startCol });
      advance();
      continue;
    }

    // Punctuation
    if (PUNCTUATIONS.has(ch)) {
      tokens.push({ type: 'PUNCTUATION', value: ch, line: startLine, col: startCol });
      advance();
      continue;
    }

    // Unknown / unrecognised character
    tokens.push({ type: 'UNKNOWN', value: ch, line: startLine, col: startCol });
    advance();
  }

  tokens.push({ type: 'EOF', value: '<EOF>', line: line, col: col });
  return tokens;
}
