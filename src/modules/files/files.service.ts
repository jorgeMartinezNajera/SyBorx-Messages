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

    const appUrl = this.configService.get<string>('appUrl');
    const fileUrl = `${appUrl}/uploads/${file.filename}`;

    return {
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      fileUrl,
    };
  }
}
