/**
 * API Routes para estatísticas de MEDs
 * PagTracker v4.0 - Nível Produção
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/api/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/meds/statistics - Estatísticas agregadas de MEDs
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // dias
    const medId = searchParams.get('medId'); // Estatísticas específicas de um MED

    const supabase = createServiceClient();

    // Data de início baseada no período
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    const startDateStr = startDate.toISOString().split('T')[0];

    let statisticsQuery = supabase
      .from('meds_statistics')
      .select(`
        *,
        meds(
          id,
          serial_number,
          model,
          manufacturer,
          client_name,
          status
        )
      `)
      .gte('date', startDateStr)
      .order('date', { ascending: true });

    // Filtrar por MED específico se solicitado
    if (medId) {
      statisticsQuery = statisticsQuery.eq('med_id', medId);
    }

    const { data: statistics, error } = await statisticsQuery;

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      );
    }

    // Processar dados para o frontend
    const processedData = {
      // Dados agrupados por data
      dailyData: statistics.reduce((acc, stat) => {
        const date = stat.date;
        if (!acc[date]) {
          acc[date] = {
            date,
            totalTransactions: 0,
            totalVolume: 0,
            transactionsCredit: 0,
            transactionsDebit: 0,
            transactionsPix: 0,
            volumeCredit: 0,
            volumeDebit: 0,
            volumePix: 0,
            averageTicket: 0,
            medCount: 0
          };
        }

        acc[date].totalTransactions += stat.daily_transactions || 0;
        acc[date].totalVolume += parseFloat(stat.daily_volume || 0);
        acc[date].transactionsCredit += stat.transactions_credit || 0;
        acc[date].transactionsDebit += stat.transactions_debit || 0;
        acc[date].transactionsPix += stat.transactions_pix || 0;
        acc[date].volumeCredit += parseFloat(stat.volume_credit || 0);
        acc[date].volumeDebit += parseFloat(stat.volume_debit || 0);
        acc[date].volumePix += parseFloat(stat.volume_pix || 0);
        acc[date].medCount += 1;

        return acc;
      }, {} as Record<string, any>),

      // Dados agrupados por MED (se não filtrado por MED específico)
      medData: medId ? [] : statistics.reduce((acc, stat) => {
        const medKey = stat.med_id;
        if (!acc[medKey]) {
          acc[medKey] = {
            medId: stat.med_id,
            medInfo: stat.meds,
            totalTransactions: 0,
            totalVolume: 0,
            averageTicket: 0,
            transactionsCredit: 0,
            transactionsDebit: 0,
            transactionsPix: 0,
            volumeCredit: 0,
            volumeDebit: 0,
            volumePix: 0,
            daysActive: 0
          };
        }

        acc[medKey].totalTransactions += stat.daily_transactions || 0;
        acc[medKey].totalVolume += parseFloat(stat.daily_volume || 0);
        acc[medKey].transactionsCredit += stat.transactions_credit || 0;
        acc[medKey].transactionsDebit += stat.transactions_debit || 0;
        acc[medKey].transactionsPix += stat.transactions_pix || 0;
        acc[medKey].volumeCredit += parseFloat(stat.volume_credit || 0);
        acc[medKey].volumeDebit += parseFloat(stat.volume_debit || 0);
        acc[medKey].volumePix += parseFloat(stat.volume_pix || 0);
        acc[medKey].daysActive += 1;

        return acc;
      }, {} as Record<string, any>),

      // Resumo geral
      summary: statistics.reduce((summary, stat) => {
        summary.totalTransactions += stat.daily_transactions || 0;
        summary.totalVolume += parseFloat(stat.daily_volume || 0);
        summary.transactionsCredit += stat.transactions_credit || 0;
        summary.transactionsDebit += stat.transactions_debit || 0;
        summary.transactionsPix += stat.transactions_pix || 0;
        summary.volumeCredit += parseFloat(stat.volume_credit || 0);
        summary.volumeDebit += parseFloat(stat.volume_debit || 0);
        summary.volumePix += parseFloat(stat.volume_pix || 0);

        return summary;
      }, {
        totalTransactions: 0,
        totalVolume: 0,
        transactionsCredit: 0,
        transactionsDebit: 0,
        transactionsPix: 0,
        volumeCredit: 0,
        volumeDebit: 0,
        volumePix: 0,
        averageTicket: 0,
        period: parseInt(period)
      })
    };

    // Calcular ticket médio
    if (processedData.summary.totalTransactions > 0) {
      processedData.summary.averageTicket = processedData.summary.totalVolume / processedData.summary.totalTransactions;
    }

    // Calcular tickets médios por MED
    Object.values(processedData.medData).forEach((med: any) => {
      if (med.totalTransactions > 0) {
        med.averageTicket = med.totalVolume / med.totalTransactions;
      }
    });

    // Converter objetos em arrays para o frontend
    const response = {
      ...processedData,
      dailyData: Object.values(processedData.dailyData),
      medData: Object.values(processedData.medData)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro na API de estatísticas de MEDs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/meds/statistics - Criar/atualizar estatísticas
 * (Normalmente usado por jobs automáticos ou integração com MEDs)
 */
export const POST = withAdminAuth(async (req: NextRequest, adminInfo) => {
  try {
    const body = await req.json();
    const { medId, date, statistics } = body;

    if (!medId || !date || !statistics) {
      return NextResponse.json(
        { error: 'medId, date e statistics são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verificar se o MED existe
    const { data: med, error: medError } = await supabase
      .from('meds')
      .select('id')
      .eq('id', medId)
      .single();

    if (medError || !med) {
      return NextResponse.json(
        { error: 'MED não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados de estatísticas
    const statsData = {
      med_id: medId,
      date,
      daily_transactions: statistics.dailyTransactions || 0,
      daily_volume: statistics.dailyVolume || 0,
      transactions_credit: statistics.transactionsCredit || 0,
      transactions_debit: statistics.transactionsDebit || 0,
      transactions_pix: statistics.transactionsPix || 0,
      volume_credit: statistics.volumeCredit || 0,
      volume_debit: statistics.volumeDebit || 0,
      volume_pix: statistics.volumePix || 0,
      average_ticket: statistics.averageTicket || 0
    };

    // Upsert (inserir ou atualizar)
    const { data: result, error: upsertError } = await supabase
      .from('meds_statistics')
      .upsert(statsData, {
        onConflict: 'med_id,date'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Erro ao salvar estatísticas:', upsertError);
      return NextResponse.json(
        { error: 'Erro ao salvar estatísticas' },
        { status: 500 }
      );
    }

    // Criar evento de atualização de estatísticas
    await supabase
      .from('meds_events')
      .insert({
        med_id: medId,
        event_type: 'info',
        title: 'Estatísticas atualizadas',
        description: `Estatísticas do dia ${date} foram atualizadas`,
        severity: 'info',
        technical_data: statsData,
        created_by: adminInfo.adminId
      });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
