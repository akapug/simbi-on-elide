"""
Image Processing Workers
Handles image uploads, avatar updates, and image transformations
"""

import os
import sys
import json
import requests
from PIL import Image
from io import BytesIO
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ImageWorker:
    """Base class for image processing workers"""

    def __init__(self):
        self.s3_bucket = os.getenv('S3_BUCKET', 'simbi-uploads')
        self.cdn_url = os.getenv('CDN_URL', 'https://cdn.simbi.com')

    def log_info(self, message):
        logger.info(f"[ImageWorker] {message}")

    def log_error(self, error):
        logger.error(f"[ImageWorker ERROR] {error}")

    def download_image(self, url):
        """Download image from URL"""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return BytesIO(response.content)
        except Exception as e:
            self.log_error(f"Failed to download image from {url}: {e}")
            raise

    def resize_image(self, image_data, size):
        """Resize image to specified size"""
        try:
            img = Image.open(image_data)

            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background

            # Calculate aspect ratio
            img.thumbnail(size, Image.LANCZOS)

            # Save to BytesIO
            output = BytesIO()
            img.save(output, format='JPEG', quality=85)
            output.seek(0)

            return output
        except Exception as e:
            self.log_error(f"Failed to resize image: {e}")
            raise

    def crop_image(self, image_data, x, y, width, height):
        """Crop image to specified dimensions"""
        try:
            img = Image.open(image_data)
            cropped = img.crop((x, y, x + width, y + height))

            output = BytesIO()
            cropped.save(output, format='JPEG', quality=85)
            output.seek(0)

            return output
        except Exception as e:
            self.log_error(f"Failed to crop image: {e}")
            raise

    def upload_to_s3(self, image_data, key):
        """Upload image to S3"""
        try:
            import boto3
            s3_client = boto3.client('s3')

            s3_client.upload_fileobj(
                image_data,
                self.s3_bucket,
                key,
                ExtraArgs={'ContentType': 'image/jpeg', 'ACL': 'public-read'}
            )

            return f"{self.cdn_url}/{key}"
        except Exception as e:
            self.log_error(f"Failed to upload to S3: {e}")
            raise


class UploadImageWorker(ImageWorker):
    """Worker for uploading and processing images"""

    def perform(self, image_id, upload_id):
        """
        Upload and process an image
        Args:
            image_id: ID of the image record
            upload_id: ID of the upload record
        """
        self.log_info(f"Uploading image {image_id} with upload {upload_id}")

        try:
            # In real implementation, fetch from database
            # For now, we'll use a mock implementation

            # Mark image as processing
            self.update_image_status(image_id, 'processing')

            # Get upload path from upload record
            upload_path = self.get_upload_path(upload_id)

            if not upload_path:
                return {'success': False, 'error': 'Upload not found'}

            # Generate different sizes
            sizes = {
                'original': None,  # No resize
                'large': (1200, 1200),
                'medium': (600, 600),
                'thumb': (150, 150),
            }

            urls = {}
            for size_name, dimensions in sizes.items():
                with open(upload_path, 'rb') as f:
                    image_data = BytesIO(f.read())

                if dimensions:
                    image_data = self.resize_image(image_data, dimensions)

                # Upload to S3
                key = f"images/{image_id}/{size_name}.jpg"
                url = self.upload_to_s3(image_data, key)
                urls[size_name] = url

            # Update image record with URLs
            self.update_image_urls(image_id, urls)

            # Mark as processed
            self.update_image_status(image_id, 'processed')

            # Delete upload record
            self.delete_upload(upload_id)

            return {
                'success': True,
                'image_id': image_id,
                'urls': urls
            }

        except Exception as e:
            self.log_error(f"Error uploading image: {e}")
            self.update_image_status(image_id, 'failed')
            return {
                'success': False,
                'error': str(e)
            }

    def get_upload_path(self, upload_id):
        """Get upload file path from database"""
        # Mock implementation - would query database
        return f"/tmp/uploads/{upload_id}.jpg"

    def update_image_status(self, image_id, status):
        """Update image processing status"""
        self.log_info(f"Image {image_id} status: {status}")
        # Would update database

    def update_image_urls(self, image_id, urls):
        """Update image URLs in database"""
        self.log_info(f"Image {image_id} URLs: {urls}")
        # Would update database

    def delete_upload(self, upload_id):
        """Delete upload record"""
        self.log_info(f"Deleting upload {upload_id}")
        # Would delete from database


