import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { promises as dns } from "dns";
import { storage } from "./storage";
import { pool, db } from "./db";
import { insertJournalEntrySchema, insertMoodCheckinSchema, type User } from "@shared/schema";
import { JOURNEY_TITLES } from "@shared/journeyTitles";
import { DAILY_REFLECTIONS } from "@shared/dailyReflections";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";
import { notifyAdminNewUser } from "./adminNotify";
import { sendBrevoEmail } from "./brevoClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PgStore = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
    oauthState?: string;
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
  storage.updateUser(req.session.userId, { lastActiveAt: new Date() }).catch(() => {});
  next();
}

const ADMIN_EMAIL = "quinzinhooliveiraa@gmail.com";

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }
  (req as any).adminUser = user;
  next();
}

function getAppDomain() {
  return process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
}

async function sendVerificationEmail(email: string, token: string, name: string) {
  try {
    const verifyUrl = `https://${getAppDomain()}/api/auth/verify-email?token=${token}`;
    await sendBrevoEmail({
      to: email,
      toName: name,
      subject: "Confirme seu email — Casa dos 20",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a1a1a;">Olá, ${name}! 👋</h2>
          <p style="color: #333; line-height: 1.6;">Bem-vindo à Casa dos 20. Para confirmar seu email e ativar todas as funcionalidades, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background: #7c3aed; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">Confirmar Email</a>
          </div>
          <p style="color: #888; font-size: 13px;">Se você não criou esta conta, ignore este email.</p>
        </div>
      `,
    });
    console.log(`[email] Verification sent to ${email}`);
  } catch (err: any) {
    console.error("[email] Failed to send verification:", err.message);
  }
}

async function sendPasswordResetEmail(email: string, token: string, name: string) {
  try {
    const resetUrl = `https://${getAppDomain()}/reset-password?token=${token}`;
    await sendBrevoEmail({
      to: email,
      toName: name,
      subject: "Recuperar senha — Casa dos 20",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a1a1a;">Olá, ${name}! 🔑</h2>
          <p style="color: #333; line-height: 1.6;">Recebemos um pedido para redefinir a senha da sua conta no Casa dos 20. Clique no botão abaixo para escolher uma nova senha:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #7c3aed; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">Redefinir Senha</a>
          </div>
          <p style="color: #888; font-size: 13px;">Este link expira em 1 hora. Se você não pediu a redefinição, ignore este email.</p>
        </div>
      `,
    });
    console.log(`[email] Password reset sent to ${email}`);
  } catch (err: any) {
    console.error("[email] Failed to send password reset:", err.message);
  }
}

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmsil.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmai.com": "gmail.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllook.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "iclod.com": "icloud.com",
  "icloud.co": "icloud.com",
  "icloud.con": "icloud.com",
  "protonmal.com": "protonmail.com",
  "protonmail.co": "protonmail.com",
};

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "yopmail.com", "10minutemail.com", "trashmail.com", "fakeinbox.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "dispostable.com",
  "maildrop.cc", "temp-mail.org", "getnada.com", "mohmal.com",
]);

async function validateEmailDomain(email: string): Promise<{ valid: boolean; suggestion?: string; reason?: string }> {
  const parts = email.split("@");
  if (parts.length !== 2) return { valid: false, reason: "Formato de email inválido" };

  const domain = parts[1].toLowerCase();

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: "Emails temporários não são permitidos. Use seu email pessoal." };
  }

  const typoCorrection = COMMON_DOMAIN_TYPOS[domain];
  if (typoCorrection) {
    return { valid: false, suggestion: `${parts[0]}@${typoCorrection}`, reason: `Você quis dizer ${parts[0]}@${typoCorrection}?` };
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: "Este domínio de email não existe ou não pode receber emails." };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Este domínio de email não existe ou não pode receber emails." };
  }
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
  if (!user.isPremium && user.premiumUntil && user.premiumUntil > new Date()) {
    return { hasPremium: true, reason: "paid" as const };
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

  (async () => {
    try {
      const adminUser = await storage.getUserByEmail(ADMIN_EMAIL);
      if (adminUser) {
        if (adminUser.role !== "admin" || !adminUser.isPremium) {
          await storage.updateUser(adminUser.id, { role: "admin", isPremium: true, password: hashPassword("Joaquim0123") });
          console.log("[admin] Admin account restored");
        }
      }
    } catch (e) {
      console.error("[admin] Error checking admin:", e);
    }
  })();

  app.post("/api/auth/validate-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ valid: false, reason: "Email é obrigatório" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(200).json({ valid: false, reason: "Formato de email inválido" });
      }
      const result = await validateEmailDomain(email);
      res.json(result);
    } catch {
      res.status(500).json({ valid: false, reason: "Erro ao validar email" });
    }
  });

  const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(4),
    inviteCode: z.string().optional(),
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);

      const emailValidation = await validateEmailDomain(data.email);
      if (!emailValidation.valid) {
        return res.status(400).json({ 
          message: emailValidation.reason || "Email inválido",
          suggestion: emailValidation.suggestion 
        });
      }

      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }

      const isAdminEmail = data.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const verificationToken = randomBytes(32).toString("hex");
      const user = await storage.createUser({
        username: data.email,
        password: hashPassword(data.password),
        name: data.name,
        email: data.email,
        role: isAdminEmail ? "admin" : "user",
        isPremium: isAdminEmail,
        isActive: true,
        trialEndsAt: isAdminEmail ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        premiumUntil: null,
        invitedBy: data.inviteCode || null,
        emailVerified: isAdminEmail,
        emailVerificationToken: isAdminEmail ? null : verificationToken,
      });

      if (!isAdminEmail) {
        sendVerificationEmail(data.email, verificationToken, data.name);
        notifyAdminNewUser(data.name, data.email).catch(() => {});
      }

      req.session.userId = user.id;
      const premiumStatus = getUserPremiumStatus(user);
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        hasPremium: premiumStatus.hasPremium,
        premiumReason: premiumStatus.reason,
        trialEndsAt: user.trialEndsAt,
        emailVerified: user.emailVerified,
        journeyOnboardingDone: user.journeyOnboardingDone,
        journeyOrder: user.journeyOrder,
        trialBonusClaimed: user.trialBonusClaimed,
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

      let user = await storage.getUserByEmail(data.email);
      if (!user || !verifyPassword(data.password, user.password)) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Conta desativada. Entre em contato com o suporte." });
      }

      if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && user.role !== "admin") {
        user = (await storage.updateUser(user.id, { role: "admin", isPremium: true })) || user;
      }

      req.session.userId = user.id;
      const premiumStatus = getUserPremiumStatus(user);
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        hasPremium: premiumStatus.hasPremium,
        premiumReason: premiumStatus.reason,
        trialEndsAt: user.trialEndsAt,
        premiumUntil: user.premiumUntil,
        emailVerified: user.emailVerified,
        journeyOnboardingDone: user.journeyOnboardingDone,
        journeyOrder: user.journeyOrder,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  app.patch("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const { name, profilePhoto } = req.body;
      const updateData: any = {};
      if (name && typeof name === "string" && name.trim().length >= 2) {
        updateData.name = name.trim();
      }
      if (profilePhoto !== undefined) {
        updateData.profilePhoto = profilePhoto;
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Nenhum dado válido para atualizar" });
      }
      const updated = await storage.updateUser(req.session.userId!, updateData);
      if (!updated) return res.status(404).json({ message: "Usuário não encontrado" });
      const premiumStatus = getUserPremiumStatus(updated);
      res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        profilePhoto: updated.profilePhoto,
        hasPremium: premiumStatus.hasPremium,
        premiumReason: premiumStatus.reason,
        trialEndsAt: updated.trialEndsAt,
        premiumUntil: updated.premiumUntil,
        isActive: updated.isActive,
        journeyOnboardingDone: updated.journeyOnboardingDone,
        journeyOrder: updated.journeyOrder,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 4 caracteres" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

      if (currentPassword && !verifyPassword(currentPassword, user.password)) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }

      await storage.updateUser(user.id, { password: hashPassword(newPassword) });
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao alterar senha" });
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
      profilePhoto: user.profilePhoto,
      hasPremium: premiumStatus.hasPremium,
      premiumReason: premiumStatus.reason,
      trialEndsAt: user.trialEndsAt,
      premiumUntil: user.premiumUntil,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      journeyOnboardingDone: user.journeyOnboardingDone,
      journeyOrder: user.journeyOrder,
      trialBonusClaimed: user.trialBonusClaimed,
    });
  });

  app.post("/api/auth/claim-trial-bonus", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Não autenticado" });
      if (user.trialBonusClaimed) return res.status(400).json({ message: "Já reclamaste o teu bónus de trial!" });
      if (!user.trialEndsAt) return res.status(400).json({ message: "Sem trial ativo" });

      const currentTrialEnd = new Date(user.trialEndsAt);
      const newTrialEnd = new Date(currentTrialEnd.getTime() + 16 * 24 * 60 * 60 * 1000);
      const updated = await storage.updateUser(user.id, { trialEndsAt: newTrialEnd, trialBonusClaimed: true });
      if (!updated) return res.status(500).json({ message: "Erro ao atualizar trial" });

      const premiumStatus = getUserPremiumStatus(updated);
      res.json({
        message: "🎉 +16 dias grátis ativados! Aproveita ao máximo a Casa dos 20.",
        trialEndsAt: updated.trialEndsAt,
        trialBonusClaimed: updated.trialBonusClaimed,
        hasPremium: premiumStatus.hasPremium,
        premiumReason: premiumStatus.reason,
      });
    } catch {
      res.status(500).json({ message: "Erro ao resgatar bónus" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logout realizado" });
    });
  });

  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).send("Token inválido");
      }

      const allUsers = await storage.getAllUsers();
      const user = allUsers.find(u => u.emailVerificationToken === token);
      if (!user) {
        return res.status(404).send(`
          <html><body style="font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#fafafa;">
            <div style="text-align:center;padding:40px;">
              <h2>Link inválido ou expirado</h2>
              <p>Tente reenviar o email de verificação.</p>
            </div>
          </body></html>
        `);
      }

      await storage.updateUser(user.id, { emailVerified: true, emailVerificationToken: null });
      res.send(`
        <html><body style="font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#fafafa;">
          <div style="text-align:center;padding:40px;">
            <h2 style="color:#7c3aed;">Email confirmado!</h2>
            <p>Obrigado, ${user.name}. Seu email foi verificado com sucesso.</p>
            <a href="/" style="display:inline-block;margin-top:20px;background:#7c3aed;color:white;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:bold;">Voltar para a Casa dos 20</a>
          </div>
        </body></html>
      `);
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).send("Erro ao verificar email");
    }
  });

  app.post("/api/auth/resend-verification", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      if (user.emailVerified) return res.json({ message: "Email já verificado" });

      const token = randomBytes(32).toString("hex");
      await storage.updateUser(user.id, { emailVerificationToken: token });
      await sendVerificationEmail(user.email, token, user.name);
      res.json({ message: "Email de verificação reenviado" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao reenviar email" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email obrigatório" });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "Se este email estiver cadastrado, você receberá um link de recuperação." });
      }

      if (user.googleId && !user.password) {
        return res.json({ message: "Esta conta usa login com Google. Use o botão 'Continuar com Google'." });
      }

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await storage.updateUser(user.id, { passwordResetToken: token, passwordResetExpires: expires });
      await sendPasswordResetEmail(user.email, token, user.name);

      res.json({ message: "Se este email estiver cadastrado, você receberá um link de recuperação." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Erro ao processar pedido. Tente novamente." });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ message: "Dados incompletos" });
      if (newPassword.length < 4) return res.status(400).json({ message: "A senha deve ter pelo menos 4 caracteres" });

      const allUsers = await storage.getAllUsers();
      const user = allUsers.find(u => u.passwordResetToken === token);
      if (!user || !user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({ message: "Link expirado ou inválido. Peça um novo link de recuperação." });
      }

      await storage.updateUser(user.id, {
        password: hashPassword(newPassword),
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      req.session.userId = user.id;
      const premiumStatus = getUserPremiumStatus(user);
      res.json({
        message: "Senha redefinida com sucesso!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto,
          hasPremium: premiumStatus.hasPremium,
          premiumReason: premiumStatus.reason,
          trialEndsAt: user.trialEndsAt,
          emailVerified: user.emailVerified,
          journeyOnboardingDone: user.journeyOnboardingDone,
          journeyOrder: user.journeyOrder,
        },
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erro ao redefinir senha. Tente novamente." });
    }
  });

  app.get("/api/auth/google-client-id", (_req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    res.json({ clientId });
  });

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ message: "Token do Google não fornecido" });
      }

      const parts = credential.split(".");
      if (parts.length !== 3) {
        return res.status(400).json({ message: "Token inválido" });
      }
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

      if (!payload.email || !payload.sub) {
        return res.status(400).json({ message: "Token do Google inválido" });
      }

      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name || email.split("@")[0];
      const emailVerified = payload.email_verified || false;

      let user = await storage.getUserByGoogleId(googleId);

      if (!user) {
        user = await storage.getUserByEmail(email);
        if (user) {
          await storage.updateUser(user.id, { googleId, emailVerified: emailVerified || user.emailVerified });
          user = (await storage.getUser(user.id))!;
        }
      }

      let isNewUser = false;
      if (!user) {
        const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        user = await storage.createUser({
          username: email,
          password: hashPassword(randomBytes(32).toString("hex")),
          name,
          email,
          role: isAdminEmail ? "admin" : "user",
          isPremium: isAdminEmail,
          isActive: true,
          trialEndsAt: isAdminEmail ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          premiumUntil: null,
          invitedBy: null,
          googleId,
          emailVerified: true,
        });
        isNewUser = true;
        notifyAdminNewUser(name, email).catch(() => {});
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
        emailVerified: user.emailVerified,
        journeyOnboardingDone: user.journeyOnboardingDone,
        journeyOrder: user.journeyOrder,
        isNewUser,
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ message: "Erro ao fazer login com Google" });
    }
  });

  app.get("/api/auth/google-oauth", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ message: "Google not configured" });
    const domain = getAppDomain();
    const redirectUri = `https://${domain}/api/auth/google-oauth/callback`;
    const state = randomBytes(16).toString("hex");
    req.session.oauthState = state;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get("/api/auth/google-oauth/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error } = req.query as Record<string, string>;
      const domain = getAppDomain();
      const redirectUri = `https://${domain}/api/auth/google-oauth/callback`;

      if (error || !code) {
        return res.redirect("/?google_error=cancelled");
      }

      if (state !== (req.session as any).oauthState) {
        return res.redirect("/?google_error=invalid_state");
      }
      delete (req.session as any).oauthState;

      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.id_token) {
        console.error("[google-oauth] No id_token:", tokenData);
        return res.redirect("/?google_error=token_failed");
      }

      const parts = tokenData.id_token.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      const { sub: googleId, email, name: googleName, email_verified } = payload;
      const name = googleName || email.split("@")[0];

      let user = await storage.getUserByGoogleId(googleId);
      if (!user) {
        user = await storage.getUserByEmail(email);
        if (user) {
          await storage.updateUser(user.id, { googleId, emailVerified: email_verified || user.emailVerified });
          user = (await storage.getUser(user.id))!;
        }
      }

      let isNewUser = false;
      if (!user) {
        const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        user = await storage.createUser({
          username: email,
          password: hashPassword(randomBytes(32).toString("hex")),
          name,
          email,
          role: isAdminEmail ? "admin" : "user",
          isPremium: isAdminEmail,
          isActive: true,
          trialEndsAt: isAdminEmail ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          premiumUntil: null,
          invitedBy: null,
          googleId,
          emailVerified: true,
        });
        isNewUser = true;
        notifyAdminNewUser(name, email).catch(() => {});
      }

      if (!user.isActive) {
        return res.redirect("/?google_error=inactive");
      }

      req.session.userId = user.id;
      res.redirect(isNewUser ? "/?google_new_user=1" : "/");
    } catch (err) {
      console.error("[google-oauth] callback error:", err);
      res.redirect("/?google_error=server_error");
    }
  });

  app.post("/api/auth/apple", async (req: Request, res: Response) => {
    try {
      const { identityToken, user: appleUser, fullName } = req.body;
      if (!identityToken) {
        return res.status(400).json({ message: "Token da Apple não fornecido" });
      }

      const parts = identityToken.split(".");
      if (parts.length !== 3) {
        return res.status(400).json({ message: "Token inválido" });
      }
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

      if (!payload.sub) {
        return res.status(400).json({ message: "Token da Apple inválido" });
      }

      const appleId = payload.sub;
      const email = payload.email || (appleUser ? `${appleUser}@privaterelay.appleid.com` : `${appleId}@privaterelay.appleid.com`);
      const name = fullName?.givenName
        ? `${fullName.givenName}${fullName.familyName ? ` ${fullName.familyName}` : ""}`
        : email.split("@")[0];

      let user = await storage.getUserByAppleId(appleId);

      if (!user) {
        user = await storage.getUserByEmail(email);
        if (user) {
          await storage.updateUser(user.id, { appleId, emailVerified: true });
          user = (await storage.getUser(user.id))!;
        }
      }

      let isNewUser = false;
      if (!user) {
        const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        user = await storage.createUser({
          username: email,
          password: hashPassword(randomBytes(32).toString("hex")),
          name,
          email,
          role: isAdminEmail ? "admin" : "user",
          isPremium: isAdminEmail,
          isActive: true,
          trialEndsAt: isAdminEmail ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          premiumUntil: null,
          invitedBy: null,
          appleId,
          emailVerified: true,
        });
        isNewUser = true;
        notifyAdminNewUser(name, email).catch(() => {});
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
        emailVerified: user.emailVerified,
        journeyOnboardingDone: user.journeyOnboardingDone,
        journeyOrder: user.journeyOrder,
        isNewUser,
      });
    } catch (error) {
      console.error("Apple auth error:", error);
      res.status(500).json({ message: "Erro ao fazer login com Apple" });
    }
  });

  app.post("/api/stripe/checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

      const stripe = await getUncachableStripeClient();
      const { priceId } = req.body;

      let customerId = user.stripeCustomerId;

      async function ensureValidCustomer() {
        if (customerId) {
          try {
            await stripe.customers.retrieve(customerId);
            return customerId;
          } catch {
            // Customer doesn't exist in this Stripe account, create new one
          }
        }
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id },
        });
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
        return customer.id;
      }
      customerId = await ensureValidCustomer();

      const domain = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const sessionParams: any = {
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${domain}/?checkout=success`,
        cancel_url: `${domain}/?checkout=cancel`,
      };

      if (req.body.trialDays) {
        sessionParams.subscription_data = {
          trial_period_days: Math.min(req.body.trialDays, 14),
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Erro ao criar sessão de pagamento" });
    }
  });

  app.get("/api/stripe/products", async (_req: Request, res: Response) => {
    try {
      const stripe = await getUncachableStripeClient();
      const products = await stripe.products.list({ active: true, limit: 10 });
      const prices = await stripe.prices.list({ active: true, limit: 50 });

      const rows = [];
      for (const product of products.data) {
        const productPrices = prices.data.filter(p => p.product === product.id);
        for (const price of productPrices) {
          rows.push({
            product_id: product.id,
            product_name: product.name,
            product_description: product.description,
            product_metadata: product.metadata,
            price_id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
          });
        }
      }
      rows.sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0));
      res.json(rows);
    } catch (error: any) {
      console.error("Products error:", error);
      res.json([]);
    }
  });

  app.post("/api/stripe/setup-for-bonus", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Não autenticado" });
      if (user.trialBonusClaimed) return res.status(400).json({ message: "Já reclamaste o teu bónus de trial!" });
      if (!user.trialEndsAt) return res.status(400).json({ message: "Sem trial ativo" });

      const stripe = await getUncachableStripeClient();

      let customerId = user.stripeCustomerId;
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch {
          customerId = null;
        }
      }
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      const domain = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "setup",
        success_url: `${domain}/?bonus=success`,
        cancel_url: `${domain}/?bonus=cancel`,
        metadata: { purpose: "trial_bonus", userId: user.id },
        currency: "eur",
        consent_collection: { terms_of_service: "none" },
        custom_text: {
          submit: { message: "O teu cartão só será cobrado quando o trial terminar, se decidires assinar." },
        },
      } as any);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Setup-for-bonus error:", error);
      res.status(500).json({ message: "Erro ao criar sessão de pagamento" });
    }
  });

  app.post("/api/stripe/portal", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "Nenhuma assinatura encontrada" });
      }

      const stripe = await getUncachableStripeClient();

      try {
        await stripe.customers.retrieve(user.stripeCustomerId);
      } catch {
        await storage.updateUser(user.id, { stripeCustomerId: null, stripeSubscriptionId: null });
        return res.status(400).json({ message: "Nenhuma assinatura encontrada" });
      }

      const domain = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${domain}/`,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error("Portal error:", error);
      res.status(500).json({ message: "Erro ao abrir portal" });
    }
  });

  app.get("/api/stripe/subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }
      const result = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}`
      );
      res.json({ subscription: result.rows[0] || null });
    } catch (error) {
      res.json({ subscription: null });
    }
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
          stripeSubscriptionId: u.stripeSubscriptionId,
          isMasterAdmin: u.email === ADMIN_EMAIL,
          lastActiveAt: u.lastActiveAt,
          pwaInstalled: u.pwaInstalled,
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
    trialEndsAt: z.string().nullable().optional(),
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const data = updateUserSchema.parse(req.body);
      const currentAdmin = (req as any).adminUser;

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (targetUser.email === ADMIN_EMAIL && data.role === "user") {
        if (currentAdmin.email !== ADMIN_EMAIL) {
          console.log(`[ALERT] Admin ${currentAdmin.email} tentou despromover o admin master!`);
          try {
            const masterUser = await storage.getUserByEmail(ADMIN_EMAIL);
            if (masterUser) {
              await storage.createFeedback({
                userId: masterUser.id,
                type: "alerta",
                subject: "Tentativa de despromover Admin Master",
                message: `O admin ${currentAdmin.name} (${currentAdmin.email}) tentou remover seu cargo de Admin Master em ${new Date().toLocaleString("pt-BR")}.`,
              });
            }
          } catch (e) {
            console.error("Erro ao criar alerta:", e);
          }
        }
        return res.status(403).json({ message: "O Admin Master não pode ser despromovido" });
      }

      if (targetUser.email === ADMIN_EMAIL && data.isActive === false) {
        return res.status(403).json({ message: "O Admin Master não pode ser bloqueado" });
      }

      const updateData: any = {};
      if (data.isPremium !== undefined) updateData.isPremium = data.isPremium;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.premiumUntil !== undefined) {
        updateData.premiumUntil = data.premiumUntil ? new Date(data.premiumUntil) : null;
      }
      if (data.trialEndsAt !== undefined) {
        updateData.trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
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

      const user = await storage.createUser({
        username: email,
        password: hashPassword(tempPassword),
        name,
        email,
        role: "user",
        isPremium: grantPremium || false,
        isActive: true,
        trialEndsAt: null,
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

  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const currentAdmin = (req as any).adminUser;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.email === ADMIN_EMAIL) {
        if (currentAdmin.email !== ADMIN_EMAIL) {
          return res.status(403).json({ message: "Apenas o Admin Master pode apagar a própria conta" });
        }

        const { newMasterEmail } = req.body || {};
        if (!newMasterEmail) {
          return res.status(400).json({
            message: "É necessário escolher um novo Admin Master antes de apagar a conta",
            requiresTransfer: true,
          });
        }

        const newMaster = await storage.getUserByEmail(newMasterEmail);
        if (!newMaster) {
          return res.status(404).json({ message: "Novo admin master não encontrado" });
        }
        if (newMaster.id === userId) {
          return res.status(400).json({ message: "O novo master deve ser outra pessoa" });
        }

        await storage.updateUser(newMaster.id, { role: "admin", isPremium: true, isActive: true });

        const deleted = await storage.deleteUser(userId);
        if (!deleted) {
          return res.status(500).json({ message: "Erro ao apagar usuário" });
        }

        req.session.destroy(() => {});
        return res.json({ message: "Conta apagada. Novo Admin Master definido.", newMasterEmail });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(500).json({ message: "Erro ao apagar usuário" });
      }
      res.json({ message: "Usuário apagado com sucesso" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Erro ao apagar usuário" });
    }
  });

  app.get("/api/admin/feedback", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const tickets = await storage.getAllFeedback();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar chamados" });
    }
  });

  app.patch("/api/admin/feedback/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });
      const { status, adminNote } = req.body;
      const updated = await storage.updateFeedbackStatus(id, status, adminNote);
      if (!updated) {
        return res.status(404).json({ message: "Chamado não encontrado" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar chamado" });
    }
  });

  // --- COUPONS (user) ---
  app.post("/api/coupons/apply", requireAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== "string") return res.status(400).json({ message: "Código inválido" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Não autenticado" });

      const coupon = await storage.getCouponByCode(code.trim());
      if (!coupon) return res.status(404).json({ message: "Cupão não encontrado" });
      if (!coupon.isActive) return res.status(400).json({ message: "Este cupão não está ativo" });
      if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ message: "Este cupão já expirou" });
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ message: "Este cupão atingiu o limite de utilizações" });

      const alreadyUsed = await storage.hasCouponBeenUsedByUser(coupon.id, user.id);
      if (alreadyUsed) return res.status(400).json({ message: "Já usaste este cupão" });

      let updatedUser: User | undefined;
      if (coupon.type === "premium_days") {
        const baseDate = user.premiumUntil && user.premiumUntil > new Date()
          ? user.premiumUntil
          : (user.trialEndsAt && user.trialEndsAt > new Date() ? user.trialEndsAt : new Date());
        const newPremiumUntil = new Date(baseDate.getTime() + coupon.value * 24 * 60 * 60 * 1000);
        updatedUser = await storage.updateUser(user.id, { premiumUntil: newPremiumUntil, isPremium: true });
      } else if (coupon.type === "full_premium") {
        updatedUser = await storage.updateUser(user.id, { isPremium: true, premiumUntil: null });
      }

      await storage.recordCouponUse(coupon.id, user.id);

      if (!updatedUser) updatedUser = user;
      const premiumStatus = getUserPremiumStatus(updatedUser);
      res.json({
        message: coupon.type === "premium_days"
          ? `✨ ${coupon.value} dias de premium ativados com sucesso!`
          : "🌟 Premium ativado com sucesso!",
        hasPremium: premiumStatus.hasPremium,
        premiumReason: premiumStatus.reason,
        premiumUntil: updatedUser.premiumUntil,
        trialEndsAt: updatedUser.trialEndsAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao aplicar cupão" });
    }
  });

  // --- COUPONS (admin) ---
  app.get("/api/admin/coupons", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const all = await storage.getCoupons();
      res.json(all);
    } catch {
      res.status(500).json({ message: "Erro ao listar cupões" });
    }
  });

  app.post("/api/admin/coupons", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { code, type, value, maxUses, expiresAt, note } = req.body;
      if (!code || !type || value === undefined) return res.status(400).json({ message: "Campos obrigatórios em falta" });
      const existing = await storage.getCouponByCode(code.trim());
      if (existing) return res.status(400).json({ message: "Já existe um cupão com este código" });
      const coupon = await storage.createCoupon({
        code: code.trim(),
        type,
        value: Number(value),
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        note: note || null,
      });
      res.status(201).json(coupon);
    } catch {
      res.status(500).json({ message: "Erro ao criar cupão" });
    }
  });

  app.patch("/api/admin/coupons/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const coupon = await storage.updateCoupon(id, req.body);
      if (!coupon) return res.status(404).json({ message: "Cupão não encontrado" });
      res.json(coupon);
    } catch {
      res.status(500).json({ message: "Erro ao atualizar cupão" });
    }
  });

  app.delete("/api/admin/coupons/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const ok = await storage.deleteCoupon(id);
      if (!ok) return res.status(404).json({ message: "Cupão não encontrado" });
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Erro ao apagar cupão" });
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

  app.get("/api/admin/notify-prefs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
      res.json({
        notifyNewUser: user.adminNotifyNewUser,
        notifyNewSub: user.adminNotifyNewSub,
      });
    } catch {
      res.status(500).json({ error: "Erro ao buscar preferências" });
    }
  });

  app.patch("/api/admin/notify-prefs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { notifyNewUser, notifyNewSub } = req.body;
      const updates: Record<string, boolean> = {};
      if (typeof notifyNewUser === "boolean") updates.adminNotifyNewUser = notifyNewUser;
      if (typeof notifyNewSub === "boolean") updates.adminNotifyNewSub = notifyNewSub;
      await storage.updateUser(req.session.userId!, updates);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Erro ao atualizar preferências" });
    }
  });

  app.post("/api/feedback", requireAuth, async (req: Request, res: Response) => {
    try {
      const { type, subject, message } = req.body;
      if (!subject?.trim() || !message?.trim()) {
        return res.status(400).json({ message: "Assunto e mensagem são obrigatórios" });
      }
      const ticket = await storage.createFeedback({
        userId: req.session.userId!,
        type: type || "feedback",
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
        adminNote: null,
      });
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Erro ao enviar feedback" });
    }
  });

  app.get("/api/feedback", requireAuth, async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getFeedbackByUser(req.session.userId!);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar feedbacks" });
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
    mood: z.string().nullable().optional(),
    date: z.string().optional(),
  });

  const FREE_MONTHLY_JOURNAL_LIMIT = 15;

  app.get("/api/journal/limit", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      const premiumStatus = getUserPremiumStatus(user);
      const monthlyCount = await storage.getMonthlyEntryCount(req.session.userId!);
      res.json({
        count: monthlyCount,
        limit: premiumStatus.hasPremium ? null : FREE_MONTHLY_JOURNAL_LIMIT,
        remaining: premiumStatus.hasPremium ? null : Math.max(0, FREE_MONTHLY_JOURNAL_LIMIT - monthlyCount),
      });
    } catch {
      res.status(500).json({ message: "Erro ao verificar limite" });
    }
  });

  app.post("/api/journal", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      const premiumStatus = getUserPremiumStatus(user);
      if (!premiumStatus.hasPremium) {
        const monthlyCount = await storage.getMonthlyEntryCount(req.session.userId!);
        if (monthlyCount >= FREE_MONTHLY_JOURNAL_LIMIT) {
          return res.status(403).json({
            message: "Limite mensal atingido",
            code: "JOURNAL_LIMIT_REACHED",
            limit: FREE_MONTHLY_JOURNAL_LIMIT,
            count: monthlyCount,
          });
        }
      }
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

  app.post("/api/journal/:id/share", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const entry = await storage.getEntry(id);
      if (!entry || entry.userId !== req.session.userId) {
        return res.status(404).json({ message: "Entrada não encontrada" });
      }

      if (entry.shareSlug) {
        return res.json({ slug: entry.shareSlug });
      }

      const slug = crypto.randomUUID().slice(0, 8) + "-" + Date.now().toString(36);
      const updated = await storage.setEntryShareSlug(id, req.session.userId!, slug);
      if (!updated) return res.status(500).json({ message: "Erro ao compartilhar" });
      res.json({ slug: updated.shareSlug });
    } catch (error) {
      res.status(500).json({ message: "Erro ao compartilhar entrada" });
    }
  });

  app.delete("/api/journal/:id/share", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

      const updated = await storage.setEntryShareSlug(id, req.session.userId!, null);
      if (!updated) return res.status(404).json({ message: "Entrada não encontrada" });
      res.json({ message: "Link removido" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover compartilhamento" });
    }
  });

  app.get("/api/shared/:slug", async (req: Request, res: Response) => {
    try {
      const entry = await storage.getEntryBySlug(req.params.slug as string);
      if (!entry) return res.status(404).json({ message: "Reflexão não encontrada" });
      res.json({
        text: entry.text,
        tags: entry.tags,
        date: entry.date,
        authorName: entry.authorName,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar reflexão" });
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

  app.get("/api/insights/monthly", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const entries = await storage.getEntries(userId);
      const checkins = await storage.getCheckins(userId);

      const monthEntries = entries.filter(e => {
        const d = new Date(e.createdAt!);
        return d >= firstDay && d <= lastDay;
      });
      const monthCheckins = checkins.filter(c => {
        const d = new Date(c.createdAt!);
        return d >= firstDay && d <= lastDay;
      });

      const moodCounts: Record<string, number> = {};
      monthCheckins.forEach(c => {
        moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
      });

      const tagCounts: Record<string, number> = {};
      monthEntries.forEach(e => {
        (e.tags || []).forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      monthCheckins.forEach(c => {
        (c.tags || []).forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      const dominantMood = Object.entries(moodCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      const activeDays = new Set<string>();
      monthEntries.forEach(e => activeDays.add(new Date(e.createdAt!).toDateString()));
      monthCheckins.forEach(c => activeDays.add(new Date(c.createdAt!).toDateString()));

      const totalDays = lastDay.getDate();
      const streak = activeDays.size;

      const totalEntries = entries.length;
      const totalCheckins = checkins.length;

      const totalWords = monthEntries.reduce((sum, e) => {
        let text = typeof e.text === "string" ? e.text : "";
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed.text === "string") text = parsed.text;
        } catch {}
        return sum + text.split(/\s+/).filter(Boolean).length;
      }, 0);

      res.json({
        month: now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        entriesThisMonth: monthEntries.length,
        checkinsThisMonth: monthCheckins.length,
        totalEntries,
        totalCheckins,
        totalWords,
        activeDays: streak,
        totalDays,
        dominantMood,
        moodCounts,
        topTags,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar insights" });
    }
  });

  app.get("/api/journey/progress", requireAuth, async (req, res) => {
    try {
      const progress = await storage.getJourneyProgress(req.session.userId!);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar progresso" });
    }
  });

  app.post("/api/journey/onboarding", requireAuth, async (req, res) => {
    try {
      const { journeyOrder } = req.body;
      if (!Array.isArray(journeyOrder) || journeyOrder.length === 0) {
        return res.status(400).json({ message: "journeyOrder obrigatório" });
      }
      const updated = await storage.updateUser(req.session.userId!, {
        journeyOnboardingDone: true,
        journeyOrder,
      });
      if (!updated) return res.status(404).json({ message: "Usuário não encontrado" });
      res.json({ success: true, journeyOrder: updated.journeyOrder });
    } catch (error) {
      res.status(500).json({ message: "Erro ao salvar onboarding" });
    }
  });

  app.post("/api/journey/start", requireAuth, async (req, res) => {
    try {
      const { journeyId } = req.body;
      if (!journeyId) return res.status(400).json({ message: "journeyId obrigatório" });
      const existing = await storage.getJourneyProgressByJourney(req.session.userId!, journeyId);
      if (existing) return res.json(existing);
      const progress = await storage.startJourney({
        userId: req.session.userId!,
        journeyId,
        completedDays: [],
      });
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Erro ao iniciar jornada" });
    }
  });

  app.post("/api/journey/complete-day", requireAuth, async (req, res) => {
    try {
      const { journeyId, dayId } = req.body;
      if (!journeyId || !dayId) return res.status(400).json({ message: "journeyId e dayId obrigatórios" });
      let progress = await storage.getJourneyProgressByJourney(req.session.userId!, journeyId);
      if (!progress) {
        progress = await storage.startJourney({
          userId: req.session.userId!,
          journeyId,
          completedDays: [],
        });
      }

      const user = await storage.getUser(req.session.userId!);
      const isAdmin = user?.role === "admin";
      if (!isAdmin && progress.completedDays.length > 0) {
        const timestamps: Record<string, string> = JSON.parse(progress.completedTimestamps || "{}");
        const lastCompletedDayId = progress.completedDays[progress.completedDays.length - 1];
        const lastTs = timestamps[lastCompletedDayId];
        if (lastTs) {
          const completedDate = new Date(lastTs);
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (completedDate >= todayStart) {
            return res.status(429).json({ message: "Você já completou um desafio hoje. Volte amanhã!" });
          }
        }
      }

      const updated = await storage.completeJourneyDay(req.session.userId!, journeyId, dayId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao completar dia" });
    }
  });

  app.post("/api/journey/uncomplete-day", requireAuth, async (req, res) => {
    try {
      const { journeyId, dayId } = req.body;
      if (!journeyId || !dayId) return res.status(400).json({ message: "journeyId e dayId obrigatórios" });
      const updated = await storage.uncompleteJourneyDay(req.session.userId!, journeyId, dayId);
      if (!updated) return res.status(404).json({ message: "Progresso não encontrado" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao desmarcar dia" });
    }
  });

  app.post("/api/journey/restart", requireAuth, async (req, res) => {
    try {
      const { journeyId } = req.body;
      if (!journeyId) return res.status(400).json({ message: "journeyId obrigatório" });
      const updated = await storage.restartJourney(req.session.userId!, journeyId);
      if (!updated) return res.status(404).json({ message: "Progresso não encontrado" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao recomeçar jornada" });
    }
  });

  app.get("/api/journey/report-status", requireAuth, async (req: Request, res: Response) => {
    try {
      const reports = await storage.getJourneyReports(req.session.userId!);
      const totalReports = reports.length;
      const isFree = totalReports === 0;
      res.json({ totalReports, isFree, pricePerReport: "R$ 2,90" });
    } catch {
      res.status(500).json({ message: "Erro ao verificar status" });
    }
  });

  app.post("/api/journey/report-checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const { journeyId } = req.body;
      if (!journeyId) return res.status(400).json({ message: "journeyId obrigatório" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

      const premiumStatus = getUserPremiumStatus(user);
      if (!premiumStatus.hasPremium) {
        return res.status(403).json({ message: "Recurso premium" });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-04-30.basil" as any });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "brl",
            product_data: {
              name: "Relatório de Jornada com IA",
              description: "Análise personalizada da sua jornada com inteligência artificial",
            },
            unit_amount: 290,
          },
          quantity: 1,
        }],
        metadata: {
          userId: req.session.userId!,
          journeyId,
          type: "journey_report",
        },
        success_url: `${req.headers.origin || req.protocol + "://" + req.get("host")}/journey/${journeyId}?report_paid=true`,
        cancel_url: `${req.headers.origin || req.protocol + "://" + req.get("host")}/journey/${journeyId}`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Erro ao criar checkout de relatório:", error);
      res.status(500).json({ message: "Erro ao iniciar pagamento" });
    }
  });

  app.post("/api/journey/report", requireAuth, async (req: Request, res: Response) => {
    try {
      const { journeyId, journeyTitle, totalDays, completedDays, dayDescriptions } = req.body;
      if (!journeyId || !journeyTitle) {
        return res.status(400).json({ message: "Dados da jornada obrigatórios" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

      const premiumStatus = getUserPremiumStatus(user);
      if (!premiumStatus.hasPremium) {
        return res.status(403).json({ message: "Recurso premium" });
      }

      const existingReports = await storage.getJourneyReports(req.session.userId!);
      const isFirstReport = existingReports.length === 0;
      const alreadyHasReportForJourney = existingReports.some(r => r.journeyId === journeyId);
      const forcePaid = req.body.forcePaid === true;

      if (!isFirstReport && !alreadyHasReportForJourney && !forcePaid) {
        return res.status(402).json({
          message: "Este relatório custa R$ 2,90. O primeiro é grátis!",
          requiresPayment: true,
          price: "R$ 2,90",
        });
      }

      const journeyEntries = await storage.getEntriesByTag(req.session.userId!, "jornada");
      const relevantEntries = journeyEntries.filter(e =>
        e.tags.includes(journeyTitle.toLowerCase())
      );

      const checkins = await storage.getCheckins(req.session.userId!);
      const recentMoods = checkins.slice(0, 30).map(c => c.mood).filter(Boolean);

      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Serviço de IA indisponível" });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const entriesText = relevantEntries.length > 0
        ? relevantEntries.map((e, i) => {
            let text = e.text;
            try { const p = JSON.parse(e.text); if (p?.text) text = p.text; } catch {}
            return `Reflexão ${i + 1} (${e.date}): "${text.substring(0, 500)}"`;
          }).join("\n")
        : "Nenhuma reflexão escrita registrada.";

      const daysInfo = dayDescriptions
        ? `\nAtividades da jornada:\n${dayDescriptions}`
        : "";

      const prompt = `Você é um mentor de autoconhecimento para jovens de 17-30 anos. Analise os dados abaixo e gere um relatório pessoal e realista sobre a jornada "${journeyTitle}" completada por ${user.name || "o(a) participante"}.

