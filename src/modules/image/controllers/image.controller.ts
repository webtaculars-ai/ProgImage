import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from '../services/image.service';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { extname } from 'path';
import * as fs from 'fs/promises';

@ApiTags('images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  /**
   * Endpoint to upload an image.
   *
   * @param file - The uploaded image file.
   * @returns An object containing the unique ID of the uploaded image.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: { example: { id: 'generated-unique-id' } },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.tiff',
      '.gif',
    ];
    const fileExt = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      throw new BadRequestException('Unsupported file type');
    }

    const id = await this.imageService.saveImage(file);
    return { id };
  }

  /**
   * Endpoint to retrieve an image, with optional format conversion.
   *
   * @param id - The unique identifier of the image.
   * @param format - The desired image format (e.g., png, webp). Optional.
   * @param res - The Express response object.
   */
  @Get(':id.:format?')
  @ApiOperation({
    summary: 'Retrieve an image with optional format conversion',
  })
  @ApiParam({ name: 'id', description: 'Unique identifier of the image' })
  @ApiParam({
    name: 'format',
    description: 'Desired image format (e.g., png, webp)',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Image retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Unsupported image format' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getImage(
    @Param('id') id: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    // Validate format if provided
    const allowedFormats = ['jpeg', 'png', 'webp', 'tiff', 'gif'];
    if (format && !allowedFormats.includes(format.toLowerCase())) {
      throw new BadRequestException('Unsupported image format');
    }

    const image = await this.imageService.getImage(id, format);
    if (!image) {
      return res.status(404).send('Image not found');
    }

    // Determine the actual format from the image buffer
    let actualFormat = 'jpeg'; // Default
    if (format) {
      actualFormat = format.toLowerCase();
    } else {
      // Extract format from original file if format not specified
      try {
        const files = await fs.readdir(this.imageService['storagePath']);
        const file = files.find((f) => f.startsWith(id));
        if (file) {
          const ext = extname(file).slice(1).toLowerCase();
          actualFormat = this.imageService['normalizeFormat'](ext);
        }
      } catch (error) {
        // Handle potential errors when reading the directory
        this.imageService['logger'].error(
          `Error reading storage directory:`,
          error,
        );
        return res.status(500).send('Internal Server Error');
      }
    }

    const mimeTypeMap: { [key: string]: string } = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      tiff: 'image/tiff',
      gif: 'image/gif',
    };

    const mimeType = mimeTypeMap[actualFormat] || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.send(image);
  }
}
