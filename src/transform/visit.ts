import type { Node, TransformationContext, Visitor } from 'typescript'
import { visitEachChild } from 'typescript'

import type { NodeVisitor } from '../objects'

function visit<N extends Node>(nodeVisitor: NodeVisitor<N>, nodes: Node[]): Node[] {
  const nextNodes: Node[] = []
  nodes.forEach(node => {
    if (nodeVisitor.wants(node)) {
      nextNodes.push(...nodeVisitor.visit(node))
    } else {
      nextNodes.push(node)
    }
  })
  return nextNodes
}

export default function (context: TransformationContext, nodeVisitors: NodeVisitor<any>[]): Visitor {
  const visitor: Visitor = node => {
    const newNodes = nodeVisitors.reduce(
      (nodes, nodeVisitor) => {
        return visit(nodeVisitor, nodes)
      },
      [node]
    )
    return newNodes.length === 0
      ? undefined
      : newNodes.length === 1
      ? visitEachChild(newNodes[0], visitor, context)
      : newNodes.map(newNode => visitEachChild(newNode, visitor, context))
  }
  return visitor
}
