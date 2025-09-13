import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from '@/hooks/usePermissions';  
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Settings, Bell, Shield, Users } from 'lucide-react';

export function AdvancedSettings() {
  const { permissions, userPermissions, hasPermission, loading: permissionsLoading } = usePermissions();
  const { settings, systemSettings, saveSettings, loading: settingsLoading } = useNotificationSettings();
  const [activeTab, setActiveTab] = useState('permissions');

  const handleNotificationToggle = async (type: string, enabled: boolean) => {
    if (!settings) return;
    
    await saveSettings({
      ...settings,
      notification_types: {
        ...settings.notification_types,
        [type]: enabled
      }
    });
  };

  const handleAlertToggle = async (type: string, enabled: boolean) => {
    if (!settings) return;
    
    await saveSettings({
      ...settings,
      alert_types: {
        ...settings.alert_types,
        [type]: enabled
      }
    });
  };

  const handleThresholdChange = async (threshold: string, value: number) => {
    if (!settings) return;
    
    await saveSettings({
      ...settings,
      thresholds: {
        ...settings.thresholds,
        [threshold]: value
      }
    });
  };

  if (permissionsLoading || settingsLoading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações Avançadas</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suas Permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userPermissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {userPermissions.map((permission) => (
                    <Badge key={permission.permission_name} variant="outline" className="p-2">
                      <div className="text-xs">
                        <div className="font-semibold">{permission.permission_name}</div>
                        <div className="text-muted-foreground">{permission.description}</div>
                      </div>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma permissão encontrada. Entre em contato com o administrador.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verificações de Acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Pode visualizar máquinas:</span>
                <Badge variant={hasPermission('machine.view') ? 'default' : 'secondary'}>
                  {hasPermission('machine.view') ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pode criar máquinas:</span>
                <Badge variant={hasPermission('machine.create') ? 'default' : 'secondary'}>
                  {hasPermission('machine.create') ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pode inserir produção:</span>
                <Badge variant={hasPermission('production.create') ? 'default' : 'secondary'}>
                  {hasPermission('production.create') ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pode gerenciar alertas:</span>
                <Badge variant={hasPermission('alerts.manage') ? 'default' : 'secondary'}>
                  {hasPermission('alerts.manage') ? 'Sim' : 'Não'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push">Notificações Push</Label>
                <Switch
                  id="push"
                  checked={settings?.notification_types?.push || false}
                  onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email</Label>
                <Switch
                  id="email"
                  checked={settings?.notification_types?.email || false}
                  onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Switch
                  id="whatsapp"
                  checked={settings?.notification_types?.whatsapp || false}
                  onCheckedChange={(checked) => handleNotificationToggle('whatsapp', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Alerta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="oee-alert">Alertas de OEE</Label>
                <Switch
                  id="oee-alert"
                  checked={settings?.alert_types?.oee || false}
                  onCheckedChange={(checked) => handleAlertToggle('oee', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="downtime-alert">Alertas de Parada</Label>
                <Switch
                  id="downtime-alert"
                  checked={settings?.alert_types?.downtime || false}
                  onCheckedChange={(checked) => handleAlertToggle('downtime', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="production-alert">Alertas de Produção</Label>
                <Switch
                  id="production-alert"
                  checked={settings?.alert_types?.production || false}
                  onCheckedChange={(checked) => handleAlertToggle('production', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limites de Alerta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oee-min">OEE Mínimo (%)</Label>
                <Input
                  id="oee-min"
                  type="number"
                  value={settings?.thresholds?.oee_min || 65}
                  onChange={(e) => handleThresholdChange('oee_min', Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="downtime-max">Tempo de Parada Máximo (min)</Label>
                <Input
                  id="downtime-max"
                  type="number"
                  value={settings?.thresholds?.downtime_max || 30}
                  onChange={(e) => handleThresholdChange('downtime_max', Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="production-min">Produção Mínima (%)</Label>
                <Input
                  id="production-min"
                  type="number"
                  value={settings?.thresholds?.production_min || 85}
                  onChange={(e) => handleThresholdChange('production_min', Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            </CardContent>
          </Card>

          {systemSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>WhatsApp:</strong> {systemSettings.whatsapp_config?.enabled ? 'Habilitado' : 'Desabilitado'}
                </div>
                <div>
                  <strong>Limite Crítico OEE:</strong> {systemSettings.alert_thresholds?.oee_critical}%
                </div>
                <div>
                  <strong>Limite Aviso OEE:</strong> {systemSettings.alert_thresholds?.oee_warning}%
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              {hasPermission('users.manage') ? (
                <div className="space-y-4">
                  <p>Funcionalidade de gerenciamento de usuários disponível.</p>
                  <Button disabled>Gerenciar Usuários (Em desenvolvimento)</Button>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Você não tem permissão para gerenciar usuários. 
                  Entre em contato com o administrador.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}