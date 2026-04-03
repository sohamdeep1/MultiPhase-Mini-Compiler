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

