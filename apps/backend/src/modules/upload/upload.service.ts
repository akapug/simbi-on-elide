import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client | null = null;
  private bucket: string;
  private enabled = false;
  private readonly localStoragePath = path.join(process.cwd(), 'uploads');

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const accessKey = this.config.get('AWS_ACCESS_KEY_ID');
    const secretKey = this.config.get('AWS_SECRET_ACCESS_KEY');
    const bucket = this.config.get('AWS_S3_BUCKET');

    if (!accessKey || !secretKey || !bucket ||
        accessKey.startsWith('your-aws') || bucket.startsWith('your-bucket')) {
      this.logger.warn('⚠️  AWS S3 not configured - files will be stored locally in ./uploads/');
      this.enabled = false;
      // Ensure local storage directory exists
      await fs.mkdir(this.localStoragePath, { recursive: true });
      return;
    }

    try {
      this.s3Client = new S3Client({
        region: this.config.get('AWS_REGION') || 'us-east-1',
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      });
      this.bucket = bucket;
      this.enabled = true;
      this.logger.log('✅ AWS S3 configured');
    } catch (error) {
      this.logger.warn('⚠️  AWS S3 initialization failed - using local storage');
      this.enabled = false;
      await fs.mkdir(this.localStoragePath, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File, userId: string) {
    // Resize and optimize image
    const optimized = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const filename = `${uuidv4()}.jpg`;
    const key = `users/${userId}/${filename}`;

    if (this.enabled && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: optimized,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
        }),
      );

      return {
        url: `https://${this.bucket}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${key}`,
        key,
      };
    } else {
      // Local storage fallback
      return this.uploadLocally(optimized, `users/${userId}`, filename);
    }
  }

  async uploadAvatar(file: Express.Multer.File, userId: string) {
    const optimized = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();

    const filename = `${userId}.jpg`;
    const key = `avatars/${filename}`;

    if (this.enabled && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: optimized,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
        }),
      );

      return {
        url: `https://${this.bucket}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${key}`,
        key,
      };
    } else {
      // Local storage fallback
      return this.uploadLocally(optimized, 'avatars', filename);
    }
  }

  private async uploadLocally(buffer: Buffer, folder: string, filename: string) {
    const folderPath = path.join(this.localStoragePath, folder);
    await fs.mkdir(folderPath, { recursive: true });

    const filePath = path.join(folderPath, filename);
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${folder}/${filename}`;
    this.logger.debug(`File stored locally: ${url}`);

    return {
      url,
      key: `${folder}/${filename}`,
    };
  }
}
