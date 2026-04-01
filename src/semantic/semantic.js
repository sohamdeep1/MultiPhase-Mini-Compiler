/**
 * src/semantic/semantic.js
 * Phase 3 -- Semantic Analysis
 *
 * Walks the AST and performs:
 *   1. Scope-aware symbol table construction
 *   2. Undeclared variable / function detection
 *   3. Type compatibility checking
 *   4. Duplicate declaration detection
 *   5. Unused variable warnings
 *
 * Usage:
 *   var result = semantic(ast);
 *   result.errors      -- array of {msg, line}
 *   result.warnings    -- array of {msg, line}
 *   result.symbolTable -- array of {name, type, scope, line}
 */

function semantic(ast) {
  var errors      = [];
  var warnings    = [];
  var symbolTable = [];
  var scopes      = [new Map()]; /* scope stack; index 0 = global */
  var functions   = new Map();  /* declared functions: name -> {retType, params} */

  /* -- Scope helpers -- */
  function currentScope() { return scopes[scopes.length - 1]; }
  function pushScope()    { scopes.push(new Map()); }
  function popScope() {
    /* Report unused variables before discarding the scope */
    currentScope().forEach(function(info, name) {
      if (!info.used && !BUILTINS.has(name)) {
        warnings.push({ msg: "Variable '" + name + "' declared but never used", line: info.line });
      }
    });
    scopes.pop();
  }

  function declareVar(name, type, line) {
    if (currentScope().has(name)) {
      errors.push({ msg: "Variable '" + name + "' already declared in this scope", line: line });
    } else {
      currentScope().set(name, { type: type, used: false, line: line });
      symbolTable.push({ name: name, type: type, scope: scopes.length, line: line });
    }
  }

  function lookupVar(name) {
    for (var i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i].has(name)) {
        scopes[i].get(name).used = true; /* mark as used */
        return scopes[i].get(name);
      }
    }
    return null;
  }

  /* -- Built-ins -- */
  var BUILTINS = new Set(['print']);
  var BUILTIN_FUNCS = new Map([
    ['print', { retType: 'void', params: [{ type: 'any' }] }]
  ]);

  /* -- Node checker (statements and declarations) -- */
  function checkNode(node) {
    if (!node) return 'void';
    switch (node.type) {

      case 'Program':
        node.children.forEach(function(c) { checkNode(c); });
        /* Check global-scope unused vars */
        currentScope().forEach(function(info, name) {
          if (!info.used && !BUILTINS.has(name))
            warnings.push({ msg: "Variable '" + name + "' declared but never used", line: info.line });
        });
        return 'void';

      case 'FunctionDecl':
        functions.set(node.name, { retType: node.retType, params: node.params });
        pushScope();
        node.params.forEach(function(p) { declareVar(p.pName, p.pType, 0); });
        if (node.body) checkNode(node.body);
        popScope();
        return node.retType;

      case 'Block':
        pushScope();
        node.stmts.forEach(function(s) { checkNode(s); });
        popScope();
        return 'void';

      case 'VarDecl': {
        var initType = 'unknown';
        if (node.init) initType = resolveType(node.init);
        if (node.init && initType !== 'unknown' && initType !== node.typeName) {
          /* Allow implicit widening: int -> float, int/bool -> bool */
          var ok = (node.typeName === 'float' && initType === 'int') ||
                   (node.typeName === 'bool'  && (initType === 'int' || initType === 'bool'));
          if (!ok) errors.push({
            msg:  "Type mismatch: cannot assign '" + initType + "' to '" + node.typeName + "' variable '" + node.name + "'",
            line: node.line
          });
        }
        declareVar(node.name, node.typeName, node.line);
        return node.typeName;
      }

      case 'IfStmt':    resolveType(node.cond); checkNode(node.then); if (node.else) checkNode(node.else); return 'void';
      case 'WhileStmt': resolveType(node.cond); checkNode(node.body); return 'void';

      case 'ForStmt':
        pushScope();
        checkNode(node.init);
        resolveType(node.cond);
        resolveType(node.update);
        checkNode(node.body);
        popScope();
        return 'void';

      case 'ReturnStmt': if (node.value) resolveType(node.value); return 'void';
      case 'PrintStmt':  resolveType(node.arg); return 'void';
      case 'ExprStmt':   return resolveType(node.expr);
      default:           return 'void';
    }
  }

  /* -- Type resolver (expressions -> inferred type string) -- */
  function resolveType(node) {
    if (!node) return 'void';
    switch (node.type) {
      case 'IntLiteral':    return 'int';
      case 'FloatLiteral':  return 'float';
      case 'StringLiteral': return 'string';
      case 'BoolLiteral':   return 'bool';

      case 'Identifier': {
        var sym = lookupVar(node.name);
        if (!sym) {
          errors.push({ msg: "Undeclared variable '" + node.name + "'", line: node.line });
          return 'unknown';
        }
        return sym.type;
      }

      case 'BinOp': {
        var lt = resolveType(node.left);
        var rt = resolveType(node.right);
        if (['==','!=','<','>','<=','>=','&&','||'].indexOf(node.op) !== -1) return 'bool';
        if (lt === 'float' || rt === 'float') return 'float';
        if (lt === 'int'   && rt === 'int')   return 'int';
        return 'unknown';
      }

      case 'UnaryOp':   return resolveType(node.operand);
      case 'Assign':    return resolveType(node.right);
      case 'GroupExpr': return resolveType(node.expr);

      case 'CallExpr': {
        var fnName = node.callee && node.callee.name;
        if (!fnName) return 'unknown';
        if (BUILTIN_FUNCS.has(fnName)) return BUILTIN_FUNCS.get(fnName).retType;
        var fn = functions.get(fnName);
        if (!fn) {
          errors.push({ msg: "Undeclared function '" + fnName + "'", line: node.line });
          return 'unknown';
        }
        return fn.retType;
      }

      default: return 'unknown';
    }
  }

  checkNode(ast);
  return { errors: errors, warnings: warnings, symbolTable: symbolTable };
}
