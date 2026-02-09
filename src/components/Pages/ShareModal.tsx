'use client'


import React, { useState, useEffect } from 'react';
import { db } from '@/db';
import { stackAuth } from '@/lib/stack-auth';
import { X, Copy, Check, Clock, Shield, Trash2, Globe } from 'lucide-react';
// Fix: Added missing 'cn' import from utilities
import { generateToken, cn } from '@/lib/utils';
import { PageInviteToken } from '@/types';

interface ShareModalProps {
  pageId: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ pageId, onClose }) => {
  const user = stackAuth.useUser();
  const currentSpace = stackAuth.useCurrentSpace();
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [expiration, setExpiration] = useState<'1h' | '24h' | '7d'>('24h');
  const [tokens, setTokens] = useState<PageInviteToken[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadTokens = () => {
    setTokens(db.getPageTokens(pageId));
  };

  useEffect(() => {
    loadTokens();
  }, [pageId]);

  const generateLink = () => {
    if (!user || !currentSpace) return;
    
    const now = new Date();
    let expiresAt = new Date();
    if (expiration === '1h') expiresAt.setHours(now.getHours() + 1);
    if (expiration === '24h') expiresAt.setHours(now.getHours() + 24);
    if (expiration === '7d') expiresAt.setDate(now.getDate() + 7);

    db.createToken({
      tenantId: currentSpace.id,
      pageId,
      token: generateToken(),
      permission,
      expiresAt: expiresAt.toISOString(),
      createdByUserId: user.id
    });
    loadTokens();
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/share/page/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const revokeToken = (id: string) => {
    db.revokeToken(id);
    loadTokens();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Compartilhar Página</h2>
            <p className="text-xs text-slate-500">Crie links temporários de acesso para convidados.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Permissão</label>
                <select 
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as any)}
                  className="w-full text-sm bg-white border-blue-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="view">Visualizar</option>
                  <option value="edit">Editar</option>
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Expiração</label>
                <select 
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value as any)}
                  className="w-full text-sm bg-white border-blue-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="1h">1 hora</option>
                  <option value="24h">24 horas</option>
                  <option value="7d">7 dias</option>
                </select>
              </div>
            </div>
            <button 
              onClick={generateLink}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" /> Gerar Link de Acesso
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Links Ativos</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {tokens.filter(t => !t.revokedAt && new Date(t.expiresAt) > new Date()).map(token => (
                <div key={token.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                        token.permission === 'view' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {token.permission === 'view' ? 'Leitura' : 'Edição'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> expira {new Date(token.expiresAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono truncate">
                      ...{token.token.substring(20)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => copyToClipboard(token.token)}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                    >
                      {copiedToken === token.token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => revokeToken(token.id)}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {tokens.length === 0 && (
                <p className="text-center py-6 text-sm text-slate-400">Nenhum link ativo encontrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
