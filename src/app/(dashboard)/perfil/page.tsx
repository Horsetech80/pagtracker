'use client';

import { PerfilSettings } from '@/components/settings/PerfilSettings';

export default function PerfilPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Perfil do Usuário</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>
        
        <PerfilSettings />
      </div>
    </div>
  );
}