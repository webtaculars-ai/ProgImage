import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import * as sharp from 'sharp';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private storagePath: string;

  constructor(private configService: ConfigService) {
    this.storagePath = path.resolve(
      this.configService.get<string>('storagePath') || 'storage',
    );
    fsPromises
      .mkdir(this.storagePath, { recursive: true })
      .then(() =>
        this.logger.log(`Storage directory set at ${this.storagePath}`),
      )
      .catch((err) =>
        this.logger.error('Error creating storage directory:', err),
      );
  }

  // Save the image and return a unique identifier
  async saveImage(file: Express.Multer.File): Promise<string> {
    const id = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${id}${extension}`;
    const filePath = path.join(this.storagePath, filename);

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      const readStream = new Readable();
      readStream.push(file.buffer);
      readStream.push(null);

      readStream
        .pipe(writeStream)
        .on('finish', () => resolve(id))
        .on('error', reject);
    });
  }

  // Retrieve the image by ID and desired format
  async getImage(id: string, format?: string): Promise<Buffer | null> {
    try {
      const files = await fsPromises.readdir(this.storagePath);
      const file = files.find((f) => f.startsWith(id));
      if (!file) {
        this.logger.warn(`Image not found with ID: ${id}`);
        return null;
      }
      const filePath = path.join(this.storagePath, file);
      let image = await fsPromises.readFile(filePath);

      if (format) {
        const normalizedFormat = this.normalizeFormat(format);
        const currentFormat = path.extname(file).slice(1).toLowerCase();

        // Check for unsupported formats
        const allowedFormats = ['jpeg', 'png', 'webp', 'tiff', 'gif'];
        if (!allowedFormats.includes(normalizedFormat)) {
          throw new BadRequestException(`Unsupported image format ${format}`);
        }

        if (currentFormat !== normalizedFormat) {
          image = await this.convertImageFormat(image, normalizedFormat);
          this.logger.log(
            `Image with ID: ${id} converted to format: ${normalizedFormat}`,
          );
        }
      }

      return image;
    } catch (error) {
      this.logger.error(`Error retrieving image with ID ${id}:`, error);
      throw new BadRequestException(error || 'Failed to retrieve image');
    }
  }

  // Normalize format strings (e.g., 'jpg' to 'jpeg')
  private normalizeFormat(format: string): string {
    const formatMap: { [key: string]: string } = {
      jpg: 'jpeg',
      tiff: 'tiff',
      png: 'png',
      webp: 'webp',
      gif: 'gif',
      // Add more mappings as needed
    };

    const lowerFormat = format.toLowerCase();
    return formatMap[lowerFormat] || lowerFormat;
  }

  // Convert image to desired format using sharp
  private async convertImageFormat(
    imageBuffer: Buffer,
    format: string,
  ): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .toFormat(format as keyof sharp.FormatEnum)
        .toBuffer();
    } catch (error) {
      this.logger.error(`Error converting image to format ${format}:`, error);
      throw new BadRequestException(
        `Failed to convert image to format ${format}`,
      );
    }
  }
}
