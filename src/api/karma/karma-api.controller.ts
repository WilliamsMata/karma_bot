import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { KarmaService } from '../../karma/karma.service';
import { GroupsService } from '../../groups/groups.service';

@Controller('karma')
export class KarmaApiController {
  constructor(
    private readonly karmaService: KarmaService,
    private readonly groupsService: GroupsService,
  ) {}

  /**
   * Endpoint: GET /api/karma/total
   * Devuelve el número total de usuarios y grupos registrados.
   */
  @Get('total')
  async getTotalStats() {
    return this.karmaService.getTotalUsersAndGroups();
  }

  /**
   * Endpoint: GET /api/karma/group/:groupId
   * Devuelve la información del grupo y una lista de todos sus usuarios
   * ordenados por karma descendente.
   */
  @Get('group/:groupId')
  async getUsersByGroupId(
    @Param('groupId', ParseIntPipe) groupId: number, // Valida y convierte el ID a número
  ) {
    // Replicamos la lógica original de hacer ambas llamadas en paralelo
    const [groupInfo, users] = await Promise.all([
      this.groupsService.getGroupInfo(groupId),
      this.karmaService.getTopKarma(groupId, false, 0), // limit = 0 para obtener todos
    ]);

    if (!groupInfo) {
      throw new NotFoundException(`Group with ID ${groupId} not found.`);
    }

    return { groupInfo, users };
  }
}
