// Copyright (c) 2026 Rally. All rights reserved.

import type { FastifyReply, FastifyRequest } from "fastify";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

declare module "fastify" {
  interface FastifyRequest {
    // The logged-in person's Firebase user ID, set by requireUser.
    firebaseUid: string;
  }
}

// Checks a Firebase ID token and returns whose it is. Throws if the token is
// invalid or expired. Tests pass a fake one instead of calling Firebase.
export type VerifyIdToken = (token: string) => Promise<{ uid: string }>;

// Checking tokens only needs the project ID, not a service account key.
export const firebaseTokenVerifier = (projectId: string): VerifyIdToken => {
  const auth = getAuth(initializeApp({ projectId }));
  return (token) => auth.verifyIdToken(token);
};

// Rejects the request unless it has a valid "Authorization: Bearer <token>" header.
export const requireUser =
  (verifyIdToken: VerifyIdToken) => async (request: FastifyRequest, reply: FastifyReply) => {
    // "Bearer" may be written in any case, as the HTTP standard allows.
    const token = /^Bearer (.+)$/i.exec(request.headers.authorization ?? "")?.[1];
    if (!token) return reply.code(401).send({ message: "Log in to continue." });
    try {
      request.firebaseUid = (await verifyIdToken(token)).uid;
    } catch {
      return reply.code(401).send({ message: "Your session has expired. Log in again." });
    }
  };
