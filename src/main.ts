import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api';
  const corsOrigin = configService.get<string>('corsOrigin') || '*';

  // 1. Global Prefix
  app.setGlobalPrefix(apiPrefix);

  // 2. Enable CORS
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Serve Static Uploaded Files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // 5. Swagger / OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SyBorx-Messenger API')
    .setDescription(
      `## Backend API para Plataforma de Mensajería Empresarial y Comunidades
      
Permite la comunicación en tiempo real, gestión de espacios de trabajo (tipo Discord/Slack),
canales temáticos, mensajería directa 1 a 1, subida de archivos adjuntos y control de roles RBAC.

### Roles Disponibles:
* **SUPERADMIN**: Acceso total al sistema, auditoría y asignación de roles directivos.
* **ADMIN**: Gestión de usuarios, moderación de comunidades y canales.
* **TECH_LEAD**: Líder técnico con permisos de creación de comunidades y canales de proyecto.
* **DEVELOPER**: Ingeniero de software con permisos de creación de comunidades y participación total.
* **GUEST**: Rol de pruebas (ej. cuentas Gmail de QA) con permisos solo de lectura/participación en comunidades públicas.`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el Access Token obtenido en /api/auth/login o /api/auth/register',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  // 6. Start listening
  await app.listen(port);
  logger.log(`🚀 SyBorx-Messenger Backend running at: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger API Documentation available at: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`⚡ WebSocket Gateway listening at namespace: /realtime`);
}

bootstrap();
