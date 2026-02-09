
import React, { useState } from 'react';
import { stackAuth } from '../services/stack-auth';
import { Users, Mail, UserPlus, Shield, MoreVertical, X } from 'lucide-react';
import { cn } from '../lib/utils';

const SettingsMembersPage: React.FC = () => {
  const currentSpace = stackAuth.useCurrentSpace();
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  if (!currentSpace) return null;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    stackAuth.inviteMember(email);
    setEmail('');
    setIsInviting(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão da Equipe</h1>
          <p className="text-slate-500 font-medium mt-1">Gerencie os membros e convites do espaço <span className="text-blue-600">"{currentSpace.name}"</span>.</p>
        </div>
        <button 
          onClick={() => setIsInviting(true)}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" /> Convidar Membro
        </button>
      </div>

      {isInviting && (
        <div className="mb-10 bg-white p-8 rounded-3xl border-2 border-blue-500 shadow-xl shadow-blue-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Enviar Convite</h3>
            <button onClick={() => setIsInviting(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={handleInvite} className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                required
                placeholder="email@empresa.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-all"
            >
              Convidar
            </button>
          </form>
          <p className="text-[11px] text-slate-400 mt-4 font-bold uppercase tracking-wider">O convidado receberá um e-mail com o link de ativação.</p>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Users className="w-4 h-4" /> Membros Ativos ({currentSpace.members.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-50">
          {currentSpace.members.map((member) => (
            <div key={member.userId} className="p-6 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-400">
                  {member.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{member.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                      member.role === 'owner' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {member.role}
                    </span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Ativo agora</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                  <Shield className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsMembersPage;
