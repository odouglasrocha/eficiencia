// Serviço híbrido que detecta ambiente e usa MongoDB real ou mock
import { ProductionRecordData } from './mongoService';

// Detectar se estamos no ambiente de desenvolvimento frontend ou backend
const isBackend = typeof window === 'undefined';
const isDevelopment = process.env.NODE_ENV === 'development';

class ProductionService {
  private mongoService: any = null;
  private mockService: any = null;
  private initPromise: Promise<void> | null = null;
  
  constructor() {
    // Inicialização será feita na primeira chamada
  }
  
  private async ensureInitialized() {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this.initializeServices();
    return this.initPromise;
  }
  
  private async initializeServices() {
    try {
      console.log('🔄 Inicializando serviços de produção...');
      
      // Sempre carregar o mock service primeiro
      try {
        const { default: mockMongoService } = await import('./mockMongoService');
        this.mockService = mockMongoService;
        console.log('✅ Mock service carregado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao carregar mock service:', error);
        throw new Error('Falha crítica: não foi possível carregar o mock service');
      }
      
      // Tentar carregar o MongoDB real apenas se não estivermos no frontend de desenvolvimento
      if (isBackend || !isDevelopment) {
        try {
          const { default: mongoService } = await import('./mongoService');
          this.mongoService = mongoService;
          console.log('✅ Serviço MongoDB real carregado');
        } catch (error) {
          console.warn('⚠️ MongoDB real não disponível, usando mock:', error.message);
        }
      }
      
      console.log('✅ Inicialização de serviços concluída');
    } catch (error) {
      console.error('❌ Erro crítico na inicialização:', error);
      throw error;
    }
  }
  
  private async getService() {
    await this.ensureInitialized();
    
    // Priorizar MongoDB real se disponível e não estivermos em desenvolvimento frontend
    if (this.mongoService && (isBackend || !isDevelopment)) {
      console.log('🔄 Usando MongoDB real');
      return this.mongoService;
    }
    
    // Usar mock service como fallback
    if (this.mockService) {
      console.log('🔄 Usando MongoDB mock (localStorage)');
      return this.mockService;
    }
    
    throw new Error('Nenhum serviço disponível após inicialização');
  }
  
  // ===== OPERAÇÕES CRUD =====
  
  async createProductionRecord(data: ProductionRecordData) {
    const service = await this.getService();
    
    try {
      console.log('📝 Criando registro de produção:', {
        machineId: data.machineId,
        goodProduction: data.goodProduction,
        service: service === this.mongoService ? 'MongoDB' : 'Mock'
      });
      
      return await service.createProductionRecord(data);
    } catch (error) {
      console.error('❌ Erro ao criar registro:', error);
      
      // Fallback para mock se MongoDB falhar
      if (service === this.mongoService && this.mockService) {
        console.log('🔄 Fallback para mock service');
        return await this.mockService.createProductionRecord(data);
      }
      
      throw error;
    }
  }
  
  async updateProductionRecord(recordId: string, updates: Partial<ProductionRecordData>) {
    const service = await this.getService();
    
    try {
      return await service.updateProductionRecord(recordId, updates);
    } catch (error) {
      console.error('❌ Erro ao atualizar registro:', error);
      
      // Fallback para mock se MongoDB falhar
      if (service === this.mongoService && this.mockService) {
        console.log('🔄 Fallback para mock service');
        return await this.mockService.updateProductionRecord(recordId, updates);
      }
      
      throw error;
    }
  }
  
  async getProductionRecords(filters?: {
    machineId?: string;
    startDate?: string;
    endDate?: string;
    shift?: string;
    operatorId?: string;
    limit?: number;
    offset?: number;
  }) {
    const service = await this.getService();
    
    try {
      return await service.getProductionRecords(filters);
    } catch (error) {
      console.error('❌ Erro ao buscar registros:', error);
      
      // Fallback para mock se MongoDB falhar
      if (service === this.mongoService && this.mockService) {
        console.log('🔄 Fallback para mock service');
        return await this.mockService.getProductionRecords(filters);
      }
      
      throw error;
    }
  }
  
  async getProductionRecordById(recordId: string) {
    const service = await this.getService();
    
    try {
      return await service.getProductionRecordById(recordId);
    } catch (error) {
      console.error('❌ Erro ao buscar registro por ID:', error);
      
      // Fallback para mock se MongoDB falhar
      if (service === this.mongoService && this.mockService) {
        console.log('🔄 Fallback para mock service');
        return await this.mockService.getProductionRecordById(recordId);
      }
      
      throw error;
    }
  }
  
  async deleteProductionRecord(recordId: string) {
    const service = await this.getService();
    
    try {
      return await service.deleteProductionRecord(recordId);
    } catch (error) {
      console.error('❌ Erro ao excluir registro:', error);
      
      // Fallback para mock se MongoDB falhar
      if (service === this.mongoService && this.mockService) {
        console.log('🔄 Fallback para mock service');
        return await this.mockService.deleteProductionRecord(recordId);
      }
      
      throw error;
    }
  }
  
  async getProductionStatistics(filters?: {
    machineId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const service = await this.getService();
    
    try {
      return await service.getProductionStatistics(filters);
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      
      // Fallback para mock se MongoDB falhar
      if (service === this.mongoService && this.mockService) {
        console.log('🔄 Fallback para mock service');
        return await this.mockService.getProductionStatistics(filters);
      }
      
      throw error;
    }
  }
  
  // Função para manter compatibilidade
  async upsertProductionRecord(data: ProductionRecordData) {
    if (data.recordId) {
      return await this.updateProductionRecord(data.recordId, data);
    } else {
      return await this.createProductionRecord(data);
    }
  }
  
  // Método para forçar uso do MongoDB (para testes)
  async forceMongoDBConnection() {
    if (!this.mongoService) {
      try {
        const { default: mongoService } = await import('./mongoService');
        this.mongoService = mongoService;
        
        // Testar conexão
        await this.mongoService.connect();
        console.log('✅ Conexão forçada com MongoDB estabelecida');
        return true;
      } catch (error) {
        console.error('❌ Falha ao conectar com MongoDB:', error);
        return false;
      }
    }
    return true;
  }
  
  // Método para verificar qual serviço está sendo usado
  getCurrentService() {
    const service = this.getService();
    if (service === this.mongoService) {
      return 'MongoDB';
    } else if (service === this.mockService) {
      return 'Mock (localStorage)';
    }
    return 'Nenhum';
  }
}

// Instância singleton
export const productionService = new ProductionService();
export default productionService;