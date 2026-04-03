/**
 * terminal/commands.js
 * All terminal command implementations.
 *
 * Each key on the COMMANDS object is a command name.
 * Commands receive an args array (words after the command name).
 * Commands render output via the primitives in output.js.
 *
 * Available commands:
 *   help, compile, lex, parse, semantic, ir, algos,
 *   tokens, symbols, stats, load, clear, cls
 */

var COMMANDS = {

  /* -- help -- */
  help: function() {
    tline('Available commands:', 't-head');
    blank();
    var cmds = [
      ['compile',      'Run all 4 phases on the editor source'],
      ['lex',          'Phase 1 -- tokenize and show token table'],
      ['parse',        'Phase 2 -- show the Abstract Syntax Tree'],
      ['semantic',     'Phase 3 -- type checking, scope tree, symbol table'],
      ['ir',           'Phase 4 -- 3-address intermediate representation'],
      ['algos',        'Phase 4 -- detected algorithm patterns'],
      ['tokens [TYPE]','Filter token table by type (e.g. tokens KEYWORD)'],
      ['symbols',      'Alias: show symbol table (same as semantic)'],
      ['stats',        'Full compilation statistics summary'],
      ['load <name>',  'Load sample: basic | loop | func | error'],
      ['clear / cls',  'Clear terminal output'],
      ['help',         'Show this message'],
    ];
    cmds.forEach(function(c) {
      out('<div class="t-line"><span style="color:#4fc1ff;display:inline-block;width:190px">' +
        esc(c[0]) + '</span><span class="t-dim">' + esc(c[1]) + '</span></div>');
    });
    blank();
    tline('Arrow Up/Down -- command history   |   Tab -- autocomplete   |   Ctrl+L -- clear', 't-dim');
  },

    /* -- compile -- */
  compile: function() {
    var src = document.getElementById('src').value.trim();
    if (!src) { tline('[!] Editor is empty. Write some code or: load basic', 't-err'); return; }

    tline('[1/4] Lexical Analysis...', 't-info');
    progress();
    _tokens = lexer(src);
    var vis = _tokens.filter(function(t) { return t.type !== 'EOF'; });
    tline('      OK -- ' + vis.length + ' tokens produced', 't-ok');

    tline('[2/4] Syntax Parsing...', 't-info');
    progress();
    var pr = parser(_tokens);
    _ast = pr.ast;
    if (pr.parseErrors.length) {
      pr.parseErrors.forEach(function(e) { tline('      WARN: ' + e.msg, 't-warn'); });
    } else {
      tline('      OK -- AST built, ' + countNodes(_ast) + ' nodes', 't-ok');
    }

    tline('[3/4] Semantic Analysis...', 't-info');
    progress();
    _sem = semantic(_ast);
    if (_sem.errors.length) {
      _sem.errors.forEach(function(e) { tline('      ERR: ' + e.msg, 't-err'); });
    } else {
      tline('      OK -- ' + _sem.symbolTable.length + ' symbol(s), ' + _sem.warnings.length + ' warning(s)', 't-ok');
    }
    _sem.warnings.forEach(function(w) { tline('      WARN: ' + w.msg, 't-warn'); });

    tline('[4/4] Code Generation...', 't-info');
    progress();
    _ir    = codeGen(_ast);
    _algos = detectAlgorithms(_ast, _tokens);
    var instrCount = _ir.filter(function(l) { return l.trim(); }).length;
    tline('      OK -- ' + instrCount + ' IR instructions, ' + _algos.length + ' pattern(s)', 't-ok');

    blank();
    compiled = true;

    if (_sem.errors.length) {
      tline('Compilation finished with ' + _sem.errors.length + ' error(s).', 't-err');
      setStatus('error', _sem.errors.length + ' error(s)');
    } else {
      tline('Compilation successful.  Next: lex | parse | semantic | ir | algos', 't-ok');
      setStatus('ok', 'compiled');
    }
  },

  /* -- lex -- */
  lex: function(args) {
    needCompiled(); if (!compiled) return;

    var filter = args && args[0] ? args[0].toUpperCase() : null;
    var vis = _tokens.filter(function(t) {
      return t.type !== 'EOF' && (!filter || t.type === filter);
    });

    if (!vis.length) {
      tline('No tokens' + (filter ? ' of type ' + filter : ''), 't-warn');
      return;
    }

    tline('Tokens' + (filter ? ' [' + filter + ']' : '') + '  (' + vis.length + ' total)', 't-head');
    blank();

    /* Column header */
    out('<div class="t-line">' +
      '<span style="color:#3d4450;display:inline-block;width:36px">#</span>' +
      '<span style="display:inline-block;width:180px;color:#4a525a">VALUE</span>' +
      '<span style="display:inline-block;width:100px;color:#4a525a">TYPE</span>' +
      '<span style="color:#4a525a">LINE</span>' +
    '</div>');

    vis.forEach(function(tok, i) {
      var ti  = TOKEN_TYPES[tok.type] || TOKEN_TYPES.UNKNOWN;
      var cls = tok.type === 'KEYWORD'     ? 't-kw'   :
                tok.type === 'IDENTIFIER'  ? 't-ident':
                tok.type === 'INTEGER' || tok.type === 'FLOAT' ? 't-lit' :
                tok.type === 'STRING'      ? 't-lit'  :
                tok.type === 'BOOL'        ? 't-type' :
                tok.type === 'OPERATOR'    ? 't-op'   :
                tok.type === 'PUNCTUATION' ? 't-punct':
                tok.type === 'COMMENT'     ? 't-comment' : 't-err';

      out('<div class="t-line">' +
        '<span style="color:#3d4450;display:inline-block;width:36px">' + (i + 1) + '</span>' +
        '<span class="' + cls + '" style="display:inline-block;width:180px;overflow:hidden;white-space:nowrap">' + esc(tok.value.substring(0, 22)) + '</span>' +
        '<span style="display:inline-block;width:100px;color:' + ti.color + ';font-size:11px;font-weight:700">' + ti.label + '</span>' +
        '<span style="color:#3d4450">' + (tok.line || '-') + '</span>' +
      '</div>');
    });

    blank();

    /* Distribution bar chart */
    var counts = {};
    _tokens.filter(function(t) { return t.type !== 'EOF'; })
           .forEach(function(t) { counts[t.type] = (counts[t.type] || 0) + 1; });
    var maxC = Math.max.apply(null, Object.values(counts).concat([1]));

    tline('Distribution:', 't-dim');
    Object.keys(counts).forEach(function(type) {
      var ti  = TOKEN_TYPES[type] || TOKEN_TYPES.UNKNOWN;
      var pct = Math.round(counts[type] / maxC * 100);
      out('<div class="t-bar-row">' +
        '<span class="t-bar-label" style="color:' + ti.color + '">' + ti.label + '</span>' +
        '<div class="t-bar-track"><div class="t-bar-fill" style="width:' + pct + '%;background:' + ti.color + '"></div></div>' +
        '<span class="t-bar-count">' + counts[type] + '</span>' +
      '</div>');
    });
  },

  /* -- parse -- */
  parse: function() {
    needCompiled(); if (!compiled) return;
    tline('Abstract Syntax Tree', 't-head');
    blank();
    printNode(_ast, '', true, 0);
  },

  /* -- semantic -- */
  semantic: function() {
    needCompiled(); if (!compiled) return;

    tline('Semantic Analysis Report', 't-head');
    blank();

    if (_sem.errors.length === 0 && _sem.warnings.length === 0) {
      tline('  No errors or warnings -- program is type-safe.', 't-ok');
    }
    _sem.errors.forEach(function(e) {
      tline('  [ERROR]  ' + e.msg + (e.line ? '  (line ~' + e.line + ')' : ''), 't-err');
    });
    _sem.warnings.forEach(function(w) {
      tline('  [WARN]   ' + w.msg + (w.line ? '  (line ~' + w.line + ')' : ''), 't-warn');
    });

    blank();

    /* Scope tree */
    tline('Scope Tree:', 't-dim');
    var scopes = buildScopeData(_ast);
    var scopeHtml = '<div style="padding-left:4px">' +
      '<div class="t-scope-block" style="border-color:#3d4450">' +
        '<span class="t-dim">scope[0]</span> <span class="t-kw">global</span>' +
      '</div>';

    scopes.forEach(function(s) {
      var indent = s.depth * 16;
      var varBadges = s.vars.map(function(v) {
        return '<span class="t-type">' + v.type + '</span> <span class="t-ident">' + esc(v.name) + '</span>';
      }).join(', ');

      scopeHtml +=
        '<div class="t-scope-block" style="border-color:' + s.color + ';margin-left:' + indent + 'px">' +
          '<span style="color:' + s.color + ';font-size:10px;font-weight:700">scope[' + s.depth + ']</span> ' +
          '<span style="color:#dcdcaa">' + esc(s.label) + '</span>' +
          (s.vars.length ? ' <span class="t-dim">--</span> ' + varBadges : '') +
        '</div>';
    });

    scopeHtml += '</div>';
    out(scopeHtml);
    blank();

    /* Symbol table */
    tline('Symbol Table:', 't-dim');
    out('<div class="t-line">' +
      '<span style="color:#3d4450;display:inline-block;width:120px">NAME</span>' +
      '<span style="display:inline-block;width:80px;color:#3d4450">TYPE</span>' +
      '<span style="display:inline-block;width:90px;color:#3d4450">SCOPE</span>' +
      '<span style="color:#3d4450">LINE</span>' +
    '</div>');

    _sem.symbolTable.forEach(function(s) {
      var tc = s.type === 'int'    ? '#b5cea8' :
               s.type === 'float'  ? '#4ec9b0' :
               s.type === 'string' ? '#ce9178' :
               s.type === 'bool'   ? '#c586c0' : '#6a737d';
      out('<div class="t-line">' +
        '<span class="t-ident" style="display:inline-block;width:120px">' + esc(s.name) + '</span>' +
        '<span style="display:inline-block;width:80px;color:' + tc + '">' + s.type + '</span>' +
        '<span style="display:inline-block;width:90px;color:#4a525a">' + (s.scope <= 1 ? 'global' : 'depth ' + s.scope) + '</span>' +
        '<span style="color:#3d4450">' + (s.line ? 'L' + s.line : '-') + '</span>' +
      '</div>');
    });
  },

  /* -- ir -- */
  ir: function() {
    needCompiled(); if (!compiled) return;

    tline('3-Address Intermediate Representation', 't-head');
    blank();

    /* Group instructions into function chunks */
    var chunks = [], current = null;
    _ir.forEach(function(l) {
      if (l.startsWith('FUNC ')) {
        if (current) chunks.push(current);
        current = { hdr: l, lines: [] };
      } else if (l.startsWith('END_FUNC')) {
        if (current) { current.lines.push(l); chunks.push(current); current = null; }
      } else if (l.trim()) {
        if (!current) current = { hdr: '// top-level', lines: [] };
        current.lines.push(l);
      }
    });
    if (current) chunks.push(current);

    chunks.forEach(function(chunk) {
      var bodyHtml = chunk.lines.map(function(l) {
        var h = esc(l);
        h = h.replace(/\b(DECL|RETURN|PRINT|CALL|PARAM|PARAM_GET|IF_FALSE|GOTO|END_FUNC)\b/g, '<span class="t-ir">$1</span>');
        h = h.replace(/\b(t\d+)\b/g,                                                           '<span class="t-temp">$1</span>');
        h = h.replace(/\b(while_\w+|endwhile_\w+|for_\w+|endfor_\w+|else_\w+|endif_\w+)\b/g,  '<span class="t-label">$1</span>');
        h = h.replace(/\b(int|float|string|bool|void|char)\b/g,                                '<span class="t-type">$1</span>');
        return '<div class="t-line">' + h + '</div>';
      }).join('');

      out('<div class="t-box">' +
        '<div class="t-box-head">' + esc(chunk.hdr) + '</div>' +
        '<div class="t-box-body">' + bodyHtml + '</div>' +
      '</div>');
    });
  },

  /* -- algos -- */
  algos: function() {
    needCompiled(); if (!compiled) return;

    tline('Algorithm Pattern Detection', 't-head');
    blank();

    if (!_algos.length) {
      tline('  No complex algorithm patterns detected.', 't-dim');
      return;
    }

    _algos.forEach(function(a) {
      out('<div class="t-algo-block">' +
        '<div class="t-algo-head">' +
          '<span style="font-weight:700;color:#d4d4d4">' + esc(a.name) + '</span>' +
          '<span class="t-algo-badge" style="background:' + a.color + '22;color:' + a.color + '">' + a.badge + '</span>' +
        '</div>' +
        '<div class="t-algo-desc">' + esc(a.desc) + '</div>' +
        '<div class="t-algo-meta">' +
          '<span>Time: ' + a.complexity + '</span>' +
          '<span>Space: ' + a.space + '</span>' +
        '</div>' +
      '</div>');
    });
  },

  /* -- tokens (alias for lex with optional filter) -- */
  tokens: function(args) { COMMANDS.lex(args); },

  /* -- symbols (alias for semantic) -- */
  symbols: function() {
    if (!_sem) { tline('[!] Run compile first.', 't-warn'); return; }
    COMMANDS.semantic();
  },

  /* -- stats -- */
  stats: function() {
    if (!compiled) { tline('[!] Run compile first.', 't-warn'); return; }

    tline('Compilation Statistics', 't-head');
    blank();

    var vis = _tokens.filter(function(t) { return t.type !== 'EOF'; });
    var counts = {};
    vis.forEach(function(t) { counts[t.type] = (counts[t.type] || 0) + 1; });

    var funcs = [];
    function ff(n) {
      if (!n) return;
      if (n.type === 'FunctionDecl') funcs.push(n);
      ['children','stmts'].forEach(function(k) { if (Array.isArray(n[k])) n[k].forEach(ff); });
      if (n.body) ff(n.body);
    }
    ff(_ast);

    var rows = [
      ['Total tokens',          vis.length],
      ['AST nodes',             countNodes(_ast)],
      ['Functions declared',    funcs.length],
      ['Symbols in table',      _sem.symbolTable.length],
      ['Semantic errors',       _sem.errors.length],
      ['Semantic warnings',     _sem.warnings.length],
      ['IR instructions',       _ir.filter(function(l) { return l.trim(); }).length],
      ['Algorithm patterns',    _algos.length],
    ];

    rows.forEach(function(r) {
      out('<div class="t-line">' +
        '<span style="color:#4a525a;display:inline-block;width:220px">' + r[0] + '</span>' +
        '<span style="color:#4fc1ff;font-weight:700">' + r[1] + '</span>' +
      '</div>');
    });

    blank();
    tline('Token breakdown:', 't-dim');
    var maxC = Math.max.apply(null, Object.values(counts).concat([1]));
    Object.keys(counts).forEach(function(type) {
      var ti  = TOKEN_TYPES[type] || TOKEN_TYPES.UNKNOWN;
      var pct = Math.round(counts[type] / maxC * 100);
      out('<div class="t-bar-row">' +
        '<span class="t-bar-label" style="color:' + ti.color + '">' + ti.label + '</span>' +
        '<div class="t-bar-track"><div class="t-bar-fill" style="width:' + pct + '%;background:' + ti.color + '"></div></div>' +
        '<span class="t-bar-count">' + counts[type] + '</span>' +
      '</div>');
    });
  },

  /* -- load -- */
  load: function(args) {
    var name = args && args[0];
    if (!name || !SAMPLES[name]) {
      tline('[!] Usage: load <basic | loop | func | error>', 't-warn');
      return;
    }
    document.getElementById('src').value = SAMPLES[name];
    syncLines();
    compiled = false;
    setStatus('dim', 'ready');
    tline('Loaded sample: ' + name + '  (' + SAMPLES[name].split('\n').length + ' lines)', 't-ok');
    tline('Run "compile" to process it.', 't-dim');
  },

  /* -- clear / cls -- */
  clear: function() { document.getElementById('output').innerHTML = ''; },
  cls:   function() { COMMANDS.clear(); },

};
