// Copyright (c) 2026 Rally contributors
// AI contribution: 50% or more AI-generated
// SPDX-License-Identifier: MIT

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const profilePhotoMaxBytes = MAX_PHOTO_BYTES;
export const profilePhotoTypes = Object.keys(extensions);

export const createProfilePhotoStorage = ({
  accountId,
  accessKeyId,
  secretAccessKey,
  bucketName,
}: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}) => {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return {
    put: async (uid: string, body: Buffer) => {
      const detected = await fileTypeFromBuffer(body);
      const contentType = detected?.mime;
      const extension = contentType ? extensions[contentType] : undefined;
      if (!extension) throw new Error("Use a JPEG, PNG, or WebP image.");
      const key = `profile-photos/${uid}/${randomUUID()}.${extension}`;
      await client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }));
      return key;
    },
    getUrl: (key: string) => getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucketName, Key: key }),
      { expiresIn: 900 },
    ),
    delete: (key: string) => client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key })),
  };
};

export type ProfilePhotoStorage = ReturnType<typeof createProfilePhotoStorage>;