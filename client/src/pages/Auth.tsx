import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowRight, ArrowLeft, KeyRound } from "lucide-react";
import logoLight from "@/assets/images/logo-light.png";
import logoDark from "@/assets/images/logo-dark.png";
import { useTheme } from "next-themes";

export default function Auth({ onRegisterSuccess }: { onRegisterSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login, register } = useAuth();
  const { resolvedTheme } = useTheme();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else if (mode === "register") {
        await register(name, email, password);
        localStorage.setItem("casa-dos-20-user-name", name);
        onRegisterSuccess();
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("409")) {
        setError("Este email já está cadastrado.");
      } else if (msg.includes("401")) {
        setError("Email ou senha incorretos.");
      } else {
        setError(mode === "login" ? "Erro ao fazer login. Tente novamente." : "Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Email ou senha temporária incorretos.");
        return;
      }

      const changeRes = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      if (!changeRes.ok) {
        const data = await changeRes.json();
        setError(data.message || "Erro ao redefinir senha.");
        return;
      }

      setSuccess("Senha redefinida com sucesso! Fazendo login...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoginValid = email.includes("@") && password.length >= 1;
  const isRegisterValid = email.includes("@") && password.length >= 4 && name.trim().length > 0;
  const isResetValid = email.includes("@") && password.length >= 1 && newPassword.length >= 4;
  const isValid = mode === "login" ? isLoginValid : mode === "register" ? isRegisterValid : isResetValid;

  const logoSrc = resolvedTheme === "dark" ? logoDark : logoLight;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col items-center space-y-8">
        <div className="w-48 h-48 flex items-center justify-center overflow-hidden">
          <img src={logoSrc} alt="Casa dos 20" className="w-full h-full object-contain" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Bem-vindo de volta" : mode === "register" ? "Crie sua conta" : "Redefinir senha"}
          </p>
        </div>

        <div className="w-full space-y-4">
          {mode !== "reset" && (
            <>
              <button
                onClick={() => setError("Login com Google será disponibilizado em breve.")}
                className="w-full h-12 rounded-xl border border-border bg-white dark:bg-muted flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                data-testid="button-google-login"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar com Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {mode === "reset" && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={16} className="text-primary" />
                <p className="text-sm font-medium text-foreground">Redefinir senha</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Insira seu email e a senha temporária que recebeu, depois escolha sua nova senha.
              </p>
            </div>
          )}

          {mode === "register" && (
            <Input
              type="text"
              placeholder="Como quer ser chamado?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-white/50 border-border/50 text-center font-sans focus-visible:ring-primary/20"
              data-testid="input-name"
            />
          )}

          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl bg-white/50 border-border/50 text-center font-sans focus-visible:ring-primary/20"
            data-testid="input-email"
          />

          <Input
            type="password"
            placeholder={mode === "reset" ? "Senha temporária" : mode === "login" ? "Sua senha" : "Crie uma senha (min. 4 caracteres)"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-white/50 border-border/50 text-center font-sans focus-visible:ring-primary/20"
            data-testid="input-password"
          />

          {mode === "reset" && (
            <Input
              type="password"
              placeholder="Nova senha (min. 4 caracteres)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 rounded-xl bg-white/50 border-border/50 text-center font-sans focus-visible:ring-primary/20"
              data-testid="input-new-password"
            />
          )}

          {error && (
            <p className="text-xs text-red-500 text-center" data-testid="text-auth-error">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-600 text-center" data-testid="text-auth-success">{success}</p>
          )}

          <Button
            onClick={mode === "reset" ? handleResetPassword : handleSubmit}
            disabled={isSubmitting || !isValid}
            className="w-full h-14 rounded-full bg-primary text-primary-foreground text-lg font-medium shadow-lg hover:shadow-xl active:scale-95 transition-all"
            data-testid="button-auth-submit"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {mode === "login" ? "Entrar" : mode === "register" ? "Criar Conta" : "Redefinir Senha"}
                <ArrowRight className="ml-2" size={20} />
              </>
            )}
          </Button>

          {mode === "login" && (
            <button
              onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}
              className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
              data-testid="button-forgot-password"
            >
              Esqueceu a senha ou recebeu uma senha temporária?
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          {mode === "reset" ? (
            <button
              onClick={() => { setMode("login"); setError(""); setSuccess(""); setNewPassword(""); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              data-testid="button-back-to-login"
            >
              <ArrowLeft size={14} />
              Voltar para login
            </button>
          ) : (
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-auth-mode"
            >
              {mode === "login" ? (
                <>Não tem conta? <span className="text-primary font-medium">Criar conta</span></>
              ) : (
                <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>
              )}
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center px-4">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
