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