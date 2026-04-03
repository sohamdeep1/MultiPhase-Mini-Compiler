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
