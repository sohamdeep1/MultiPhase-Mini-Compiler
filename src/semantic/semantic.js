/**
 * src/semantic/semantic.js
 * Phase 3 -- Semantic Analysis
 *
 * Performs:
 *   1. Scope-aware symbol table construction
 *   2. Undeclared variable / function detection
 *   3. Type compatibility checking
 *   4. Duplicate declaration detection
 *   5. Unused variable warnings
 */

function semantic(ast) {
  var errors      = [];
  var warnings    = [];
  var symbolTable = [];
  var scopes      = [new Map()];
  var functions   = new Map();

  function currentScope() { return scopes[scopes.length - 1]; }
  function pushScope()    { scopes.push(new Map()); }
  function popScope() {
    currentScope().forEach(function(info, name) {
      if (!info.used && !BUILTINS.has(name)) {
        warnings.push({ msg: "Variable '" + name + "' declared but never used", line: info.line });
      }
    });
    scopes.pop();
  }
