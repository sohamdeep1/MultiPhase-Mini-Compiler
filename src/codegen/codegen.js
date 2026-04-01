/**
 * src/codegen/codegen.js
 * Phase 4 -- IR Generation and Algorithm Mapping
 *
 * Part A: codeGen(ast)
 *   Emits 3-Address Code (TAC / 3AC), the standard intermediate
 *   representation used between the front-end and target codegen.
 *   Temporaries:  t1, t2, t3 ...
 *   Labels:       while_1, endwhile_1, for_1, else_1, endif_1 ...
 *
 * Part B: detectAlgorithms(ast, tokens)
 *   Walks the AST and token list to identify common algorithm
 *   patterns and annotates each with complexity estimates.
 *
 * Usage:
 *   var ir    = codeGen(ast);        // string[]
 *   var algos = detectAlgorithms(ast, tokens); // pattern[]
 */

/* ============================================================
   PART A -- 3-Address IR Code Generator
============================================================ */
function codeGen(ast) {
  var instructions = [];
  var tempCount = 0;
  var labelCount = 0;

  function newTemp()        { return 't' + (++tempCount); }
  function newLabel(prefix) { return (prefix || 'L') + (++labelCount); }
  function emit(instr)      { instructions.push(instr); }

  /* Expression code gen -- returns the name of the result (temp or identifier) */
  function genExpr(node) {
    if (!node) return '0';
    switch (node.type) {
      case 'IntLiteral':    return String(node.value);
      case 'FloatLiteral':  return String(node.value);
      case 'StringLiteral': return node.value;
      case 'BoolLiteral':   return node.value ? '1' : '0';
      case 'Identifier':    return node.name;
      case 'GroupExpr':     return genExpr(node.expr);

      case 'BinOp': {
        var l = genExpr(node.left), r = genExpr(node.right), t = newTemp();
        emit('  ' + t + ' = ' + l + ' ' + node.op + ' ' + r);
        return t;
      }
      case 'UnaryOp': {
        var operand = genExpr(node.operand), t = newTemp();
        emit('  ' + t + ' = ' + node.op + operand);
        return t;
      }
      case 'Assign': {
        var val = genExpr(node.right), target = genExpr(node.left);
        emit('  ' + target + ' ' + node.op + ' ' + val);
        return target;
      }
      case 'CallExpr': {
        var fn   = (node.callee && node.callee.name) || '?';
        var args = node.args || [];
        var t    = newTemp();
        args.forEach(function(a) { emit('  PARAM ' + genExpr(a)); });
        emit('  ' + t + ' = CALL ' + fn + ', ' + args.length);
        return t;
      }
      default: return '?';
    }
  }

  /* Statement code gen */
  function genStmt(node) {
    if (!node) return;
    switch (node.type) {

      case 'Program':
        node.children.forEach(function(c) { genStmt(c); });
        break;

      case 'FunctionDecl': {
        var params = node.params.map(function(p) { return p.pType + ' ' + p.pName; }).join(', ');
        emit('FUNC ' + node.name + '(' + params + ') -> ' + node.retType + ':');
        node.params.forEach(function(p) { emit('  PARAM_GET ' + p.pType + ' ' + p.pName); });
        if (node.body) genStmt(node.body);
        emit('END_FUNC ' + node.name);
        emit(''); /* blank line between functions */
        break;
      }

      case 'Block':    node.stmts.forEach(function(s) { genStmt(s); }); break;
      case 'ExprStmt': genExpr(node.expr); break;

      case 'VarDecl':
        emit(node.init
          ? '  DECL ' + node.typeName + ' ' + node.name + ' = ' + genExpr(node.init)
          : '  DECL ' + node.typeName + ' ' + node.name);
        break;

      case 'PrintStmt':
        emit('  PRINT ' + genExpr(node.arg));
        break;

      case 'ReturnStmt':
        emit('  RETURN ' + (node.value ? genExpr(node.value) : 'void'));
        break;

      case 'IfStmt': {
        var cond  = genExpr(node.cond);
        var elseL = newLabel('else_');
        var endL  = newLabel('endif_');
        emit('  IF_FALSE ' + cond + ' GOTO ' + elseL);
        genStmt(node.then);
        if (node.else) {
          emit('  GOTO ' + endL);
          emit(elseL + ':');
          genStmt(node.else);
          emit(endL + ':');
        } else {
          emit(elseL + ':');
        }
        break;
      }

      case 'WhileStmt': {
        var startL = newLabel('while_');
        var endL   = newLabel('endwhile_');
        emit(startL + ':');
        var cond = genExpr(node.cond);
        emit('  IF_FALSE ' + cond + ' GOTO ' + endL);
        genStmt(node.body);
        emit('  GOTO ' + startL);
        emit(endL + ':');
        break;
      }

      case 'ForStmt': {
        var startL = newLabel('for_');
        var endL   = newLabel('endfor_');
        genStmt(node.init);
        emit(startL + ':');
        var cond = genExpr(node.cond);
        emit('  IF_FALSE ' + cond + ' GOTO ' + endL);
        genStmt(node.body);
        genExpr(node.update);
        emit('  GOTO ' + startL);
        emit(endL + ':');
        break;
      }

      default: break;
    }
  }

  genStmt(ast);
  return instructions;
}

