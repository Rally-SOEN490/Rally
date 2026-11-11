// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { fileTypeFromBuffer } from "file-type";
import { requireUser, type VerifyIdToken } from "../../auth.ts";
import type { Database } from "../../db.ts";
import type { ProfilePhotoStorage } from "./photo-storage.ts";
import { profilePhotoMaxBytes, profilePhotoTypes } from "./photo-storage.ts";
import { createUserRepository, type ProfileChanges } from "./repository.ts";
import { directoryQuerySchema, profileChangesBodySchema, registerBodySchema } from "./schemas.ts";
import { createUserService } from "./service.ts";

type RegisterBody = { displayName: string; ageConfirmed: true };

const noAccount = { message: "No Rally account found." };
const photosNotConfigured = { message: "Profile photo uploads are not configured." };

// Sends the user, or 404 when the person has no Rally account.
const sendUserOrNotFound = <T>(user: T | null, reply: FastifyReply) =>
  user ?? reply.code(404).send(noAccount);

// Reads the uploaded photo. Returns an error message instead when the request
// has no file or the file isn't a JPEG, PNG, or WebP image.
const readProfilePhoto = async (
  request: FastifyRequest,
): Promise<{ body: Buffer } | { error: string }> => {
  const file = await request.file({ limits: { files: 1, fileSize: profilePhotoMaxBytes } });
  if (!file) return { error: "Choose a profile photo to upload." };
  const body = await file.toBuffer();
  const detected = await fileTypeFromBuffer(body);
  if (!detected || !profilePhotoTypes.includes(detected.mime))
    return { error: "Use a JPEG, PNG, or WebP image." };
  return { body };
};

export const userRoutes: FastifyPluginAsync<{
  db: Database;
  verifyIdToken: VerifyIdToken;
  photos?: ProfilePhotoStorage;
}> = async (app, { db, verifyIdToken, photos }) => {
  const users = createUserService(createUserRepository(db), photos);

  // Every route in this file needs a logged-in user.
  app.addHook("preHandler", requireUser(verifyIdToken));

  app.get("/", { schema: { querystring: directoryQuerySchema } }, (request) =>
    users.getDirectory(request.firebaseUid),
  );

  // Saves the logged-in person in Rally's database. The app calls this right after sign-up.
  app.post<{ Body: RegisterBody }>("/me", { schema: { body: registerBodySchema } }, (request) =>
    users.register(request.firebaseUid, request.body.displayName),
  );

  app.get("/me", async (request, reply) =>
    sendUserOrNotFound(await users.getCurrent(request.firebaseUid), reply),
  );

  app.patch<{ Body: ProfileChanges }>(
    "/me",
    { schema: { body: profileChangesBodySchema } },
    async (request, reply) =>
      sendUserOrNotFound(await users.update(request.firebaseUid, request.body), reply),
  );

  app.delete("/me/photo", async (request, reply) => {
    if (!photos) return reply.code(503).send(photosNotConfigured);
    return sendUserOrNotFound(await users.removePhoto(request.firebaseUid), reply);
  });

  app.post("/me/photo", async (request, reply) => {
    if (!photos) return reply.code(503).send(photosNotConfigured);
    const photo = await readProfilePhoto(request);
    if ("error" in photo) return reply.code(400).send({ message: photo.error });
    return sendUserOrNotFound(await users.uploadPhoto(request.firebaseUid, photo.body), reply);
  });

  // Deletes the logged-in person's Rally data. The app then deletes their Firebase login.
  app.delete("/me", async (request, reply) => {
    await users.remove(request.firebaseUid);
    return reply.code(204).send();
  });
};
