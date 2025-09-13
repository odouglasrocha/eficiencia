import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OeeChartProps {
  type: "line" | "area" | "bar" | "pie";
  title: string;
  data: any[];
  className?: string;
  period?: "hour" | "day" | "week" | "month";
  height?: number;
}

const OEE_COLORS = {
  excellent: "hsl(var(--oee-excellent))",
  good: "hsl(var(--oee-good))",
  warning: "hsl(var(--oee-warning))",
  critical: "hsl(var(--oee-critical))",
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))"
};

const CHART_COLORS = [
  OEE_COLORS.primary,
  OEE_COLORS.excellent,
  OEE_COLORS.warning,
  OEE_COLORS.critical,
  "hsl(var(--muted-foreground))"
];

// Componente de Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}:</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {typeof entry.value === 'number' ? 
                `${entry.value.toFixed(1)}%` : 
                entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Componente para gráfico de linha/área
const LineAreaChart = ({ type, data, height = 300 }: { type: "line" | "area", data: any[], height: number }) => {
  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="oeeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={OEE_COLORS.primary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={OEE_COLORS.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="oee"
            stroke={OEE_COLORS.primary}
            fillOpacity={1}
            fill="url(#oeeGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="availability"
            stroke={OEE_COLORS.excellent}
            fillOpacity={0.2}
            fill={OEE_COLORS.excellent}
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="performance"
            stroke={OEE_COLORS.warning}
            fillOpacity={0.2}
            fill={OEE_COLORS.warning}
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="quality"
            stroke={OEE_COLORS.good}
            fillOpacity={0.2}
            fill={OEE_COLORS.good}
            strokeWidth={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="time" 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="oee"
          stroke={OEE_COLORS.primary}
          strokeWidth={3}
          dot={{ fill: OEE_COLORS.primary, strokeWidth: 2, r: 4 }}
          name="OEE"
        />
        <Line
          type="monotone"
          dataKey="availability"
          stroke={OEE_COLORS.excellent}
          strokeWidth={2}
          dot={{ fill: OEE_COLORS.excellent, strokeWidth: 2, r: 3 }}
          name="Disponibilidade"
        />
        <Line
          type="monotone"
          dataKey="performance"
          stroke={OEE_COLORS.warning}
          strokeWidth={2}
          dot={{ fill: OEE_COLORS.warning, strokeWidth: 2, r: 3 }}
          name="Performance"
        />
        <Line
          type="monotone"
          dataKey="quality"
          stroke={OEE_COLORS.good}
          strokeWidth={2}
          dot={{ fill: OEE_COLORS.good, strokeWidth: 2, r: 3 }}
          name="Qualidade"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Componente para gráfico de barras
const BarChartComponent = ({ data, height = 300 }: { data: any[], height: number }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis 
        dataKey="machine" 
        stroke="hsl(var(--muted-foreground))" 
        fontSize={12}
      />
      <YAxis 
        stroke="hsl(var(--muted-foreground))" 
        fontSize={12}
        domain={[0, 100]}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Bar 
        dataKey="oee" 
        fill={OEE_COLORS.primary}
        name="OEE"
        radius={[4, 4, 0, 0]}
      />
      <Bar 
        dataKey="availability" 
        fill={OEE_COLORS.excellent}
        name="Disponibilidade"
        radius={[4, 4, 0, 0]}
      />
      <Bar 
        dataKey="performance" 
        fill={OEE_COLORS.warning}
        name="Performance"
        radius={[4, 4, 0, 0]}
      />
      <Bar 
        dataKey="quality" 
        fill={OEE_COLORS.good}
        name="Qualidade"
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);

// Componente para gráfico de pizza
const PieChartComponent = ({ data, height = 300 }: { data: any[], height: number }) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
    </PieChart>
  </ResponsiveContainer>
);

export function OeeChart({ 
  type, 
  title, 
  data, 
  className, 
  period = "hour",
  height = 300 
}: OeeChartProps) {
  const getPeriodBadge = () => {
    const periods = {
      hour: "Última Hora",
      day: "Hoje",
      week: "Esta Semana", 
      month: "Este Mês"
    };
    return periods[period];
  };

  const renderChart = () => {
    switch (type) {
      case "line":
      case "area":
        return <LineAreaChart type={type} data={data} height={height} />;
      case "bar":
        return <BarChartComponent data={data} height={height} />;
      case "pie":
        return <PieChartComponent data={data} height={height} />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {getPeriodBadge()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}