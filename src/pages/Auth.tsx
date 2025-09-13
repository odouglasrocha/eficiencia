import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import mockMongoService from "@/services/mockMongoService";
import { Eye, EyeOff, Factory, LogIn, UserPlus } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const navigate = useNavigate();

  // Verificar se já está logado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
         if (token) {
           await mockMongoService.verifyToken(token);
           navigate("/");
         }
      } catch (error) {
        // Token inválido, remover do localStorage
        localStorage.removeItem('auth_token');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await mockMongoService.authenticateUser(formData.email, formData.password);
      
      // Salvar token no localStorage
      localStorage.setItem('auth_token', result.token);
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Sistema OEE",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Email ou senha incorretos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro na validação",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro na validação",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await mockMongoService.createUser(formData.email, formData.password, formData.email);
      
      // Fazer login automaticamente após criar a conta
      const authResult = await mockMongoService.authenticateUser(formData.email, formData.password);
      localStorage.setItem('auth_token', authResult.token);
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao Sistema OEE",
      });
      
      navigate("/");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      if (errorMessage.includes("já existe")) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já possui uma conta. Tente fazer login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center shadow-lg animate-glow">
            <Factory className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sistema OEE</h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento Industrial Avançado
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              {isLogin ? "Entrar na Plataforma" : "Criar Conta"}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {isLogin 
                ? "Acesse o painel de controle OEE" 
                : "Cadastre-se para começar a monitorar"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? "login" : "signup"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="login" 
                  onClick={() => setIsLogin(true)}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  onClick={() => setIsLogin(false)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu.email@empresa.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="bg-background pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary-glow"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="seu.email@empresa.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="bg-background pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Digite a senha novamente"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="bg-background"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-success to-oee-good"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Sistema OEE Industrial © 2024</p>
          <p>Monitoramento de Eficiência Global de Equipamentos</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;