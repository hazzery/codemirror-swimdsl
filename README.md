# codemirror-lang-swimdsl

This package implements swimDSL language support for the CodeMirror code editor.

swimDSL is a domain specific language which models the domain of swim
programming. A swim programme is a set of instructions for a swimmer to swim in
the pool, and is typically authored by a swimming coach.
`codemirror-lang-swimdsl` has been primarily developed for the [swimDSL web
editor](https://github.com/bartneck/SwimDsl).

## How can I use `codemirror-lang-swimdsl` in my own project?

To use `codemirror-lang-swimdsl` in your own project, you'll first need to have
CodeMirror ready to go. You can then create an EditorView configured to parse
its contents as swimdsl with the following code.

```ts
import { EditorView, basicSetup } from "codemirror";
import { swimdsl } from "codemirror-lang-swimdsl";

const view = new EditorView({
  parent: document.body,
  doc: "200 Freestyle",
  extensions: [basicSetup, swimdsl()],
});
```

### Translating to swiML

`codemirror-lang-swimdsl` comes with the ability to translate swimDSL documents
into swiML ([learn more about swiML here](http://swiml.org)). A separate
function is exported to create a CodeMirror extension. This function takes as an
argument a callback function. The callback function you provide is called with
the translated swiML XML every single time the document in the editor is
changed.

```ts
import { EditorView, basicSetup } from "codemirror";
import { compileSwimDsl, swimdsl } from "codemirror-lang-swimdsl";

const view = new EditorView({
  parent: document.body,
  doc: "200 Freestyle",
  extensions: [basicSetup, swimdsl(), compileSwimDsl(console.log)],
});
```
