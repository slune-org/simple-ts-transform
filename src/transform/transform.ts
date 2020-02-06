import {
  Program,
  SourceFile,
  TransformationContext,
  Transformer,
  TransformerFactory,
  visitNode,
} from 'typescript'

import { NodeVisitorContext, NodeVisitorContextType, NodeVisitorType } from '../objects'
import buildVisitor from './visit'

type TransformerMetaFactory = (program: Program, configuration: any) => TransformerFactory<SourceFile>

export default function<C extends NodeVisitorContext>(
  Context: NodeVisitorContextType<C>,
  NodeVisitors: NodeVisitorType<C>[]
): TransformerMetaFactory {
  return (program: Program, configuration: any): TransformerFactory<SourceFile> => {
    const context: C = new Context(program, configuration)
    return (transContext: TransformationContext): Transformer<SourceFile> => (
      sourceFile: SourceFile
    ): SourceFile => {
      context.initNewFile(transContext, sourceFile)
      const nodeVisitors = NodeVisitors.map(NodeVisitor => new NodeVisitor(context))
      return visitNode(sourceFile, buildVisitor(transContext, nodeVisitors))
    }
  }
}