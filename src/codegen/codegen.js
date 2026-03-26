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
