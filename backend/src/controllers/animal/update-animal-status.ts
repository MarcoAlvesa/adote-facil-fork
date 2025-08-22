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