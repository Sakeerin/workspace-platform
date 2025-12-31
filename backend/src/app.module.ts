import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { WorkspaceController } from './controllers/workspace.controller';
import { PageController } from './controllers/page.controller';
import { BlockController } from './controllers/block.controller';
import { DatabaseController } from './controllers/database.controller';
import { CommentController } from './controllers/comment.controller';
import { AuthService } from './services/auth.service';
import { WorkspaceService } from './services/workspace.service';
import { PageService } from './services/page.service';
import { BlockService } from './services/block.service';
import { DatabaseService } from './services/database.service';
import { CommentService } from './services/comment.service';
import { NotificationService } from './services/notification.service';
import { PermissionService } from './services/permission.service';
import { UserRepository } from './repositories/user.repository';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { PageRepository } from './repositories/page.repository';
import { BlockRepository } from './repositories/block.repository';
import { DatabaseRepository } from './repositories/database.repository';
import { DatabaseRowRepository } from './repositories/database-row.repository';
import { CommentRepository } from './repositories/comment.repository';
import { FavoriteRepository } from './repositories/favorite.repository';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AuthController, WorkspaceController, PageController, BlockController, DatabaseController, CommentController, SearchController],
  providers: [
    AuthService,
    WorkspaceService,
    PageService,
    BlockService,
    DatabaseService,
    CommentService,
    NotificationService,
    PermissionService,
    SearchService,
    UserRepository,
    WorkspaceRepository,
    WorkspaceMemberRepository,
    PageRepository,
    BlockRepository,
    DatabaseRepository,
    DatabaseRowRepository,
    CommentRepository,
    FavoriteRepository,
  ],
})
export class AppModule {}

