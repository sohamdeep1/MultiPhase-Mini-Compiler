/**
 * terminal/state.js
 * Shared mutable state for the terminal session.
 *
 * All compiler phases write their results here after running
 * so that later commands (e.g. "symbols" after "compile") can
 * read the cached output without re-running.
 *
 * Variables:
 *   cmdHistory   -- command cmdHistory for arrow-key recall
 *   cmdHistIdx   -- current position in cmdHistory
 *   _tokens   -- token array from last lexer run
 *   _ast      -- AST root from last parser run
 *   _sem      -- semantic result {errors, warnings, symbolTable}
 *   _ir       -- IR instruction string array from last codeGen run
 *   _algos    -- algorithm pattern array from last detectAlgorithms run
 *   compiled  -- true once a successful compile() has been run
 */

var cmdHistory = [];
var cmdHistIdx = -1;

var _tokens  = [];
var _ast     = null;
var _sem     = null;
var _ir      = [];
var _algos   = [];

var compiled = false;

