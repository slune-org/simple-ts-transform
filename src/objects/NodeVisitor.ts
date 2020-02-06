import { Node } from 'typescript'

import NodeVisitorContext from './NodeVisitorContext'

/**
 * A visitor to use on an AST node.
 */
export default interface NodeVisitor<N extends Node> {
  /**
   * Indicate if the visitor wants to visit the current node. Also used as type guard.
   *
   * @param node - The node to visit.
   * @returns True if the visitor wants to visit this node.
   */
  wants(node: Node): node is N

  /**
   * Visit the given node.
   *
   * @param node - The node to visit.
   * @returns The new nodes to use instead of visited one.
   */
  visit(node: N): Node[]
}

/**
 * Defines the constructor of the visitors.
 */
export type NodeVisitorType<C extends NodeVisitorContext> = new (context: C) => NodeVisitor<any>
