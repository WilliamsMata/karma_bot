import { Injectable } from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { Group } from './schemas/group.schema';

interface ITelegramChat {
  id: number;
  title?: string;
}

@Injectable()
export class GroupsService {
  constructor(private readonly groupsRepository: GroupsRepository) {}

  /**
   * Encuentra un grupo por su ID de Telegram o lo crea si no existe.
   * Lógica movida desde KarmaService.
   */
  async findOrCreate(chatData: ITelegramChat): Promise<Group> {
    const group = await this.groupsRepository.upsert(
      { groupId: chatData.id },
      { $set: { groupName: chatData.title } },
    );
    if (!group)
      throw new Error(`Could not find or create group ${chatData.id}`);
    return group;
  }

  /**
   * Obtiene la información de un grupo por su ID.
   */
  async getGroupInfo(groupId: number): Promise<Group | null> {
    return this.groupsRepository.findOne({ groupId });
  }

  /**
   * Obtiene los IDs de todos los grupos registrados.
   */
  async getDistinctGroupIds(): Promise<number[]> {
    const groups = await this.groupsRepository.find({});
    return groups.map((g) => g.groupId);
  }

  /**
   * Cuenta todos los grupos en la base de datos.
   */
  async count(): Promise<number> {
    return this.groupsRepository.countDocuments();
  }

  /**
   * Encuentra múltiples grupos por sus ObjectIds de la base de datos.
   */
  async findByIds(groupIds: any[]): Promise<Group[]> {
    return this.groupsRepository.find({ _id: { $in: groupIds } });
  }
}
