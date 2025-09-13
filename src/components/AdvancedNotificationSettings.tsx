import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import NotificationSettings from "./NotificationSettings";

interface AdvancedNotificationSettingsProps {
  children?: React.ReactNode;
}

export function AdvancedNotificationSettings({ children }: AdvancedNotificationSettingsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Configurações Avançadas de Notificação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações Avançadas de Notificação
          </DialogTitle>
          <DialogDescription>
            Configure detalhadamente todos os aspectos das notificações do sistema
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          <NotificationSettings />
        </div>
      </DialogContent>
    </Dialog>
  );
}