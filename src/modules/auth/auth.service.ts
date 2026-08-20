import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GlobalRole, CommunityRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, displayName, avatarUrl, bio } = registerDto;

    // Validate email domain policy
    this.validateEmailPolicy(email);

    // Check if email or username already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictException('El correo electrónico ya se encuentra registrado');
      }
      throw new ConflictException('El nombre de usuario ya se encuentra en uso');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Determine initial role: If it is the first user registered, assign SUPERADMIN, otherwise DEVELOPER
    const userCount = await this.prisma.user.count();
    const globalRole = userCount === 0 ? GlobalRole.SUPERADMIN : GlobalRole.DEVELOPER;

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        displayName,
        avatarUrl,
        bio,
        globalRole,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        globalRole: true,
        status: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    // Auto-join nuevos usuarios a la comunidad pública principal
    const publicCommunity = await this.prisma.community.findFirst({
      where: { isPrivate: false },
      orderBy: { createdAt: 'asc' },
    });
    if (publicCommunity) {
      await this.prisma.communityMember.create({
        data: {
          communityId: publicCommunity.id,
          userId: user.id,
          role: CommunityRole.COMMUNITY_MEMBER,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.username, user.globalRole);

    return {
      message: 'Usuario registrado exitosamente',
      user,
      mustChangePassword: false,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { identifier, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta ha sido desactivada por un administrador');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si la contraseña expiró por política de 6 meses (180 días)
    const isOverSixMonths =
      user.passwordChangedAt &&
      Date.now() - new Date(user.passwordChangedAt).getTime() > 180 * 24 * 60 * 60 * 1000;
    const mustChangePassword = Boolean(user.mustChangePassword || isOverSixMonths);

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.username,
      user.globalRole,
      ipAddress,
      userAgent,
    );

    return {
      message: mustChangePassword
        ? 'Inicio de sesión exitoso. Se requiere actualizar la contraseña por seguridad.'
        : 'Inicio de sesión exitoso',
      mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        globalRole: user.globalRole,
        status: user.status,
        customStatus: user.customStatus,
        mustChangePassword,
      },
      ...tokens,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (currentPassword) {
      const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        throw new BadRequestException('La contraseña actual o temporal proporcionada es incorrecta');
      }
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameAsOld) {
      throw new BadRequestException('La nueva contraseña no puede ser idéntica a la anterior');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        temporaryPasswordExpiresAt: null,
      },
    });

    // Invalida tokens previos
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return {
      message: 'Contraseña actualizada exitosamente',
      mustChangePassword: false,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Sesión no válida o usuario inactivo');
      }

      // Verify token exists in database
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          userId: user.id,
          expiresAt: { gt: new Date() },
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token revocado o no encontrado');
      }

      // Generate new pair
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.username,
        user.globalRole,
      );

      return tokens;
    } catch (err) {
      throw new UnauthorizedException('Refresh token expirado o inválido');
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return { message: 'Sesión cerrada exitosamente' };
  }

  private validateEmailPolicy(email: string) {
    const domain = email.split('@')[1]?.toLowerCase();
    const allowedCorpDomain = this.configService.get<string>('corporate.allowedDomain');
    const allowGmail = this.configService.get<boolean>('corporate.allowGmailTesting');

    const isCorpDomain = domain === allowedCorpDomain;
    const isGmail = domain === 'gmail.com';

    if (!isCorpDomain && (!allowGmail || !isGmail)) {
      throw new BadRequestException(
        `Solo se permiten correos corporativos (@${allowedCorpDomain})${
          allowGmail ? ' o cuentas @gmail.com de pruebas' : ''
        }`,
      );
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    username: string,
    globalRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload = { sub: userId, email, username, globalRole };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save refresh token in DB
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: await bcrypt.hash(refreshToken, 6),
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }
}
