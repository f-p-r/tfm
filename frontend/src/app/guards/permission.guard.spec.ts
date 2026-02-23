import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, Subject } from 'rxjs';
import { requirePermission, requireAnyPermission } from './permission.guard';
import { PermissionsStore } from '../core/authz/permissions.store';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Crea un mock de PermissionsStore con permisos dados */
function makeStoreMock(permissions: string[], waitComplete = true) {
  const completeSubject = new Subject<void>();
  return {
    allPermissions: vi.fn().mockReturnValue(permissions),
    hasPermission: vi.fn((perm: string) =>
      permissions.includes('*') || permissions.includes(perm)
    ),
    waitForLoad: vi.fn().mockReturnValue(
      waitComplete ? of(void 0) : completeSubject.asObservable()
    ),
    _completeSubject: completeSubject,
  };
}

/**
 * Configura TestBed con el mock del store.
 * DEBE llamarse antes de cualquier inject() para evitar el error
 * "Cannot override provider when the test module has already been instantiated".
 */
function setupGuardTest(storeMock: ReturnType<typeof makeStoreMock>) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: PermissionsStore, useValue: storeMock },
    ],
  });
}

// ─── requirePermission() ────────────────────────────────────────────────────

describe('requirePermission()', () => {
  it('devuelve true cuando el usuario tiene el permiso requerido', async () => {
    setupGuardTest(makeStoreMock(['pages.edit']));
    const guard = requirePermission('pages.edit');
    const result = await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );
    expect(result).toBe(true);
  });

  it('devuelve false cuando el usuario NO tiene el permiso requerido', async () => {
    setupGuardTest(makeStoreMock(['news.create']));
    const guard = requirePermission('pages.edit');
    const result = await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );
    expect(result).toBe(false);
  });

  it('devuelve false con lista de permisos vacía', async () => {
    setupGuardTest(makeStoreMock([]));
    const guard = requirePermission('admin');
    const result = await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );
    expect(result).toBe(false);
  });

  it('devuelve true con wildcard "*" para cualquier permiso', async () => {
    setupGuardTest(makeStoreMock(['*']));
    const guard = requirePermission('any.perm');
    const result = await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );
    expect(result).toBe(true);
  });

  it('navega a "/" cuando el permiso es denegado', async () => {
    const mock = makeStoreMock([]);
    setupGuardTest(mock);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const guard = requirePermission('admin');
    await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('espera a que waitForLoad() complete antes de resolver', async () => {
    const mock = makeStoreMock(['pages.edit'], false); // no resuelve inmediatamente
    setupGuardTest(mock);
    let resolved: boolean | undefined;

    const guard = requirePermission('pages.edit');
    const guardPromise = TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    ).then((r) => (resolved = r));

    expect(resolved).toBeUndefined(); // aún esperando

    // Resolver la carga de permisos
    mock._completeSubject.next();
    await guardPromise;

    expect(resolved).toBe(true);
  });
});

// ─── requireAnyPermission() ──────────────────────────────────────────────────

describe('requireAnyPermission()', () => {
  it('devuelve true cuando el usuario tiene al menos un permiso', async () => {
    setupGuardTest(makeStoreMock(['news.create']));
    const guard = requireAnyPermission();
    const result = await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );
    expect(result).toBe(true);
  });

  it('devuelve true con múltiples permisos', async () => {
    setupGuardTest(makeStoreMock(['a', 'b', 'c']));
    const guard = requireAnyPermission();
    const result = await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );
    expect(result).toBe(true);
  });

  it('devuelve false cuando no tiene ningún permiso', async () => {
    setupGuardTest(makeStoreMock([]));
    const guard = requireAnyPermission();
    const result = await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );
    expect(result).toBe(false);
  });

  it('navega a "/" cuando no tiene permisos', async () => {
    const mock = makeStoreMock([]);
    setupGuardTest(mock);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const guard = requireAnyPermission();
    await TestBed.runInInjectionContext(() =>
      guard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot) as Promise<boolean>
    );

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
