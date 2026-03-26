/**
 * src/codegen/codegen.js
 * Phase 4 -- IR Generation & Algorithm Mapping
 *
 * Part A: codeGen(ast)
 *   Emits 3-Address Code (TAC), the standard intermediate
 *   representation used before target code generation.
 *   Temporaries: t1, t2 ...   Labels: while_1, endwhile_1 ...
 *
 * Part B: detectAlgorithms(ast, tokens)
 *   Identifies common algorithm patterns with complexity estimates.
 */

/* Part A -- 3-Address IR Code Generator */
function codeGen(ast) {
  var instructions = [];
  var tempCount = 0, labelCount = 0;

  function newTemp()           { return 't' + (++tempCount); }
  function newLabel(prefix)    { return (prefix || 'L') + (++labelCount); }
  function emit(instr)         { instructions.push(instr); }

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
        var fn = (node.callee && node.callee.name) || '?';
        var args = node.args || [];
        args.forEach(function(a) { emit('  PARAM ' + genExpr(a)); });
        var t = newTemp();
        emit('  ' + t + ' = CALL ' + fn + ', ' + args.length);
        return t;
      }
      default: return '?';
    }
  }

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
        emit('');
        break;
      }

      case 'Block':     node.stmts.forEach(function(s) { genStmt(s); }); break;
      case 'ExprStmt':  genExpr(node.expr); break;

      case 'VarDecl':
        if (node.init) emit('  DECL ' + node.typeName + ' ' + node.name + ' = ' + genExpr(node.init));
        else           emit('  DECL ' + node.typeName + ' ' + node.name);
        break;

      case 'PrintStmt':
        emit('  PRINT ' + genExpr(node.arg));
        break;

      case 'ReturnStmt':
        emit('  RETURN ' + (node.value ? genExpr(node.value) : 'void'));
        break;

      case 'IfStmt': {
        var cond = genExpr(node.cond);
        var elseL = newLabel('else_'), endL = newLabel('endif_');
        emit('  IF_FALSE ' + cond + ' GOTO ' + elseL);
        genStmt(node.then);
        if (node.else) { emit('  GOTO ' + endL); emit(elseL + ':'); genStmt(node.else); emit(endL + ':'); }
        else emit(elseL + ':');
        break;
      }

      case 'WhileStmt': {
        var startL = newLabel('while_'), endL = newLabel('endwhile_');
        emit(startL + ':');
        var cond = genExpr(node.cond);
        emit('  IF_FALSE ' + cond + ' GOTO ' + endL);
        genStmt(node.body);
        emit('  GOTO ' + startL);
        emit(endL + ':');
        break;
      }

      case 'ForStmt': {
        var startL = newLabel('for_'), endL = newLabel('endfor_');
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

/* Part B -- Algorithm Pattern Detection */
function detectAlgorithms(ast, tokens) {
  var patterns = [], seen = new Set();

  function add(p) { if (!seen.has(p.name)) { seen.add(p.name); patterns.push(p); } }

  function walk(node, depth) {
    if (!node || (depth || 0) > 30) return;
    switch (node.type) {
      case 'WhileStmt':
        add({ name:'While Loop -- Iteration Pattern', type:'Loop', badge:'LOOP', complexity:'O(n)', space:'O(1)', color:'#2dd4bf',
              desc:'A while loop with a conditional guard. Used for linear traversal, counting, accumulation, and sentinel-controlled iteration.' });
        walk(node.cond, (depth||0)+1); walk(node.body, (depth||0)+1);
        break;

      case 'ForStmt':
        add({ name:'For Loop -- Counted Iteration', type:'Loop', badge:'FOR', complexity:'O(n)', space:'O(1)', color:'#0ea5e9',
              desc:'A for loop with explicit initialiser, condition, and update. Classic pattern for array traversal, sum accumulation, and range iteration.' });
        walk(node.body, (depth||0)+1);
        break;

      case 'IfStmt':
        add({ name:'Conditional Branching', type:'Control Flow', badge:'BRANCH', complexity:'O(1)', space:'O(1)', color:'#f59e0b',
              desc:'If/else conditional for multi-path decision logic. Foundational pattern for guard clauses, base cases, validation, and selecting between execution paths.' });
        walk(node.then, (depth||0)+1); walk(node.else, (depth||0)+1);
        break;

      case 'FunctionDecl': {
        var bodyStr = JSON.stringify(node.body || {});
        var re = new RegExp('"name":"' + node.name + '"', 'g');
        var matches = bodyStr.match(re);
        if (matches && matches.length > 0) {
          add({ name:"Recursive Function -- '" + node.name + "'", type:'Recursion', badge:'RECURSE', complexity:'O(2^n) worst / O(n) best', space:'O(n) call stack', color:'#f472b6',
                desc:"Function '" + node.name + "' calls itself recursively. Used in divide-and-conquer, tree traversal, factorial, and backtracking algorithms." });
        }
        walk(node.body, (depth||0)+1);
        break;
      }
      case 'Program': node.children && node.children.forEach(function(c) { walk(c, (depth||0)+1); }); break;
      case 'Block':   node.stmts   && node.stmts.forEach(function(s)   { walk(s, (depth||0)+1); }); break;
      default: break;
    }
  }

  walk(ast, 0);

  var identNames = tokens.filter(function(t) { return t.type === 'IDENTIFIER'; }).map(function(t) { return t.value; });
  var mathKw = ['factorial','fib','fibonacci','gcd','lcm','prime','power'];
  if (mathKw.some(function(k) { return identNames.indexOf(k) !== -1; })) {
    add({ name:'Mathematical Series / Number Theory', type:'Math', badge:'MATH', complexity:'O(n)', space:'O(n)', color:'#a855f7',
          desc:'Mathematical series or number-theory function identified (factorial, Fibonacci, GCD, prime). Often implemented via recursion or iteration with an accumulator.' });
  }
  var sortKw = ['swap','sort','bubble','pivot','merge','partition'];
  if (sortKw.some(function(k) { return identNames.indexOf(k) !== -1; })) {
    add({ name:'Sorting Algorithm', type:'Sorting', badge:'SORT', complexity:'O(n^2) to O(n log n)', space:'O(1) to O(n)', color:'#fb923c',
          desc:'Sorting-related identifiers detected (swap, pivot, merge). Typical patterns: bubble O(n^2), merge O(n log n), quick O(n log n) average.' });
  }

  return patterns;
}