class UpdateAvatarWorker(ImageWorker):
    """Worker for updating user avatars"""

    def perform(self, user_id, avatar_params, updater_id):
        """
        Update user avatar
        Args:
            user_id: ID of the user
            avatar_params: Avatar parameters (upload_id, data_uri, crop info)
            updater_id: ID of the user making the update
        """
        self.log_info(f"Updating user {user_id} avatar: {avatar_params}")

        try:
            # Mark avatar as processing
            self.update_user_status(user_id, {'avatar_processing': True})

            # Get current avatar URL
            old_avatar = self.get_current_avatar(user_id)

            image_data = None

            # Handle different avatar sources
            if 'upload_id' in avatar_params:
                # From upload
                upload_path = self.get_upload_path(avatar_params['upload_id'])
                with open(upload_path, 'rb') as f:
                    image_data = BytesIO(f.read())

            elif 'data_uri' in avatar_params:
                # From data URI (camera)
                import base64
                data_uri = avatar_params['data_uri']
                if 'base64,' in data_uri:
                    base64_data = data_uri.split('base64,')[1]
                    image_data = BytesIO(base64.b64decode(base64_data))

            elif 'cropping' in avatar_params and avatar_params['cropping']:
                # Crop existing avatar
                if old_avatar:
                    old_image = self.download_image(old_avatar)
                    crop_params = avatar_params.get('crop', {})
                    image_data = self.crop_image(
                        old_image,
                        crop_params.get('x', 0),
                        crop_params.get('y', 0),
                        crop_params.get('width', 500),
                        crop_params.get('height', 500)
                    )

            if not image_data:
                return {'success': False, 'error': 'No image data provided'}

            # Generate avatar sizes
            sizes = {
                'original': None,
                'large': (400, 400),
                'medium': (200, 200),
                'thumb': (80, 80),
            }

            urls = {}
            for size_name, dimensions in sizes.items():
                img_data = BytesIO(image_data.getvalue())

                if dimensions:
                    img_data = self.resize_image(img_data, dimensions)

                # Upload to S3
                key = f"avatars/{user_id}/{size_name}.jpg"
                url = self.upload_to_s3(img_data, key)
                urls[size_name] = url

            # Update user avatar URLs
            self.update_user_avatar(user_id, urls)

            # Mark as done
            self.update_user_status(user_id, {'avatar_processing': False})

            # Notify via websocket
            self.notify_avatar_update(updater_id, urls['medium'])

            return {
                'success': True,
                'user_id': user_id,
                'urls': urls
            }

        except Exception as e:
            self.log_error(f"Error updating avatar: {e}")
            self.update_user_status(user_id, {'avatar_processing': False})
            return {
                'success': False,
                'error': str(e)
            }

    def get_current_avatar(self, user_id):
        """Get current avatar URL"""
        # Would query database
        return None

    def update_user_status(self, user_id, status):
        """Update user status"""
        self.log_info(f"User {user_id} status: {status}")
        # Would update database

    def update_user_avatar(self, user_id, urls):
        """Update user avatar URLs"""
        self.log_info(f"User {user_id} avatar URLs: {urls}")
        # Would update database

    def notify_avatar_update(self, user_id, avatar_url):
        """Notify via websocket"""
        self.log_info(f"Notifying user {user_id} of avatar update")
        # Would send websocket notification


class ImageOptimizationWorker(ImageWorker):
    """Worker for optimizing images"""

    def perform(self, image_id):
        """Optimize an existing image"""
        self.log_info(f"Optimizing image {image_id}")

        try:
            # Get image URL
            image_url = self.get_image_url(image_id, 'original')

            # Download image
            image_data = self.download_image(image_url)

            # Optimize
            img = Image.open(image_data)

            # Convert to progressive JPEG
            output = BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True, progressive=True)
            output.seek(0)

            # Upload optimized version
            key = f"images/{image_id}/optimized.jpg"
            url = self.upload_to_s3(output, key)

            return {
                'success': True,
                'image_id': image_id,
                'optimized_url': url
            }

        except Exception as e:
            self.log_error(f"Error optimizing image: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_image_url(self, image_id, size):
        """Get image URL from database"""
        # Would query database
        return f"{self.cdn_url}/images/{image_id}/{size}.jpg"


if __name__ == '__main__':
    # For testing
    worker = UploadImageWorker()
    result = worker.perform(1, 1)
    print(json.dumps(result))
