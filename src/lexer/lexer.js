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
