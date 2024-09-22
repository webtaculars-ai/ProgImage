import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class ImageService {
  private storagePath = path.join(__dirname, '../../../../storage');

  constructor() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  // Save the image and return a unique identifier
  saveImage(file: Express.Multer.File): string {
    const id = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${id}${extension}`;
    fs.writeFileSync(path.join(this.storagePath, filename), file.buffer);
    return id;
  }

  // Retrieve the image by ID and desired format
  async getImage(id: string, format?: string): Promise<Buffer | null> {
    const files = fs.readdirSync(this.storagePath);
    const file = files.find((f) => f.startsWith(id));
    if (!file) {
      return null;
    }
    const filePath = path.join(this.storagePath, file);
    let image = fs.readFileSync(filePath);
    if (format) {
      const currentFormat = path.extname(file).slice(1);
      if (currentFormat !== format) {
        image = await this.convertImageFormat(image, format);
      }
    }
    return image;
  }

  // Convert image to desired format using sharp
  private async convertImageFormat(
    imageBuffer: Buffer,
    format: string,
  ): Promise<Buffer> {
    return await sharp(imageBuffer)
      .toFormat(format as keyof sharp.FormatEnum)
      .toBuffer();
  }
}
