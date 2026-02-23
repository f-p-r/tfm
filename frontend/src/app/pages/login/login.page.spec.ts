import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { LoginPage } from './login.page';
import { AuthService } from '../../core/auth/auth.service';

/** Construye un mock mínimo del snapshot de ActivatedRoute */
function makeActivatedRoute(queryParams: Record<string, string | null> = {}) {
  return {
    snapshot: {
      queryParamMap: {
        get: (key: string) => queryParams[key] ?? null,
      },
    },
  };
}

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let authServiceMock: { login: ReturnType<typeof vi.fn> };
  let router: Router;
  let locationMock: { back: ReturnType<typeof vi.fn> };

  async function setup(
    queryParams: Record<string, string | null> = {},
    platformId = 'browser'
  ) {
    TestBed.resetTestingModule();
    authServiceMock = { login: vi.fn() };
    locationMock = { back: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: makeActivatedRoute(queryParams) },
        { provide: Location, useValue: locationMock },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    })
      .overrideComponent(LoginPage, {
        set: {
          imports: [ReactiveFormsModule, RouterLink],
          template: `<form [formGroup]="form"></form>`,
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => setup());

  // ---------------------------------------------------------------
  // Estado inicial
  // ---------------------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form initially', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should initialise signals to default values', () => {
    expect(component.generalError()).toBeNull();
    expect(component.fieldErrors()).toEqual({});
    expect(component.isSubmitting()).toBe(false);
    expect(component.successMessage()).toBeNull();
  });

  // ---------------------------------------------------------------
  // ngOnInit — parámetro de query ?newUser
  // ---------------------------------------------------------------

  it('should show success message when ?newUser is in queryParams', async () => {
    await setup({ newUser: 'alice' });
    expect(component.successMessage()).toContain('alice');
  });

  it('should navigate to clear ?newUser from URL on init', async () => {
    await setup({ newUser: 'alice' });
    const navigateSpy = vi.spyOn(router, 'navigate');

    // Volver a disparar ngOnInit mediante detectChanges
    component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith([], {
      queryParams: { newUser: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('should NOT show success message when no ?newUser param', () => {
    expect(component.successMessage()).toBeNull();
  });

  // ---------------------------------------------------------------
  // Guards de onSubmit
  // ---------------------------------------------------------------

  it('should NOT call authService.login when form is invalid', () => {
    component.onSubmit();
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should NOT call authService.login when already submitting', () => {
    component.form.setValue({ username: 'alice', password: 'secret123' });
    component.isSubmitting.set(true);
    component.onSubmit();
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // onSubmit — navegación en caso de éxito
  // ---------------------------------------------------------------

  it('should navigate to returnUrl on successful login when returnUrl is set', async () => {
    await setup({ returnUrl: '/admin' });
    authServiceMock.login.mockReturnValue(
      of({ id: 1, username: 'alice' })
    );
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.form.setValue({ username: 'alice', password: 'secret123' });
    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
  });

  it('should navigate to "/" when no returnUrl after login', () => {
    authServiceMock.login.mockReturnValue(
      of({ id: 1, username: 'alice' })
    );
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.form.setValue({ username: 'alice', password: 'secret123' });
    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should call authService.login with correct credentials', () => {
    authServiceMock.login.mockReturnValue(of({ id: 1, username: 'alice' }));

    component.form.setValue({ username: 'alice', password: 'mypassword' });
    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('alice', 'mypassword');
  });

  // ---------------------------------------------------------------
  // onSubmit — ciclo de vida de isSubmitting
  // ---------------------------------------------------------------

  it('should set isSubmitting=true while request is in flight', () => {
    const subject = new Subject<any>();
    authServiceMock.login.mockReturnValue(subject.asObservable());

    component.form.setValue({ username: 'alice', password: 'secret123' });
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
  });

  it('should reset isSubmitting=false on error', () => {
    authServiceMock.login.mockReturnValue(throwError(() => ({ status: 401 })));

    component.form.setValue({ username: 'alice', password: 'wrong' });
    component.onSubmit();

    expect(component.isSubmitting()).toBe(false);
  });

  // ---------------------------------------------------------------
  // onSubmit — formato de error 1: {errors:true, errorsList:{...}}
  // ---------------------------------------------------------------

  it('should populate fieldErrors from format-1 error response', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        errors: true,
        errorsList: {
          username: 'Usuario no encontrado',
          password: 'Contraseña incorrecta',
        },
      }))
    );

    component.form.setValue({ username: 'alice', password: 'wrong' });
    component.onSubmit();

    expect(component.fieldErrors()['username']).toBe('Usuario no encontrado');
    expect(component.fieldErrors()['password']).toBe('Contraseña incorrecta');
  });

  it('should set generalError from errorsList.id in format-1 error', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        errors: true,
        errorsList: {
          id: 'Cuenta bloqueada',
        },
      }))
    );

    component.form.setValue({ username: 'alice', password: 'wrong' });
    component.onSubmit();

    expect(component.generalError()).toBe('Cuenta bloqueada');
  });

  it('should set generalError from errorsList.general in format-1 error', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        errors: true,
        errorsList: {
          general: 'Demasiados intentos fallidos',
        },
      }))
    );

    component.form.setValue({ username: 'alice', password: 'wrong' });
    component.onSubmit();

    expect(component.generalError()).toBe('Demasiados intentos fallidos');
  });

  // ---------------------------------------------------------------
  // onSubmit — formato de error 2: HTTP 401
  // ---------------------------------------------------------------

  it('should set generalError "Credenciales inválidas" on 401', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({ status: 401 }))
    );

    component.form.setValue({ username: 'alice', password: 'wrong' });
    component.onSubmit();

    expect(component.generalError()).toBe('Credenciales inválidas');
  });

  // ---------------------------------------------------------------
  // onSubmit — formato de error 3: validación 422 de Laravel
  // ---------------------------------------------------------------

  it('should populate fieldErrors from 422 Laravel error format', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        status: 422,
        errors: {
          username: ['El campo username es obligatorio'],
          password: ['Debe tener al menos 8 caracteres'],
        },
      }))
    );

    component.form.setValue({ username: 'alice', password: 'wrong' });
    component.onSubmit();

    expect(component.fieldErrors()['username']).toBe('El campo username es obligatorio');
    expect(component.fieldErrors()['password']).toBe('Debe tener al menos 8 caracteres');
  });

  it('should set generalError.message from 422 Laravel response', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        status: 422,
        errors: { username: ['Error'] },
        message: 'Los datos no son válidos',
      }))
    );

    component.form.setValue({ username: 'alice', password: 'wrong' });
    component.onSubmit();

    expect(component.generalError()).toBe('Los datos no son válidos');
  });

  // ---------------------------------------------------------------
  // onSubmit — error genérico (fallback)
  // ---------------------------------------------------------------

  it('should set generic error message as fallback', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );

    component.form.setValue({ username: 'alice', password: 'secret123' });
    component.onSubmit();

    expect(component.generalError()).toBe('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
  });

  // ---------------------------------------------------------------
  // El estado se limpia al re-enviar
  // ---------------------------------------------------------------

  it('should clear previous error state when a new submission starts', () => {
    authServiceMock.login.mockReturnValue(of({ id: 1, username: 'alice' }));

    component.generalError.set('Error previo');
    component.fieldErrors.set({ username: 'Error previo' });
    component.successMessage.set('Mensaje previo');

    component.form.setValue({ username: 'alice', password: 'secret123' });
    component.onSubmit();

    expect(component.generalError()).toBeNull();
    expect(component.fieldErrors()).toEqual({});
    expect(component.successMessage()).toBeNull();
  });

  // ---------------------------------------------------------------
  // cancel()
  // ---------------------------------------------------------------

  it('should call location.back() when cancel is called', () => {
    component.cancel();
    expect(locationMock.back).toHaveBeenCalledOnce();
  });

  // ---------------------------------------------------------------
  // Helper getFieldError
  // ---------------------------------------------------------------

  it('getFieldError should return field message when present', () => {
    component.fieldErrors.set({ username: 'Usuario requerido' });
    expect(component.getFieldError('username')).toBe('Usuario requerido');
  });

  it('getFieldError should return null when field has no error', () => {
    component.fieldErrors.set({});
    expect(component.getFieldError('username')).toBeNull();
  });

  // ---------------------------------------------------------------
  // loginWithGoogle / loginWithFacebook — guard de plataforma
  // ---------------------------------------------------------------

  it('loginWithGoogle should not redirect when running on server', async () => {
    await setup({}, 'server'); // reinicializar con plataforma servidor

    const originalHref = window.location.href;
    component.loginWithGoogle();
    // Con plataforma servidor, isPlatformBrowser() devuelve false → href sin cambios
    expect(window.location.href).toBe(originalHref);
  });
});
