# Mini Compiler — Multi-Phase Analysis

A browser-based multi-phase compiler built from scratch in plain HTML/CSS/JS.
No build tools, no dependencies — just open `index.html`.

## Project Structure

mini-compiler/
│
├── index.html                  ← Entry point (loads all scripts & styles)
│
├── styles/
│   ├── base.css                ← Design tokens, reset, layout, animations
│   ├── editor.css              ← Header, code editor, status bar
│   ├── output.css              ← Tabs, phase panels, pipeline diagram
│   └── components.css         ← Token table, AST tree, symbol table, IR blocks
│
├── samples/
│   └── samples.js              ← Pre-written example programs (basic, loop, func, error)
│
├── src/
│   ├── lexer/
│   │   └── lexer.js            ← Phase 1: Tokenizer (character-level scanner)
│   │
│   ├── parser/
│   │   └── parser.js           ← Phase 2: Recursive descent parser → AST
│   │
│   ├── semantic/
│   │   └── semantic.js         ← Phase 3: Type checker + scope analyser
│   │
│   ├── codegen/
│   │   └── codegen.js          ← Phase 4: 3-address IR + algorithm detector
│
└── README.md
