// test/unit/image.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from '../../src/modules/image/services/image.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';

describe('ImageService', () => {
  let service: ImageService;
  const testStoragePath = path.join(__dirname, '../../../test-storage');

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        storagePath: testStoragePath,
        // Add other configuration keys if needed
      };
      return config[key];
    }),
  };

  beforeAll(async () => {
    try {
      // Create the test storage directory
      await fs.mkdir(testStoragePath, { recursive: true });
    } catch (error) {
      console.error('Error creating test storage directory:', error);
    }
  });

  afterEach(async () => {
    try {
      // Clean up storage after each test by deleting all files
      const files = await fs.readdir(testStoragePath);
      const unlinkPromises = files.map((file) =>
        fs.unlink(path.join(testStoragePath, file)),
      );
      await Promise.all(unlinkPromises);
    } catch (error) {
      console.error('Error cleaning test storage directory:', error);
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ImageService>(ImageService);
  });

  it('should save and retrieve an image', async () => {
    const dummyFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('dummy data'),
    } as Express.Multer.File;

    // Await the asynchronous saveImage method
    const id = await service.saveImage(dummyFile);
    expect(id).toBeDefined();

    // Await the asynchronous getImage method
    const retrieved = await service.getImage(id);
    expect(retrieved).toEqual(dummyFile.buffer);
  });

  it('should convert image format', async () => {
    // Path to a real image for accurate testing
    const imagePath = path.join(__dirname, '../test-images/sample.jpeg');
    const imageBuffer = await fs.readFile(imagePath);

    const dummyFile = {
      originalname: 'sample.jpeg',
      buffer: imageBuffer,
    } as Express.Multer.File;

    const id = await service.saveImage(dummyFile);
    expect(id).toBeDefined();

    // Attempt to convert the image to PNG format
    const pngImageBuffer = await service.getImage(id, 'png');
    expect(pngImageBuffer).toBeInstanceOf(Buffer);
    expect(pngImageBuffer.length).toBeGreaterThan(0);

    // Verify that the converted image is indeed a PNG
    const metadata = await sharp(pngImageBuffer).metadata();
    expect(metadata.format).toBe('png');
  });

  it('should return null for non-existent image', async () => {
    const nonExistentId = 'non-existent-id';
    const retrieved = await service.getImage(nonExistentId);
    expect(retrieved).toBeNull();
  });

  it('should handle unsupported format gracefully', async () => {
    // Path to a real image for accurate testing
    const imagePath = path.join(__dirname, '../test-images/sample.jpeg');
    const imageBuffer = await fs.readFile(imagePath);

    const dummyFile = {
      originalname: 'sample.jpeg',
      buffer: imageBuffer,
    } as Express.Multer.File;

    const id = await service.saveImage(dummyFile);
    expect(id).toBeDefined();

    // Attempt to convert to an unsupported format
    const unsupportedFormat = 'unsupportedformat';

    // Use Jest's .rejects.toThrow() for expecting exceptions
    await expect(service.getImage(id, unsupportedFormat)).rejects.toThrow(
      `Unsupported image format`,
    );
  });
});
