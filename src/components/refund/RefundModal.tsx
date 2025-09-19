'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefund: (amount?: number, reason?: string) => Promise<void>;
  chargeId: string;
  chargeAmount: number;
  formatCurrency: (amount: number) => string;
}

export default function RefundModal({ 
  isOpen, 
  onClose, 
  onRefund, 
  chargeId, 
  chargeAmount,
  formatCurrency
}: RefundModalProps) {
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [refundAmount, setRefundAmount] = useState<number | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, isError: boolean} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Se for reembolso total, não envie o valor, a API usará o valor total
      const amount = isFullRefund ? undefined : refundAmount;
      
      await onRefund(amount, reason);
      setMessage({
        text: "Reembolso processado com sucesso",
        isError: false
      });
      
      // Fechar o modal após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erro ao processar reembolso:', error);
      setMessage({
        text: error instanceof Error ? error.message : "Ocorreu um erro ao processar o reembolso",
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reembolsar cobrança</DialogTitle>
          <DialogDescription>
            Reembolso da cobrança #{chargeId.substring(0, 8)}
          </DialogDescription>
        </DialogHeader>
        
        {message && (
          <div className={`p-3 rounded-md mb-3 ${message.isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="full-refund"
                checked={isFullRefund}
                onChange={() => setIsFullRefund(true)}
                className="accent-primary"
                title="Reembolso total"
              />
              <Label htmlFor="full-refund">Reembolso total ({formatCurrency(chargeAmount)})</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="partial-refund"
                checked={!isFullRefund}
                onChange={() => setIsFullRefund(false)}
                className="accent-primary"
                title="Reembolso parcial"
              />
              <Label htmlFor="partial-refund">Reembolso parcial</Label>
            </div>
          </div>
          
          {!isFullRefund && (
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Valor a reembolsar</Label>
              <Input
                id="refund-amount"
                type="number"
                min={1}
                max={chargeAmount}
                value={refundAmount || ''}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                placeholder={`Valor máximo: ${formatCurrency(chargeAmount)}`}
                required={!isFullRefund}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Motivo do reembolso</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Insira o motivo do reembolso"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando
                </>
              ) : (
                'Processar Reembolso'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 