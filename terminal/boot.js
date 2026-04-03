/**
 * terminal/boot.js
 * Application boot sequence.
 *
 * Runs once the DOM is ready (placed at the end of index.html
 * after all other scripts have loaded).
 *
 * Steps:
 *   1. Load the default sample into the editor
 *   2. Sync the line-number gutter
 *   3. Focus the terminal input
 *   4. Print the ASCII banner and welcome message
 */

(function boot() {
  /* Load default sample */
  document.getElementById('src').value = SAMPLES.basic;
  syncLines();
  document.getElementById('cmd-input').focus();

  /* ASCII banner */
  var banner = [
  ];
  banner.forEach(function(b) { out('<div class="t-line">' + b + '</div>'); });

  blank();
  tline('Multi-Phase Compiler  --  Lexer | Parser | Semantic | IR Codegen', 't-dim');
  tline('Type  <span class="t-kw">help</span>  for all commands   |   <span class="t-kw">compile</span>  to run all 4 phases', 't-dim');
  tline('Editor on the left   |   <span class="t-kw">load &lt;basic|loop|func|error&gt;</span>  for samples', 't-dim');
  blank();
  ruler();
})();
