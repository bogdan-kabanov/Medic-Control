import type Redis from "ioredis";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { RegisterStudentRequest } from "@medcare/contracts";
import { ok, err, type Result } from "@medcare/contracts";
import type { Env } from "../config.js";
import type { UserRepository } from "../repositories/user.repository.js";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  studentId: string | null;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private redis: Redis,
    private config: Env
  ) {}

  async login(email: string, password: string): Promise<Result<LoginResult>> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      return err({ code: "INVALID_CREDENTIALS", message: "Invalid email or password", statusCode: 401 });
    }

    if (!user.isActive) {
      return err({ code: "ACCOUNT_INACTIVE", message: "Account is not activated", statusCode: 403 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return err({ code: "INVALID_CREDENTIALS", message: "Invalid email or password", statusCode: 401 });
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
    };

    const accessToken = jwt.sign(payload, this.config.JWT_SECRET, {
      expiresIn: this.config.ACCESS_TOKEN_TTL,
    });

    const refreshToken = jwt.sign(payload, this.config.JWT_REFRESH_SECRET, {
      expiresIn: this.config.REFRESH_TOKEN_TTL,
    });

    return ok({ accessToken, refreshToken });
  }

  async refresh(refreshToken: string): Promise<Result<{ accessToken: string }>> {
    try {
      const payload = jwt.verify(refreshToken, this.config.JWT_REFRESH_SECRET) as TokenPayload;

      const isBlacklisted = await this.redis.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        return err({ code: "TOKEN_REVOKED", message: "Token has been revoked", statusCode: 401 });
      }

      const accessToken = jwt.sign(
        { userId: payload.userId, email: payload.email, role: payload.role, studentId: payload.studentId },
        this.config.JWT_SECRET,
        { expiresIn: this.config.ACCESS_TOKEN_TTL }
      );

      return ok({ accessToken });
    } catch {
      return err({ code: "INVALID_TOKEN", message: "Invalid refresh token", statusCode: 401 });
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      const decoded = jwt.decode(accessToken) as { exp?: number } | null;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redis.setex(`blacklist:${accessToken}`, ttl, "1");
        }
      }
    } catch {
      // token already invalid, nothing to blacklist
    }
  }

  async verify(accessToken: string): Promise<Result<TokenPayload>> {
    try {
      const isBlacklisted = await this.redis.get(`blacklist:${accessToken}`);
      if (isBlacklisted) {
        return err({ code: "TOKEN_REVOKED", message: "Token has been revoked", statusCode: 401 });
      }

      const payload = jwt.verify(accessToken, this.config.JWT_SECRET) as TokenPayload;
      return ok(payload);
    } catch {
      return err({ code: "INVALID_TOKEN", message: "Invalid or expired token", statusCode: 401 });
    }
  }

  async me(accessToken: string): Promise<Result<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    studentId: string | null;
    isActive: boolean;
    createdAt: string;
  }>> {
    const verifyResult = await this.verify(accessToken);
    if (!verifyResult.ok) return verifyResult;

    const user = await this.userRepo.findById(verifyResult.data.userId);

    if (!user) {
      return err({ code: "USER_NOT_FOUND", message: "User not found", statusCode: 404 });
    }

    return ok({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      studentId: user.studentId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    });
  }

  async registerStudent(data: RegisterStudentRequest): Promise<Result<{ activationCode: string }>> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      return err({ code: "EMAIL_EXISTS", message: "Email already registered", statusCode: 409 });
    }

    const activationCode = crypto.randomInt(100000, 999999).toString();

    await this.userRepo.create({
      email: data.email,
      passwordHash: "",
      firstName: data.firstName,
      lastName: data.lastName,
      role: "student",
      studentId: data.studentId,
      isActive: false,
      activationCode,
    });

    return ok({ activationCode });
  }

  async activate(code: string, password: string): Promise<Result<void>> {
    const user = await this.userRepo.findByActivationCode(code);

    if (!user) {
      return err({ code: "INVALID_CODE", message: "Invalid activation code", statusCode: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.userRepo.updatePassword(user.id, passwordHash, true);

    return ok(undefined as unknown as void);
  }
}
