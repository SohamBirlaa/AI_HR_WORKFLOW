import io
import uuid
import zipfile
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from typing import Optional
from app.core.config import settings
from app.services.storage_base import BaseStorageService

class S3StorageService(BaseStorageService):
    """S3-compatible storage implementation for managing resume uploads."""

    def __init__(self):
        """Initialize the boto3 S3 client using project environment configurations."""
        self.bucket_name = settings.S3_BUCKET_NAME
        
        # Configure signature version explicitly to support MinIO and newer AWS S3 region requirements
        s3_config = Config(signature_version="s3v4")
        
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            config=s3_config
        )

    def validate_resume_file(self, content: bytes, content_type: str) -> bool:
        """Inspects file headers (magic bytes) and MIME structure to validate file authenticity.
        
        Blocks renamed files (e.g. executable .exe renamed to .pdf or .docx).
        """
        # PDF Validation: check magic bytes prefix %PDF- (hex: 25 50 44 46)
        if content.startswith(b"%PDF"):
            return content_type == "application/pdf"

        # DOCX Validation: check magic bytes PK.. (hex: 50 4b 03 04)
        if content.startswith(b"PK\x03\x04"):
            valid_docx_mimes = [
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/octet-stream"  # Browser generic upload fallback
            ]
            if content_type not in valid_docx_mimes:
                return False

            # Verify the ZIP container is valid and contains Microsoft Word OpenXML file properties
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as z:
                    file_list = z.namelist()
                    # A true DOCX document contains '[Content_Types].xml' and some word folder properties
                    if "[Content_Types].xml" in file_list and any(f.startswith("word/") for f in file_list):
                        return True
            except Exception:
                return False

        # All other structures are rejected (EXE, ZIP, JS, BAT, etc.)
        return False

    async def _ensure_bucket_exists(self):
        """Helper to check bucket existence and create it if it is missing."""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            # 404 means bucket does not exist, so we will attempt to create it
            if error_code in ("404", "NoSuchBucket") or e.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 404:
                try:
                    # In us-east-1, LocationConstraint causes errors, so handle location logic carefully
                    if settings.S3_REGION == "us-east-1":
                        self.s3_client.create_bucket(Bucket=self.bucket_name)
                    else:
                        self.s3_client.create_bucket(
                            Bucket=self.bucket_name,
                            CreateBucketConfiguration={"LocationConstraint": settings.S3_REGION}
                        )
                except ClientError as create_err:
                    # Log or ignore if bucket was created by a concurrent request
                    if "BucketAlreadyOwnedByYou" not in str(create_err) and "BucketAlreadyExists" not in str(create_err):
                        raise create_err
            else:
                raise e

    async def upload_resume(self, file_content: bytes, filename: str) -> str:
        """Uploads candidate resume bytes to the configured S3/MinIO bucket.
        
        Returns:
            The unique storage key (path) inside the bucket.
        """
        # Ensure the storage bucket exists before attempting uploads
        await self._ensure_bucket_exists()

        # Sanitize filename extension to maintain a clean key structure
        ext = "pdf" if filename.lower().endswith(".pdf") else "docx"
        unique_key = f"resumes/{uuid.uuid4()}.{ext}"

        # Upload the object payload
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=unique_key,
            Body=file_content,
            ContentType="application/pdf" if ext == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        return unique_key

    def get_resume_download_url(self, storage_key: str) -> str:
        """Generates a transient, secure presigned download link for the resume object."""
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": storage_key},
                ExpiresIn=3600  # Token expires in 1 hour
            )
            return url
        except ClientError as e:
            # Fallback or error resolution
            raise RuntimeError(f"Failed to generate presigned download URL: {str(e)}") from e
