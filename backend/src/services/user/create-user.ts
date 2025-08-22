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