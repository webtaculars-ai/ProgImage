import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from '../services/image.service';

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
}
