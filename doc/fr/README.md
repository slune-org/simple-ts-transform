# simple-ts-transform - Bibliothèque d'aide à la création de transformateurs typescript simples

Ce paquet fourni une API simple pour construire des transformateurs _TypeScript_, basés sur un contexte partagé et plusieurs visiteurs de nœuds.

Pour des exemples d'utilisation, vous pouvez regarder:

- [ts-transform-asset](https://github.com/slune-org/ts-transform-asset)
- [ts-transform-auto-require](https://github.com/slune-org/ts-transform-auto-require)

Vous pourriez également être intéressé par:

- [ts-transform-test-compiler](https://github.com/slune-org/ts-transform-test-compiler)

# Langue

Les documents et messages, le code (y compris les noms de variable et commentaires), sont en anglais.

Cependant, Slune étant une entreprise française, tous les documents et messages importants doivent également être fournis en français. Les autres traductions sont bienvenues.

# Installation

L’installation se fait avec la commande `npm install` :

```bash
$ npm install --save simple-ts-transform
```

# Utilisation

## Contexte

Tout d'abord, créez la classe de contexte. Vous pouvez y mettre tout ce dont vous avez besoin pour vos visiteurs. Le contexte est créé lorsque la compilation commence et est mis à jour pour chaque fichier. Vos visiteurs de nœuds peuvent accéder au contexte et, bien sûr, peuvent également le modifier si besoin.

Le constructeur de la classe de contexte sera appelé avec :

- un paramètre `ts.Program`,
- un objet `unknown` contenant la configuration fournie au transformateur.

La classe de contexte doit également implémenter la méthode `initNewFile(context: TransformationContext, sourceFile: SourceFile): void`, appelée avant de visiter chaque nouveau fichier.

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

## Visiteurs de nœuds

Ensuite, vous pouvez créer les visiteurs de nœuds. Les visiteurs de nœuds sont créés pour chaque fichier une fois que le contexte est initialisé et avant de démarrer la visite.

Puisque chaque visiteur de nœuds ne gère qu'un seul type de nœud, ce type doit être fourni comme paramètre générique `N` à l'interface implémentée.

Le constructeur du visiteur sera appelé avec votre contexte comme unique paramètre.

Votre visiteur doit implémenter les méthodes suivantes :

- La méthode `wants(node: Node): node is N` fait des vérifications basiques sur le nœud pour indiquer si le visiteur va le gérer ou non. Cette méthode sert également de barrière de type (_type guard_) pour assurer que le nœud a bien le type approprié.
- La méthode `visit(node: N): Node[]` reçoit le nœud a visiter afin de travailler dessus. Cette méthode renvoie un tableau de 0, 1 ou plus de nœuds, donc elle peut supprimer, modifier ou créer des nœuds. Les nœuds créés par ce visiteur seront visités par tous les visiteurs fournis suivants.

```typescript
// MyFileNameInserter.ts
import type { NodeVisitor } from 'simple-ts-transform'
import type { Node, StringLiteral } from 'typescript'
import { isStringLiteral } from 'typescript'
import type { MyContext } from './MyContext'

export default class MyFileNameInserter implements NodeVisitor<StringLiteral> {
  private readonly fileName: string
  public constructor(private readonly context: MyContext) {
    this.fileName = context.fileName
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

## Appel

Il n'y a actuellement pas moyen de déclarer un transformateur dans le compilateur _TypeScript_ standard. Si vous ne souhaitez pas écrire votre propre compilateur en utilisant l'API `typescript`, vous pouvez utiliser la surcouche [ttypescript](https://www.npmjs.com/package/ttypescript).

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

Notez que le transformateur construit est de type `program`, qui est le type par défaut pour `ttypescript`. C'est pour cela qu'il est inutile d'ajouter une entrée `type` dans la configuration.

# Contribuer

Bien que nous ne puissions pas garantir un temps de réponse, n’hésitez pas à ouvrir un incident si vous avez une question ou un problème pour utiliser ce paquet.

Les _Pull Requests_ sont bienvenues. Vous pouvez bien sûr soumettre des corrections ou améliorations de code, mais n’hésitez pas également à améliorer la documentation, même pour de petites fautes d’orthographe ou de grammaire.
