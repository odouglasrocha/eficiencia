import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAlertConfigurations } from '@/hooks/useAlertConfigurations';
import { useToast } from '@/hooks/use-toast';
import { Bell, MessageCircle, Mail, Volume2, Smartphone, Settings, TestTube } from 'lucide-react';

export default function NotificationSettings() {
  const { configuration, loading, updateConfiguration } = useAlertConfigurations();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();

  if (loading) {
    return <div className="flex justify-center p-8">Carregando configurações...</div>;
  }

  if (!configuration) {
    return <div className="text-center p-8">Configurações não encontradas</div>;
  }

  const handleNotificationTypeChange = async (type: keyof typeof configuration.notification_types, value: boolean) => {
    await updateConfiguration({
      notification_types: {
        ...configuration.notification_types,
        [type]: value
      }
    });
  };

  const handleAlertTypeChange = async (type: keyof typeof configuration.alert_types, value: boolean) => {
    await updateConfiguration({
      alert_types: {
        ...configuration.alert_types,
        [type]: value
      }
    });
  };

  const handleAdvancedSettingChange = async (setting: keyof typeof configuration.advanced_settings, value: any) => {
    await updateConfiguration({
      advanced_settings: {
        ...configuration.advanced_settings,
        [setting]: value
      }
    });
  };

  const handleWhatsAppConfigChange = async (key: keyof typeof configuration.whatsapp_config, value: any) => {
    await updateConfiguration({
      whatsapp_config: {
        ...configuration.whatsapp_config,
        [key]: value
      }
    });
  };

  const addWhatsAppNumber = () => {
    if (!whatsappNumber.trim()) return;
    
    // Validação básica de número internacional
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(whatsappNumber)) {
      toast({
        title: "Erro",
        description: "Número deve estar no formato internacional (+55xxxxxxxxxx)",
        variant: "destructive",
      });
      return;
    }

    const updatedNumbers = [...configuration.recipients.whatsapp_numbers, whatsappNumber];
    updateConfiguration({
      recipients: {
        ...configuration.recipients,
        whatsapp_numbers: updatedNumbers
      }
    });
    setWhatsappNumber('');
  };

  const removeWhatsAppNumber = (index: number) => {
    const updatedNumbers = configuration.recipients.whatsapp_numbers.filter((_, i) => i !== index);
    updateConfiguration({
      recipients: {
        ...configuration.recipients,
        whatsapp_numbers: updatedNumbers
      }
    });
  };

  const addEmail = () => {
    if (!email.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive",
      });
      return;
    }

    const updatedEmails = [...configuration.recipients.emails, email];
    updateConfiguration({
      recipients: {
        ...configuration.recipients,
        emails: updatedEmails
      }
    });
    setEmail('');
  };

  const removeEmail = (index: number) => {
    const updatedEmails = configuration.recipients.emails.filter((_, i) => i !== index);
    updateConfiguration({
      recipients: {
        ...configuration.recipients,
        emails: updatedEmails
      }
    });
  };

  const testWhatsAppConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuration.whatsapp_config)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Conexão WhatsApp testada com sucesso!",
        });
        await handleWhatsAppConfigChange('connected', true);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Falha na conexão WhatsApp",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar conexão",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações de Notificações</h1>
      </div>

      {/* Tipos de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tipos de Notificação
          </CardTitle>
          <CardDescription>Configure os canais de notificação disponíveis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <Label htmlFor="email-notifications">Notificações por Email</Label>
            </div>
            <Switch
              id="email-notifications"
              checked={configuration.notification_types.email}
              onCheckedChange={(value) => handleNotificationTypeChange('email', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <Label htmlFor="push-notifications">Notificações Push</Label>
            </div>
            <Switch
              id="push-notifications"
              checked={configuration.notification_types.push}
              onCheckedChange={(value) => handleNotificationTypeChange('push', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Label htmlFor="sound-notifications">Notificações Sonoras</Label>
            </div>
            <Switch
              id="sound-notifications"
              checked={configuration.notification_types.sound}
              onCheckedChange={(value) => handleNotificationTypeChange('sound', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <Label htmlFor="whatsapp-notifications">Notificações por WhatsApp</Label>
              {configuration.whatsapp_config.connected && (
                <Badge variant="outline" className="text-green-600">Conectado</Badge>
              )}
            </div>
            <Switch
              id="whatsapp-notifications"
              checked={configuration.notification_types.whatsapp}
              onCheckedChange={(value) => handleNotificationTypeChange('whatsapp', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações WhatsApp */}
      {configuration.notification_types.whatsapp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Configurações do WhatsApp
            </CardTitle>
            <CardDescription>Configure a integração com WhatsApp Business API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="whatsapp-api-key">API Key</Label>
                <Input
                  id="whatsapp-api-key"
                  type="password"
                  value={configuration.whatsapp_config.api_key}
                  onChange={(e) => handleWhatsAppConfigChange('api_key', e.target.value)}
                  placeholder="Sua chave da API WhatsApp"
                />
              </div>
              
              <div>
                <Label htmlFor="business-id">Business ID</Label>
                <Input
                  id="business-id"
                  value={configuration.whatsapp_config.business_id}
                  onChange={(e) => handleWhatsAppConfigChange('business_id', e.target.value)}
                  placeholder="ID da conta business"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={configuration.whatsapp_config.webhook_url}
                onChange={(e) => handleWhatsAppConfigChange('webhook_url', e.target.value)}
                placeholder="URL do webhook"
              />
            </div>
            
            <Button 
              onClick={testWhatsAppConnection}
              disabled={testingConnection}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testingConnection ? 'Testando...' : 'Testar Conexão WhatsApp'}
            </Button>
            
            <Separator />
            
            <div>
              <Label htmlFor="whatsapp-template">Template de Mensagem</Label>
              <Textarea
                id="whatsapp-template"
                value={configuration.advanced_settings.whatsapp_template}
                onChange={(e) => handleAdvancedSettingChange('whatsapp_template', e.target.value)}
                placeholder="Use {{machine_name}}, {{alert_type}}, {{current_value}}, {{threshold}}, {{timestamp}}"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Placeholders disponíveis: {'{'}{'{'} machine_name {'}'}{'}'},  {'{'}{'{'} alert_type {'}'}{'}'},  {'{'}{'{'} current_value {'}'}{'}'},  {'{'}{'{'} threshold {'}'}{'}'},  {'{'}{'{'} timestamp {'}'}{'}'} 
              </p>
            </div>
            
            <div>
              <Label>Números WhatsApp</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+5511999999999"
                />
                <Button onClick={addWhatsAppNumber}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {configuration.recipients.whatsapp_numbers.map((number, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeWhatsAppNumber(index)}>
                    {number} ×
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destinatários Email */}
      {configuration.notification_types.email && (
        <Card>
          <CardHeader>
            <CardTitle>Destinatários Email</CardTitle>
            <CardDescription>Configure os emails que receberão as notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
              />
              <Button onClick={addEmail}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {configuration.recipients.emails.map((emailAddr, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeEmail(index)}>
                  {emailAddr} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tipos de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Alertas</CardTitle>
          <CardDescription>Selecione quais tipos de alertas você deseja receber</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="oee-alerts">Alertas de OEE</Label>
            <Switch
              id="oee-alerts"
              checked={configuration.alert_types.oee}
              onCheckedChange={(value) => handleAlertTypeChange('oee', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="downtime-alerts">Alertas de Parada</Label>
            <Switch
              id="downtime-alerts"
              checked={configuration.alert_types.downtime}
              onCheckedChange={(value) => handleAlertTypeChange('downtime', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-alerts">Alertas de Manutenção</Label>
            <Switch
              id="maintenance-alerts"
              checked={configuration.alert_types.maintenance}
              onCheckedChange={(value) => handleAlertTypeChange('maintenance', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="production-alerts">Alertas de Produção</Label>
            <Switch
              id="production-alerts"
              checked={configuration.alert_types.production}
              onCheckedChange={(value) => handleAlertTypeChange('production', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
          <CardDescription>Ajuste fino das notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="alert-level">Nível de Alerta</Label>
            <Select 
              value={configuration.alert_level} 
              onValueChange={(value: 'high' | 'medium' | 'low') => updateConfiguration({ alert_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Alto - Apenas críticos</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo - Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="frequency">Frequência (minutos)</Label>
            <Select 
              value={configuration.frequency.toString()} 
              onValueChange={(value) => updateConfiguration({ frequency: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minuto</SelectItem>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">60 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="critical-only">Apenas Alertas Críticos</Label>
            <Switch
              id="critical-only"
              checked={configuration.advanced_settings.critical_only}
              onCheckedChange={(value) => handleAdvancedSettingChange('critical_only', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="summary-reports">Resumos Diários/Semanais</Label>
            <Switch
              id="summary-reports"
              checked={configuration.advanced_settings.summary_reports}
              onCheckedChange={(value) => handleAdvancedSettingChange('summary_reports', value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}