/**
 * terminal/helpers.js
 * Utility functions used by the command handlers.
 *
 * Functions:
 *   needCompiled()          -- guard: warn if nothing compiled yet
 *   setStatus(type, msg)    -- update editor footer status dot + text
 *   countNodes(node)        -- count total nodes in an AST
 *   buildScopeData(ast)     -- build scope list for visualiser
 *   printNode(node, ...)    -- recursively print AST as a tree
 */

/* -- Guard -- */
function needCompiled() {
  if (!compiled) {
    tline('[!] Nothing compiled yet. Run: compile', 't-warn');
  }
}

/* -- Editor footer status -- */
function setStatus(type, msg) {
  var dot = document.getElementById('ef-dot');
  var txt = document.getElementById('ef-msg');
  if (type === 'ok')    dot.style.background = '#4ec9b0';
  else if (type === 'error') dot.style.background = '#f44747';
  else if (type === 'warn')  dot.style.background = '#ffcc02';
  else                       dot.style.background = '#3d4450';
  txt.textContent = msg;
}

/* -- AST node counter -- */
function countNodes(node) {
  if (!node || typeof node !== 'object') return 0;
  var count = 1;
  Object.values(node).forEach(function(v) {
    if (Array.isArray(v)) v.forEach(function(ch) { if (ch && typeof ch === 'object') count += countNodes(ch); });
    else if (v && typeof v === 'object') count += countNodes(v);
  });
  return count;
}

/* -- Scope data builder -- */
var SCOPE_COLORS = ['#4ec9b0', '#4fc1ff', '#dcdcaa', '#c586c0', '#ce9178'];

function buildScopeData(ast) {
  var scopes = [];

  function walk(node, depth, parentLabel) {
    if (!node) return;
    var label = null, vars = [];

    if (node.type === 'FunctionDecl') {
      label = 'fn: ' + node.name + '()';
      vars  = (node.params || []).map(function(p) { return { name: p.pName, type: p.pType }; });
    }

    if (label) {
      /* Collect var decls directly inside this function body */
      var stmts = node.body ? (node.body.stmts || []) : (node.stmts || []);
      stmts.forEach(function(s) {
        if (s && s.type === 'VarDecl') vars.push({ name: s.name, type: s.typeName });
      });
      scopes.push({
        depth: depth,
        label: label,
        vars:  vars,
        color: SCOPE_COLORS[Math.min(depth, SCOPE_COLORS.length - 1)]
      });
    }
    
    /* Recurse into children */
    var nextDepth = depth + (label ? 1 : 0);
    ['children', 'stmts', 'params'].forEach(function(key) {
      if (Array.isArray(node[key])) node[key].forEach(function(c) { walk(c, nextDepth, label || parentLabel); });
    });
    if (node.body) walk(node.body, nextDepth, label || parentLabel);
    if (node.then) walk(node.then, depth, label || parentLabel);
    if (node.else) walk(node.else, depth, label || parentLabel);
  }

  walk(ast, 1, 'global');
  return scopes;
}

/* -- AST tree printer -- */
var AST_NODE_COLORS = {
  Program: '#c586c0', FunctionDecl: '#569cd6', Block: '#4a525a',
  Param: '#4a525a', VarDecl: '#4ec9b0', IfStmt: '#dcdcaa',
  WhileStmt: '#4ec9b0', ForStmt: '#4fc1ff', ReturnStmt: '#c586c0',
  PrintStmt: '#ce9178', BinOp: '#d4d4d4', Assign: '#d4d4d4',
  CallExpr: '#dcdcaa', Identifier: '#4fc1ff',
  IntLiteral: '#b5cea8', FloatLiteral: '#b5cea8',
  StringLiteral: '#ce9178', BoolLiteral: '#c586c0',
};

function printNode(node, prefix, isLast, depth) {
  if (!node || (depth || 0) > 12) return;

  var color     = AST_NODE_COLORS[node.type] || '#6a737d';
  var connector = isLast ? '`-- ' : '|-- ';

  /* Inline annotation: name, type hint, operator, literal value */
  var ann = '';
  if (node.name)     ann += ' <span class="t-ident">' + esc(node.name) + '</span>';
  if (node.pName)    ann += ' <span class="t-type">' + esc(node.pType) + '</span> <span class="t-ident">' + esc(node.pName) + '</span>';
  if (node.typeName) ann += ' <span class="t-type">' + esc(node.typeName) + '</span>';
  if (node.retType && node.type === 'FunctionDecl')
    ann += ' <span class="t-dim">-&gt;</span> <span class="t-type">' + esc(node.retType) + '</span>';
  if (node.op)  ann += ' <span class="t-op">' + esc(node.op) + '</span>';
  if (node.type === 'IntLiteral' || node.type === 'FloatLiteral')
    ann += ' <span class="t-lit">' + node.value + '</span>';
  if (node.type === 'StringLiteral')
    ann += ' <span class="t-lit">' + esc(node.value) + '</span>';
  if (node.type === 'BoolLiteral')
    ann += ' <span class="t-type">' + node.value + '</span>';

  out('<div class="t-tree-node">' +
    '<span class="t-dim">' + esc((prefix || '') + connector) + '</span>' +
    '<span class="t-node-tag" style="background:' + color + '22;color:' + color + '">' + node.type + '</span>' +
    ann +
  '</div>');

    /* Collect children according to node type */
  var children = [];
  if (node.type === 'Program')       children = node.children || [];
  else if (node.type === 'Block')    children = node.stmts    || [];
  else if (node.type === 'FunctionDecl')
    children = (node.params || []).concat(node.body ? [node.body] : []);
  else if (node.type === 'VarDecl' && node.init) children = [node.init];
  else if (node.type === 'IfStmt')   children = [node.cond, node.then, node.else].filter(Boolean);
  else if (node.type === 'WhileStmt')children = [node.cond, node.body].filter(Boolean);
  else if (node.type === 'ForStmt')  children = [node.init, node.cond, node.update, node.body].filter(Boolean);
  else if (node.type === 'BinOp' || node.type === 'Assign') children = [node.left, node.right];
  else if (node.type === 'UnaryOp')  children = [node.operand];
  else if (node.type === 'GroupExpr')children = [node.expr];
  else if (node.type === 'ExprStmt') children = [node.expr];
  else if (node.type === 'ReturnStmt' && node.value) children = [node.value];
  else if (node.type === 'PrintStmt')children = [node.arg];
  else if (node.type === 'CallExpr') children = node.args || [];

  var childPrefix = (prefix || '') + (isLast ? '    ' : '|   ');
  children.forEach(function(child, i) {
    printNode(child, childPrefix, i === children.length - 1, (depth || 0) + 1);
  });
}
