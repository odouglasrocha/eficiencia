import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, X, Bell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OeeAlert {
  id: string;
  machineId: string;
  machineName: string;
  type: "low_oee" | "downtime" | "quality_issue" | "maintenance_due";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface AlertSystemProps {
  alerts: OeeAlert[];
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  className?: string;
}

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case "critical":
      return {
        color: "text-oee-critical border-oee-critical/20 bg-oee-critical/10",
        badgeColor: "bg-oee-critical text-white",
        icon: AlertTriangle,
        text: "Crítico"
      };
    case "high":
      return {
        color: "text-oee-warning border-oee-warning/20 bg-oee-warning/10",
        badgeColor: "bg-oee-warning text-white",
        icon: AlertTriangle,
        text: "Alto"
      };
    case "medium":
      return {
        color: "text-warning border-warning/20 bg-warning/10",
        badgeColor: "bg-warning text-white",
        icon: Bell,
        text: "Médio"
      };
    case "low":
      return {
        color: "text-muted-foreground border-muted bg-muted/10",
        badgeColor: "bg-muted text-muted-foreground",
        icon: Bell,
        text: "Baixo"
      };
    default:
      return {
        color: "text-muted-foreground border-muted bg-muted/10",
        badgeColor: "bg-muted text-muted-foreground",
        icon: Bell,
        text: "Info"
      };
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case "low_oee":
      return "OEE Baixo";
    case "downtime":
      return "Tempo Parado";
    case "quality_issue":
      return "Problema Qualidade";
    case "maintenance_due":
      return "Manutenção Pendente";
    default:
      return "Alerta";
  }
};

export function AlertSystem({ alerts, onAcknowledge, onDismiss, className }: AlertSystemProps) {
  const [sortedAlerts, setSortedAlerts] = useState<OeeAlert[]>([]);

  useEffect(() => {
    // Ordenar alertas por severidade e timestamp
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const sorted = [...alerts].sort((a, b) => {
      const severityDiff = severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    setSortedAlerts(sorted);
  }, [alerts]);

  const unacknowledgedAlerts = sortedAlerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = sortedAlerts.filter(alert => alert.acknowledged);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-oee-warning" />
          <span>Sistema de Alertas</span>
          {unacknowledgedAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unacknowledgedAlerts.length} novos
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum alerta ativo</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Alertas não reconhecidos */}
            {unacknowledgedAlerts.length > 0 && (
              <>
                <div className="text-sm font-medium text-foreground">
                  Alertas Pendentes ({unacknowledgedAlerts.length})
                </div>
                {unacknowledgedAlerts.map((alert) => {
                  const severityConfig = getSeverityConfig(alert.severity);
                  const SeverityIcon = severityConfig.icon;
                  
                  return (
                    <Alert key={alert.id} className={cn(
                      "border transition-all duration-200",
                      severityConfig.color,
                      !alert.acknowledged && "animate-pulse"
                    )}>
                      <SeverityIcon className="h-4 w-4" />
                      <div className="flex-1">
                        <AlertTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span>{alert.machineName}</span>
                            <Badge className={severityConfig.badgeColor}>
                              {getTypeText(alert.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">
                              {alert.timestamp.toLocaleTimeString('pt-BR')}
                            </span>
                          </div>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          {alert.message}
                        </AlertDescription>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAcknowledge(alert.id)}
                            className="text-xs"
                          >
                            Reconhecer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDismiss(alert.id)}
                            className="text-xs"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Alert>
                  );
                })}
              </>
            )}

            {/* Alertas reconhecidos */}
            {acknowledgedAlerts.length > 0 && (
              <>
                <div className="text-sm font-medium text-muted-foreground mt-6">
                  Alertas Reconhecidos ({acknowledgedAlerts.length})
                </div>
                {acknowledgedAlerts.map((alert) => {
                  const severityConfig = getSeverityConfig(alert.severity);
                  
                  return (
                    <Alert key={alert.id} className="border border-muted bg-muted/30 opacity-70">
                      <Bell className="h-4 w-4" />
                      <div className="flex-1">
                        <AlertTitle className="flex items-center justify-between text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <span>{alert.machineName}</span>
                            <Badge variant="outline" className="opacity-70">
                              {getTypeText(alert.type)}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDismiss(alert.id)}
                            className="text-xs opacity-70 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                          {alert.message}
                        </AlertDescription>
                      </div>
                    </Alert>
                  );
                })}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}