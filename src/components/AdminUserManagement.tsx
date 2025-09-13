import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Edit, Trash2, Shield, User, Briefcase } from "lucide-react";
// Removido import do Supabase - usando dados mock
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ProtectedRoute, AdminOnly } from "./ProtectedRoute";

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profile: {
    full_name: string | null;
    department: string | null;
    position: string | null;
  } | null;
  roles: Array<{
    role: 'administrador' | 'operador' | 'supervisor';
  }>;
}

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  department: string;
  position: string;
  role: 'administrador' | 'operador' | 'supervisor';
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    email: "",
    password: "",
    full_name: "",
    department: "",
    position: "",
    role: "operador"
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, canManageUsers } = useAuthorization();



  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Dados mock de usuários
      const mockUsers: UserWithProfile[] = [
        {
          id: 'admin-001',
          email: 'admin@sistema-oee.com',
          created_at: new Date().toISOString(),
          profile: {
            full_name: 'Administrador do Sistema',
            department: 'TI',
            position: 'Administrador'
          },
          roles: [{ role: 'administrador' }]
        },
        {
          id: 'supervisor-001',
          email: 'supervisor@sistema-oee.com',
          created_at: new Date().toISOString(),
          profile: {
            full_name: 'Supervisor de Produção',
            department: 'Produção',
            position: 'Supervisor'
          },
          roles: [{ role: 'supervisor' }]
        },
        {
          id: 'operador-001',
          email: 'operador@sistema-oee.com',
          created_at: new Date().toISOString(),
          profile: {
            full_name: 'Operador de Máquina',
            department: 'Produção',
            position: 'Operador'
          },
          roles: [{ role: 'operador' }]
        }
      ];
      
      setUsers(mockUsers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);
      
      // Simulação de criação de usuário (mock)
      const newUser: UserWithProfile = {
        id: `user-${Date.now()}`,
        email: createUserData.email,
        created_at: new Date().toISOString(),
        profile: {
          full_name: createUserData.full_name,
          department: createUserData.department,
          position: createUserData.position
        },
        roles: [{ role: createUserData.role }]
      };
      
      setUsers(prev => [...prev, newUser]);
      
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso! (simulação)",
      });
      
      setCreateUserData({
        email: '',
        password: '',
        full_name: '',
        department: '',
        position: '',
        role: 'operador'
      });
      setIsCreateDialogOpen(false);
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'administrador' | 'operador' | 'supervisor') => {
    try {
      // Simulação de atualização de role (mock)
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, roles: [{ role: newRole }] }
          : user
      ));
      
      toast({
        title: "Sucesso",
        description: "Role do usuário atualizada com sucesso! (simulação)",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar role';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Simulação de exclusão de usuário (mock)
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso! (simulação)",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover usuário';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "administrador":
        return { 
          color: "bg-primary/15 text-primary border-primary/30", 
          text: "Administrador",
          icon: Shield
        };
      case "supervisor":
        return { 
          color: "bg-oee-good/15 text-oee-good border-oee-good/30", 
          text: "Supervisor",
          icon: User
        };
      case "operador":
        return { 
          color: "bg-warning/15 text-warning border-warning/30", 
          text: "Operador",
          icon: Briefcase
        };
      default:
        return { 
          color: "bg-muted/50 text-muted-foreground border-muted", 
          text: "Sem Role",
          icon: User
        };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminOnly>
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciamento de Usuários
            </CardTitle>
            <CardDescription>
              Gerencie usuários, perfis e permissões do sistema
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Criar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema
            </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createUserData.email}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createUserData.password}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={createUserData.full_name}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={createUserData.department}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={createUserData.position}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, position: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Nível de Acesso</Label>
                  <Select
                    value={createUserData.role}
                    onValueChange={(value: 'administrador' | 'operador' | 'supervisor') => 
                      setCreateUserData(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createUser} disabled={loading}>
                {loading ? "Criando..." : "Criar Usuário"}
              </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Nível de Acesso</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const primaryRole = user.roles[0]?.role || null;
                const roleConfig = getRoleConfig(primaryRole || '');
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.profile?.full_name || "Sem nome"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.profile?.department || "-"}</TableCell>
                    <TableCell>{user.profile?.position || "-"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs border ${roleConfig.color}`}
                      >
                        <roleConfig.icon className="h-3 w-3 mr-1" />
                        {roleConfig.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={primaryRole || ""}
                          onValueChange={(value: 'administrador' | 'operador' | 'supervisor') => 
                            updateUserRole(user.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operador">Operador</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="administrador">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover o usuário "{user.profile?.full_name || user.email}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </AdminOnly>
  );
}