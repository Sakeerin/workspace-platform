import { UserRepository } from '../repositories/user.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { EncryptionService } from '../utils/encryption';
import { JWTService, TokenPair } from '../utils/jwt';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private workspaceRepo: WorkspaceRepository,
    private workspaceMemberRepo: WorkspaceMemberRepository
  ) {}

  async register(dto: RegisterDto): Promise<{ user: any; tokens: TokenPair }> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await EncryptionService.hashPassword(dto.password);

    // Create user
    const user = await this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    // Create default workspace
    const slug = this.generateSlug(dto.name);
    const workspace = await this.workspaceRepo.create({
      name: `${dto.name}'s Workspace`,
      slug,
    });

    // Add user as owner
    await this.workspaceMemberRepo.create({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    });

    // Generate tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.uuid,
      email: user.email,
    });

    return {
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<{ user: any; tokens: TokenPair }> {
    // Find user
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await EncryptionService.comparePassword(
      dto.password,
      user.passwordHash
    );
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.uuid,
      email: user.email,
    });

    return {
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.userRepo.findByUuid(userId);
    if (!user || !user.isActive) {
      throw new Error('User not found');
    }

    return {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      locale: user.locale,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);
  }
}

