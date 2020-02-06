# simple-ts-transform - Bibliothèque d'aide à la création de transformateurs typescript simples

Ce paquet fourni une API simple pour construire des tranformateurs _TypeScript_, basés sur un contexte partagé et plusieurs visiteurs de nœuds.

Pour des exemples d'utilisation, vous pouvez regarder:

- [ts-transform-asset](https://github.com/slune-org/ts-transform-asset)
- [ts-transform-auto-require](https://github.com/slune-org/ts-transform-auto-require)

Vous pourriez également être intéressé par:

- [ts-transform-test-compiler](https://github.com/slune-org/ts-transform-test-compiler)

# Langue

Slune étant une entreprise française, vous trouverez tous les documents et messages en français. Les autres traductions sont bienvenues.

Cependant, l'anglais étant la langue de la programmation, le code, y compris les noms de variable et commentaires, sont en anglais.

# Installation

L'installation se fait avec la commande `npm install` :

```bash
$ npm install --save simple-ts-transform
```

Si vous préférez utiliser `yarn` :

```bash
$ yarn add simple-ts-transform
```

# Utilisation

## Contexte

Tout d'abord, créez la classe de contexte. Vous pouvez y mettre tout ce dont vous avez besoin pour vos visiteurs. Le contexte est créé lorsque la compilation commence et est mis à jour pour chaque fichier. Vos visiteurs de nœuds peuvent accéder au contexte et, bien sûr, peuvent également le modifier si besoin.

Le constructeur de la classe de contexte sera appelé avec :

- un paramètre `ts.Program`,
- un objet `any` contenant la configuration fournie au transformateur.

La classe de contexte doit également implémenter la méthode `initNewFile(context: TransformationContext, sourceFile: SourceFile): void`, appelée avant de visiter chaque nouveau fichier.

```typescript
// MyContext.ts
import { NodeVisitorContext } from 'simple-ts-transform'
import { Program, SourceFile, TransformationContext } from 'typescript'

export default class MyContext implements NodeVisitorContext {
  public readonly basePath: string
  public fileName?: string
  public constructor(program: Program, public readonly configuration: any) {
    this.basePath = program.getCompilerOptions().rootDir || program.getCurrentDirectory()
  }
  public initNewFile(_context: TransformationContext, sourceFile: SourceFile): void {
    this.fileName = sourceFile.fileName
  }
}
```

## Visiteurs de nœuds

Ensuite, vous pouvez créer les visiteurs de nœuds. Les visiteurs de nœuds sont créés pour chaque fichier une fois que le contexte est initialisé et avant de démarrer la visite.

Puisque chaque visiteur de nœuds ne gère qu'un seul type de nœud, ce type doit être fourni comme paramètre générique `N` à l'interface implémentée.

Le constructeur du visiteur sera appelé avec votre contexte comme unique paramètre.

Votre visiteur doit implémenter les méthodes suivantes :

- La méthode `wants(node: Node): node is N` fait des vérifications basiques sur le nœud pour indiquer si le visiteur va le gérer ou non. Cette méthode sert également de barrière de type (_type guard_) pour assurer que le nœud a bien le type approprié.
- La méthode `visit(node: N): Node[]` reçoit le nœud a visiter afin de travailler dessus. Cette méthode renvoie un tableau de 0, 1 ou plus de nœuds, donc elle peut supprimer, modifier ou créer des nœuds. Les nœuds créés par ce visiteur seront visités par tous les visiteurs fournis suivants.

```typescript
// MyFileNameInserter.ts
import { NodeVisitor } from 'simple-ts-transform'
import { Node, StringLiteral } from 'typescript'

export default class MyFileNameInserter implements NodeVisitor<StringLiteral> {
  private readonly fileName: string
  public constructor(private readonly context: MyContext) {
    this.fileName = context.fileName!
  }
  public wants(node: Node): node is StringLiteral {
    return isStringLiteral(node)
  }
  public visit(node: StringLiteral) {
    return [createStringLiteral(this.fileName + ': ' + node.getText().slice(1, -1)]
  }
}
```

## Transformateur

Vous pouvez finalement créer le transformateur. Pour cela, appelez simplement `buildTransformer` avec la classe de contexte et les visiteurs de nœuds dans l'ordre où ils doivent être exécutés.

```typescript
// index.ts
import buildTransformer from 'simple-ts-transform'
import MyContext from './MyContext'
import MyFileNameInserter from './MyFileNameInserter'
import OtherVisitor from './OtherVisitor'

const transformer = buildTransformer(MyContext, [MyFileNameInserter, OtherVisitor])
export default transformer
```
