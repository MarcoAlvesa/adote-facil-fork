# Codesmells e refatorização

### 1. create-animal.ts

Smell detectado: Primitive Obsession

O "smell" ocorre porque estamos utilizando tipos primitivos (string) para representar conceitos de negócio que possuem regras e valores específicos. Por exemplo, o campo gender não deveria aceitar qualquer texto, mas sim um conjunto limitado de valores (como 'MALE' ou 'FEMALE'). O mesmo vale para type ('DOG', 'CAT', etc.).

```typescript
// ...
class CreateAnimalController {
  // ...
  async handle(request: Request, response: Response): Promise<Response> {
    // As propriedades `type`, `gender`, e `race` são apenas strings.
    const { name, type, gender, race, description } = request.body;
    // ...
    try {
      // ...
      const result = await this.createAnimal.execute({
        name,
        type,
        gender,
        race,
        description,
        userId: user?.id || '',
        pictures: pictureBuffers,
      });
}
}
```
A refatoração aplicada introduz um schema de validação na "borda" da aplicação (o controller) para transformar os dados primitivos de entrada em tipos fortes e garantidos, resolvendo a obsessão por primitivos.

Código refatorado:

```typescript
// src/controllers/animal/create-animal.controller.ts (Refatorado)

import { Request, Response } from 'express';
import { z } from 'zod'; // 1. Importa o Zod
import {
  CreateAnimalService,
  createAnimalServiceInstance,
} from '../../services/animal/create-animal.js';

// 2. Define o schema com tipos específicos e regras de validação
const createAnimalBodySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['DOG', 'CAT', 'BIRD', 'OTHER']),
  gender: z.enum(['MALE', 'FEMALE']),
  race: z.string().min(1),
});

class CreateAnimalController {
  constructor(private readonly createAnimal: CreateAnimalService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { user } = request;
    const pictures = request.files as Express.Multer.File[];

    try {
      // 3. Valida o `request.body` usando o schema
      const validationResult = createAnimalBodySchema.safeParse(request.body);

      if (!validationResult.success) {
        // Se a validação falhar, retorna um erro claro
        return response.status(400).json({
          message: 'Invalid input data.',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }
      
      // 4. Utiliza os dados já validados e com tipos seguros
      const body = validationResult.data;

      const pictureBuffers = pictures.map((file) => file.buffer);

      const result = await this.createAnimal.execute({
        name: body.name,
        type: body.type,
        gender: body.gender,
        race: body.race,
        description: body.description,
        userId: user?.id || '',
        pictures: pictureBuffers,
      });

      const statusCode = result.isFailure() ? 400 : 201;
      return response.status(statusCode).json(result.value);

    } catch (err) {
      const error = err as Error;
      console.error('Error creating animal:', error);
      return response.status(500).json({ error: 'Internal server error.' });
    }
  }
}

export const createAnimalControllerInstance = new CreateAnimalController(
  createAnimalServiceInstance,
);
```

### 2. update-animal-status.ts

Smell detectado: Leaking Implementation Details

O problema está localizado no bloco `catch`, que captura erros inesperados. A linha destacada envia a mensagem de erro interna diretamente na resposta da API para o cliente.

```typescript
// ...
class UpdateAnimalStatusController {
  // ...
  async handle(request: Request, response: Response): Promise<Response> {
    // ...
    try {
      // ... (lógica principal)
    } catch (err) {
      const error = err as Error;
      // O erro interno é logado, o que é uma boa prática.
      console.error('Error updating animal:', error); 
      
      // SMELL: A mensagem do erro original é enviada na resposta da API.
      return response.status(500).json({ error: error.message });
    }
  }
}
```

A refatoração consiste em separar o que é registrado para a equipe de desenvolvimento (o detalhe completo do erro) do que é retornado para o cliente (uma mensagem genérica e segura).

```typescript
// src/controllers/animal/update-animal-status.controller.ts (Refatorado)

import { Request, Response } from 'express';
import {
  UpdateAnimalStatusService,
  updateAnimalStatusServiceInstance,
} from '../../services/animal/update-animal-status.js';

class UpdateAnimalStatusController {
  constructor(private readonly updateAnimalStatus: UpdateAnimalStatusService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { status } = request.body;
    const { id } = request.params;
    const { user } = request;

    try {
      const result = await this.updateAnimalStatus.execute({
        id,
        status,
        userId: user?.id || '',
      });

      const statusCode = result.isFailure() ? 400 : 200;

      return response.status(statusCode).json(result.value);
    } catch (err) {
      const error = err as Error;
      // O erro detalhado ainda é logado para depuração interna.
      console.error('Error updating animal:', error);

      // CORREÇÃO: Retorna uma mensagem genérica e segura para o cliente.
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export const updateAnimalStatusControllerInstance =
  new UpdateAnimalStatusController(updateAnimalStatusServiceInstance);
```

### 3. create-user.ts

Smell detectado: magic string

O smell se refere a strings literais usadas diretamente no código que possuem um significado especial, mas não são auto-explicativas. No nosso caso, 'Email já cadastrado.' é uma delas.

```typescript
// ...
export class CreateUserService {
  // ...
  async execute(params: CreateUserDTO.Params): Promise<CreateUserDTO.Result> {
    // ...
    const userAlreadyExists = await this.userRepository.findByEmail(email)

    if (userAlreadyExists) {
      // SMELL: A string 'Email já cadastrado.' é uma "Magic String".
      // O objeto de falha é genérico e não expressa o tipo de erro.
      return Failure.create({ message: 'Email já cadastrado.' })
    }

    const hashedPassword = this.encrypter.encrypt(password)
    // ...
    return Success.create(user)
  }
}
```

A refatoração consiste em substituir a "Magic String" e o objeto de falha genérico por uma classe de erro de domínio específica. Isso torna o erro um cidadão de primeira classe no nosso sistema, com tipo e significado próprios.

```typescript
import { User } from '@prisma/client'
import {
  UserRepository,
  userRepositoryInstance,
} from '../../repositories/user.js'
import { Encrypter, encrypterInstance } from '../../providers/encrypter.js'
import { Either, Failure, Success } from '../../utils/either.js'

// 1. Criamos uma classe de erro de domínio específica.
export class EmailAlreadyExistsError extends Error {
  constructor() {
    // A mensagem agora está centralizada e encapsulada.
    super('Email já cadastrado.')
    this.name = 'EmailAlreadyExistsError'
  }
}

namespace CreateUserDTO {
  export type Params = {
    name: string
    email: string
    password: string
  }

  // 2. O tipo de retorno agora é explícito sobre o erro que pode ocorrer.
  export type Result = Either<EmailAlreadyExistsError, User>
}

export class CreateUserService {
  constructor(
    private readonly encrypter: Encrypter,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    params: CreateUserDTO.Params,
  ): Promise<CreateUserDTO.Result> {
    const { name, email, password } = params

    const userAlreadyExists = await this.userRepository.findByEmail(email)

    if (userAlreadyExists) {
      // 3. Retornamos uma instância do nosso erro tipado.
      return Failure.create(new EmailAlreadyExistsError())
    }

    const hashedPassword = this.encrypter.encrypt(password)

    const user = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
    })

    return Success.create(user)
  }
}

export const createUserServiceInstance = new CreateUserService(
  encrypterInstance,
  userRepositoryInstance,
)
```