/* ============================================================
   PART B -- Algorithm Pattern Detection
============================================================ */
function detectAlgorithms(ast, tokens) {
  var patterns = [];
  var seen     = new Set();

  function add(p) {
    if (!seen.has(p.name)) { seen.add(p.name); patterns.push(p); }
  }

  function walk(node, depth) {
    if (!node || (depth || 0) > 30) return;
    switch (node.type) {

      case 'WhileStmt':
        add({
          name: 'While Loop -- Iteration Pattern',
          badge: 'LOOP', color: '#4ec9b0',
          complexity: 'O(n)', space: 'O(1)',
          desc: 'Conditional loop for linear traversal, counting, and accumulation.'
        });
        walk(node.cond, (depth||0)+1);
        walk(node.body, (depth||0)+1);
        break;

      case 'ForStmt':
        add({
          name: 'For Loop -- Counted Iteration',
          badge: 'FOR', color: '#4fc1ff',
          complexity: 'O(n)', space: 'O(1)',
          desc: 'Counted loop with explicit init, condition, and update expression.'
        });
        walk(node.body, (depth||0)+1);
        break;

      case 'IfStmt':
        add({
          name: 'Conditional Branching',
          badge: 'BRANCH', color: '#dcdcaa',
          complexity: 'O(1)', space: 'O(1)',
          desc: 'Multi-path decision logic via if/else. Used for guard clauses, validation, and base cases.'
        });
        walk(node.then, (depth||0)+1);
        walk(node.else, (depth||0)+1);
        break;

      case 'FunctionDecl': {
        /* Check for self-recursion by searching serialised body */
        var bodyStr = JSON.stringify(node.body || {});
        var re      = new RegExp('"name":"' + node.name + '"', 'g');
        if ((bodyStr.match(re) || []).length > 0) {
          add({
            name: "Recursive Function -- '" + node.name + "'",
            badge: 'RECURSE', color: '#c586c0',
            complexity: 'O(2^n) worst / O(n) best', space: 'O(n) call stack',
            desc: "Function '" + node.name + "' calls itself. Pattern used in divide-and-conquer, tree traversal, and backtracking."
          });
        }
        walk(node.body, (depth||0)+1);
        break;
      }

      case 'Program': node.children && node.children.forEach(function(c) { walk(c, (depth||0)+1); }); break;
      case 'Block':   node.stmts   && node.stmts.forEach(function(s)    { walk(s, (depth||0)+1); }); break;
      default: break;
    }
  }

  walk(ast, 0);

  /* Token-level heuristics */
  var ids = tokens.filter(function(t) { return t.type === 'IDENTIFIER'; }).map(function(t) { return t.value; });

  var mathKeywords = ['factorial','fib','fibonacci','gcd','lcm','prime','power'];
  if (mathKeywords.some(function(k) { return ids.indexOf(k) !== -1; })) {
    add({
      name: 'Mathematical Series / Number Theory',
      badge: 'MATH', color: '#a855f7',
      complexity: 'O(n)', space: 'O(n)',
      desc: 'Mathematical sequence or number-theory function (factorial, Fibonacci, GCD, prime test).'
    });
  }

  var sortKeywords = ['swap','bubble','pivot','merge','partition'];
  if (sortKeywords.some(function(k) { return ids.indexOf(k) !== -1; })) {
    add({
      name: 'Sorting Algorithm',
      badge: 'SORT', color: '#ce9178',
      complexity: 'O(n^2) to O(n log n)', space: 'O(1) to O(n)',
      desc: 'Sorting-related identifiers detected (swap, pivot, merge, partition).'
    });
  }

  return patterns;
}
