import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { UserRepository } from '../repositories/user.repository';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('workspaces/:workspaceUuid/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly userRepo: UserRepository
  ) {}

  @Get()
  async search(
    @Param('workspaceUuid') workspaceUuid: string,
    @Request() req: any,
    @Query('q') query: string,
    @Query('type') type?: 'page' | 'block' | 'database',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    if (!query) {
      throw new Error('Query parameter q is required');
    }

    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const results = await this.searchService.search(workspaceUuid, user.id, query, {
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      success: true,
      data: results,
    };
  }
}

