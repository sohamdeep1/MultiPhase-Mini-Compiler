# Multi-Phase MiniCompiler Terminal

A browser-based multi-phase compiler with a terminal interface.
Open `index.html` in any browser -- no server or build tools needed.

---

## Folder Structure

```
mc-terminal/
|
|-- index.html                   Entry point (HTML shell only, no inline JS)
|
|-- styles/
|   +-- terminal.css             All CSS: variables, layout, terminal primitives
|
|-- samples/
|   +-- samples.js               Four sample programs: basic, loop, func, error
|
|-- src/                         Compiler engine (pure logic, no DOM)
|   |-- lexer/
|   |   +-- lexer.js             Phase 1: character scanner -> token stream
|   |-- parser/
|   |   +-- parser.js            Phase 2: recursive descent parser -> AST
|   |-- semantic/
|   |   +-- semantic.js          Phase 3: type checker + scope analyser
|   +-- codegen/
|       +-- codegen.js           Phase 4: 3-address IR + algorithm detector
|
+-- terminal/                    Terminal UI layer (reads compiler output, renders it)
    |-- state.js                 Shared mutable state (_tokens, _ast, _sem, _ir, etc.)
    |-- output.js                Low-level output primitives (out, tline, blank, etc.)
    |-- helpers.js               AST printer, scope builder, node counter, setStatus
    |-- commands.js              All COMMANDS handlers (help, compile, lex, parse, ...)
    |-- input.js                 Keyboard handler: Enter, arrows, Tab, Ctrl+L
    |-- editor.js                Line-number sync, loadSample(), cursor tracking
    +-- boot.js                  Startup sequence: load default sample, print banner
```

---

## Script Load Order (index.html)

The browser executes scripts in this exact order -- each file depends on those above it:

```
samples.js        -- SAMPLES variable
lexer.js          -- TOKEN_TYPES, lexer()
parser.js         -- parser()
semantic.js       -- semantic()
codegen.js        -- codeGen(), detectAlgorithms()
state.js          -- shared vars: _tokens, _ast, compiled, ...
output.js         -- out(), tline(), blank(), echoCmd(), progress()
helpers.js        -- countNodes(), buildScopeData(), printNode(), setStatus()
commands.js       -- COMMANDS object (uses all of the above)
input.js          -- handleKey() (uses COMMANDS, history, histIdx)
editor.js         -- syncLines(), loadSample() (uses SAMPLES, compiled)
boot.js           -- runs IIFE: loads sample, prints banner
```


---

## Compiler Phases

### Phase 1 -- Lexical Analysis (`src/lexer/lexer.js`)
Character-level scanner. Produces a flat token stream from source text.
Token types: KEYWORD, IDENTIFIER, INT_LIT, FLOAT_LIT, STR_LIT, BOOL_LIT,
OPERATOR, PUNCT, COMMENT, UNKNOWN, EOF.

### Phase 2 -- Syntax Parsing (`src/parser/parser.js`)
Recursive descent parser. Builds an Abstract Syntax Tree (AST).
Handles: function declarations, variable declarations, if/else, while,
for, return, print, and full expression precedence (7 levels).

### Phase 3 -- Semantic Analysis (`src/semantic/semantic.js`)
AST walker. Checks program correctness:
- Multi-level scope-aware symbol table
- Undeclared variable and function detection
- Type compatibility (int, float, string, bool)
- Duplicate declaration errors
- Unused variable warnings

### Phase 4 -- IR and Algorithm Mapping (`src/codegen/codegen.js`)
Two outputs:
- 3-Address Code (TAC): temps t1 t2..., labels while_1 endwhile_1...
- Algorithm pattern detection: loops, recursion, branching, math, sorting

---

## Terminal Commands

| Command          | Description                                      |
|------------------|--------------------------------------------------|
| `compile`        | Run all 4 phases on the editor source            |
| `lex`            | Phase 1 -- token table + distribution chart      |
| `parse`          | Phase 2 -- AST printed as an indented tree       |
| `semantic`       | Phase 3 -- errors, scope tree, symbol table      |
| `ir`             | Phase 4 -- 3-address IR code by function         |
| `algos`          | Phase 4 -- detected algorithm patterns           |
| `tokens [TYPE]`  | Filter token table (e.g. `tokens KEYWORD`)       |
| `symbols`        | Alias for `semantic`                             |
| `stats`          | Full compilation statistics                      |
| `load <name>`    | Load sample: basic, loop, func, error            |
| `clear` / `cls`  | Clear terminal output                            |
| `help`           | Show command list                                |

### Keyboard shortcuts
- `Arrow Up / Down` -- command history
- `Tab`             -- autocomplete command name
- `Ctrl + L`        -- clear terminal

---

## How to Run

```bash
# Simply open in a browser
open index.html

# Or serve locally to avoid any CORS edge cases
python3 -m http.server 8080
# then open http://localhost:8080
```
