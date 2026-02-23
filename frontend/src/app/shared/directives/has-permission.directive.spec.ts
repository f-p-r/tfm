import { Component, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HasPermissionDirective } from './has-permission.directive';
import { PermissionsStore } from '../../core/authz/permissions.store';

// ─── Mock de PermissionsStore ────────────────────────────────────────────────

class MockPermissionsStore {
  private readonly _permissions = signal<string[]>([]);

  readonly allPermissions = this._permissions;

  hasPermission(perm: string): boolean {
    const perms = this._permissions();
    return perms.includes('*') || perms.includes(perm);
  }

  hasAnyPermission(perms: string[]): boolean {
    return perms.some((p) => this.hasPermission(p));
  }

  hasAllPermissions(perms: string[]): boolean {
    return perms.every((p) => this.hasPermission(p));
  }

  /** Setter de conveniencia para cambiar permisos en los tests */
  setPermissions(perms: string[]) {
    this._permissions.set(perms);
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function createFixture<T>(component: new (...args: any[]) => T): ComponentFixture<T> {
  TestBed.configureTestingModule({
    imports: [component as any],
    providers: [{ provide: PermissionsStore, useClass: MockPermissionsStore }],
  });
  const fixture = TestBed.createComponent(component as any);
  fixture.detectChanges();
  return fixture as unknown as ComponentFixture<T>;
}

function text(fixture: ComponentFixture<any>): string {
  return (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
}

// ─── Componentes host de prueba ──────────────────────────────────────────────

@Component({
  selector: 'test-single',
  imports: [HasPermissionDirective],
  template: `<span *hasPermission="'pages.edit'">Protegido</span>`,
})
class SinglePermissionHost {}

@Component({
  selector: 'test-else',
  imports: [HasPermissionDirective],
  template: `
    <span *hasPermission="'admin'; else noAccess">Acceso</span>
    <ng-template #noAccess><span>Sin acceso</span></ng-template>
  `,
})
class WithElseHost {}

@Component({
  selector: 'test-any',
  imports: [HasPermissionDirective],
  template: `<span *hasPermission="['a', 'b']">Any</span>`,
})
class AnyModeHost {}

@Component({
  selector: 'test-all',
  imports: [HasPermissionDirective],
  template: `<span *hasPermission="['a', 'b']; mode: 'all'">All</span>`,
})
class AllModeHost {}

// ─── Suites ──────────────────────────────────────────────────────────────────

describe('HasPermissionDirective — permiso único (string)', () => {
  let store: MockPermissionsStore;
  let fixture: ComponentFixture<SinglePermissionHost>;

  beforeEach(() => {
    fixture = createFixture(SinglePermissionHost);
    store = TestBed.inject(PermissionsStore) as unknown as MockPermissionsStore;
  });

  it('oculta el contenido cuando no hay permisos', () => {
    expect(text(fixture)).toBe('');
  });

  it('muestra el contenido cuando tiene el permiso', () => {
    store.setPermissions(['pages.edit']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Protegido');
  });

  it('vuelve a ocultar el contenido al perder el permiso', () => {
    store.setPermissions(['pages.edit']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Protegido');

    store.setPermissions([]);
    fixture.detectChanges();
    expect(text(fixture)).toBe('');
  });

  it('muestra el contenido con wildcard "*"', () => {
    store.setPermissions(['*']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Protegido');
  });
});

describe('HasPermissionDirective — bloque else', () => {
  let store: MockPermissionsStore;
  let fixture: ComponentFixture<WithElseHost>;

  beforeEach(() => {
    fixture = createFixture(WithElseHost);
    store = TestBed.inject(PermissionsStore) as unknown as MockPermissionsStore;
  });

  it('muestra el bloque else cuando no tiene el permiso', () => {
    expect(text(fixture)).toBe('Sin acceso');
  });

  it('muestra el contenido principal cuando tiene el permiso', () => {
    store.setPermissions(['admin']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Acceso');
  });

  it('alterna entre contenido y else al cambiar permisos', () => {
    store.setPermissions(['admin']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Acceso');

    store.setPermissions([]);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Sin acceso');
  });
});

describe('HasPermissionDirective — modo "any" (array)', () => {
  let store: MockPermissionsStore;
  let fixture: ComponentFixture<AnyModeHost>;

  beforeEach(() => {
    fixture = createFixture(AnyModeHost);
    store = TestBed.inject(PermissionsStore) as unknown as MockPermissionsStore;
  });

  it('oculta el contenido cuando no tiene ningún permiso', () => {
    expect(text(fixture)).toBe('');
  });

  it('muestra el contenido cuando tiene al menos uno de los permisos', () => {
    store.setPermissions(['a']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Any');
  });

  it('muestra el contenido cuando tiene ambos permisos', () => {
    store.setPermissions(['a', 'b']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('Any');
  });

  it('oculta si los permisos son distintos (ni a ni b)', () => {
    store.setPermissions(['c', 'd']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('');
  });
});

describe('HasPermissionDirective — modo "all" (array)', () => {
  let store: MockPermissionsStore;
  let fixture: ComponentFixture<AllModeHost>;

  beforeEach(() => {
    fixture = createFixture(AllModeHost);
    store = TestBed.inject(PermissionsStore) as unknown as MockPermissionsStore;
  });

  it('oculta el contenido cuando no tiene ningún permiso', () => {
    expect(text(fixture)).toBe('');
  });

  it('oculta el contenido cuando solo tiene uno de los dos permisos', () => {
    store.setPermissions(['a']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('');
  });

  it('muestra el contenido cuando tiene TODOS los permisos', () => {
    store.setPermissions(['a', 'b']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('All');
  });

  it('muestra el contenido con permisos adicionales (superset)', () => {
    store.setPermissions(['a', 'b', 'c']);
    fixture.detectChanges();
    expect(text(fixture)).toBe('All');
  });
});