DADOS:
- Jornada: "${journeyTitle}" (${totalDays} dias)
- Dias completados: ${completedDays || totalDays}${daysInfo}
- Reflexões escritas durante a jornada (${relevantEntries.length} entradas):
${entriesText}
- Humores recentes: ${recentMoods.length > 0 ? recentMoods.join(", ") : "sem registros"}

GERE O RELATÓRIO em formato JSON com exatamente esta estrutura (sem markdown, apenas JSON puro):
{
  "titulo": "Título curto e impactante do relatório",
  "resumo": "Parágrafo de 2-3 frases resumindo a jornada dessa pessoa com empatia",
  "pontosFortes": ["ponto 1", "ponto 2", "ponto 3"],
  "pontosAtencao": ["ponto 1", "ponto 2"],
  "oQueMelhorou": "Parágrafo sobre o que provavelmente evoluiu baseado nas reflexões",
  "oQuePodeMelhorar": "Parágrafo com sugestões práticas e realistas",
  "dicaPratica": "Uma dica acionável e concreta para o próximo passo",
  "fraseMotivacional": "Frase curta e inspiradora para fechar"
}

REGRAS:
- Seja REALISTA e HONESTO, não genérico. Se as reflexões forem superficiais, diga isso com carinho.
- Use linguagem jovem brasileira, informal mas respeitosa.
- Se não houver reflexões escritas, baseie-se no fato de a pessoa ter completado a jornada e nos temas da jornada.
- Pontos fortes devem ser específicos e baseados nos dados.
- Pontos de atenção devem ser construtivos, nunca agressivos.
- Retorne APENAS o JSON, sem texto adicional.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      let report;
      try {
        const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        report = JSON.parse(cleaned);
      } catch {
        return res.status(500).json({ message: "Erro ao processar relatório" });
      }

      const saved = await storage.saveJourneyReport({
        userId: req.session.userId!,
        journeyId,
        journeyTitle,
        reportData: JSON.stringify(report),
        entriesCount: relevantEntries.length,
        completedDays: completedDays || totalDays,
        totalDays,
      });

      res.json({
        id: saved.id,
        report,
        journeyTitle,
        completedDays: completedDays || totalDays,
        totalDays,
        entriesCount: relevantEntries.length,
        generatedAt: saved.createdAt,
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      res.status(500).json({ message: "Erro ao gerar relatório da jornada" });
    }
  });

  app.get("/api/journey/reports", requireAuth, async (req: Request, res: Response) => {
    try {
      const reports = await storage.getJourneyReports(req.session.userId!);
      res.json(reports.map(r => ({
        id: r.id,
        journeyId: r.journeyId,
        journeyTitle: r.journeyTitle,
        report: JSON.parse(r.reportData),
        entriesCount: r.entriesCount,
        completedDays: r.completedDays,
        totalDays: r.totalDays,
        createdAt: r.createdAt,
      })));
    } catch {
      res.status(500).json({ message: "Erro ao buscar relatórios" });
    }
  });

  app.get("/api/journey/reports/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const report = await storage.getJourneyReport(parseInt(req.params.id), req.session.userId!);
      if (!report) return res.status(404).json({ message: "Relatório não encontrado" });
      res.json({
        id: report.id,
        journeyId: report.journeyId,
        journeyTitle: report.journeyTitle,
        report: JSON.parse(report.reportData),
        entriesCount: report.entriesCount,
        completedDays: report.completedDays,
        totalDays: report.totalDays,
        createdAt: report.createdAt,
      });
    } catch {
      res.status(500).json({ message: "Erro ao buscar relatório" });
    }
  });

  interface LobbyPlayer {
    ws: WebSocket;
    name: string;
    id: string;
  }

  interface Lobby {
    code: string;
    players: LobbyPlayer[];
    hostId: string;
    mode: "online" | "presencial";
    relation: string;
    currentTurn: number;
    currentCard: number;
    seenCards: number[];
    started: boolean;
  }

  const lobbies = new Map<string, Lobby>();

  function generateLobbyCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  function broadcastToLobby(lobby: Lobby, message: any, excludeId?: string) {
    const msg = JSON.stringify(message);
    lobby.players.forEach(p => {
      if (p.id !== excludeId && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(msg);
      }
    });
  }

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url === "/ws/lobby") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    let currentLobby: Lobby | null = null;
    let playerId = randomBytes(8).toString("hex");

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "create") {
          const code = generateLobbyCode();
          const lobby: Lobby = {
            code,
            players: [{ ws, name: msg.name, id: playerId }],
            hostId: playerId,
            mode: msg.mode || "online",
            relation: msg.relation || "",
            currentTurn: 0,
            currentCard: -1,
            seenCards: [],
            started: false,
          };
          lobbies.set(code, lobby);
          currentLobby = lobby;
          ws.send(JSON.stringify({
            type: "created",
            code,
            playerId,
            players: lobby.players.map(p => ({ name: p.name, id: p.id, isHost: p.id === lobby.hostId })),
          }));
        }

        if (msg.type === "join") {
          const lobby = lobbies.get(msg.code?.toUpperCase());
          if (!lobby) {
            ws.send(JSON.stringify({ type: "error", message: "Sala não encontrada" }));
            return;
          }
          if (lobby.started) {
            ws.send(JSON.stringify({ type: "error", message: "Jogo já começou" }));
            return;
          }
          if (lobby.players.length >= 8) {
            ws.send(JSON.stringify({ type: "error", message: "Sala cheia (máx 8)" }));
            return;
          }
          lobby.players.push({ ws, name: msg.name, id: playerId });
          currentLobby = lobby;
          const playerList = lobby.players.map(p => ({ name: p.name, id: p.id, isHost: p.id === lobby.hostId }));
          ws.send(JSON.stringify({
            type: "joined",
            code: lobby.code,
            playerId,
            players: playerList,
            mode: lobby.mode,
            relation: lobby.relation,
          }));
          broadcastToLobby(lobby, { type: "player_joined", players: playerList }, playerId);
        }

        if (msg.type === "start" && currentLobby && playerId === currentLobby.hostId) {
          currentLobby.started = true;
          currentLobby.currentTurn = 0;
          const firstCard = Math.floor(Math.random() * (msg.totalCards || 10));
          currentLobby.currentCard = firstCard;
          currentLobby.seenCards = [firstCard];
          const turnPlayer = currentLobby.players[0];
          broadcastToLobby(currentLobby, {
            type: "game_started",
            currentTurn: turnPlayer.id,
            currentTurnName: turnPlayer.name,
            currentCard: firstCard,
            players: currentLobby.players.map(p => ({ name: p.name, id: p.id, isHost: p.id === currentLobby!.hostId })),
          });
          ws.send(JSON.stringify({
            type: "game_started",
            currentTurn: turnPlayer.id,
            currentTurnName: turnPlayer.name,
            currentCard: firstCard,
            players: currentLobby.players.map(p => ({ name: p.name, id: p.id, isHost: p.id === currentLobby!.hostId })),
          }));
        }

        if (msg.type === "next_card" && currentLobby && currentLobby.started) {
          const lobby = currentLobby;
          const nextTurnIndex = (lobby.currentTurn + 1) % lobby.players.length;
          lobby.currentTurn = nextTurnIndex;

          const totalCards = msg.totalCards || 10;
          const unseen = Array.from({ length: totalCards }, (_, i) => i).filter(i => !lobby.seenCards.includes(i));
          let nextCard: number;
          if (unseen.length > 0) {
            nextCard = unseen[Math.floor(Math.random() * unseen.length)];
          } else {
            nextCard = Math.floor(Math.random() * totalCards);
            lobby.seenCards = [];
          }
          lobby.currentCard = nextCard;
          lobby.seenCards.push(nextCard);

          const turnPlayer = lobby.players[nextTurnIndex];
          const payload = {
            type: "new_card",
            currentTurn: turnPlayer?.id,
            currentTurnName: turnPlayer?.name,
            currentCard: nextCard,
          };
          broadcastToLobby(lobby, payload);
          ws.send(JSON.stringify(payload));
        }

        if (msg.type === "submit_answer" && currentLobby && currentLobby.started) {
          const playerName = currentLobby.players.find(p => p.id === playerId)?.name || "?";
          broadcastToLobby(currentLobby, {
            type: "player_answer",
            playerId,
            playerName,
            answer: msg.answer,
            cardIndex: msg.cardIndex,
          }, playerId);
        }

        if (msg.type === "leave") {
          if (currentLobby) {
            currentLobby.players = currentLobby.players.filter(p => p.id !== playerId);
            if (currentLobby.players.length === 0) {
              lobbies.delete(currentLobby.code);
            } else {
              if (currentLobby.hostId === playerId) {
                currentLobby.hostId = currentLobby.players[0].id;
              }
              broadcastToLobby(currentLobby, {
                type: "player_left",
                players: currentLobby.players.map(p => ({ name: p.name, id: p.id, isHost: p.id === currentLobby!.hostId })),
              });
            }
            currentLobby = null;
          }
        }
      } catch (e) {
        console.error("WS message error:", e);
      }
    });

    ws.on("close", () => {
      if (currentLobby) {
        currentLobby.players = currentLobby.players.filter(p => p.id !== playerId);
        if (currentLobby.players.length === 0) {
          lobbies.delete(currentLobby.code);
        } else {
          if (currentLobby.hostId === playerId) {
            currentLobby.hostId = currentLobby.players[0].id;
          }
          broadcastToLobby(currentLobby, {
            type: "player_left",
            players: currentLobby.players.map(p => ({ name: p.name, id: p.id, isHost: p.id === currentLobby!.hostId })),
          });
        }
      }
    });
  });

  app.get("/api/push/vapid-key", (_req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
  });

  app.get("/api/admin/push-campaigns", requireAdmin, async (_req, res) => {
    try {
      const campaigns = await storage.getPushCampaigns();
      res.json(campaigns);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/clicked", async (req, res) => {
    try {
      const { campaignId } = req.body;
      if (campaignId && typeof campaignId === "number") {
        await storage.incrementCampaignClicks(campaignId);
      }
      res.json({ ok: true });
    } catch {
      res.status(200).json({ ok: true });
    }
  });

  app.post("/api/pwa/installed", requireAuth, async (req, res) => {
    try {
      await storage.updateUser(req.session.userId!, { pwaInstalled: true });
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Erro" });
    }
  });

  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint, p256dh, auth } = req.body;
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ error: "Dados incompletos" });
      }
      const sub = await storage.savePushSubscription({
        userId: req.session.userId!,
        endpoint,
        p256dh,
        auth,
      });
      res.json(sub);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/unsubscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint } = req.body;
      await storage.deletePushSubscription(req.session.userId!, endpoint);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/send", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const webpushModule = await import("web-push");
      const webpush = webpushModule.default || webpushModule;
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@example.com",
        process.env.VAPID_PUBLIC_KEY || "",
        process.env.VAPID_PRIVATE_KEY || ""
      );
      const { title, body, url, targetUserId } = req.body;
      const pushTitle = title || "Casa dos 20";
      const pushBody = body || "";
      const pushUrl = url || "/";

      let subscriptions;
      if (targetUserId) {
        subscriptions = await storage.getPushSubscriptions(targetUserId);
      } else {
        subscriptions = await storage.getAllPushSubscriptions();
      }

      let sent = 0;
      let failed = 0;

      const campaign = await storage.createPushCampaign({
        title: pushTitle,
        body: pushBody,
        url: pushUrl,
        sentCount: 0,
        failedCount: 0,
      });

      const payload = JSON.stringify({ title: pushTitle, body: pushBody, url: pushUrl, campaignId: campaign.id });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch {
          await storage.deletePushSubscription(sub.userId, sub.endpoint);
          failed++;
        }
      }

      await storage.updatePushCampaignCounts(campaign.id, sent, failed);
      res.json({ sent, failed, total: subscriptions.length, campaignId: campaign.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/notifications/scheduled", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
      const list = await storage.getScheduledNotifications();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/notifications/scheduled", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
      const { title, body, url, intervalHours, isActive } = req.body;
      const notif = await storage.createScheduledNotification({
        title: title || "Casa dos 20",
        body: body || "",
        url: url || "/",
        intervalHours: intervalHours || 24,
        isActive: isActive !== false,
      });
      res.json(notif);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/notifications/scheduled/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
      const id = parseInt(req.params.id);
      const updated = await storage.updateScheduledNotification(id, req.body);
      if (!updated) return res.status(404).json({ error: "Não encontrado" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/notifications/scheduled/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
      const id = parseInt(req.params.id);
      await storage.deleteScheduledNotification(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/test", requireAuth, async (req, res) => {
    try {
      const webpushModule = await import("web-push");
      const webpush = webpushModule.default || webpushModule;
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@example.com",
        process.env.VAPID_PUBLIC_KEY || "",
        process.env.VAPID_PRIVATE_KEY || ""
      );
      const subscriptions = await storage.getPushSubscriptions(req.session.userId!);
      if (subscriptions.length === 0) {
        return res.status(404).json({ error: "Nenhuma assinatura encontrada" });
      }
      const payload = JSON.stringify({
        title: "Casa dos 20",
        body: "As notificações estão funcionando! 🎉",
        url: "/",
      });
      let sent = 0;
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch {
          await storage.deletePushSubscription(sub.userId, sub.endpoint);
        }
      }
      res.json({ sent });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/notifications/auto", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
      const configs = await storage.getAutoNotificationConfigs();
      const stats = await storage.getAutoNotificationStats();
      const merged = configs.map(c => ({
        ...c,
        ...stats.find(s => s.type === c.type),
      }));
      res.json(merged);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/notifications/auto/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
      const id = parseInt(req.params.id);
      const updated = await storage.updateAutoNotificationConfig(id, req.body);
      if (!updated) return res.status(404).json({ error: "Não encontrado" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/notifications/auto/seed", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
      await seedAutoNotifications();
      const configs = await storage.getAutoNotificationConfigs();
      res.json(configs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}

const AUTO_NOTIFICATION_DEFAULTS = [
  {
    type: "morning_prompt",
    title: "Bom dia! ☀️",
    body: "O teu exercício de hoje: {day_title} — {day_description}",
    url: "/journey/{journey_id}",
    triggerHours: 22,
    isActive: true,
  },
  {
    type: "evening_reflection",
    title: "Hora de refletir 🌙",
    body: "Como foi o teu dia? Tira 5 minutos para escrever no diário antes de dormir.",
    url: "/journal",
    triggerHours: 22,
    isActive: true,
  },
  {
    type: "daily_reflection",
    title: "Casa dos 20",
    body: "Ainda não escreveste hoje. Tira 5 minutos para refletir sobre o teu dia 📝",
    url: "/journal",
    triggerHours: 20,
    isActive: true,
  },
  {
    type: "mood_checkin",
    title: "Como te sentes hoje?",
    body: "Faz o teu check-in de humor — é rápido e ajuda-te a conhecer-te melhor 🌟",
    url: "/",
    triggerHours: 24,
    isActive: true,
  },
  {
    type: "streak_risk",
    title: "O teu streak está em risco! 🔥",
    body: "Já passaram {days} dias sem escreveres. Não deixes a tua sequência quebrar!",
    url: "/journal",
    triggerHours: 48,
    isActive: true,
  },
  {
    type: "streak_celebration",
    title: "Parabéns! 🎉",
    body: "Já escreveste {count} vezes este mês. Continua assim, estás a construir um hábito incrível!",
    url: "/journal",
    triggerHours: 168,
    isActive: true,
  },
  {
    type: "journey_nudge",
    title: "A tua jornada espera por ti 🚀",
    body: "Tens uma jornada em progresso. Que tal avançar mais um dia hoje?",
    url: "/journeys",
    triggerHours: 72,
    isActive: true,
  },
  {
    type: "reengagement",
    title: "Sentimos a tua falta! 💛",
    body: "Já passaram {days} dias. A Casa dos 20 está aqui sempre que precisares de um momento para ti.",
    url: "/",
    triggerHours: 120,
    isActive: true,
  },
  {
    type: "daily_motivation",
    title: "Reflexão do Dia ✨",
    body: "{reflection}",
    url: "/",
    triggerHours: 24,
    isActive: true,
  },
];

export async function seedAutoNotifications() {
  for (const config of AUTO_NOTIFICATION_DEFAULTS) {
    const existing = await storage.getAutoNotificationConfig(config.type);
    if (!existing) {
      await storage.upsertAutoNotificationConfig(config);
    }
  }
}

const AUTO_NOTIFICATION_PRIORITY: string[] = [
  "streak_risk",
  "reengagement",
  "journey_nudge",
  "morning_prompt",
  "evening_reflection",
  "daily_reflection",
  "mood_checkin",
  "streak_celebration",
  "daily_motivation",
];

export async function processAutoNotifications() {
  const configs = await storage.getAutoNotificationConfigs();
  const activeConfigs = configs.filter(c => c.isActive);
  if (activeConfigs.length === 0) return;

  const sortedConfigs = [...activeConfigs].sort((a, b) => {
    const aIdx = AUTO_NOTIFICATION_PRIORITY.indexOf(a.type);
    const bIdx = AUTO_NOTIFICATION_PRIORITY.indexOf(b.type);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  const webpushModule = await import("web-push");
  const webpush = webpushModule.default || webpushModule;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY || "",
    process.env.VAPID_PRIVATE_KEY || ""
  );

  const allUsers = await storage.getAllUsers();
  const activeUsers = allUsers.filter(u => u.isActive);

  for (const user of activeUsers) {
    const subs = await storage.getPushSubscriptions(user.id);
    if (subs.length === 0) continue;

    const recentlySent = await storage.getAutoNotificationLog(user.id, "__any__cooldown__", 2);
    if (recentlySent) continue;

    for (const config of sortedConfigs) {
      const alreadySent = await storage.getAutoNotificationLog(user.id, config.type, config.triggerHours);
      if (alreadySent) continue;

      const shouldSend = await checkAutoNotificationCondition(config.type, user.id);
      if (!shouldSend) continue;

      const result = await buildAutoNotificationBody(config, user.id);
      const payload = JSON.stringify({ title: config.title, body: result.body, url: result.url });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch {
          await storage.deletePushSubscription(user.id, sub.endpoint);
        }
      }

      await storage.createAutoNotificationLog(user.id, config.type);
      await storage.createAutoNotificationLog(user.id, "__any__cooldown__");
      break;
    }
  }
}

function getNextJourneyDay(userId: string, progress: any[]): { journeyId: string; journeyTitle: string; dayTitle: string; dayDescription: string; dayNumber: number } | null {
  for (const p of progress) {
    const journeyData = JOURNEY_TITLES[p.journeyId];
    if (!journeyData) continue;
    const completedSet = new Set(p.completedDays || []);
    const nextDay = journeyData.days.find(d => !completedSet.has(d.id));
    if (nextDay) {
      return {
        journeyId: p.journeyId,
        journeyTitle: journeyData.title,
        dayTitle: nextDay.title,
        dayDescription: nextDay.description,
        dayNumber: nextDay.day,
      };
    }
  }
  return null;
}

async function checkAutoNotificationCondition(type: string, userId: string): Promise<boolean> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (type) {
    case "morning_prompt": {
      const progress = await storage.getJourneyProgress(userId);
      const activeJourneys = progress.filter(p => p.completedDays.length < 30);
      if (activeJourneys.length === 0) return false;
      const nextDay = getNextJourneyDay(userId, activeJourneys);
      return nextDay !== null;
    }
    case "evening_reflection": {
      const entries = await storage.getEntries(userId);
      const todayEntry = entries.find(e => new Date(e.createdAt) >= todayStart);
      return !todayEntry;
    }
    case "daily_motivation": {
      return true;
    }
    case "daily_reflection": {
      const entries = await storage.getEntries(userId);
      const todayEntry = entries.find(e => new Date(e.createdAt) >= todayStart);
      return !todayEntry;
    }
    case "mood_checkin": {
      const latest = await storage.getLatestCheckin(userId);
      if (!latest) return true;
      return new Date(latest.createdAt) < todayStart;
    }
    case "streak_risk": {
      const entries = await storage.getEntries(userId);
      if (entries.length === 0) return false;
      const lastEntry = entries[0];
      const daysSince = (now.getTime() - new Date(lastEntry.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= 2 && daysSince < 7;
    }
    case "streak_celebration": {
      const monthCount = await storage.getMonthlyEntryCount(userId);
      return monthCount >= 7 && monthCount % 7 === 0;
    }
    case "journey_nudge": {
      const progress = await storage.getJourneyProgress(userId);
      const activeJourneys = progress.filter(p => p.completedDays.length > 0 && p.completedDays.length < 30);
      if (activeJourneys.length === 0) return false;
      const mostRecent = activeJourneys.sort((a, b) =>
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      )[0];
      const daysSince = (now.getTime() - new Date(mostRecent.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= 3;
    }
    case "reengagement": {
      const entries = await storage.getEntries(userId);
      const checkins = await storage.getCheckins(userId);
      const lastEntryDate = entries.length > 0 ? new Date(entries[0].createdAt) : null;
      const lastCheckinDate = checkins.length > 0 ? new Date(checkins[0].createdAt) : null;
      const lastActivity = lastEntryDate && lastCheckinDate
        ? new Date(Math.max(lastEntryDate.getTime(), lastCheckinDate.getTime()))
        : lastEntryDate || lastCheckinDate;
      if (!lastActivity) return false;
      const daysSince = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= 5;
    }
    default:
      return false;
  }
}

async function buildAutoNotificationBody(config: { type: string; body: string; url: string }, userId: string): Promise<{ body: string; url: string }> {
  let body = config.body;
  let url = config.url;
  const now = new Date();

  if (config.type === "daily_motivation") {
    const today = new Date().toISOString().split('T')[0];
    let seed = 0;
    for (let i = 0; i < today.length; i++) seed = ((seed << 5) - seed + today.charCodeAt(i)) | 0;
    const index = Math.abs(seed) % DAILY_REFLECTIONS.length;
    const reflection = DAILY_REFLECTIONS[index];
    body = reflection.text;
  }

  if (config.type === "morning_prompt") {
    const progress = await storage.getJourneyProgress(userId);
    const activeJourneys = progress.filter(p => p.completedDays.length < 30);
    const nextDay = getNextJourneyDay(userId, activeJourneys);
    if (nextDay) {
      body = `Dia ${nextDay.dayNumber} de "${nextDay.journeyTitle}": ${nextDay.dayTitle} — ${nextDay.dayDescription}`;
      url = `/journey/${nextDay.journeyId}`;
    }
  }

  if (config.type === "streak_risk" || config.type === "reengagement") {
    const entries = await storage.getEntries(userId);
    const checkins = await storage.getCheckins(userId);
    const lastEntryDate = entries.length > 0 ? new Date(entries[0].createdAt) : null;
    const lastCheckinDate = checkins.length > 0 ? new Date(checkins[0].createdAt) : null;
    const lastActivity = lastEntryDate && lastCheckinDate
      ? new Date(Math.max(lastEntryDate.getTime(), lastCheckinDate.getTime()))
      : lastEntryDate || lastCheckinDate;
    if (lastActivity) {
      const days = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      body = body.replace("{days}", String(days));
    }
  }

  if (config.type === "streak_celebration") {
    const monthCount = await storage.getMonthlyEntryCount(userId);
    body = body.replace("{count}", String(monthCount));
  }

  return { body, url };
}
