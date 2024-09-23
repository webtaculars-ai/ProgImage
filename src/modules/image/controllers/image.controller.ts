import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFiles,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple image files to upload',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    schema: {
      example: [
        { id: 'generated-unique-id-1' },
        { id: 'generated-unique-id-2' },
      ],
    },
  })
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.tiff',
      '.gif',
    ];

    const results = await Promise.all(
      files.map((file) => {
        const fileExt = extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
          throw new BadRequestException(`Unsupported file type: ${fileExt}`);
        }
        return this.imageService.saveImage(file);
      }),
    );

    return results.map((id) => ({ id }));
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
