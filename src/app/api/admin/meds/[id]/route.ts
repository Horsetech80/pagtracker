/**
 * API Routes para MED individual
 * PagTracker v4.0 - Nível Produção
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/api/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateMEDSchema = z.object({
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  clientName: z.string().optional(),
  clientDocument: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'blocked', 'pending_activation']).optional(),
  connectionType: z.enum(['wifi', '4g', 'ethernet', 'bluetooth']).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  signalStrength: z.number().min(0).max(100).optional(),
  firmwareVersion: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationCoordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  supportedMethods: z.array(z.enum(['credit', 'debit', 'pix', 'voucher', 'contactless'])).optional(),
  fees: z.object({
    credit: z.number().min(0),
    debit: z.number().min(0),
    pix: z.number().min(0)
  }).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  maintenanceScheduled: z.string().optional(),
  notes: z.string().optional()
});

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/admin/meds/[id] - Buscar MED específico
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  return withAdminAuth(async () => {
    try {
      const { id } = params;

      const supabase = createServiceClient();

      // Buscar dados do MED com estatísticas
      const { data: med, error } = await supabase
        .from('meds')
        .select(`
          *,
          meds_statistics(
            date,
            daily_transactions,
            daily_volume,
            transactions_credit,
            transactions_debit,
            transactions_pix,
            volume_credit,
            volume_debit,
            volume_pix,
            average_ticket
          ),
          meds_events(
            id,
            event_type,
            title,
            description,
            severity,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'MED não encontrado' },
            { status: 404 }
          );
        }
        console.error('Erro ao buscar MED:', error);
        return NextResponse.json(
          { error: 'Erro ao buscar MED' },
          { status: 500 }
        );
      }

      // Calcular estatísticas agregadas
      const statistics = med.meds_statistics || [];
      const totalTransactions = statistics.reduce((sum: number, stat: any) => sum + (stat.daily_transactions || 0), 0);
      const totalVolume = statistics.reduce((sum: number, stat: any) => sum + parseFloat(stat.daily_volume || 0), 0);

      // Estatísticas dos últimos 30 dias
      const last30Days = statistics
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);

      const response = {
        ...med,
        aggregatedStats: {
          totalTransactions,
          totalVolume,
          averageTicket: totalTransactions > 0 ? totalVolume / totalTransactions : 0,
          last30Days
        }
      };

      return NextResponse.json(response);

    } catch (error) {
      console.error('Erro na API de MED:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PUT /api/admin/meds/[id] - Atualizar MED
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withAdminAuth(async (req: NextRequest, adminInfo) => {
    try {
      const { id } = params;
      const body = await req.json();
      const validatedData = UpdateMEDSchema.parse(body);

      const supabase = createServiceClient();

      // Verificar se o MED existe
      const { data: existingMED, error: fetchError } = await supabase
        .from('meds')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'MED não encontrado' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: 'Erro ao buscar MED' },
          { status: 500 }
        );
      }

      // Preparar dados para atualização
      const updateData: any = {
        updated_by: adminInfo.adminId
      };

      // Mapear campos validados
      if (validatedData.model) updateData.model = validatedData.model;
      if (validatedData.manufacturer) updateData.manufacturer = validatedData.manufacturer;
      if (validatedData.clientName) updateData.client_name = validatedData.clientName;
      if (validatedData.clientDocument) updateData.client_document = validatedData.clientDocument;
      if (validatedData.status) updateData.status = validatedData.status;
      if (validatedData.connectionType) updateData.connection_type = validatedData.connectionType;
      if (validatedData.batteryLevel !== undefined) updateData.battery_level = validatedData.batteryLevel;
      if (validatedData.signalStrength !== undefined) updateData.signal_strength = validatedData.signalStrength;
      if (validatedData.firmwareVersion) updateData.firmware_version = validatedData.firmwareVersion;
      if (validatedData.locationAddress) updateData.location_address = validatedData.locationAddress;
      if (validatedData.locationCity) updateData.location_city = validatedData.locationCity;
      if (validatedData.locationState) updateData.location_state = validatedData.locationState;
      if (validatedData.locationCoordinates) updateData.location_coordinates = validatedData.locationCoordinates;
      if (validatedData.supportedMethods) updateData.supported_methods = validatedData.supportedMethods;
      if (validatedData.fees) updateData.fees = validatedData.fees;
      if (validatedData.riskLevel) updateData.risk_level = validatedData.riskLevel;
      if (validatedData.maintenanceScheduled) updateData.maintenance_scheduled = validatedData.maintenanceScheduled;
      if (validatedData.notes) updateData.notes = validatedData.notes;

      // Atualizar última atividade se houver mudança de status
      if (validatedData.status && validatedData.status !== existingMED.status) {
        updateData.last_activity = new Date().toISOString();
      }

      // Atualizar MED
      const { data: updatedMED, error: updateError } = await supabase
        .from('meds')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar MED:', updateError);
        return NextResponse.json(
          { error: 'Erro ao atualizar MED' },
          { status: 500 }
        );
      }

      // Criar evento de alteração
      const changes = Object.keys(updateData).filter(key => key !== 'updated_by');
      if (changes.length > 0) {
        await supabase
          .from('meds_events')
          .insert({
            med_id: id,
            event_type: 'config_change',
            title: 'Configuração alterada',
            description: `Campos alterados: ${changes.join(', ')}`,
            severity: 'info',
            technical_data: {
              changes: changes,
              oldValues: Object.fromEntries(changes.map(key => [key, existingMED[key]])),
              newValues: Object.fromEntries(changes.map(key => [key, updateData[key]]))
            },
            created_by: adminInfo.adminId
          });
      }

      return NextResponse.json(updatedMED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Erro ao atualizar MED:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/admin/meds/[id] - Remover MED
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withAdminAuth(async (req: NextRequest, adminInfo) => {
    try {
      const { id } = params;

      const supabase = createServiceClient();

      // Verificar se o MED existe
      const { data: existingMED, error: fetchError } = await supabase
        .from('meds')
        .select('serial_number')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'MED não encontrado' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: 'Erro ao buscar MED' },
          { status: 500 }
        );
      }

      // Criar evento de desativação antes de remover
      await supabase
        .from('meds_events')
        .insert({
          med_id: id,
          event_type: 'deactivation',
          title: 'MED removido',
          description: `MED ${existingMED.serial_number} foi removido do sistema`,
          severity: 'info',
          created_by: adminInfo.adminId
        });

      // Remover MED (isso também remove estatísticas e eventos por CASCADE)
      const { error: deleteError } = await supabase
        .from('meds')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Erro ao remover MED:', deleteError);
        return NextResponse.json(
          { error: 'Erro ao remover MED' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'MED removido com sucesso' });

    } catch (error) {
      console.error('Erro ao remover MED:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  })(req);
}
