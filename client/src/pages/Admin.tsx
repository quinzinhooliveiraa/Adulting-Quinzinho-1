import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ChevronLeft, Users, Crown, Shield, UserPlus, Ban, Check,
  BarChart3, Clock, Star, XCircle, Search, Send, Trash2,
  MessageSquare, CheckCircle2, AlertCircle, ChevronDown,
  Bell, BellOff, Plus, ToggleLeft, ToggleRight, RefreshCw, Ticket, Copy, TrendingUp,
  BookOpen, Lock, ChevronRight, ChevronUp, Pencil, CreditCard
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isPremium: boolean;
  isActive: boolean;
  hasPremium: boolean;
  premiumReason: string;
  trialEndsAt: string | null;
  premiumUntil: string | null;
  invitedBy: string | null;
  createdAt: string;
  stripeSubscriptionId: string | null;
  isMasterAdmin?: boolean;
  lastActiveAt: string | null;
  pwaInstalled: boolean;
  trialBonusClaimed?: boolean;
  hasBook: boolean;
}

const MASTER_EMAIL = "quinzinhooliveiraa@gmail.com";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  trialUsers: number;
  grantedUsers: number;
  expiredUsers: number;
  blockedUsers: number;
  cardBonusUsers: number;
  bookPurchaseUsers: number;
}

