import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { WorkspaceController } from './controllers/workspace.controller';
import { AuthService } from './services/auth.service';
import { WorkspaceService } from './services/workspace.service';
import { PermissionService } from './services/permission.service';
import { UserRepository } from './repositories/user.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AuthController, WorkspaceController],
  providers: [
    AuthService,
    WorkspaceService,
    PermissionService,
    UserRepository,
    WorkspaceRepository,
    WorkspaceMemberRepository,
  ],
})
export class AppModule {}

