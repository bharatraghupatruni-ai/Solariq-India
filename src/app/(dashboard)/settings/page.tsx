"use client";

import { useAuth } from "@/hooks/useAuth";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { Settings, User, Mail, Calendar, Key, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d97706]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const name = user.user_metadata?.full_name || "SolarIQ User";
  const email = user.email || "";
  const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "N/A";

  return (
    <div className="flex flex-col gap-8 max-w-2xl text-[#292524]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1c1917] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#d97706]" /> Account Settings
        </h1>
        <p className="text-stone-500 text-sm mt-1 font-medium">
          Manage your profile settings and session.
        </p>
      </div>

      {/* Profile Info */}
      <ClayCard className="p-6 border-stone-200/50">
        <h2 className="text-lg font-bold text-[#1c1917] mb-6 tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-[#d97706]" /> Profile Information
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Full Name
            </label>
            <p className="text-sm font-semibold text-[#1c1917] bg-stone-50/50 p-3.5 rounded-xl border border-stone-200/30">
              {name}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Email Address
            </label>
            <p className="text-sm font-semibold text-[#1c1917] bg-stone-50/50 p-3.5 rounded-xl border border-stone-200/30 flex items-center gap-2">
              <Mail className="w-4 h-4 text-stone-400" />
              {email}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Account ID
              </label>
              <p className="text-sm font-semibold text-[#1c1917] bg-stone-50/50 p-3.5 rounded-xl border border-stone-200/30 font-mono flex items-center gap-2">
                <Key className="w-4 h-4 text-stone-400" />
                {user.id.slice(0, 8)}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Joined
              </label>
              <p className="text-sm font-semibold text-[#1c1917] bg-stone-50/50 p-3.5 rounded-xl border border-stone-200/30 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                {joinedDate}
              </p>
            </div>
          </div>
        </div>
      </ClayCard>

      {/* Danger Zone */}
      <ClayCard className="p-6 border-red-500/20 bg-red-500/[0.01]">
        <h2 className="text-lg font-bold text-red-500 mb-2 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" /> Danger Zone
        </h2>
        <p className="text-xs text-stone-500 mb-6 leading-relaxed font-medium">
          Once you sign out or take actions here, your current session resets. For database changes or profile deletion, contact team support.
        </p>
        <div className="flex gap-4">
          <ClayButton variant="danger" size="sm" className="px-5 font-bold text-xs uppercase tracking-wider py-2.5" onClick={signOut}>
            Sign Out
          </ClayButton>
        </div>
      </ClayCard>
    </div>
  );
}
