/**
 * src/lexer/lexer.js
 * Phase 1 -- Lexical Analysis
 *
 * Converts raw source code into a flat list of tokens.
 * Each token: { type, value, line, col }
 *
 * Token types:
 *   KEYWORD | IDENTIFIER | INTEGER | FLOAT | STRING | BOOL
 *   OPERATOR | PUNCTUATION | COMMENT | EOF | UNKNOWN
 */

/* Token Type Definitions */
var TOKEN_TYPES = {
  KEYWORD:     { label: 'KEYWORD',   color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  IDENTIFIER:  { label: 'IDENT',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  INTEGER:     { label: 'INT_LIT',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  FLOAT:       { label: 'FLOAT_LIT', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  STRING:      { label: 'STR_LIT',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  BOOL:        { label: 'BOOL_LIT',  color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  OPERATOR:    { label: 'OPERATOR',  color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  PUNCTUATION: { label: 'PUNCT',     color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  COMMENT:     { label: 'COMMENT',   color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  EOF:         { label: 'EOF',       color: '#475569', bg: 'rgba(71,85,105,0.08)'  },
  UNKNOWN:     { label: 'UNKNOWN',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};

/* Language Definition */
var KEYWORDS = new Set([
  'int', 'float', 'string', 'bool', 'void', 'char',
  'if', 'else', 'while', 'for', 'return', 'print',
  'true', 'false', 'break', 'continue', 'null'
]);

var OPERATORS = new Set([
  '+', '-', '*', '/', '%',
  '=', '==', '!=',
  '<', '>', '<=', '>=',
  '&&', '||', '!',
  '++', '--',
  '+=', '-=', '*=', '/='
]);

var PUNCTUATIONS = new Set([
  '{', '}', '(', ')', '[', ']',
  ';', ',', '.', ':', '->'
]);

var MULTI_CHAR_OPS = [
  '==', '!=', '<=', '>=',
  '&&', '||',
  '++', '--',
  '+=', '-=', '*=', '/=',
  '->'
];

/* Lexer */
function lexer(source) {
  var tokens = [];
  var i = 0, line = 1, col = 1;

  function peek(offset)   { offset = offset || 0; return source[i + offset]; }
  function advance() {
    var ch = source[i++];
    if (ch === '\n') { line++; col = 1; } else { col++; }
    return ch;
  }

  while (i < source.length) {
    var startLine = line, startCol = col;
    var ch = peek();

    // Single-line comment
    if (ch === '/' && peek(1) === '/') {
      var val = '';
      while (i < source.length && peek() !== '\n') val += advance();
      tokens.push({ type: 'COMMENT', value: val.trim(), line: startLine, col: startCol });
      continue;
    }

    // Block comment (slash-star to star-slash)
    if (ch === '/' && peek(1) === '*') {
      var val = '';
      advance(); advance();
      while (i < source.length && !(peek() === '*' && peek(1) === '/')) val += advance();
      if (i < source.length) { advance(); advance(); }
      tokens.push({ type: 'COMMENT', value: val.trim(), line: startLine, col: startCol });
      continue;
    }

    // Whitespace -- skip
    if (/\s/.test(ch)) { advance(); continue; }

    // String literal
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

    // Numeric literal
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

    // Identifier / keyword / boolean
    if (/[a-zA-Z_]/.test(ch)) {
      var val = '';
      while (i < source.length && /[a-zA-Z0-9_]/.test(peek())) val += advance();
      if (val === 'true' || val === 'false')
        tokens.push({ type: 'BOOL', value: val, line: startLine, col: startCol });
      else if (KEYWORDS.has(val))
        tokens.push({ type: 'KEYWORD', value: val, line: startLine, col: startCol });
      else
        tokens.push({ type: 'IDENTIFIER', value: val, line: startLine, col: startCol });
      continue;
    }

    // Multi-character operators
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

    // Unknown character
    tokens.push({ type: 'UNKNOWN', value: ch, line: startLine, col: startCol });
    advance();
  }

  tokens.push({ type: 'EOF', value: '<EOF>', line: line, col: col });
  return tokens;
}
