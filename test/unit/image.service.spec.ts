import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from '../../src/modules/image/services/image.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';

describe('ImageService', () => {
  let service: ImageService;
  const testStoragePath = path.join(__dirname, '../../../test-storage');

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        storagePath: testStoragePath,
      };
      return config[key];
    }),
  };

  beforeAll(async () => {
    try {
      await fs.mkdir(testStoragePath, { recursive: true });
    } catch (error) {
      console.error('Error creating test storage directory:', error);
    }
  });

  afterEach(async () => {
    try {
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

    const id = await service.saveImage(dummyFile);
    expect(id).toBeDefined();

    const retrieved = await service.getImage(id);
    expect(retrieved).toEqual(dummyFile.buffer);
  });

  it('should convert image format', async () => {
    const imagePath = path.join(__dirname, '../test-images/sample.jpeg');
    const imageBuffer = await fs.readFile(imagePath);

    const dummyFile = {
      originalname: 'sample.jpeg',
      buffer: imageBuffer,
    } as Express.Multer.File;

    const id = await service.saveImage(dummyFile);
    expect(id).toBeDefined();

    const pngImageBuffer = await service.getImage(id, 'png');
    expect(pngImageBuffer).toBeInstanceOf(Buffer);
    expect(pngImageBuffer.length).toBeGreaterThan(0);

    const metadata = await sharp(pngImageBuffer).metadata();
    expect(metadata.format).toBe('png');
  });

  it('should return null for non-existent image', async () => {
    const nonExistentId = 'non-existent-id';
    const retrieved = await service.getImage(nonExistentId);
    expect(retrieved).toBeNull();
  });

  it('should handle unsupported format gracefully', async () => {
    const imagePath = path.join(__dirname, '../test-images/sample.jpeg');
    const imageBuffer = await fs.readFile(imagePath);

    const dummyFile = {
      originalname: 'sample.jpeg',
      buffer: imageBuffer,
    } as Express.Multer.File;

    const id = await service.saveImage(dummyFile);
    expect(id).toBeDefined();

    const unsupportedFormat = 'unsupportedformat';

    await expect(service.getImage(id, unsupportedFormat)).rejects.toThrow(
      `Unsupported image format`,
    );
  });

  it('should successfully upload a large image', async () => {
    const largeImageBuffer = Buffer.alloc(10 * 1024 * 1024);
    const largeFile = {
      originalname: 'large_test.jpg',
      buffer: largeImageBuffer,
    } as Express.Multer.File;

    const id = await service.saveImage(largeFile);
    expect(id).toBeDefined();

    const retrieved = await service.getImage(id);
    expect(retrieved).toEqual(largeFile.buffer);
  });

  it('should handle concurrent image uploads', async () => {
    const files = Array.from({ length: 10 }).map((_, i) => ({
      originalname: `image_${i}.jpg`,
      buffer: Buffer.alloc(1 * 1024 * 1024),
    })) as Express.Multer.File[];

    const uploadPromises = files.map((file) => service.saveImage(file));
    const ids = await Promise.all(uploadPromises);

    ids.forEach((id) => expect(id).toBeDefined());

    const retrievalPromises = ids.map((id) => service.getImage(id));
    const images = await Promise.all(retrievalPromises);

    images.forEach((image, index) => {
      expect(image).toEqual(files[index].buffer);
    });
  });
});
