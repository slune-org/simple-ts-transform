import { Program, SourceFile, TransformationContext } from 'typescript'

/**
 * The context for the node visitor.
 */
export default interface NodeVisitorContext {
  /**
   * Initialize context for new file.
   *
   * @param context - The transformation context.
   * @param sourceFile - The source file to be visited.
   */
  initNewFile(context: TransformationContext, sourceFile: SourceFile): void
}

/**
 * Defines the constructor of the node visitor context.
 *
 * @param program - The current compilation program.
 * @param configuration - The provided transformer configuration.
 */
export type NodeVisitorContextType<C extends NodeVisitorContext> = new (
  program: Program,
  configuration: any
) => C
