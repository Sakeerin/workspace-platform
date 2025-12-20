import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { WorkspaceController } from './controllers/workspace.controller';
import { PageController } from './controllers/page.controller';
import { BlockController } from './controllers/block.controller';
import { AuthService } from './services/auth.service';
import { WorkspaceService } from './services/workspace.service';
import { PageService } from './services/page.service';
import { BlockService } from './services/block.service';
import { PermissionService } from './services/permission.service';
import { UserRepository } from './repositories/user.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { PageRepository } from './repositories/page.repository';
import { BlockRepository } from './repositories/block.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AuthController, WorkspaceController, PageController, BlockController],
  providers: [
    AuthService,
    WorkspaceService,
    PageService,
    BlockService,
    PermissionService,
    UserRepository,
    WorkspaceRepository,
    WorkspaceMemberRepository,
    PageRepository,
    BlockRepository,
  ],
})
export class AppModule {}

