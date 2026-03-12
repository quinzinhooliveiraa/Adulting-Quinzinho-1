import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { storage } from "./storage";
import { pool } from "./db";
import { insertJournalEntrySchema, insertMoodCheckinSchema } from "@shared/schema";
import { z } from "zod";

const PgStore = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const supplied = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, supplied);
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }
  next();
}

function getUserPremiumStatus(user: { role: string; isPremium: boolean; trialEndsAt: Date | null; premiumUntil: Date | null; isActive: boolean }) {
  if (user.role === "admin") return { hasPremium: true, reason: "admin" as const };
  if (!user.isActive) return { hasPremium: false, reason: "blocked" as const };
  if (user.isPremium) {
    if (user.premiumUntil && user.premiumUntil > new Date()) {
      return { hasPremium: true, reason: "paid" as const };
    }
    if (!user.premiumUntil) {
      return { hasPremium: true, reason: "granted" as const };
    }
  }
  if (user.trialEndsAt && user.trialEndsAt > new Date()) {
    return { hasPremium: true, reason: "trial" as const };
  }
  return { hasPremium: false, reason: "expired" as const };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      store: new PgStore({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "casa-dos-20-secret-key-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(4),
    inviteCode: z.string().optional(),
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const user = await storage.createUser({
        username: data.email,
        password: hashPassword(data.password),
        name: data.name,
        email: data.email,
        role: "user",
        isPremium: false,
        isActive: true,
        trialEndsAt,
        premiumUntil: null,
        invitedBy: data.inviteCode || null,
      });

      req.session.userId = user.id;
      const premiumStatus = getUserPremiumStatus(user);
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPremium: premiumStatus.hasPremium,
        premiumReason: premiumStatus.reason,
        trialEndsAt: user.trialEndsAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user || !verifyPassword(data.password, user.password)) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Conta desativada. Entre em contato com o suporte." });
      }

      req.session.userId = user.id;
      const premiumStatus = getUserPremiumStatus(user);
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPremium: premiumStatus.hasPremium,
        premiumReason: premiumStatus.reason,
        trialEndsAt: user.trialEndsAt,
        premiumUntil: user.premiumUntil,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    const premiumStatus = getUserPremiumStatus(user);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasPremium: premiumStatus.hasPremium,
      premiumReason: premiumStatus.reason,
      trialEndsAt: user.trialEndsAt,
      premiumUntil: user.premiumUntil,
      isActive: user.isActive,
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logout realizado" });
    });
  });

  app.get("/api/admin/users", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersWithStatus = allUsers.map(u => {
        const premiumStatus = getUserPremiumStatus(u);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isPremium: u.isPremium,
          isActive: u.isActive,
          hasPremium: premiumStatus.hasPremium,
          premiumReason: premiumStatus.reason,
          trialEndsAt: u.trialEndsAt,
          premiumUntil: u.premiumUntil,
          invitedBy: u.invitedBy,
          createdAt: u.createdAt,
        };
      });
      res.json(usersWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  const updateUserSchema = z.object({
    isPremium: z.boolean().optional(),
    isActive: z.boolean().optional(),
    role: z.enum(["user", "admin"]).optional(),
    premiumUntil: z.string().nullable().optional(),
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const data = updateUserSchema.parse(req.body);

      const updateData: any = {};
      if (data.isPremium !== undefined) updateData.isPremium = data.isPremium;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.premiumUntil !== undefined) {
        updateData.premiumUntil = data.premiumUntil ? new Date(data.premiumUntil) : null;
      }

      const updated = await storage.updateUser(userId, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const premiumStatus = getUserPremiumStatus(updated);
      res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isPremium: updated.isPremium,
        isActive: updated.isActive,
        hasPremium: premiumStatus.hasPremium,
        premiumReason: premiumStatus.reason,
        trialEndsAt: updated.trialEndsAt,
        premiumUntil: updated.premiumUntil,
        invitedBy: updated.invitedBy,
        createdAt: updated.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.post("/api/admin/invite", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { email, name, grantPremium } = req.body;
      if (!email || !name) {
        return res.status(400).json({ message: "Nome e email são obrigatórios" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }

      const tempPassword = randomBytes(4).toString("hex");
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const user = await storage.createUser({
        username: email,
        password: hashPassword(tempPassword),
        name,
        email,
        role: "user",
        isPremium: grantPremium || false,
        isActive: true,
        trialEndsAt,
        premiumUntil: null,
        invitedBy: "admin",
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        tempPassword,
        message: `Conta criada. Senha temporária: ${tempPassword}`,
      });
    } catch (error) {
      console.error("Invite error:", error);
      res.status(500).json({ message: "Erro ao convidar usuário" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const now = new Date();
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.isActive).length;
      const premiumUsers = allUsers.filter(u => {
        const s = getUserPremiumStatus(u);
        return s.hasPremium && s.reason === "paid";
      }).length;
      const trialUsers = allUsers.filter(u => {
        const s = getUserPremiumStatus(u);
        return s.hasPremium && s.reason === "trial";
      }).length;
      const grantedUsers = allUsers.filter(u => {
        const s = getUserPremiumStatus(u);
        return s.hasPremium && s.reason === "granted";
      }).length;
      const expiredUsers = allUsers.filter(u => {
        const s = getUserPremiumStatus(u);
        return !s.hasPremium && s.reason === "expired";
      }).length;
      const blockedUsers = allUsers.filter(u => !u.isActive).length;

      res.json({
        totalUsers,
        activeUsers,
        premiumUsers,
        trialUsers,
        grantedUsers,
        expiredUsers,
        blockedUsers,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/journal", requireAuth, async (req: Request, res: Response) => {
    try {
      const tag = req.query.tag as string | undefined;
      let entries;
      if (tag && tag !== "Todas") {
        entries = await storage.getEntriesByTag(req.session.userId!, tag);
      } else {
        entries = await storage.getEntries(req.session.userId!);
      }
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar entradas" });
    }
  });

  const createEntrySchema = z.object({
    text: z.string().min(1),
    tags: z.array(z.string()).default([]),
    mood: z.string().optional(),
    date: z.string().optional(),
  });

  app.post("/api/journal", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = createEntrySchema.parse(req.body);
      const now = new Date();
      const entry = await storage.createEntry({
        userId: req.session.userId!,
        text: data.text,
        tags: data.tags,
        mood: data.mood || null,
        date: data.date || now.toLocaleDateString("pt-BR"),
      });
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao criar entrada" });
    }
  });

  const updateEntrySchema = z.object({
    text: z.string().min(1),
    tags: z.array(z.string()).default([]),
  });

  app.patch("/api/journal/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const data = updateEntrySchema.parse(req.body);
      const entry = await storage.updateEntry(id, req.session.userId!, data.text, data.tags);
      if (!entry) {
        return res.status(404).json({ message: "Entrada não encontrada" });
      }
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao atualizar entrada" });
    }
  });

  app.delete("/api/journal/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const deleted = await storage.deleteEntry(id, req.session.userId!);
      if (!deleted) {
        return res.status(404).json({ message: "Entrada não encontrada" });
      }
      res.json({ message: "Entrada deletada" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar entrada" });
    }
  });

  app.get("/api/checkins", requireAuth, async (req: Request, res: Response) => {
    try {
      const checkins = await storage.getCheckins(req.session.userId!);
      res.json(checkins);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar check-ins" });
    }
  });

  app.get("/api/checkins/latest", requireAuth, async (req: Request, res: Response) => {
    try {
      const checkin = await storage.getLatestCheckin(req.session.userId!);
      res.json(checkin || null);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar check-in" });
    }
  });

  const createCheckinSchema = z.object({
    mood: z.string().min(1),
    entry: z.string().default(""),
    tags: z.array(z.string()).default([]),
    date: z.string().optional(),
  });

  app.post("/api/checkins", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = createCheckinSchema.parse(req.body);
      const now = new Date();
      const checkin = await storage.createCheckin({
        userId: req.session.userId!,
        mood: data.mood,
        entry: data.entry,
        tags: data.tags,
        date: data.date || now.toLocaleDateString("pt-BR"),
      });
      res.status(201).json(checkin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao criar check-in" });
    }
  });

  return httpServer;
}
