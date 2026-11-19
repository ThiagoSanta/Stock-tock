import { createClient } from '@/utils/supabase/client';
import { AuditLogEntry, UserRole } from '@/core/domain/security/types';

export interface LogActionParams {
  companyId: string;
  userName: string;
  userRole: UserRole;
  module: 'INVENTARIO' | 'CATALOGO' | 'VENTAS' | 'CAJA' | 'CLIENTES' | 'PROVEEDORES' | 'SEGURIDAD';
  action: string;
  entityId?: string;
  entityName?: string;
  details?: string;
}

export class AuditService {
  /**
   * Registra una acción en el libro inmutable de auditoría.
   * Se ejecuta de forma asíncrona no bloqueante para no frenar la interfaz de usuario.
   */
  static async logAction(params: LogActionParams): Promise<void> {
    try {
      if (!params.companyId) return;
      const supabase = createClient();
      await supabase.from('audit_logs').insert({
        company_id: params.companyId,
        user_name: params.userName || 'Sistema',
        user_role: params.userRole || 'ADMIN',
        module: params.module,
        action: params.action,
        entity_id: params.entityId || null,
        entity_name: params.entityName || null,
        details: params.details || null,
      });
    } catch (err) {
      console.warn('Advertencia no crítica: Error al registrar evento de auditoría:', err);
    }
  }

  /**
   * Obtiene los eventos de auditoría con filtros opcionales.
   */
  static async getLogs(
    companyId: string,
    options?: {
      module?: string;
      limit?: number;
    }
  ): Promise<AuditLogEntry[]> {
    try {
      const supabase = createClient();
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(options?.limit || 100);

      if (options?.module && options.module !== 'ALL') {
        query = query.eq('module', options.module);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        userName: row.user_name,
        userRole: row.user_role as UserRole,
        module: row.module,
        action: row.action,
        entityId: row.entity_id || undefined,
        entityName: row.entity_name || undefined,
        details: row.details || undefined,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.error('Error al consultar logs de auditoría:', err);
      return [];
    }
  }
}
