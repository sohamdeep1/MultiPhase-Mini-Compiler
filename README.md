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

