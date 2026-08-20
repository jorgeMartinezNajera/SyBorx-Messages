import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly configService: ConfigService) {}

  formatUploadedFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    // Usar ruta relativa para que funcione tanto en localhost como en la IP de red local (192.168.x.x) y en producción
    const fileUrl = `/uploads/${file.filename}`;

    return {
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      fileUrl,
    };
  }
}
