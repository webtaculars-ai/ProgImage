import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from '../services/image.service';
import { Response } from 'express';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  // Endpoint to upload an image
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    const id = this.imageService.saveImage(file);
    return { id };
  }

  // Endpoint to retrieve an image, with optional format conversion
  @Get(':id.:format?')
  async getImage(
    @Param('id') id: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    const image = await this.imageService.getImage(id, format); // Use await here
    if (!image) {
      return res.status(404).send('Image not found');
    }

    let mimeType = 'image/jpeg'; // Default MIME type
    if (format) {
      mimeType = `image/${format}`;
    }
    res.setHeader('Content-Type', mimeType);
    res.send(image);
  }
}
