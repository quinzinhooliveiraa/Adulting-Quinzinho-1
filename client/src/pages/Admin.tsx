import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ChevronLeft, Users, Crown, Shield, UserPlus, Ban, Check,
  BarChart3, Clock, Star, XCircle, Search, Send, Trash2,
  MessageSquare, CheckCircle2, AlertCircle, ChevronDown
} from "lucide-react";
import { useLocation } from "wouter";

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
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  trialUsers: number;
  grantedUsers: number;
  expiredUsers: number;
  blockedUsers: number;
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

function UserCard({ user, onUpdate, onDelete }: { user: AdminUser; onUpdate: (id: string, data: any) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const premiumEnd = user.premiumUntil ? new Date(user.premiumUntil) : null;
  const createdAt = new Date(user.createdAt);
  const isMainAdmin = user.email === "quinzinhooliveiraa@gmail.com";

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
        data-testid={`user-card-${user.id}`}
      >
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground/60 shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <StatusBadge user={user} />
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <ChevronLeft size={14} className={`text-muted-foreground transition-transform ${expanded ? "-rotate-90" : "rotate-180"}`} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted-foreground">Cadastro:</span>
              <p className="text-foreground">{createdAt.toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Trial até:</span>
              <p className="text-foreground">{trialEnd ? trialEnd.toLocaleDateString("pt-BR") : "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Premium até:</span>
              <p className="text-foreground">{premiumEnd ? premiumEnd.toLocaleDateString("pt-BR") : "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Convite:</span>
              <p className="text-foreground">{user.invitedBy || "—"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isMainAdmin && (
              <>
                {user.isPremium ? (
                  <button
                    onClick={() => onUpdate(user.id, { isPremium: false, premiumUntil: null })}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    data-testid={`button-revoke-premium-${user.id}`}
                  >
                    <XCircle size={12} /> Revogar Premium
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdate(user.id, { isPremium: true })}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20 transition-colors flex items-center gap-1"
                    data-testid={`button-grant-premium-${user.id}`}
                  >
                    <Star size={12} /> Liberar Premium
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

                {user.role !== "admin" ? (
                  <button
                    onClick={() => onUpdate(user.id, { role: "admin" })}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                    data-testid={`button-promote-admin-${user.id}`}
                  >
                    <Shield size={12} /> Tornar Admin
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdate(user.id, { role: "user" })}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    data-testid={`button-demote-admin-${user.id}`}
                  >
                    <Shield size={12} /> Remover Admin
                  </button>
                )}

                {confirmDelete ? (
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => { onDelete(user.id); setConfirmDelete(false); }}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1"
                      data-testid={`button-confirm-delete-${user.id}`}
                    >
                      <Trash2 size={12} /> Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground"
                    >
                      Cancelar
                    </button>
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

export default function Admin() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "feedback">("users");

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: allUsers = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allFeedback = [] } = useQuery<FeedbackTicket[]>({
    queryKey: ["/api/admin/feedback"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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

  return (
    <div className="px-6 pt-12 pb-24 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation("/")} className="p-2 -ml-2 rounded-full hover:bg-muted" data-testid="button-back-admin">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-serif text-foreground">Painel Admin</h1>
          <p className="text-xs text-muted-foreground">Gerencie usuários, feedbacks e acessos</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "bg-foreground text-background"
              : "bg-muted/50 text-muted-foreground border border-border hover:text-foreground"
          }`}
          data-testid="tab-users"
        >
          <Users size={16} />
          Usuários
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
            activeTab === "feedback"
              ? "bg-foreground text-background"
              : "bg-muted/50 text-muted-foreground border border-border hover:text-foreground"
          }`}
          data-testid="tab-feedback"
        >
          <MessageSquare size={16} />
          Chamados
          {openFeedbackCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {openFeedbackCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "users" && (
        <>
          {stats && (
            <div className="grid grid-cols-3 gap-2">
              <StatCard icon={Users} label="Total" value={stats.totalUsers} color="text-foreground" />
              <StatCard icon={Star} label="Premium" value={stats.premiumUsers} color="text-yellow-500" />
              <StatCard icon={Clock} label="Trial" value={stats.trialUsers} color="text-blue-500" />
              <StatCard icon={Check} label="Liberados" value={stats.grantedUsers} color="text-green-500" />
              <StatCard icon={XCircle} label="Expirados" value={stats.expiredUsers} color="text-muted-foreground" />
              <StatCard icon={Ban} label="Bloqueados" value={stats.blockedUsers} color="text-red-500" />
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

            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
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
                  className={`text-[11px] px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
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
              <UserCard key={user.id} user={user} onUpdate={handleUpdate} onDelete={handleDelete} />
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
    </div>
  );
}
