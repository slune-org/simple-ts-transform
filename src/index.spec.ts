/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import { expect } from 'chai'
import Compiler from 'ts-transform-test-compiler'
import type {
  ExportAssignment,
  Node,
  SourceFile,
  StringLiteral,
  TransformationContext,
  VariableDeclaration,
} from 'typescript'
import {
  NodeFlags,
  SyntaxKind,
  isExportAssignment,
  isSourceFile,
  isStringLiteral,
  isVariableDeclaration,
} from 'typescript'

import type { NodeVisitor, NodeVisitorContext } from '.'
import buildTransformer from '.'

class TestedContext implements NodeVisitorContext {
  public context!: TransformationContext
  public sourceFile!: SourceFile
  public constructor(_program: any, public readonly configuration: any) {}
  public initNewFile(context: TransformationContext, sourceFile: SourceFile): void {
    this.context = context
    this.sourceFile = sourceFile
  }
}

class HelloModifier implements NodeVisitor<StringLiteral> {
  public constructor(private readonly context: TestedContext) {}
  public wants(node: Node): node is StringLiteral {
    return isStringLiteral(node)
  }
  public visit(node: StringLiteral): StringLiteral[] {
    const { createStringLiteral } = this.context.context.factory
    return [createStringLiteral(node.getText().slice(1, -1) + this.context.configuration.message)]
  }
}

class TransferValue implements NodeVisitor<VariableDeclaration> {
  public constructor(private readonly context: TestedContext) {}
  public wants(node: Node): node is VariableDeclaration {
    return isVariableDeclaration(node)
  }
  public visit(node: VariableDeclaration): VariableDeclaration[] {
    const { createIdentifier, createVariableDeclaration } = this.context.context.factory
    return [
      node,
      createVariableDeclaration(
        createIdentifier('value'),
        undefined,
        undefined,
        createIdentifier('result')
      ),
    ]
  }
}

class DeleteExport implements NodeVisitor<ExportAssignment> {
  public wants(node: Node): node is ExportAssignment {
    return isExportAssignment(node)
  }
  public visit(): ExportAssignment[] {
    return []
  }
}

class AddExport implements NodeVisitor<SourceFile> {
  public constructor(private readonly context: TestedContext) {}
  public wants(node: Node): node is SourceFile {
    return isSourceFile(node)
  }
  public visit(node: SourceFile): SourceFile[] {
    const {
      createIdentifier,
      createModifier,
      createVariableDeclaration,
      createVariableDeclarationList,
      createVariableStatement,
      updateSourceFile,
    } = this.context.context.factory
    return [
      updateSourceFile(node, [
        ...node.statements,
        createVariableStatement(
          [createModifier(SyntaxKind.ExportKeyword)],
          createVariableDeclarationList(
            [
              createVariableDeclaration(
                createIdentifier('finalValue'),
                undefined,
                undefined,
                createIdentifier('value')
              ),
            ],
            NodeFlags.Const
          )
        ),
      ]),
    ]
  }
}

describe('simple-ts-transform', function () {
  this.slow(4000)
  this.timeout(10000)

  it('should create a noop transformer', function () {
    const result = new Compiler(buildTransformer(TestedContext, []), 'dist/__test__')
      .setRootDir('__test__')
      .compile('noop', {})
    expect(result.succeeded).to.be.true
    expect(result.requireContent()).to.equal('Hello')
  })

  it('should transform string in file', function () {
    const result = new Compiler(buildTransformer(TestedContext, [HelloModifier]), 'dist/__test__')
      .setRootDir('__test__')
      .compile('world', { message: ' world' })
    expect(result.succeeded).to.be.true
    expect(result.requireContent()).to.equal('Hello world')
  })

  it('should change node counts', function () {
    const result = new Compiler(
      buildTransformer(TestedContext, [TransferValue, DeleteExport, AddExport]),
      'dist/__test__'
    )
      .setRootDir('__test__')
      .compile('counts', { message: ' world' })
    expect(result.succeeded).to.be.true
    expect(result.requireContent(undefined, 'finalValue')).to.equal('Hello')
  })
})
