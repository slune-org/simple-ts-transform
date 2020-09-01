[![npm package](https://badge.fury.io/js/simple-ts-transform.svg)](https://www.npmjs.com/package/simple-ts-transform)
[![License](https://img.shields.io/github/license/slune-org/simple-ts-transform.svg)](https://github.com/slune-org/simple-ts-transform/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/slune-org/simple-ts-transform.svg?branch=master)](https://travis-ci.org/slune-org/simple-ts-transform)
[![Coverage Status](https://coveralls.io/repos/github/slune-org/simple-ts-transform/badge.svg?branch=master)](https://coveralls.io/github/slune-org/simple-ts-transform?branch=master)
[![Issues](https://img.shields.io/github/issues/slune-org/simple-ts-transform.svg)](https://github.com/slune-org/simple-ts-transform/issues)

# simple-ts-transform - Library to help create simple typescript transformers

This package provides a simple API to build _TypeScript_ transformers, based on a shared context and multiple node visitors.

For usage examples, you can look at:

- [ts-transform-asset](https://github.com/slune-org/ts-transform-asset)
- [ts-transform-auto-require](https://github.com/slune-org/ts-transform-auto-require)

You may also be interrested in:

- [ts-transform-test-compiler](https://github.com/slune-org/ts-transform-test-compiler)

# Language/langue

Documents, messages, code (including variable names and comments), are in English.

Anyway, because Slune is French firm, all documents and important messages must also be provided in French. Other translations are welcome.

:fr: Une version française de ce document se trouve [ici](doc/fr/README.md).

# Installation

Installation is done using `npm install` command:

```bash
$ npm install --save simple-ts-transform
```

# Usage

## Context

First, create the context class. You can put in it whatever you need for your visitors. The context is created when the compilation starts and is updated for each file. Your node visitors can access the context, and of course, can also modify it if needed.

The context class constructor will be called with:

- a `ts.Program` parameter,
- an `unknown` object containing the configuration provided to the transformer.

The context class must also implement the `initNewFile(context: TransformationContext, sourceFile: SourceFile): void` method, called before visiting each new file.

```typescript
// MyContext.ts
import type { NodeVisitorContext } from 'simple-ts-transform'
import type { NodeFactory, Program, SourceFile, TransformationContext } from 'typescript'

export default class MyContext implements NodeVisitorContext {
  public readonly basePath: string
  public factory!: NodeFactory
  public fileName!: string
  public constructor(program: Program, public readonly _configuration: unknown) {
    this.basePath = program.getCompilerOptions().rootDir || program.getCurrentDirectory()
  }
  public initNewFile(context: TransformationContext, sourceFile: SourceFile): void {
    this.factory = context.factory
    this.fileName = sourceFile.fileName
  }
}
```

## Node visitors

Then, you can create the node visitors. The node visitors are created for each file after the context is initialized and before starting the visit.

Because each node visitor is only managing one single type of node, this node type must be given as generic parameter `N` to the implemented interface.

The visitor constructor will be called with your context as single parameter.

Your visitor must implement the following methods:

- The method `wants(node: Node): node is N` make some basic checks on the node to indicate if the visitor will manage it or not. This method also serves as a type guard to ensure the node is of appropriate type.
- The method `visit(node: N): Node[]` is given the node to visit in order to work on it. This method returns an array of 0, 1 or more nodes, so it can remove, update or create nodes. The nodes created by this visitor will be visited by all the following provided visitors.

```typescript
// MyFileNameInserter.ts
import type { NodeVisitor } from 'simple-ts-transform'
import type { Node, StringLiteral } from 'typescript'
import { isStringLiteral } from 'typescript'
import type { MyContext } from './MyContext'

export default class MyFileNameInserter implements NodeVisitor<StringLiteral> {
  private readonly fileName: string
  public constructor(private readonly context: MyContext) {
    this.fileName = context.fileName!
  }
  public wants(node: Node): node is StringLiteral {
    return isStringLiteral(node)
  }
  public visit(node: StringLiteral) {
    const { createStringLiteral } = this.context.factory
    return [createStringLiteral(this.fileName + ': ' + node.getText().slice(1, -1)]
  }
}
```

## Transformer

You finally can create the transformer. For this, simply call `buildTransformer` and provide the context class and the node visitors in the order they have to be executed.

```typescript
// index.ts
import buildTransformer from 'simple-ts-transform'
import MyContext from './MyContext'
import MyFileNameInserter from './MyFileNameInserter'
import OtherVisitor from './OtherVisitor'

const transformer = buildTransformer(MyContext, [MyFileNameInserter, OtherVisitor])
export default transformer
```

## Call

There is currently no way of declaring a transformer in the vanilla _TypeScript_ compiler. If you do not want to write your own compiler using the `typescript` API, you can use the [ttypescript](https://www.npmjs.com/package/ttypescript) wrapper. The configuration then is made in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "my-transformer",
        "my-config-entry": "hello",
        "another-config": true
      }
    ]
  }
}
```

Note that the built transformer is of type `program` which is the default for `ttypescript`. That's why you don't need to add a `type` entry in the configuration.

# Contributing

Even though we cannot guarantee a response time, please feel free to file an issue if you have any question or problem using the package.

_Pull Requests_ are welcome. You can, of course, submit corrections or improvements for code, but do not hesitate to also improve documentation, even for small spell or grammar errors.