interface FeedbackTicket {
  id: number;
  userId: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (!user.isActive) {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">Bloqueado</span>;
  }
  if (user.role === "admin") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-medium">Admin</span>;
  }
  if (user.premiumReason === "paid") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium">Premium</span>;
  }
  if (user.premiumReason === "granted") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Liberado</span>;
  }
  if (user.premiumReason === "trial") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">Trial</span>;
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Expirado</span>;
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={color} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function UserCard({ user, onUpdate, onDelete, currentUserEmail, allUsers }: { user: AdminUser; onUpdate: (id: string, data: any) => void; onDelete: (id: string) => void; currentUserEmail: string; allUsers: AdminUser[] }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showTrialPicker, setShowTrialPicker] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedNewMaster, setSelectedNewMaster] = useState("");
  const [transferConfirmText, setTransferConfirmText] = useState("");
  const [transferError, setTransferError] = useState("");
  const [showGrantPremium, setShowGrantPremium] = useState(false);
  const [grantDays, setGrantDays] = useState(30);
  const [grantConfirm, setGrantConfirm] = useState(false);
  const [grantConfirmText, setGrantConfirmText] = useState("");
  const [grantingBonus, setGrantingBonus] = useState(false);
  const [grantingBook, setGrantingBook] = useState(false);
  const [adminConfirmAction, setAdminConfirmAction] = useState<"grant" | "revoke" | null>(null);
  const [adminConfirmText, setAdminConfirmText] = useState("");

  const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const premiumEnd = user.premiumUntil ? new Date(user.premiumUntil) : null;
  const createdAt = new Date(user.createdAt);
  const isMainAdmin = user.email === MASTER_EMAIL;
  const iAmMaster = currentUserEmail === MASTER_EMAIL;

  const getPlanLabel = () => {
    if (user.premiumReason === "paid" && user.stripeSubscriptionId) return "Assinatura Stripe";
    if (user.premiumReason === "granted") return "Liberado pelo Admin";
    if (user.premiumReason === "trial") return "Trial Grátis";
    if (user.premiumReason === "admin") return "Admin";
    return "Sem plano";
  };

  return (
    <div className="border border-border rounded-xl bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-2.5 text-left hover:bg-muted/50 transition-colors rounded-xl"
        data-testid={`user-card-${user.id}`}
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground/60 shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate max-w-[140px]">{user.name}</p>
            <StatusBadge user={user} />
            {user.pwaInstalled && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" title="PWA instalado" />}
            {user.lastActiveAt && (Date.now() - new Date(user.lastActiveAt).getTime()) > 7 * 24 * 60 * 60 * 1000 && (
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-medium">Inativo</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <ChevronLeft size={14} className={`text-muted-foreground transition-transform shrink-0 ${expanded ? "-rotate-90" : "rotate-180"}`} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="min-w-0">
              <span className="text-muted-foreground">Plano:</span>
              <p className="text-foreground font-medium truncate">{getPlanLabel()}</p>
            </div>
            <div className="min-w-0">
              <span className="text-muted-foreground">Vencimento:</span>
              <p className="text-foreground font-medium truncate">
                {premiumEnd ? premiumEnd.toLocaleDateString("pt-BR") : trialEnd ? trialEnd.toLocaleDateString("pt-BR") + " (trial)" : user.isPremium ? "Ilimitado" : "—"}
              </p>
            </div>
            <div className="min-w-0">
              <span className="text-muted-foreground">Cadastro:</span>
              <p className="text-foreground">{createdAt.toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="min-w-0">
              <span className="text-muted-foreground">Última atividade:</span>
              <p className="text-foreground">
                {user.lastActiveAt ? (() => {
                  const diff = Date.now() - new Date(user.lastActiveAt).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 5) return "Agora";
                  if (mins < 60) return `${mins}min atrás`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h atrás`;
                  const days = Math.floor(hrs / 24);
                  return days === 1 ? "Ontem" : `${days} dias atrás`;
                })() : "—"}
              </p>
            </div>
            <div className="min-w-0">
              <span className="text-muted-foreground">Livro:</span>
              <p className={`font-medium ${user.hasBook ? "text-emerald-500" : "text-muted-foreground"}`}>
                {user.hasBook ? "Comprado" : "Não"}
              </p>
            </div>
            <div className="min-w-0">
              <span className="text-muted-foreground">PWA:</span>
              <p className={`font-medium ${user.pwaInstalled ? "text-green-500" : "text-muted-foreground"}`}>
                {user.pwaInstalled ? "Instalado" : "Não"}
              </p>
            </div>
            <div className="min-w-0">
              <span className="text-muted-foreground">Convite:</span>
              <p className="text-foreground truncate">{user.invitedBy || "—"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isMainAdmin && (
              <>
                {user.isPremium || user.premiumReason === "paid" ? (
                  <button
                    onClick={() => onUpdate(user.id, { isPremium: false, premiumUntil: null })}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    data-testid={`button-revoke-premium-${user.id}`}
                  >
                    <XCircle size={12} /> Revogar Premium
                  </button>
                ) : (
                  <button
                    onClick={() => setShowGrantPremium(!showGrantPremium)}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20 transition-colors flex items-center gap-1"
                    data-testid={`button-grant-premium-${user.id}`}
                  >
                    <Star size={12} /> Liberar Premium
                  </button>
                )}

                {showGrantPremium && (
                  <div className="w-full bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 space-y-2">
                    {!grantConfirm ? (
                      <>
                        <p className="text-[11px] text-muted-foreground">Por quantos dias?</p>
                        <div className="flex gap-2 flex-wrap">
                          {[30, 90, 180, 365].map(d => (
                            <button
                              key={d}
                              onClick={() => setGrantDays(d)}
                              className={`text-[10px] px-2 py-1 rounded-md border ${grantDays === d ? "bg-yellow-500 text-white border-yellow-500" : "border-border text-muted-foreground hover:bg-muted"}`}
                              data-testid={`button-grant-days-${d}`}
                            >
                              {d}d
                            </button>
                          ))}
                          <button
                            onClick={() => setGrantDays(0)}
                            className={`text-[10px] px-2 py-1 rounded-md border ${grantDays === 0 ? "bg-yellow-500 text-white border-yellow-500" : "border-border text-muted-foreground hover:bg-muted"}`}
                            data-testid="button-grant-unlimited"
                          >
                            Ilimitado
                          </button>
                        </div>
                        <button
                          onClick={() => { setGrantConfirm(true); setGrantConfirmText(""); }}
                          className="w-full text-[11px] px-3 py-1.5 rounded-lg bg-yellow-500 text-white font-medium"
                          data-testid={`button-confirm-grant-${user.id}`}
                        >
                          Liberar — {grantDays > 0 ? `${grantDays} dias` : "Ilimitado"}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] text-muted-foreground">
                          Escreve <strong className="text-foreground">"confirmar"</strong> para liberar premium a <strong className="text-foreground">{user.name}</strong>:
                        </p>
                        <input
                          type="text"
                          value={grantConfirmText}
                          onChange={e => setGrantConfirmText(e.target.value)}
                          placeholder="confirmar"
                          className="w-full text-[11px] px-2 py-1.5 rounded-md border border-border bg-background"
                          data-testid={`input-grant-confirm-${user.id}`}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setGrantConfirm(false); setGrantConfirmText(""); }}
                            className="flex-1 text-[11px] px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`button-cancel-grant-${user.id}`}
                          >
                            Cancelar
                          </button>
                          <button
                            disabled={grantConfirmText !== "confirmar"}
                            onClick={() => {
                              const premiumUntil = grantDays > 0 ? new Date(Date.now() + grantDays * 86400000).toISOString() : null;
                              onUpdate(user.id, { isPremium: true, premiumUntil });
                              setShowGrantPremium(false);
                              setGrantConfirm(false);
                              setGrantConfirmText("");
                            }}
                            className="flex-1 text-[11px] px-3 py-1.5 rounded-lg bg-yellow-500 text-white font-medium disabled:opacity-40"
                            data-testid={`button-confirm-grant-final-${user.id}`}
                          >
                            Confirmar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {user.hasBook ? (
                  <button
                    disabled={grantingBook}
                    onClick={async () => {
                      setGrantingBook(true);
                      try {
                        await apiRequest("DELETE", `/api/admin/users/${user.id}/revoke-book`);
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                      } finally { setGrantingBook(false); }
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-50"
                    data-testid={`button-revoke-book-${user.id}`}
                  >
                    <BookOpen size={12} /> Revogar Livro
                  </button>
                ) : (
                  <button
                    disabled={grantingBook}
                    onClick={async () => {
                      setGrantingBook(true);
                      try {
                        await apiRequest("POST", `/api/admin/users/${user.id}/grant-book`);
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                      } finally { setGrantingBook(false); }
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                    data-testid={`button-grant-book-${user.id}`}
                  >
                    <BookOpen size={12} /> Liberar Livro
                  </button>
                )}

                {user.isActive ? (
                  <button
                    onClick={() => onUpdate(user.id, { isActive: false })}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                    data-testid={`button-block-${user.id}`}
                  >
                    <Ban size={12} /> Bloquear
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdate(user.id, { isActive: true })}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 hover:bg-green-500/20 transition-colors flex items-center gap-1"
                    data-testid={`button-unblock-${user.id}`}
                  >
                    <Check size={12} /> Desbloquear
                  </button>
                )}

                {showTrialPicker ? (
                  <div className="w-full flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <span className="text-[11px] text-blue-600 whitespace-nowrap">Estender por</span>
                    <select
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value))}
                      className="text-[11px] px-2 py-1 rounded bg-background border border-border text-foreground"
                    >
                      <option value={7}>7 dias</option>
                      <option value={14}>14 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={60}>60 dias</option>
                      <option value={90}>90 dias</option>
                    </select>
                    <button
                      onClick={() => {
                        const newEnd = new Date();
                        newEnd.setDate(newEnd.getDate() + trialDays);
                        onUpdate(user.id, { trialEndsAt: newEnd.toISOString() });
                        setShowTrialPicker(false);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded bg-blue-500 text-white font-medium"
                      data-testid={`button-confirm-trial-${user.id}`}
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setShowTrialPicker(false)}
                      className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowTrialPicker(true)}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                      data-testid={`button-extend-trial-${user.id}`}
                    >
                      <Clock size={12} /> Estender Trial
                    </button>
                    {trialEnd && trialEnd > new Date() && (
                      <button
                        onClick={() => onUpdate(user.id, { trialEndsAt: new Date(0).toISOString() })}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/20 transition-colors flex items-center gap-1"
                        data-testid={`button-end-trial-${user.id}`}
                      >
                        <XCircle size={12} /> Encerrar Trial
                      </button>
                    )}
                    {!user.trialBonusClaimed && (
                      <button
                        disabled={grantingBonus}
                        onClick={async () => {
                          setGrantingBonus(true);
                          try {
                            await fetch(`/api/admin/users/${user.id}/grant-trial-bonus`, { method: "POST", credentials: "include" });
                            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                          } finally {
                            setGrantingBonus(false);
                          }
                        }}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 hover:bg-green-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                        data-testid={`button-grant-bonus-${user.id}`}
                      >
                        <Star size={12} /> {grantingBonus ? "..." : "+16 dias bónus"}
                      </button>
                    )}
                  </>
                )}

                {isMainAdmin ? (
                  <span className="text-[11px] px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 font-semibold flex items-center gap-1">
                    <Crown size={12} /> Admin Master
                  </span>
                ) : adminConfirmAction ? (
                  <div className="w-full bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 space-y-2">
                    <p className="text-[11px] text-muted-foreground">
                      Escreve <strong className="text-foreground">"confirmar"</strong> para{" "}
                      {adminConfirmAction === "grant" ? (
                        <>tornar <strong className="text-foreground">{user.name}</strong> admin</>
                      ) : (
                        <>remover admin de <strong className="text-foreground">{user.name}</strong></>
                      )}:
                    </p>
                    <input
                      type="text"
                      value={adminConfirmText}
                      onChange={e => setAdminConfirmText(e.target.value)}
                      placeholder="confirmar"
                      className="w-full text-[11px] px-2 py-1.5 rounded-md border border-border bg-background"
                      data-testid={`input-admin-confirm-${user.id}`}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAdminConfirmAction(null); setAdminConfirmText(""); }}
                        className="flex-1 text-[11px] px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`button-cancel-admin-${user.id}`}
                      >
                        Cancelar
                      </button>
                      <button
                        disabled={adminConfirmText !== "confirmar"}
                        onClick={() => {
                          onUpdate(user.id, { role: adminConfirmAction === "grant" ? "admin" : "user" });
                          setAdminConfirmAction(null);
                          setAdminConfirmText("");
                        }}
                        className="flex-1 text-[11px] px-3 py-1.5 rounded-lg bg-purple-500 text-white font-medium disabled:opacity-40"
                        data-testid={`button-confirm-admin-${user.id}`}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                ) : user.role !== "admin" ? (
                  <button
                    onClick={() => { setAdminConfirmAction("grant"); setAdminConfirmText(""); }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                    data-testid={`button-promote-admin-${user.id}`}
                  >
                    <Shield size={12} /> Tornar Admin
                  </button>
                ) : (
                  <button
                    onClick={() => { setAdminConfirmAction("revoke"); setAdminConfirmText(""); }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    data-testid={`button-demote-admin-${user.id}`}
                  >
                    <Shield size={12} /> Remover Admin
                  </button>
                )}

                {isMainAdmin && iAmMaster ? (
                  <>
                    <button
                      onClick={() => setShowTransferDialog(true)}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                      data-testid={`button-delete-master-${user.id}`}
                    >
                      <Trash2 size={12} /> Apagar Minha Conta
                    </button>
                    {showTransferDialog && (
                      <div className="w-full p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle size={16} />
                          <p className="text-xs font-semibold">Transferir Admin Master</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Antes de apagar sua conta, escolha quem será o novo Admin Master. Esta ação é irreversível.
                        </p>
                        <select
                          value={selectedNewMaster}
                          onChange={(e) => { setSelectedNewMaster(e.target.value); setTransferError(""); }}
                          className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                          data-testid="select-new-master"
                        >
                          <option value="">Selecione o novo Admin Master...</option>
                          {allUsers.filter(u => u.id !== user.id && u.isActive).map(u => (
                            <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                        {selectedNewMaster && (
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1">
                              Digite <strong>"apagar"</strong> para confirmar:
                            </p>
                            <input
                              type="text"
                              value={transferConfirmText}
                              onChange={(e) => setTransferConfirmText(e.target.value)}
                              placeholder="apagar"
                              className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                              data-testid="input-transfer-confirm"
                            />
                          </div>
                        )}
                        {transferError && (
                          <p className="text-[11px] text-red-500">{transferError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!selectedNewMaster) {
                                setTransferError("Selecione o novo Admin Master");
                                return;
                              }
                              if (transferConfirmText !== "apagar") {
                                setTransferError('Digite "apagar" para confirmar');
                                return;
                              }
                              try {
                                const res = await fetch(`/api/admin/users/${user.id}`, {
                                  method: "DELETE",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ newMasterEmail: selectedNewMaster }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  window.location.href = "/";
                                } else {
                                  setTransferError(data.message || "Erro ao transferir");
                                }
                              } catch {
                                setTransferError("Erro de conexão");
                              }
                            }}
                            disabled={!selectedNewMaster || transferConfirmText !== "apagar"}
                            className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                            data-testid="button-confirm-transfer-delete"
                          >
                            <Trash2 size={12} /> Confirmar e Apagar
                          </button>
                          <button
                            onClick={() => { setShowTransferDialog(false); setSelectedNewMaster(""); setTransferConfirmText(""); setTransferError(""); }}
                            className="text-[11px] px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : !isMainAdmin && (
                  <>
                    {confirmDelete ? (
                      <div className="mt-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 space-y-2">
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                          Esta ação é irreversível. Todos os dados serão apagados.
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Escreve <strong className="text-foreground">"apagar"</strong> para confirmar:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={e => setDeleteConfirmText(e.target.value)}
                          placeholder="apagar"
                          className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:border-red-400"
                          data-testid={`input-delete-confirm-${user.id}`}
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => { onDelete(user.id); setConfirmDelete(false); setDeleteConfirmText(""); }}
                            disabled={deleteConfirmText !== "apagar"}
                            className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                            data-testid={`button-confirm-delete-${user.id}`}
                          >
                            <Trash2 size={12} /> Apagar definitivamente
                          </button>
                          <button
                            onClick={() => { setConfirmDelete(false); setDeleteConfirmText(""); }}
                            className="text-[11px] px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 size={12} /> Apagar Conta
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InviteForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grantPremium, setGrantPremium] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const inviteMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; grantPremium: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/invite", data);
      return res.json();
    },
    onSuccess: (data) => {
      setResult(`Conta criada! Senha temporária: ${data.tempPassword}`);
      setName("");
      setEmail("");
      setGrantPremium(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      onSuccess();
    },
  });

  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome"
        className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        data-testid="input-invite-name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        data-testid="input-invite-email"
      />
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={grantPremium}
          onChange={(e) => setGrantPremium(e.target.checked)}
          className="rounded"
          data-testid="checkbox-invite-premium"
        />
        Liberar Premium
      </label>
      <button
        onClick={() => inviteMutation.mutate({ name, email, grantPremium })}
        disabled={!name.trim() || !email.trim() || inviteMutation.isPending}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        data-testid="button-send-invite"
      >
        <Send size={16} />
        {inviteMutation.isPending ? "Criando..." : "Convidar"}
      </button>
      {result && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
          {result}
        </div>
      )}
      {inviteMutation.isError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          Erro ao convidar. Verifique se o email já existe.
        </div>
      )}
    </div>
  );
}

function FeedbackStatusBadge({ status }: { status: string }) {
  if (status === "open") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium">Aberto</span>;
  }
  if (status === "in_progress") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">Em Andamento</span>;
  }
  if (status === "resolved") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Resolvido</span>;
  }
  if (status === "closed") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Fechado</span>;
  }
  return null;
}

function FeedbackTypeBadge({ type }: { type: string }) {
  if (type === "bug") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">Bug</span>;
  }
  if (type === "idea") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-medium">Ideia</span>;
  }
  if (type === "support") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">Suporte</span>;
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Feedback</span>;
}

function FeedbackCard({ ticket, onUpdate }: { ticket: FeedbackTicket; onUpdate: (id: number, data: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(ticket.adminNote || "");
  const createdAt = new Date(ticket.createdAt);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
        data-testid={`feedback-card-${ticket.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
            <FeedbackTypeBadge type={ticket.type} />
            <FeedbackStatusBadge status={ticket.status} />
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {ticket.userName} ({ticket.userEmail}) — {createdAt.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3 animate-in fade-in duration-200">
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-foreground whitespace-pre-wrap">
            {ticket.message}
          </div>

          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota do admin (opcional)..."
              className="w-full p-2.5 rounded-lg bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={2}
              data-testid={`textarea-admin-note-${ticket.id}`}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["open", "in_progress", "resolved", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => onUpdate(ticket.id, { status: s, adminNote: note || undefined })}
                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                  ticket.status === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                }`}
                data-testid={`button-status-${s}-${ticket.id}`}
              >
                {s === "open" && <AlertCircle size={11} />}
                {s === "in_progress" && <Clock size={11} />}
                {s === "resolved" && <CheckCircle2 size={11} />}
                {s === "closed" && <XCircle size={11} />}
                {s === "open" ? "Aberto" : s === "in_progress" ? "Em Andamento" : s === "resolved" ? "Resolvido" : "Fechado"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function splitByFrases(text: string): string[] {
  const result: string[] = [];
  let buf = "";
  let i = 0;
  while (i < text.length) {
    buf += text[i];
    if (/[.!?]/.test(text[i]) && i + 1 < text.length) {
      let j = i + 1;
      while (j < text.length && text[j] === " ") j++;
      const nextChar = text[j];
      if (nextChar && /[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ"—]/.test(nextChar) && buf.trim().length >= 60) {
        result.push(buf.trim());
        buf = "";
        i = j;
        continue;
      }
    }
    i++;
  }
  if (buf.trim()) result.push(buf.trim());
  return result.filter(p => p.length > 0);
}

function processContent(raw: string): string[] {
  if (!raw.trim()) return [];
  if (raw.includes("\n\n")) {
    return raw.split(/\n\n+/).map(block =>
      block.split("\n").map(l => l.trim()).filter(l => l.length > 0).join(" ")
    ).filter(p => p.trim().length > 0);
  }
  if (!raw.includes("\n")) return splitByFrases(raw);
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const paragraphs: string[] = [];
  let current = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    current = current ? current + " " + line : line;
    const next = lines[i + 1];
    if (!next) { paragraphs.push(current); break; }
    const endsWithPunct = /[.!?]["»"']?$/.test(line);
    const nextStartsCap = /^[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ""—]/.test(next);
    if (endsWithPunct && nextStartsCap) { paragraphs.push(current); current = ""; }
  }
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs.filter(p => p.length > 0);
}

// Versão previsível para o editor admin:
// SOMENTE \n\n cria novo parágrafo. \n simples = continuação da linha (vira espaço).
// Assim o editor controla exatamente onde quer a quebra.
function processContentEditor(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/\n\n+/)
    .map(block =>
      block
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join(" ")
    )
    .filter(p => p.trim().length > 0);
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user: authUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "feedback" | "push" | "coupons" | "analytics" | "livro">("users");
  const [bookEditId, setBookEditId] = useState<number | null>(null);
  const [bookForm, setBookForm] = useState({ order: 1, title: "", tag: "", excerpt: "", content: "", isPreview: false });
  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [bookPreview, setBookPreview] = useState(false);
  const [bookExpandedId, setBookExpandedId] = useState<number | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [excludeAdmins, setExcludeAdmins] = useState(true);
  const [adminAlert, setAdminAlert] = useState<string | null>(null);
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const isCustomRange = !!(appliedStart && appliedEnd);

  function buildAnalyticsUrl(path: string) {
    const params = new URLSearchParams({ excludeAdmins: String(excludeAdmins) });
    if (isCustomRange) {
      params.set("startDate", appliedStart);
      params.set("endDate", appliedEnd);
    } else {
      params.set("days", String(analyticsDays));
    }
    return `${path}?${params.toString()}`;
  }

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: allUsers = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allFeedback = [] } = useQuery<FeedbackTicket[]>({
    queryKey: ["/api/admin/feedback"],
  });

  const { data: notifyPrefs } = useQuery<{ notifyNewUser: boolean; notifyNewSub: boolean }>({
    queryKey: ["/api/admin/notify-prefs"],
  });

  const { data: analyticsData } = useQuery<{
    eventCounts: { event: string; count: number }[];
    dailyActive: { date: string; count: number }[];
  }>({
    queryKey: ["/api/admin/analytics", analyticsDays, excludeAdmins, appliedStart, appliedEnd],
    queryFn: () => fetch(buildAnalyticsUrl("/api/admin/analytics"), { credentials: "include" }).then(r => r.json()),
    enabled: activeTab === "analytics",
  });

  const { data: topUsersRaw } = useQuery<{ userId: string; name: string; email: string; avatarUrl: string | null; count: number }[]>({
    queryKey: ["/api/admin/top-users", analyticsDays, excludeAdmins, appliedStart, appliedEnd],
    queryFn: () => fetch(buildAnalyticsUrl("/api/admin/top-users"), { credentials: "include" }).then(r => r.json()),
    enabled: activeTab === "analytics",
  });
  const topUsers = Array.isArray(topUsersRaw) ? topUsersRaw : [];

  const todayDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const { data: hourlyDataRaw } = useQuery<{ hour: number; count: number }[]>({
    queryKey: ["/api/admin/analytics/hourly", todayDateStr, excludeAdmins],
    queryFn: () => fetch(`/api/admin/analytics/hourly?date=${todayDateStr}&excludeAdmins=${excludeAdmins}`, { credentials: "include" }).then(r => r.json()),
    enabled: activeTab === "analytics" && analyticsDays === 1 && !isCustomRange,
    refetchInterval: 60_000,
  });
  const hourlyData: { hour: number; count: number }[] = Array.isArray(hourlyDataRaw) ? hourlyDataRaw : [];

  const { data: demographics } = useQuery<{
    total: number;
    withAge: number;
    withInterests: number;
    ageRanges: { range: string; count: number }[];
    topInterests: { interest: string; count: number }[];
  }>({
    queryKey: ["/api/admin/demographics", excludeAdmins],
    queryFn: () => fetch(`/api/admin/demographics?excludeAdmins=${excludeAdmins}`, { credentials: "include" }).then(r => r.json()),
    enabled: activeTab === "analytics",
  });

  const { data: pushStatus, refetch: refetchPushStatus } = useQuery<{ subscriptionCount: number; hasSubscription: boolean }>({
    queryKey: ["/api/admin/push-status"],
    refetchOnWindowFocus: true,
  });

  const { data: adminBookChapters = [], refetch: refetchBookChapters } = useQuery<{ id: number; order: number; title: string; tag: string | null; excerpt: string | null; content: string; isPreview: boolean }[]>({
    queryKey: ["/api/admin/book/chapters"],
    queryFn: () => fetch("/api/admin/book/chapters", { credentials: "include" }).then(r => r.json()),
    enabled: activeTab === "livro",
  });

  const { data: bookPurchases = [] } = useQuery<{ userId: string; name: string; email: string; amountCents: number; createdAt: string }[]>({
    queryKey: ["/api/admin/book/purchases"],
    queryFn: () => fetch("/api/admin/book/purchases", { credentials: "include" }).then(r => r.json()),
    enabled: activeTab === "livro",
  });

  const notifyPrefsMutation = useMutation({
    mutationFn: async (data: { notifyNewUser?: boolean; notifyNewSub?: boolean }) => {
      const res = await fetch("/api/admin/notify-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notify-prefs"] });
    },
  });

  const [pushTestMsg, setPushTestMsg] = useState<string | null>(null);
  const [targetUserSearch, setTargetUserSearch] = useState("");
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetUserName, setTargetUserName] = useState("");
  const [directTitle, setDirectTitle] = useState("Casa dos 20");
  const [directBody, setDirectBody] = useState("");
  const [directUrl, setDirectUrl] = useState("/");
  const [directSending, setDirectSending] = useState(false);
  const [directResult, setDirectResult] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const pushTestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/push-test", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao enviar");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPushTestMsg(data.sent > 0 ? `✅ Enviado para ${data.sent} dispositivo(s)` : "⚠️ Nenhum dispositivo recebeu");
      setTimeout(() => setPushTestMsg(null), 5000);
    },
    onError: (err: any) => {
      setPushTestMsg(`❌ ${err.message}`);
      setTimeout(() => setPushTestMsg(null), 6000);
    },
  });

  const handleSubscribePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidRes = await fetch("/api/push/vapid-key");
      const { publicKey } = await vapidRes.json();
      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const applicationServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) applicationServerKey[i] = rawData.charCodeAt(i);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      const subJson = sub.toJSON() as any;
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        }),
      });
      refetchPushStatus();
      setPushTestMsg("✅ Inscrição renovada com sucesso!");
      setTimeout(() => setPushTestMsg(null), 4000);
    } catch (err: any) {
      setPushTestMsg(`❌ Erro ao inscrever: ${err.message}`);
      setTimeout(() => setPushTestMsg(null), 5000);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Erro ao atualizar");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setAdminAlert(null);
    },
    onError: (error: Error) => {
      setAdminAlert(error.message);
      setTimeout(() => setAdminAlert(null), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/feedback/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
    },
  });

  const handleUpdate = (id: string, data: any) => {
    updateMutation.mutate({ id, data });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFeedbackUpdate = (id: number, data: any) => {
    updateFeedbackMutation.mutate({ id, data });
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === "all") return true;
    if (filterStatus === "premium") return u.premiumReason === "paid" || u.premiumReason === "granted";
    if (filterStatus === "trial") return u.premiumReason === "trial";
    if (filterStatus === "expired") return u.premiumReason === "expired";
    if (filterStatus === "blocked") return !u.isActive;
    if (filterStatus === "admin") return u.role === "admin";
    return true;
  });

  const openFeedbackCount = allFeedback.filter(f => f.status === "open").length;

  const filteredTargetUsers = targetUserSearch.trim().length > 0
    ? allUsers.filter(u =>
        u.name.toLowerCase().includes(targetUserSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(targetUserSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSendDirect = async () => {
    if (!targetUserId || !directBody.trim()) return;
    setDirectSending(true);
    setDirectResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: directTitle, body: directBody, url: directUrl, targetUserId }),
      });
      const data = await res.json();
      if (data.sent > 0) {
        setDirectResult(`✅ Enviado para ${data.sent} dispositivo(s) de ${targetUserName}`);
        setDirectBody("");
      } else {
        setDirectResult(`⚠️ ${targetUserName} não tem dispositivos inscritos`);
      }
    } catch {
      setDirectResult("❌ Erro ao enviar. Tente novamente.");
    }
    setDirectSending(false);
    setTimeout(() => setDirectResult(null), 6000);
  };

  return (
    <div className="w-full box-border px-4 pt-12 pb-24 space-y-5 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex items-center gap-3 pr-20 md:pr-0">
        <button onClick={() => setLocation("/")} className="p-2 -ml-2 rounded-full hover:bg-muted shrink-0" data-testid="button-back-admin">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-serif text-foreground truncate">Painel Admin</h1>
          <p className="text-xs text-muted-foreground truncate">Gerencie usuários, feedbacks e acessos</p>
        </div>
      </div>

      {adminAlert && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200" data-testid="admin-alert">
          <AlertCircle size={14} />
          {adminAlert}
        </div>
      )}

      <div className="grid grid-cols-6 gap-1">
        {([
          { id: "users", icon: <Users size={14} />, label: "Usuários" },
          { id: "analytics", icon: <TrendingUp size={14} />, label: "Analytics" },
          { id: "feedback", icon: <MessageSquare size={14} />, label: "Chamados", badge: openFeedbackCount },
          { id: "push", icon: <Send size={14} />, label: "Push" },
          { id: "coupons", icon: <Ticket size={14} />, label: "Cupões" },
          { id: "livro", icon: <BookOpen size={14} />, label: "Livro" },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors ${
              activeTab === tab.id
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground border border-border"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            <span className="text-[9px] font-medium leading-none">{tab.label}</span>
            {"badge" in tab && tab.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <>
          {stats && (
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon={Users} label="Total" value={stats.totalUsers} color="text-foreground" />
              <StatCard icon={TrendingUp} label="Ativos 30d" value={stats.activeUsers} color="text-green-500" />
              <StatCard icon={Star} label="Premium" value={stats.premiumUsers} color="text-yellow-500" />
              <StatCard icon={Clock} label="Trial" value={stats.trialUsers} color="text-blue-500" />
              <StatCard icon={Check} label="Liberados" value={stats.grantedUsers} color="text-green-500" />
              <StatCard icon={XCircle} label="Expirados" value={stats.expiredUsers} color="text-muted-foreground" />
              <StatCard icon={Ban} label="Bloqueados" value={stats.blockedUsers} color="text-red-500" />
              <StatCard icon={CreditCard} label="Cartão 30d" value={stats.cardBonusUsers ?? 0} color="text-violet-500" />
              <StatCard icon={BookOpen} label="Livro" value={stats.bookPurchaseUsers ?? 0} color="text-amber-500" />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              data-testid="button-toggle-invite"
            >
              <UserPlus size={16} />
              Convidar
            </button>
          </div>

          {showInvite && (
            <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-sm font-medium text-foreground">Convidar Pessoa</h3>
              <InviteForm onSuccess={() => {}} />
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-search-users"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { id: "all", label: "Todos" },
                { id: "trial", label: "Trial" },
                { id: "premium", label: "Premium" },
                { id: "expired", label: "Expirados" },
                { id: "blocked", label: "Bloqueados" },
                { id: "admin", label: "Admins" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`text-[11px] px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-colors ${
                    filterStatus === f.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                  }`}
                  data-testid={`filter-${f.id}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{filteredUsers.length} usuário(s)</p>
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} onUpdate={handleUpdate} onDelete={handleDelete} currentUserEmail={authUser?.email || ""} allUsers={allUsers} />
            ))}
          </div>
        </>
      )}

      {activeTab === "feedback" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-foreground" />
            <h2 className="text-sm font-medium text-foreground">
              {allFeedback.length} chamado(s) — {openFeedbackCount} aberto(s)
            </h2>
          </div>

          {allFeedback.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum chamado recebido ainda.</p>
            </div>
          ) : (
            allFeedback.map((ticket) => (
              <FeedbackCard key={ticket.id} ticket={ticket} onUpdate={handleFeedbackUpdate} />
            ))
          )}
        </div>
      )}

      {activeTab === "push" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell size={16} />
              Alertas do Admin
            </h3>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${pushStatus?.hasSubscription ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
              <span className={`w-2 h-2 rounded-full ${pushStatus?.hasSubscription ? "bg-green-500" : "bg-red-500"}`} />
              {pushStatus === undefined
                ? "Verificando inscrição..."
                : pushStatus.hasSubscription
                ? `${pushStatus.subscriptionCount} dispositivo(s) inscrito(s) — notificações ativas`
                : "Nenhuma inscrição ativa — notificações não serão entregues"}
            </div>

            {!pushStatus?.hasSubscription && (
              <button
                onClick={handleSubscribePush}
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                data-testid="button-push-subscribe"
              >
                Reativar Notificações neste Dispositivo
              </button>
            )}

            {pushStatus?.hasSubscription && (
              <button
                onClick={() => pushTestMutation.mutate()}
                disabled={pushTestMutation.isPending}
                className="w-full py-2 rounded-xl bg-muted text-foreground text-sm font-medium disabled:opacity-50"
                data-testid="button-push-test"
              >
                {pushTestMutation.isPending ? "Enviando..." : "Testar Notificação"}
              </button>
            )}

            {pushTestMsg && (
              <p className="text-xs text-center text-muted-foreground">{pushTestMsg}</p>
            )}

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between py-2 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Novo usuário</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Receber notificação quando alguém criar conta</p>
                </div>
                <button
                  onClick={() => notifyPrefsMutation.mutate({ notifyNewUser: !notifyPrefs?.notifyNewUser })}
                  className="transition-colors shrink-0"
                  data-testid="toggle-notify-new-user"
                >
                  {notifyPrefs?.notifyNewUser ? (
                    <ToggleRight size={28} className="text-primary" />
                  ) : (
                    <ToggleLeft size={28} className="text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between py-2 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Pagamentos e cartões</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Nova assinatura, cartão adicionado e renovações</p>
                </div>
                <button
                  onClick={() => notifyPrefsMutation.mutate({ notifyNewSub: !notifyPrefs?.notifyNewSub })}
                  className="transition-colors shrink-0"
                  data-testid="toggle-notify-new-sub"
                >
                  {notifyPrefs?.notifyNewSub ? (
                    <ToggleRight size={28} className="text-primary" />
                  ) : (
                    <ToggleLeft size={28} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Send size={16} />
              Enviar para Usuário Específico
            </h3>

            <div className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar usuário por nome ou email..."
                  value={targetUserId ? targetUserName : targetUserSearch}
                  onChange={(e) => {
                    if (targetUserId) {
                      setTargetUserId(null);
                      setTargetUserName("");
                    }
                    setTargetUserSearch(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => { if (!targetUserId) setShowUserDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
                  className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="input-target-user-search"
                />
                {targetUserId && (
                  <button
                    onClick={() => { setTargetUserId(null); setTargetUserName(""); setTargetUserSearch(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>

              {showUserDropdown && filteredTargetUsers.length > 0 && !targetUserId && (
                <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                  {filteredTargetUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setTargetUserId(u.id);
                        setTargetUserName(u.name);
                        setTargetUserSearch("");
                        setShowUserDropdown(false);
                      }}
                      className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-2.5"
                      data-testid={`target-user-option-${u.id}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {targetUserId && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <input
                  type="text"
                  placeholder="Título"
                  value={directTitle}
                  onChange={e => setDirectTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="input-direct-title"
                />
                <textarea
                  placeholder="Mensagem..."
                  value={directBody}
                  onChange={e => setDirectBody(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  data-testid="input-direct-body"
                />
                <input
                  type="text"
                  placeholder="URL (ex: /journey)"
                  value={directUrl}
                  onChange={e => setDirectUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="input-direct-url"
                />
                <button
                  onClick={handleSendDirect}
                  disabled={directSending || !directBody.trim()}
                  className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  data-testid="button-send-direct"
                >
                  <Send size={14} />
                  {directSending ? "Enviando..." : `Enviar para ${targetUserName}`}
                </button>
                {directResult && (
                  <p className="text-xs text-center text-muted-foreground animate-in fade-in duration-200">{directResult}</p>
                )}
              </div>
            )}
          </div>

          <PushNotificationPanel />
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Uso do App</h2>
            <div className="flex gap-1">
              {([1, 7, 30, 90] as const).map(d => (
                <button
                  key={d}
                  data-testid={`btn-analytics-${d}d`}
                  onClick={() => { setAnalyticsDays(d); setAppliedStart(""); setAppliedEnd(""); setCustomStart(""); setCustomEnd(""); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!isCustomRange && analyticsDays === d ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
                >
                  {d === 1 ? "Hoje" : `${d}d`}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Período personalizado</p>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStart}
                max={customEnd || todayStr}
                onChange={e => setCustomStart(e.target.value)}
                data-testid="input-analytics-start"
                className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
              />
              <span className="text-xs text-muted-foreground shrink-0">até</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={todayStr}
                onChange={e => setCustomEnd(e.target.value)}
                data-testid="input-analytics-end"
                className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
              />
              <button
                onClick={() => { if (customStart && customEnd) { setAppliedStart(customStart); setAppliedEnd(customEnd); } }}
                disabled={!customStart || !customEnd}
                data-testid="btn-analytics-apply"
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-40 shrink-0"
              >
                Aplicar
              </button>
            </div>
            {isCustomRange && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-primary font-medium">📅 {appliedStart.slice(5)} → {appliedEnd.slice(5)}</span>
                <button
                  onClick={() => { setAppliedStart(""); setAppliedEnd(""); setCustomStart(""); setCustomEnd(""); }}
                  className="text-[11px] text-muted-foreground underline"
                  data-testid="btn-analytics-clear"
                >limpar</button>
              </div>
            )}
          </div>

          <button
            onClick={() => setExcludeAdmins(v => !v)}
            data-testid="toggle-exclude-admins"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors w-full justify-between border ${
              excludeAdmins
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            <span>Excluir admins dos dados</span>
            <span className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${excludeAdmins ? "bg-primary" : "bg-muted-foreground/30"}`}>
              <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${excludeAdmins ? "translate-x-4" : "translate-x-0"}`} />
            </span>
          </button>

          {/* Hourly chart — only when "Hoje" is selected */}
          {!isCustomRange && analyticsDays === 1 && (() => {
            const totalToday = hourlyData.reduce((s, h) => s + h.count, 0);
            const maxCount = Math.max(...hourlyData.map(h => h.count), 1);
            const peakHour = hourlyData.reduce((best, h) => h.count > best.count ? h : best, hourlyData[0] ?? { hour: 0, count: 0 });
            const nowBrt = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const currentHour = nowBrt.getHours();
            const fmt = (h: number) => `${String(h).padStart(2, "0")}h`;
            const labelHours = [0, 3, 6, 9, 12, 15, 18, 21];
            return (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Utilizadores ativos — hoje por hora</p>
                    {peakHour.count > 0 && (
                      <p className="text-[10px] text-primary font-medium mt-0.5">
                        Pico às {fmt(peakHour.hour)} · {peakHour.count} utilizador{peakHour.count !== 1 ? "es" : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{totalToday}</p>
                    <p className="text-[9px] text-muted-foreground">total hoje</p>
                  </div>
                </div>
                <div className="flex items-end gap-px h-24">
                  {hourlyData.map((h) => {
                    const pct = (h.count / maxCount) * 100;
                    const isPeak = h.count > 0 && h.count === peakHour.count;
                    const isCurrent = h.hour === currentHour;
                    const isFuture = h.hour > currentHour;
                    return (
                      <div key={h.hour} className="flex-1 flex flex-col items-center group relative" style={{ height: "100%", justifyContent: "flex-end" }}>
                        {h.count > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[8px] px-1 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            {fmt(h.hour)}: {h.count}
                          </div>
                        )}
                        <div
                          className={`w-full rounded-t-[2px] transition-colors ${
                            isPeak
                              ? "bg-primary ring-1 ring-primary/40"
                              : isCurrent
                              ? "bg-primary/70"
                              : isFuture || h.count === 0
                              ? "bg-muted/30"
                              : "bg-primary/45 hover:bg-primary/65"
                          }`}
                          style={{ height: `${h.count === 0 ? 2 : Math.max(pct, 6)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1.5 px-0">
                  {hourlyData.map((h) => (
                    <span key={h.hour} className={`flex-1 text-center ${labelHours.includes(h.hour) ? (h.hour === peakHour.hour && peakHour.count > 0 ? "text-primary font-bold" : "text-muted-foreground") : "opacity-0 select-none"}`} style={{ fontSize: "8px" }}>
                      {labelHours.includes(h.hour) ? fmt(h.hour) : "."}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Daily chart — all periods except "Hoje" */}
          {(isCustomRange || analyticsDays !== 1) && analyticsData?.dailyActive && analyticsData.dailyActive.length > 0 && (() => {
            const max = Math.max(...analyticsData.dailyActive.map(x => x.count), 1);
            const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
            const total = analyticsData.dailyActive.reduce((s, d) => s + d.count, 0);
            const todayCount = analyticsData.dailyActive.find(d => d.date === today)?.count ?? 0;
            return (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground">Utilizadores ativos por dia</p>
                  <div className="flex gap-3 text-right">
                    <div>
                      <p className="text-sm font-bold text-foreground">{todayCount}</p>
                      <p className="text-[9px] text-muted-foreground">hoje</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{total}</p>
                      <p className="text-[9px] text-muted-foreground">total {analyticsDays}d</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-end gap-px h-20">
                  {analyticsData.dailyActive.map((d, i) => {
                    const pct = (d.count / max) * 100;
                    const isToday = d.date === today;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative" style={{ height: "100%", justifyContent: "flex-end" }}>
                        {d.count > 0 && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-[8px] px-1 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            {d.date.slice(5)}: {d.count}
                          </div>
                        )}
                        <div
                          className={`w-full rounded-sm transition-colors ${isToday ? "bg-primary" : d.count === 0 ? "bg-muted/40" : "bg-primary/60 hover:bg-primary/80"}`}
                          style={{ height: `${d.count === 0 ? 2 : Math.max(pct, 6)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1.5">
                  <span>{analyticsData.dailyActive[0]?.date.slice(5)}</span>
                  <span className="text-primary font-medium">hoje</span>
                  <span>{analyticsData.dailyActive[analyticsData.dailyActive.length - 1]?.date.slice(5)}</span>
                </div>
              </div>
            );
          })()}

          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">Funcionalidades mais usadas</p>
            {!analyticsData || analyticsData.eventCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Ainda sem dados suficientes</p>
            ) : (
              <div className="space-y-2">
                {analyticsData.eventCounts.map((item, i) => {
                  const max = analyticsData.eventCounts[0]?.count || 1;
                  const pct = (item.count / max) * 100;
                  const label = item.event.replace("page:", "📱 ").replace("journal:", "📝 ").replace("journey:", "🗺️ ").replace("card:", "🃏 ").replace("mood:", "😊 ");
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground capitalize">{label}</span>
                        <span className="text-xs font-semibold text-foreground">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {analyticsData?.dailyActive.reduce((sum, d) => sum + d.count, 0) || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">sessões únicas</p>
              <p className="text-[9px] text-muted-foreground">{isCustomRange ? `${appliedStart.slice(5)} → ${appliedEnd.slice(5)}` : analyticsDays === 1 ? "hoje" : `últimos ${analyticsDays}d`}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {analyticsData?.eventCounts.reduce((sum, e) => sum + e.count, 0) || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">ações totais</p>
              <p className="text-[9px] text-muted-foreground">{isCustomRange ? `${appliedStart.slice(5)} → ${appliedEnd.slice(5)}` : analyticsDays === 1 ? "hoje" : `últimos ${analyticsDays}d`}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">Utilizadores mais ativos</p>
            {topUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Ainda sem dados suficientes</p>
            ) : (
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div key={u.userId} className="flex items-center gap-2.5" data-testid={`top-user-${i}`}>
                    <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0">{u.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Perfil do Público</h3>
              {demographics && (
                <span className="text-[10px] text-muted-foreground">
                  {demographics.withAge}/{demographics.total} responderam
                </span>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Distribuição de idades</p>
              {!demographics || demographics.withAge === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Ainda sem dados</p>
              ) : (
                <div className="space-y-1.5">
                  {demographics.ageRanges.map((item) => {
                    const max = Math.max(...demographics.ageRanges.map(r => r.count));
                    const pct = max > 0 ? (item.count / max) * 100 : 0;
                    return (
                      <div key={item.range} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-10 shrink-0">{item.range}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/70 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-foreground w-5 text-right">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Principais interesses</p>
              {!demographics || demographics.topInterests.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Ainda sem dados</p>
              ) : (
                <div className="space-y-2">
                  {demographics.topInterests.slice(0, 6).map((item) => {
                    const max = demographics.topInterests[0]?.count || 1;
                    const pct = (item.count / max) * 100;
                    const emojis: Record<string, string> = {
                      "autoconhecimento": "🧠", "saude-mental": "💙", "relacoes": "❤️",
                      "carreira": "💼", "proposito": "✨", "criatividade": "🎨",
                      "familia": "👨‍👩‍👦", "amizades": "🤝", "financas": "💰", "espiritualidade": "🌟"
                    };
                    return (
                      <div key={item.interest} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground capitalize flex items-center gap-1">
                            <span>{emojis[item.interest] || "•"}</span>
                            {item.interest.replace(/-/g, " ")}
                          </span>
                          <span className="text-xs font-semibold text-foreground">{item.count}</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "coupons" && <CouponsPanel />}

      {activeTab === "livro" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Capítulos do Livro</h2>
            <button
              onClick={() => { setBookEditId(null); setBookForm({ order: (adminBookChapters.length || 0) + 1, title: "", tag: "", excerpt: "", content: "", isPreview: false }); setBookFormOpen(true); }}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1 font-medium"
              data-testid="btn-new-chapter"
            >
              <Plus size={12} />
              Novo Capítulo
            </button>
          </div>

          {bookFormOpen && (
            <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs font-semibold text-foreground">{bookEditId ? "Editar Capítulo" : "Novo Capítulo"}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ordem</label>
                  <input type="number" value={bookForm.order} onChange={e => setBookForm(f => ({ ...f, order: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" data-testid="input-chapter-order" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tag</label>
                  <input type="text" value={bookForm.tag} onChange={e => setBookForm(f => ({ ...f, tag: e.target.value }))} placeholder="ex: Essencial" className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" data-testid="input-chapter-tag" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Título</label>
                <input type="text" value={bookForm.title} onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))} placeholder="A Solidão" className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" data-testid="input-chapter-title" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Excerto (citação de abertura)</label>
                <input type="text" value={bookForm.excerpt} onChange={e => setBookForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Frase de destaque..." className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" data-testid="input-chapter-excerpt" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Conteúdo completo</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{bookForm.content.length} car. · {processContentEditor(bookForm.content).length} parág.</span>
                    <div className="flex rounded-md overflow-hidden border border-border text-[10px] font-medium">
                      <button
                        type="button"
                        onClick={() => setBookPreview(false)}
                        className={`px-2 py-1 transition-colors ${!bookPreview ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookPreview(true)}
                        className={`px-2 py-1 transition-colors ${bookPreview ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                      >
                        Pré-visualizar
                      </button>
                    </div>
                  </div>
                </div>

                {!bookPreview && (
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Linha em branco entre textos (<code className="bg-muted px-1 rounded">Enter Enter</code>) = novo parágrafo. &nbsp;
                    Enter simples = continua no mesmo parágrafo.
                  </p>
                )}

                {bookPreview ? (
                  <div
                    className="w-full border border-border rounded-lg bg-[#fdf8f2] dark:bg-[#1a1510] overflow-y-auto"
                    style={{ minHeight: 400, maxHeight: 600, padding: "24px 20px" }}
                  >
                    {bookForm.title && (
                      <div className="mb-5 pb-4 border-b border-border/40">
                        {bookForm.tag && (
                          <p className="text-[9px] uppercase tracking-[0.28em] font-bold mb-2 text-amber-700 dark:text-amber-400">{bookForm.tag}</p>
                        )}
                        <h2 className="font-serif font-bold text-[18px] text-stone-800 dark:text-stone-100 leading-snug uppercase tracking-wide">
                          {bookForm.title}
                        </h2>
                        {bookForm.excerpt && (
                          <p className="font-serif text-[13px] italic text-stone-500 dark:text-stone-400 mt-2 leading-relaxed border-l-2 border-amber-600/40 pl-3">
                            {bookForm.excerpt}
                          </p>
                        )}
                      </div>
                    )}
                    {processContentEditor(bookForm.content).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-8">Nenhum conteúdo para exibir.</p>
                    ) : (
                      processContentEditor(bookForm.content).map((para, i, arr) => (
                        <p
                          key={i}
                          className="font-serif text-stone-800 dark:text-stone-100"
                          style={{
                            fontSize: "16px",
                            lineHeight: "1.72",
                            textAlign: "justify",
                            hyphens: "auto",
                            marginBottom: i < arr.length - 1 ? "0.85em" : 0,
                            textIndent: i === 0 ? "0" : "1.6em",
                          }}
                        >
                          {para}
                        </p>
                      ))
                    )}
                  </div>
                ) : (
                  <textarea
                    value={bookForm.content}
                    onChange={e => setBookForm(f => ({ ...f, content: e.target.value }))}
                    rows={20}
                    placeholder="Colar o texto completo do capítulo aqui..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-y font-mono"
                    style={{ minHeight: 400 }}
                    data-testid="input-chapter-content"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBookForm(f => ({ ...f, isPreview: !f.isPreview }))}
                  className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${bookForm.isPreview ? "bg-primary" : "bg-muted-foreground/30"}`}
                  data-testid="toggle-chapter-preview"
                >
                  <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${bookForm.isPreview ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                <span className="text-xs text-muted-foreground">Pré-visualização gratuita</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!bookForm.title.trim()) return;
                    const url = bookEditId ? `/api/admin/book/chapters/${bookEditId}` : "/api/admin/book/chapters";
                    const method = bookEditId ? "PATCH" : "POST";
                    await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bookForm) });
                    setBookFormOpen(false);
                    setBookEditId(null);
                    refetchBookChapters();
                  }}
                  disabled={!bookForm.title.trim() || !bookForm.content.trim()}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
                  data-testid="btn-save-chapter"
                >
                  {bookEditId ? "Guardar" : "Criar"}
                </button>
                <button onClick={() => { setBookFormOpen(false); setBookEditId(null); }} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {adminBookChapters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Ainda sem capítulos. Adiciona o primeiro.</p>
            ) : (
              adminBookChapters.map(ch => (
                <div key={ch.id} className={`bg-card border rounded-xl overflow-hidden ${ch.content.length < 50 ? "border-red-500/40" : "border-border"}`} data-testid={`admin-chapter-${ch.id}`}>
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{ch.order}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${ch.content.length < 50 ? "text-red-500" : "text-foreground"}`}>{ch.title}</p>
                      {ch.tag && <p className="text-[10px] text-primary">{ch.tag}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/book/chapters/${ch.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPreview: !ch.isPreview }) });
                          refetchBookChapters();
                          queryClient.invalidateQueries({ queryKey: ["/api/book/chapters"] });
                        }}
                        className={`text-[9px] px-2 py-1 rounded-full font-semibold border transition-colors ${ch.isPreview ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "bg-muted text-muted-foreground border-border hover:bg-muted/70"}`}
                        data-testid={`btn-toggle-preview-${ch.id}`}
                        title={ch.isPreview ? "Clica para bloquear" : "Clica para libertar"}
                      >
                        {ch.isPreview ? "Grátis" : "Bloqueado"}
                      </button>
                      <span className="text-[10px] text-muted-foreground">{ch.content.length}c</span>
                      <button
                        onClick={() => { setBookEditId(ch.id); setBookForm({ order: ch.order, title: ch.title, tag: ch.tag || "", excerpt: ch.excerpt || "", content: processContent(ch.content).join("\n\n"), isPreview: ch.isPreview }); setBookPreview(false); setBookFormOpen(true); setBookExpandedId(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="p-1.5 rounded-lg bg-primary/5 hover:bg-primary/15 transition-colors"
                        data-testid={`btn-edit-chapter-${ch.id}`}
                        title="Editar"
                      >
                        <Pencil size={12} className="text-primary" />
                      </button>
                      <button
                        onClick={() => setBookExpandedId(bookExpandedId === ch.id ? null : ch.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        {bookExpandedId === ch.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                  {bookExpandedId === ch.id && (
                    <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                      {ch.excerpt && <p className="text-xs italic text-muted-foreground">"{ch.excerpt}"</p>}
                      {ch.content.length < 50 ? (
                        <p className="text-xs text-red-500 font-medium">⚠ Conteúdo vazio — clica no lápis para editar.</p>
                      ) : (
                        <p className="text-xs text-foreground/70 line-clamp-3 whitespace-pre-wrap">{ch.content}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={async () => {
                            if (!confirm("Apagar este capítulo?")) return;
                            await fetch(`/api/admin/book/chapters/${ch.id}`, { method: "DELETE", credentials: "include" });
                            refetchBookChapters();
                          }}
                          className="flex items-center gap-1 text-xs text-red-500 font-medium px-2 py-1 rounded-lg bg-red-500/10"
                          data-testid={`btn-delete-chapter-${ch.id}`}
                        >
                          <Trash2 size={11} />
                          Apagar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Compradores</h3>
            {bookPurchases.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Ainda sem compras registadas.</p>
            ) : (
              <div className="space-y-2">
                {bookPurchases.map((p, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3" data-testid={`book-purchase-${i}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">R${(p.amountCents / 100).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ScheduledNotif {
  id: number;
  title: string;
  body: string;
  url: string;
  intervalHours: number;
  isActive: boolean;
  lastSentAt: string | null;
  createdAt: string;
}

interface AutoNotif {
  id: number;
  type: string;
  title: string;
  body: string;
  url: string;
  isActive: boolean;
  triggerHours: number;
  totalSent?: number;
  lastSentAt?: string | null;
}

const AUTO_TYPE_LABELS: Record<string, { label: string; description: string; icon: string }> = {
  morning_prompt: { label: "Exercício do Dia", description: "De manhã, envia o próximo exercício da jornada ativa do utilizador", icon: "☀️" },
  evening_reflection: { label: "Reflexão da Noite", description: "À noite, convida a escrever no diário se ainda não escreveu hoje", icon: "🌙" },
  daily_reflection: { label: "Lembrete Diário", description: "Enviado quando o utilizador não escreveu no diário hoje", icon: "📝" },
  mood_checkin: { label: "Check-in de Humor", description: "Enviado quando o utilizador não fez check-in hoje", icon: "🌟" },
  streak_risk: { label: "Streak em Risco", description: "Enviado após 2+ dias sem escrever", icon: "🔥" },
  streak_celebration: { label: "Celebração de Streak", description: "Enviado a cada 7 reflexões no mês", icon: "🎉" },
  journey_nudge: { label: "Progresso na Jornada", description: "Enviado após 3+ dias sem avançar na jornada", icon: "🚀" },
  reengagement: { label: "Reengajamento", description: "Enviado após 5+ dias completamente inativo", icon: "💛" },
  daily_motivation: { label: "Reflexão do Dia", description: "Envia a frase motivacional do dia como notificação push", icon: "✨" },
};

const INTERVAL_OPTIONS = [
  { value: 6, label: "A cada 6 horas" },
  { value: 12, label: "A cada 12 horas" },
  { value: 24, label: "Diária (24h)" },
  { value: 48, label: "A cada 2 dias" },
  { value: 72, label: "A cada 3 dias" },
  { value: 168, label: "Semanal" },
];

function RecoveryNotificationCard() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const { data: abandoned, isLoading } = useQuery<{ total: number; users: { id: string; name: string; email: string; hasPush: boolean }[] }>({
    queryKey: ["/api/admin/abandoned-checkouts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/abandoned-checkouts", { credentials: "include" });
      if (!res.ok) return { total: 0, users: [] };
      return res.json();
    },
  });

  const withPush = abandoned?.users.filter(u => u.hasPush) ?? [];
  const withoutPush = abandoned?.users.filter(u => !u.hasPush) ?? [];

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/send-recovery-notifications", { method: "POST", credentials: "include" });
      const data = await res.json();
      setResult(`Enviado para ${data.sent} dispositivo(s). ${data.skipped > 0 ? `${data.skipped} sem push ativo.` : ""}`);
    } catch {
      setResult("Erro ao enviar.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard size={16} className="text-foreground" />
        <h2 className="text-sm font-medium text-foreground">Recuperação de Checkout</h2>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Utilizadores que iniciaram o registo do cartão mas não completaram — envia-lhes uma notificação push a lembrar.
        </p>
        {isLoading ? (
          <p className="text-[11px] text-muted-foreground">A verificar Stripe...</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-foreground font-semibold">{abandoned?.total ?? 0}</span>
              <span className="text-muted-foreground">com checkout abandonado</span>
              {withPush.length > 0 && (
                <>
                  <span className="text-green-500 font-semibold">{withPush.length}</span>
                  <span className="text-muted-foreground">com push ativo</span>
                </>
              )}
            </div>
            {abandoned && abandoned.users.length > 0 && (
              <div className="space-y-1">
                {abandoned.users.map(u => (
                  <div key={u.id} className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-muted/50">
                    <span className="text-foreground">{u.name}</span>
                    <span className={u.hasPush ? "text-green-500" : "text-muted-foreground"}>
                      {u.hasPush ? "push ativo" : "sem push"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {withoutPush.length > 0 && (
              <p className="text-[10px] text-muted-foreground">{withoutPush.length} utilizador(es) sem push — não receberão notificação.</p>
            )}
          </div>
        )}
        {result && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">{result}</p>
        )}
        <button
          onClick={handleSend}
          disabled={sending || isLoading || withPush.length === 0}
          className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all active:scale-[0.98]"
          data-testid="button-send-recovery"
        >
          {sending ? "Enviando..." : `Enviar Notificação${withPush.length > 0 ? ` (${withPush.length})` : ""}`}
        </button>
      </div>
    </div>
  );
}

function PushNotificationPanel() {
  const [pushTitle, setPushTitle] = useState("Casa dos 20");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/");
  const [pushSending, setPushSending] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("Casa dos 20");
  const [newBody, setNewBody] = useState("");
  const [newUrl, setNewUrl] = useState("/");
  const [newInterval, setNewInterval] = useState(24);
  const [showNewForm, setShowNewForm] = useState(false);

  interface PushCampaignData {
    id: number;
    title: string;
    body: string;
    url: string;
    sentCount: number;
    failedCount: number;
    clickedCount: number;
    createdAt: string;
  }

  const { data: campaigns = [], refetch: refetchCampaigns } = useQuery<PushCampaignData[]>({
    queryKey: ["/api/admin/push-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/admin/push-campaigns", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: scheduled = [], refetch: refetchScheduled } = useQuery<ScheduledNotif[]>({
    queryKey: ["/api/notifications/scheduled"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/scheduled", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleSendNow = async () => {
    if (!pushBody.trim()) return;
    setPushSending(true);
    setPushResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: pushTitle, body: pushBody, url: pushUrl }),
      });
      const data = await res.json();
      setPushResult(`Enviado para ${data.sent} dispositivo(s). ${data.failed > 0 ? `${data.failed} falhou.` : ""}`);
      setPushBody("");
      refetchCampaigns();
    } catch {
      setPushResult("Erro ao enviar.");
    } finally {
      setPushSending(false);
    }
  };

  const handleCreateScheduled = async () => {
    if (!newBody.trim()) return;
    try {
      await fetch("/api/notifications/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newTitle, body: newBody, url: newUrl, intervalHours: newInterval }),
      });
      setNewBody("");
      setNewTitle("Casa dos 20");
      setNewUrl("/");
      setNewInterval(24);
      setShowNewForm(false);
      refetchScheduled();
    } catch {}
  };

  const handleToggleActive = async (notif: ScheduledNotif) => {
    await fetch(`/api/notifications/scheduled/${notif.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !notif.isActive }),
    });
    refetchScheduled();
  };

  const handleDeleteScheduled = async (id: number) => {
    await fetch(`/api/notifications/scheduled/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    refetchScheduled();
  };

  return (
    <div className="space-y-6">
      <AutoNotificationsPanel />

      <RecoveryNotificationCard />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Send size={16} className="text-foreground" />
          <h2 className="text-sm font-medium text-foreground">Enviar Agora</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Título</label>
            <input
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              placeholder="Casa dos 20"
              data-testid="input-push-title"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Mensagem</label>
            <textarea
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none min-h-16"
              placeholder="Hora de fazer seu check-in!"
              data-testid="input-push-body"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Link</label>
            <input
              value={pushUrl}
              onChange={(e) => setPushUrl(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              placeholder="/"
              data-testid="input-push-url"
            />
          </div>
          {pushResult && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">{pushResult}</p>
          )}
          <button
            onClick={handleSendNow}
            disabled={pushSending || !pushBody.trim()}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50 transition-all active:scale-[0.98]"
            data-testid="button-send-push"
          >
            {pushSending ? "Enviando..." : "Enviar para Todos"}
          </button>
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-foreground" />
            <h2 className="text-sm font-medium text-foreground">Histórico de Envios</h2>
          </div>
          <div className="space-y-2">
            {campaigns.map((c) => {
              const clickRate = c.sentCount > 0 ? Math.round((c.clickedCount / c.sentCount) * 100) : 0;
              return (
                <div key={c.id} className="bg-card border border-border rounded-xl p-3 space-y-2" data-testid={`campaign-${c.id}`}>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.body}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Send size={10} className="text-green-500" />
                      <span className="text-foreground font-medium">{c.sentCount}</span>
                      <span className="text-muted-foreground">enviados</span>
                    </div>
                    {c.failedCount > 0 && (
                      <div className="flex items-center gap-1">
                        <XCircle size={10} className="text-red-500" />
                        <span className="text-foreground font-medium">{c.failedCount}</span>
                        <span className="text-muted-foreground">falharam</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-blue-500" />
                      <span className="text-foreground font-medium">{c.clickedCount}</span>
                      <span className="text-muted-foreground">cliques ({clickRate}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-foreground" />
            <h2 className="text-sm font-medium text-foreground">Notificações Recorrentes</h2>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1 font-medium"
            data-testid="button-new-scheduled"
          >
            <Plus size={12} />
            Nova
          </button>
        </div>

        {showNewForm && (
          <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Título</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                placeholder="Casa dos 20"
                data-testid="input-sched-title"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Mensagem</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none min-h-16"
                placeholder="Ex: Que tal refletir um pouco hoje?"
                data-testid="input-sched-body"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Link</label>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                placeholder="/"
                data-testid="input-sched-url"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Frequência</label>
              <select
                value={newInterval}
                onChange={(e) => setNewInterval(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                data-testid="select-sched-interval"
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateScheduled}
                disabled={!newBody.trim()}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50"
                data-testid="button-save-scheduled"
              >
                Salvar
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {scheduled.length === 0 && !showNewForm ? (
          <div className="py-8 text-center">
            <Bell size={28} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação recorrente configurada.</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Crie lembretes automáticos para seus usuários.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduled.map((notif) => {
              const intervalLabel = INTERVAL_OPTIONS.find((o) => o.value === notif.intervalHours)?.label || `A cada ${notif.intervalHours}h`;
              const lastSent = notif.lastSentAt ? new Date(notif.lastSentAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Nunca";

              return (
                <div
                  key={notif.id}
                  className={`border rounded-xl p-3 space-y-2 transition-colors ${
                    notif.isActive ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                  }`}
                  data-testid={`scheduled-notif-${notif.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(notif)}
                      className="shrink-0 mt-0.5"
                      data-testid={`button-toggle-notif-${notif.id}`}
                    >
                      {notif.isActive ? (
                        <ToggleRight size={24} className="text-primary" />
                      ) : (
                        <ToggleLeft size={24} className="text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground gap-2">
                    <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap min-w-0">
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock size={10} /> {intervalLabel}
                      </span>
                      <span className="shrink-0">Último: {lastSent}</span>
                      {notif.url !== "/" && (
                        <span className="text-primary truncate max-w-[80px]">{notif.url}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteScheduled(notif.id)}
                      className="text-red-400 hover:text-red-500 transition-colors shrink-0"
                      data-testid={`button-delete-notif-${notif.id}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AutoNotificationsPanel() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const { data: autoNotifs = [], refetch } = useQuery<AutoNotif[]>({
    queryKey: ["/api/notifications/auto"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/auto", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleToggle = async (notif: AutoNotif) => {
    await fetch(`/api/notifications/auto/${notif.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !notif.isActive }),
    });
    refetch();
  };

  const handleSaveEdit = async (notif: AutoNotif) => {
    await fetch(`/api/notifications/auto/${notif.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: editTitle, body: editBody }),
    });
    setEditingId(null);
    refetch();
  };

  const startEdit = (notif: AutoNotif) => {
    setEditingId(notif.id);
    setEditTitle(notif.title);
    setEditBody(notif.body);
  };

  if (autoNotifs.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-foreground" />
          <h2 className="text-sm font-medium text-foreground">Notificações Inteligentes</h2>
        </div>
        <div className="py-6 text-center bg-card border border-border rounded-xl">
          <Bell size={28} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">A carregar notificações automáticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-foreground" />
        <h2 className="text-sm font-medium text-foreground">Notificações Inteligentes</h2>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">
        Enviadas automaticamente com base no comportamento de cada utilizador.
      </p>

      <div className="space-y-2">
        {autoNotifs.map((notif) => {
          const meta = AUTO_TYPE_LABELS[notif.type] || { label: notif.type, description: "", icon: "🔔" };
          const isEditing = editingId === notif.id;
          const lastSent = notif.lastSentAt
            ? new Date(notif.lastSentAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
            : "Nunca";

          return (
            <div
              key={notif.id}
              className={`border rounded-xl p-3 space-y-2 transition-colors ${
                notif.isActive ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
              }`}
              data-testid={`auto-notif-${notif.type}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.icon}</span>
                    <p className="text-sm font-medium text-foreground">{meta.label}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(notif)}
                  className="shrink-0 mt-0.5"
                  data-testid={`button-toggle-auto-${notif.type}`}
                >
                  {notif.isActive ? (
                    <ToggleRight size={24} className="text-primary" />
                  ) : (
                    <ToggleLeft size={24} className="text-muted-foreground" />
                  )}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-2 pt-1">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs"
                    placeholder="Título"
                    data-testid={`input-auto-title-${notif.type}`}
                  />
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs resize-none min-h-12"
                    placeholder="Mensagem"
                    data-testid={`input-auto-body-${notif.type}`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(notif)}
                      className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold"
                      data-testid={`button-save-auto-${notif.type}`}
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => startEdit(notif)}
                  className="bg-muted/30 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <p className="text-[11px] font-medium text-muted-foreground">{notif.title}</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">{notif.body}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-muted-foreground gap-2">
                <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap min-w-0">
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock size={10} /> {notif.triggerHours}h mín.
                  </span>
                  <span className="shrink-0">Último: {lastSent}</span>
                </div>
                <span className="bg-muted/50 px-2 py-0.5 rounded-full font-medium shrink-0">
                  {notif.totalSent || 0} env.
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

function CouponsPanel() {
  const queryClient = useQueryClient();
  const [couponForm, setCouponForm] = useState({ code: "", type: "premium_days", value: "30", maxUses: "", expiresAt: "", note: "" });
  const [couponFormOpen, setCouponFormOpen] = useState(false);

  const { data: coupons = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/coupons"],
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/coupons", data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setCouponForm({ code: "", type: "premium_days", value: "30", maxUses: "", expiresAt: "", note: "" });
      setCouponFormOpen(false);
    },
  });

  const toggleCouponMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/coupons/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] }),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/coupons/${id}`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Ticket size={16} />
          Cupões de desconto
        </h3>
        <button
          onClick={() => setCouponFormOpen(!couponFormOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground text-background text-[13px] font-medium"
          data-testid="btn-create-coupon"
        >
          <Plus size={14} />
          Criar cupão
        </button>
      </div>

      {couponFormOpen && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h4 className="text-sm font-semibold">Novo cupão</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1 block">Código</label>
              <input
                value={couponForm.code}
                onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="ex: AMIGOS20"
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm font-mono"
                data-testid="input-coupon-code"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Tipo</label>
              <select
                value={couponForm.type}
                onChange={e => setCouponForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm"
                data-testid="select-coupon-type"
              >
                <option value="premium_days">Dias de premium</option>
                <option value="full_premium">Premium completo</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">
                {couponForm.type === "premium_days" ? "Nº de dias" : "Valor (ignorado)"}
              </label>
              <input
                type="number"
                value={couponForm.value}
                onChange={e => setCouponForm(f => ({ ...f, value: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm"
                data-testid="input-coupon-value"
                min="1"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Máx. utilizações (vazio = ilimitado)</label>
              <input
                type="number"
                value={couponForm.maxUses}
                onChange={e => setCouponForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Ilimitado"
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm"
                data-testid="input-coupon-max-uses"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Expira em (vazio = nunca)</label>
              <input
                type="date"
                value={couponForm.expiresAt}
                onChange={e => setCouponForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm"
                data-testid="input-coupon-expires"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1 block">Nota interna (opcional)</label>
              <input
                value={couponForm.note}
                onChange={e => setCouponForm(f => ({ ...f, note: e.target.value }))}
                placeholder="ex: Campanha de verão"
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm"
                data-testid="input-coupon-note"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCouponFormOpen(false)}
              className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={() => createCouponMutation.mutate({
                code: couponForm.code,
                type: couponForm.type,
                value: Number(couponForm.value),
                maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : null,
                expiresAt: couponForm.expiresAt || null,
                note: couponForm.note || null,
              })}
              disabled={!couponForm.code || !couponForm.value || createCouponMutation.isPending}
              className="flex-1 py-2 rounded-xl bg-foreground text-background text-sm font-medium disabled:opacity-50"
              data-testid="btn-save-coupon"
            >
              {createCouponMutation.isPending ? "A criar..." : "Criar cupão"}
            </button>
          </div>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="py-12 text-center">
          <Ticket size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum cupão criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c: any) => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-4 space-y-2" data-testid={`coupon-card-${c.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-foreground tracking-wider">{c.code}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(c.code)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copiar código"
                    >
                      <Copy size={12} />
                    </button>
                    {c.isActive ? (
                      <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium">Ativo</span>
                    ) : (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Inativo</span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {c.type === "premium_days" ? `${c.value} dias de premium` : "Premium completo"}
                    {" · "}
                    {c.usedCount} uso{c.usedCount !== 1 ? "s" : ""}
                    {c.maxUses !== null ? ` / ${c.maxUses}` : " (ilimitado)"}
                  </p>
                  {c.note && <p className="text-[11px] text-muted-foreground/70 italic">{c.note}</p>}
                  {c.expiresAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Expira: {new Date(c.expiresAt).toLocaleDateString("pt-PT")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleCouponMutation.mutate({ id: c.id, isActive: !c.isActive })}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`toggle-coupon-${c.id}`}
                  >
                    {c.isActive ? <ToggleRight size={24} className="text-primary" /> : <ToggleLeft size={24} />}
                  </button>
                  <button
                    onClick={() => { if (confirm("Apagar cupão?")) deleteCouponMutation.mutate(c.id); }}
                    className="text-red-400 hover:text-red-500 transition-colors"
                    data-testid={`delete-coupon-${c.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
