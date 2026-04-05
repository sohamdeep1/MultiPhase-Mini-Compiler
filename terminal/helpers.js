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
