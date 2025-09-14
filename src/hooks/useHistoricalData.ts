import { useState, useEffect } from 'react';
import mockMongoService from '@/services/mockMongoService';
import productionRecordService from '@/services/productionRecordService';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';

interface HistoricalAnalytics {
  avgOee: number;
  avgAvailability: number;
  avgPerformance: number;
  avgQuality: number;
  totalProduction: number;
  totalTarget: number;
  totalDowntime: number;
  downtimeEvents: number;
  mtbf: number;
  trend: number;
  criticalAlerts: number;
  downtimeByCategory: Array<{
    category: string;
    totalHours: number;
    percentage: number;
  }>;
  oeeHistory: Array<{
    date: string;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  }>;
  improvementOpportunities: Array<{
    area: string;
    suggestion: string;
    potential: number;
  }>;
  monthlyProductivity: {
    currentMonth: number;
    previousMonth: number;
    percentageChange: number;
    trend: 'improvement' | 'decline' | 'stable';
  };
  performanceVariations: {
    hasSignificantVariations: boolean;
    maxVariation: number;
    variationDays: number;
    averageDailyProduction: number;
  };
  riskAnalysis: {
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
}

export function useHistoricalData(machineId?: string) {
  const [data, setData] = useState<HistoricalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentDate = new Date();
        const startOfCurrentMonth = startOfMonth(currentDate);
        const endOfCurrentMonth = endOfMonth(currentDate);
        
        // Also get previous month for comparison
        const startOfPreviousMonth = startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        const endOfPreviousMonth = endOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

        // Fetch OEE history from current month
        const oeeData = await mockMongoService.getOeeHistory(
          machineId || '',
          startOfCurrentMonth,
          endOfCurrentMonth
        );

        // Fetch downtime events from current month
        const downtimeData = await mockMongoService.getDowntimeEvents(machineId);
        
        // Filtrar por data no frontend (pode ser otimizado no mongoService depois)
        const filteredDowntimeData = downtimeData.filter((event: any) => {
          const eventDate = new Date(event.start_time);
          return eventDate >= startOfCurrentMonth && eventDate <= endOfCurrentMonth;
        });

        // Fetch production records from current month
        let allProductionData;
        const isApiAvailable = await productionRecordService.isApiAvailable();
        
        if (isApiAvailable) {
          console.log('✅ Usando API MongoDB real para dados históricos');
          const response = await productionRecordService.getProductionRecords({
            machine_id: machineId,
            start_date: startOfCurrentMonth.toISOString(),
            end_date: endOfCurrentMonth.toISOString(),
            limit: 1000
          });
          allProductionData = response.records;
        } else {
          console.log('ℹ️ Usando mockMongoService para dados históricos');
          allProductionData = await mockMongoService.getProductionRecords({
            machineId: machineId,
            startDate: startOfCurrentMonth.toISOString(),
            endDate: endOfCurrentMonth.toISOString(),
            limit: 1000
          });
        }
        
        // Filtrar por data no frontend (se necessário)
        const productionData = allProductionData.filter((record: any) => {
          const recordDate = new Date(record.start_time);
          return recordDate >= startOfCurrentMonth && recordDate <= endOfCurrentMonth;
        });

        // Fetch alerts from current month
        const allAlertsData = await mockMongoService.getAlerts(machineId);
        const alertsData = allAlertsData.filter((alert: any) => {
          const alertDate = new Date(alert.created_at);
          return alertDate >= startOfCurrentMonth && 
                 alertDate <= endOfCurrentMonth && 
                 alert.severity === 'critical';
        });

        // Fetch previous month production for comparison
        let previousMonthData;
        if (isApiAvailable) {
          const previousResponse = await productionRecordService.getProductionRecords({
            machine_id: machineId,
            start_date: startOfPreviousMonth.toISOString(),
            end_date: endOfPreviousMonth.toISOString(),
            limit: 1000
          });
          previousMonthData = previousResponse.records;
        } else {
          previousMonthData = allProductionData.filter((record: any) => {
            const recordDate = new Date(record.start_time);
            return recordDate >= startOfPreviousMonth && recordDate <= endOfPreviousMonth;
          });
        }

        // Calculate analytics
        const avgOee = oeeData?.reduce((sum, record) => sum + record.oee, 0) / (oeeData?.length || 1) || 0;
        const avgAvailability = oeeData?.reduce((sum, record) => sum + record.availability, 0) / (oeeData?.length || 1) || 0;
        const avgPerformance = oeeData?.reduce((sum, record) => sum + record.performance, 0) / (oeeData?.length || 1) || 0;
        const avgQuality = oeeData?.reduce((sum, record) => sum + record.quality, 0) / (oeeData?.length || 1) || 0;

        const totalProduction = productionData?.reduce((sum, record) => sum + (record.good_production || 0), 0) || 0;
        const totalPlannedTime = productionData?.reduce((sum, record) => sum + (record.planned_time || 0), 0) || 0;

        const totalDowntime = filteredDowntimeData?.reduce((sum: number, event: any) => sum + (event.minutes || 0), 0) || 0;
        const downtimeEvents = filteredDowntimeData?.length || 0;

        // Calculate MTBF (Mean Time Between Failures)
        const mtbf = downtimeEvents > 0 ? (totalPlannedTime / downtimeEvents) / 60 : 0; // Convert to hours

        // Calculate trend (compare first half vs second half of period)
        const midPoint = Math.floor((oeeData?.length || 0) / 2);
        const firstHalfAvg = oeeData?.slice(0, midPoint).reduce((sum, record) => sum + record.oee, 0) / (midPoint || 1) || 0;
        const secondHalfAvg = oeeData?.slice(midPoint).reduce((sum, record) => sum + record.oee, 0) / ((oeeData?.length || 0) - midPoint || 1) || 0;
        const oeeChangeTrend = secondHalfAvg - firstHalfAvg;

        // Group downtime by category
        const downtimeByCategory = filteredDowntimeData?.reduce((acc: any[], event: any) => {
          const category = event.category || 'Outros';
          const existing = acc.find(item => item.category === category);
          if (existing) {
            existing.totalHours += (event.minutes || 0) / 60;
          } else {
            acc.push({ category, totalHours: (event.minutes || 0) / 60, percentage: 0 });
          }
          return acc;
        }, [] as Array<{ category: string; totalHours: number; percentage: number }>) || [];

        // Calculate percentages for downtime categories
        const totalDowntimeHours = totalDowntime / 60;
        downtimeByCategory.forEach(item => {
          item.percentage = totalDowntimeHours > 0 ? (item.totalHours / totalDowntimeHours) * 100 : 0;
        });

        // Calculate monthly productivity analysis
        const currentMonthProduction = totalProduction;
        const previousMonthProduction = previousMonthData?.reduce((sum, record) => sum + (record.good_production || 0), 0) || 0;
        
        let percentageChange = 0;
        if (previousMonthProduction > 0) {
          percentageChange = ((currentMonthProduction - previousMonthProduction) / previousMonthProduction) * 100;
        }

        let productivityTrend: 'improvement' | 'decline' | 'stable' = 'stable';
        if (Math.abs(percentageChange) >= 5) {
          productivityTrend = percentageChange > 0 ? 'improvement' : 'decline';
        }

        // Analyze performance variations throughout the month
        const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });
        const dailyProduction = daysInMonth.map(date => {
          const dayProduction = productionData?.filter((record: any) => {
            const recordDate = new Date(record.start_time);
            return format(recordDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          }).reduce((sum: number, record: any) => sum + (record.good_production || 0), 0) || 0;
          
          return { date: format(date, 'dd/MM'), production: dayProduction };
        });

        const productionValues = dailyProduction.map(d => d.production).filter(p => p > 0);
        const averageDailyProduction = productionValues.reduce((sum, val) => sum + val, 0) / (productionValues.length || 1);
        
        let maxVariation = 0;
        let variationDays = 0;
        
        if (productionValues.length > 1) {
          productionValues.forEach(production => {
            const variation = Math.abs((production - averageDailyProduction) / averageDailyProduction) * 100;
            if (variation > maxVariation) maxVariation = variation;
            if (variation > 20) variationDays++;
          });
        }

        // Risk analysis
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        const riskFactors: string[] = [];
        const recommendations: string[] = [];

        if (productivityTrend === 'decline') {
          riskLevel = 'medium';
          riskFactors.push('Tendência de queda na produtividade mensal');
          recommendations.push('Investigar causas da redução de performance');
        }

        if (maxVariation > 30) {
          riskLevel = riskLevel === 'medium' ? 'high' : 'medium';
          riskFactors.push('Variações significativas na produção diária');
          recommendations.push('Implementar controles de estabilidade na produção');
        }

        if (avgOee < 70) {
          riskLevel = 'high';
          riskFactors.push('OEE abaixo do padrão aceitável');
          recommendations.push('Revisar processos de manutenção e operação');
        }

        if (totalDowntime > 100) { // More than 100 hours of downtime in a month
          riskLevel = riskLevel === 'low' ? 'medium' : 'high';
          riskFactors.push('Alto tempo de parada mensal');
          recommendations.push('Otimizar programa de manutenção preventiva');
        }

        // Create daily history for chart (current month)
        const oeeHistory = dailyProduction.map(dayData => {
          const dayStr = dayData.date;
          const dayOeeData = oeeData?.filter((record: any) => {
            const recordDate = new Date(record.timestamp);
            return format(recordDate, 'dd/MM') === dayStr;
          }) || [];

          const dayAvgOee = dayOeeData.reduce((sum: number, record: any) => sum + record.oee, 0) / (dayOeeData.length || 1) || 0;
          const dayAvgAvailability = dayOeeData.reduce((sum: number, record: any) => sum + record.availability, 0) / (dayOeeData.length || 1) || 0;
          const dayAvgPerformance = dayOeeData.reduce((sum: number, record: any) => sum + record.performance, 0) / (dayOeeData.length || 1) || 0;
          const dayAvgQuality = dayOeeData.reduce((sum: number, record: any) => sum + record.quality, 0) / (dayOeeData.length || 1) || 0;

          return {
            date: dayStr,
            oee: Math.round(dayAvgOee),
            availability: Math.round(dayAvgAvailability),
            performance: Math.round(dayAvgPerformance),
            quality: Math.round(dayAvgQuality),
          };
        });

        // Generate improvement opportunities based on data
        const improvementOpportunities = [];
        if (avgAvailability < 85) {
          improvementOpportunities.push({
            area: 'Disponibilidade',
            suggestion: 'Implementar manutenção preditiva para reduzir paradas não planejadas',
            potential: (85 - avgAvailability) * 0.7
          });
        }
        if (avgPerformance < 90) {
          improvementOpportunities.push({
            area: 'Performance',
            suggestion: 'Otimizar velocidade de produção e reduzir micro-paradas',
            potential: (90 - avgPerformance) * 0.8
          });
        }
        if (avgQuality < 95) {
          improvementOpportunities.push({
            area: 'Qualidade',
            suggestion: 'Implementar controle de qualidade em tempo real',
            potential: (95 - avgQuality) * 0.9
          });
        }

        const analytics: HistoricalAnalytics = {
          avgOee,
          avgAvailability,
          avgPerformance,
          avgQuality,
          totalProduction,
          totalTarget: totalPlannedTime,
          totalDowntime: totalDowntimeHours,
          downtimeEvents,
          mtbf,
          trend: oeeChangeTrend,
          criticalAlerts: alertsData.length || 0,
          downtimeByCategory: downtimeByCategory.sort((a, b) => b.totalHours - a.totalHours),
          oeeHistory,
          improvementOpportunities,
          monthlyProductivity: {
            currentMonth: currentMonthProduction,
            previousMonth: previousMonthProduction,
            percentageChange,
            trend: productivityTrend
          },
          performanceVariations: {
            hasSignificantVariations: maxVariation > 20,
            maxVariation,
            variationDays,
            averageDailyProduction
          },
          riskAnalysis: {
            riskLevel,
            factors: riskFactors,
            recommendations
          }
        };

        setData(analytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Error fetching historical data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [machineId]);

  return { data, loading, error };
}