import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

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
}
