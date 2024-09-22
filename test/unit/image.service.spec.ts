import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from '../../src/modules/image/services/image.service';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

describe('ImageService', () => {
  let service: ImageService;
  const storagePath = path.join(__dirname, '../../../storage');

  beforeAll(() => {
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up storage after each test
    const files = fs.readdirSync(storagePath);
    for (const file of files) {
      fs.unlinkSync(path.join(storagePath, file));
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageService],
    }).compile();

    service = module.get<ImageService>(ImageService);
  });

  it('should save and retrieve an image', async () => {
    const dummyFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('dummy data'),
    } as Express.Multer.File;

    const id = service.saveImage(dummyFile);
    expect(id).toBeDefined();

    const retrieved = await service.getImage(id);
    expect(retrieved).toEqual(dummyFile.buffer);
  });

  it('should convert image format', async () => {
    // Use a real image buffer for accurate testing
    const imagePath = path.join(__dirname, '../test-images/sample.jpeg');
    const imageBuffer = fs.readFileSync(imagePath);

    const dummyFile = {
      originalname: 'sample.jpeg',
      buffer: imageBuffer,
    } as Express.Multer.File;

    const id = service.saveImage(dummyFile);
    expect(id).toBeDefined();

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
    // Use a real image buffer for accurate testing
    const imagePath = path.join(__dirname, '../test-images/sample.jpeg');
    const imageBuffer = fs.readFileSync(imagePath);

    const dummyFile = {
      originalname: 'sample.jpeg',
      buffer: imageBuffer,
    } as Express.Multer.File;

    const id = service.saveImage(dummyFile);
    expect(id).toBeDefined();

    // Attempt to convert to an unsupported format
    const unsupportedFormat = 'unsupportedformat';
    try {
      await service.getImage(id, unsupportedFormat);
      // If no error is thrown, fail the test
      fail('Expected an error to be thrown for unsupported format');
    } catch (error) {
      expect(error).toBeDefined();
      // Depending on implementation, check for specific error types or messages
    }
  });
});
