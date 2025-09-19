/**
 * API Routes para gerenciamento de MEDs (Máquinas de Cartão)
 * PagTracker v4.0 - Nível Produção
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/api/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schemas de validação
const CreateMEDSchema = z.object({
  serialNumber: z.string().min(1, 'Número de série é obrigatório'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  manufacturer: z.string().min(1, 'Fabricante é obrigatório'),
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  clientDocument: z.string().min(11, 'Documento do cliente é obrigatório'),
  connectionType: z.enum(['wifi', '4g', 'ethernet', 'bluetooth']).default('wifi'),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  supportedMethods: z.array(z.enum(['credit', 'debit', 'pix', 'voucher', 'contactless'])).default(['credit', 'debit', 'pix']),
  fees: z.object({
    credit: z.number().min(0),
    debit: z.number().min(0),
    pix: z.number().min(0)
  }).default({ credit: 0, debit: 0, pix: 0 }),
  riskLevel: z.enum(['low', 'medium', 'high']).default('low'),
  notes: z.string().optional()
});

const UpdateMEDSchema = CreateMEDSchema.partial();

/**
 * GET /api/admin/meds - Listar todos os MEDs
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const manufacturer = searchParams.get('manufacturer');
    const search = searchParams.get('search');

    const supabase = createServiceClient();
    
    let query = supabase
      .from('meds')
      .select(`
        *,
        meds_statistics!inner(
          daily_transactions,
          daily_volume,
          average_ticket
        )
      `, { count: 'exact' });

    // Filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (manufacturer && manufacturer !== 'all') {
      query = query.eq('manufacturer', manufacturer);
    }

    if (search) {
      query = query.or(`
        client_name.ilike.%${search}%,
        serial_number.ilike.%${search}%,
        model.ilike.%${search}%
      `);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('created_at', { ascending: false });

    const { data: meds, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar MEDs:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar MEDs' },
        { status: 500 }
      );
    }

    // Calcular estatísticas resumidas
    const { data: summary } = await supabase
      .from('meds')
      .select('status')
      .then(async ({ data: allMeds }) => {
        const totalDevices = allMeds?.length || 0;
        const activeDevices = allMeds?.filter(m => m.status === 'active').length || 0;
        const inactiveDevices = allMeds?.filter(m => m.status === 'inactive').length || 0;
        const maintenanceDevices = allMeds?.filter(m => m.status === 'maintenance').length || 0;
        const blockedDevices = allMeds?.filter(m => m.status === 'blocked').length || 0;
        const pendingActivation = allMeds?.filter(m => m.status === 'pending_activation').length || 0;

        // Calcular estatísticas de hoje
        const today = new Date().toISOString().split('T')[0];
        const { data: todayStats } = await supabase
          .from('meds_statistics')
          .select('daily_volume, daily_transactions')
          .eq('date', today);

        const totalRevenue = todayStats?.reduce((sum, stat) => sum + parseFloat(stat.daily_volume || 0), 0) || 0;
        const totalTransactions = todayStats?.reduce((sum, stat) => sum + (stat.daily_transactions || 0), 0) || 0;

        return {
          data: {
            totalDevices,
            activeDevices,
            inactiveDevices,
            maintenanceDevices,
            blockedDevices,
            pendingActivation,
            averageBattery: 0, // TODO: Calcular média real
            totalRevenue,
            monthlyGrowth: 0 // TODO: Calcular crescimento real
          }
        };
      });

    return NextResponse.json({
      meds,
      summary: summary || {},
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erro na API de MEDs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/meds - Criar novo MED
 */
export const POST = withAdminAuth(async (req: NextRequest, adminInfo) => {
  try {
    const body = await req.json();
    const validatedData = CreateMEDSchema.parse(body);

    const supabase = createServiceClient();

    // Verificar se o número de série já existe
    const { data: existingMED } = await supabase
      .from('meds')
      .select('id')
      .eq('serial_number', validatedData.serialNumber)
      .single();

    if (existingMED) {
      return NextResponse.json(
        { error: 'Número de série já existe' },
        { status: 400 }
      );
    }

    // Buscar informações do tenant e usuário
    const tenantId = req.headers.get('x-tenant-id') || 'default-tenant';
    const userId = adminInfo.adminId;

    const medData = {
      serial_number: validatedData.serialNumber,
      model: validatedData.model,
      manufacturer: validatedData.manufacturer,
      tenant_id: tenantId,
      user_id: userId,
      client_name: validatedData.clientName,
      client_document: validatedData.clientDocument,
      connection_type: validatedData.connectionType,
      location_address: validatedData.locationAddress,
      location_city: validatedData.locationCity,
      location_state: validatedData.locationState,
      supported_methods: validatedData.supportedMethods,
      fees: validatedData.fees,
      risk_level: validatedData.riskLevel,
      notes: validatedData.notes,
      firmware_version: '1.0.0', // Versão inicial
      installation_date: new Date().toISOString(),
      created_by: userId
    };

    const { data: newMED, error } = await supabase
      .from('meds')
      .insert(medData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar MED:', error);
      return NextResponse.json(
        { error: 'Erro ao criar MED' },
        { status: 500 }
      );
    }

    // Criar evento de ativação
    await supabase
      .from('meds_events')
      .insert({
        med_id: newMED.id,
        event_type: 'activation',
        title: 'MED cadastrado',
        description: `MED ${validatedData.serialNumber} foi cadastrado no sistema`,
        severity: 'info',
        created_by: userId
      });

    return NextResponse.json(newMED, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar MED:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
