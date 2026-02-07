// admin-context.service.ts (Propuesta)
import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthzService } from '../authz/authz.service';
import { AuthzQueryBreakdownResponse } from '../authz/authz.models';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminContextService {
  private authz = inject(AuthzService);

  // Estado reactivo del contexto actual
  private currentScope = signal<{ type: number; id: number } | null>(null);

  // Almacenamos los permisos RAW del contexto actual
  private permissions = signal<string[]>([]);

  // Computed signals para la UI (Súper fácil de usar en el HTML)
  public canManageDashboard = computed(() => true); // Dashboard suele ser público para admins
  public canManagePartners = computed(() => this.hasPermission('users.manage'));
  public canManageNews = computed(() => this.hasPermission('news.create') || this.hasPermission('news.edit'));
  public canManageSettings = computed(() => this.hasPermission('association.update'));

  /**
   * Inicializa el contexto (Llamar al entrar en una ruta admin)
   */
  public setContext(scopeType: number, scopeId: number) {
    this.currentScope.set({ type: scopeType, id: scopeId });
    this.loadPermissions(scopeType, scopeId);
  }

  /**
   * Carga TODOS los permisos para este scope y los guarda en el signal
   */
  private loadPermissions(type: number, id: number) {
    this.authz.query({
      scopeType: type,
      scopeIds: [id],
      permissions: [], // Array vacío = TRAER TODOS (según tu API)
      breakdown: true
    }).subscribe(response => {
       // Extraemos los permisos de la respuesta compleja
       const breakdown = response as AuthzQueryBreakdownResponse;
       // Buscamos los resultados para NUESTRO ID
       const scopeResult = breakdown.results.find(r => r.scopeId === id);

       // Actualizamos el signal con la lista de strings (ej: ['news.create', 'users.manage'])
       this.permissions.set(scopeResult?.permissions || []);
    });
  }

  /**
   * Helper privado para verificar strings
   */
  public hasPermission(perm: string): boolean {
    return this.permissions().includes(perm);
  }
}
