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