import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OeeCardProps {
  title: string;
  value: number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  status?: "excellent" | "good" | "warning" | "critical";
  className?: string;
}

const getStatusColor = (status: string | undefined, value: number) => {
  if (status) {
    switch (status) {
      case "excellent": return "bg-green-50 border-green-200";
      case "good": return "bg-green-50 border-green-200";
      case "warning": return "bg-yellow-50 border-yellow-200";
      case "critical": return "bg-red-50 border-red-200";
    }
  }
  
  // Auto-determine status based on value for OEE
  if (value >= 85) return "bg-green-50 border-green-200";
  if (value >= 75) return "bg-green-50 border-green-200";
  if (value >= 65) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
};

const getStatusBadgeColor = (status: string | undefined, value: number) => {
  if (status) {
    switch (status) {
      case "excellent": return "bg-green-100 text-green-800 border-green-300";
      case "good": return "bg-green-100 text-green-800 border-green-300";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "critical": return "bg-red-100 text-red-800 border-red-300";
    }
  }
  
  if (value >= 85) return "bg-green-100 text-green-800 border-green-300";
  if (value >= 75) return "bg-green-100 text-green-800 border-green-300";
  if (value >= 65) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
};

const getStatusText = (status: string | undefined, value: number) => {
  if (status) {
    switch (status) {
      case "excellent": return "Excelente";
      case "good": return "Bom";
      case "warning": return "Atenção";
      case "critical": return "Crítico";
    }
  }
  
  if (value >= 85) return "Excelente";
  if (value >= 75) return "Bom";
  if (value >= 65) return "Atenção";
  return "Crítico";
};

export function OeeCard({ 
  title, 
  value, 
  unit = "%", 
  trend, 
  trendValue, 
  status,
  className 
}: OeeCardProps) {
  const isLowOee = value < 65;
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg border",
      getStatusColor(status, value),
      isLowOee && "animate-pulse",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs border",
            getStatusBadgeColor(status, value)
          )}
        >
          {getStatusText(status, value)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-foreground">
            {value.toFixed(1)}{unit}
          </div>
          {isLowOee && (
            <AlertTriangle className="h-5 w-5 text-oee-critical animate-bounce" />
          )}
        </div>
        {trend && trendValue && (
          <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-oee-good" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3 text-oee-critical" />
            ) : null}
            <span className={cn(
              trend === "up" && "text-oee-good",
              trend === "down" && "text-oee-critical"
            )}>
              {trend === "up" ? "+" : ""}{trendValue.toFixed(1)}% vs ontem
            </span>
          </div>
        )}
      </CardContent>
      {isLowOee && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-oee-critical/50 to-oee-warning/50" />
      )}
    </Card>
  );
}