import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegistroPage } from './registro.page';
import { UsersService } from '../../core/users/users.service';

describe('RegistroPage', () => {
  let fixture: ComponentFixture<RegistroPage>;
  let component: RegistroPage;
  let usersServiceMock: { create: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    usersServiceMock = { create: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegistroPage],
      providers: [
        provideRouter([]),
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideComponent(RegistroPage, {
        set: {
          imports: [ReactiveFormsModule, RouterLink],
          template: `<form [formGroup]="form"></form>`,
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------
  // Estado inicial
  // ---------------------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form initially (all fields empty)', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should initialise signals to default values', () => {
    expect(component.generalError()).toBeNull();
    expect(component.fieldErrors()).toEqual({});
    expect(component.isSubmitting()).toBe(false);
    expect(component.success()).toBe(false);
  });

  // ---------------------------------------------------------------
  // Guard del formulario — onSubmit se omite si es inválido o ya está enviando
  // ---------------------------------------------------------------

  it('should NOT call usersService.create when form is invalid', () => {
    component.onSubmit();
    expect(usersServiceMock.create).not.toHaveBeenCalled();
  });

  it('should NOT call usersService.create when already submitting', () => {
    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.isSubmitting.set(true);
    component.onSubmit();
    expect(usersServiceMock.create).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // Guard de contraseñas no coincidentes
  // ---------------------------------------------------------------

  it('should set fieldErrors.passwordConfirmation when passwords do not match', () => {
    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'different',
    });

    component.onSubmit();

    expect(usersServiceMock.create).not.toHaveBeenCalled();
    expect(component.fieldErrors()['passwordConfirmation']).toBe('Las contraseñas no coinciden');
  });

  // ---------------------------------------------------------------
  // Camino feliz — éxito
  // ---------------------------------------------------------------

  it('should call usersService.create with correct payload', () => {
    usersServiceMock.create.mockReturnValue(
      of({ errors: false, data: { id: 1, username: 'alice' } })
    );

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });

    component.onSubmit();

    expect(usersServiceMock.create).toHaveBeenCalledWith({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
    });
  });

  it('should set success=true on successful response', () => {
    usersServiceMock.create.mockReturnValue(
      of({ errors: false, data: { id: 1, username: 'alice' } })
    );

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });

    component.onSubmit();

    expect(component.success()).toBe(true);
  });

  it('should navigate to /login?newUser=username after 2s on success', () => {
    vi.useFakeTimers();
    usersServiceMock.create.mockReturnValue(
      of({ errors: false, data: { id: 1, username: 'alice' } })
    );
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });

    component.onSubmit();
    expect(navigateSpy).not.toHaveBeenCalled(); // todavía no

    vi.advanceTimersByTime(2000);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { newUser: 'alice' },
    });

    vi.useRealTimers();
  });

  // ---------------------------------------------------------------
  // handler next — el backend devuelve errors:true (errores de validación en el body)
  // ---------------------------------------------------------------

  it('should populate fieldErrors from backend validation response (next, errors:true)', () => {
    usersServiceMock.create.mockReturnValue(
      of({
        errors: true,
        errorsList: {
          username: 'El nombre de usuario ya está en uso',
          email: 'El email ya está registrado',
        },
      })
    );

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.onSubmit();

    expect(component.fieldErrors()['username']).toBe('El nombre de usuario ya está en uso');
    expect(component.fieldErrors()['email']).toBe('El email ya está registrado');
    expect(component.isSubmitting()).toBe(false);
    expect(component.success()).toBe(false);
  });

  it('should set generalError for non-field errors in validation response', () => {
    usersServiceMock.create.mockReturnValue(
      of({
        errors: true,
        errorsList: {
          registration: 'Los registros están cerrados temporalmente',
        },
      })
    );

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.onSubmit();

    expect(component.generalError()).toBe('Los registros están cerrados temporalmente');
    expect(component.fieldErrors()['registration']).toBeUndefined();
  });

  // ---------------------------------------------------------------
  // handler de error — Formato 1: error.error.errors === true + errorsList
  // ---------------------------------------------------------------

  it('should handle HTTP error format 1 (error.error.errors:true + errorsList) — field errors', () => {
    usersServiceMock.create.mockReturnValue(
      throwError(() => ({
        error: {
          errors: true,
          errorsList: {
            username: 'Nombre de usuario no disponible',
          },
        },
      }))
    );

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.onSubmit();

    expect(component.fieldErrors()['username']).toBe('Nombre de usuario no disponible');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should handle HTTP error format 1 — non-field errors go to generalError', () => {
    usersServiceMock.create.mockReturnValue(
      throwError(() => ({
        error: {
          errors: true,
          errorsList: {
            general: 'Registro no disponible',
          },
        },
      }))
    );

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.onSubmit();

    expect(component.generalError()).toBe('Registro no disponible');
    expect(component.isSubmitting()).toBe(false);
  });

  // ---------------------------------------------------------------
  // handler de error — Formato 2: 422 Laravel (error.error.errors como arrays)
  // ---------------------------------------------------------------

  it('should handle HTTP 422 Laravel error format', () => {
    usersServiceMock.create.mockReturnValue(
      throwError(() => ({
        status: 422,
        error: {
          errors: {
            email: ['El campo email es obligatorio', 'El email no es válido'],
            name: ['El nombre es obligatorio'],
          },
        },
      }))
    );

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.onSubmit();

    expect(component.fieldErrors()['email']).toBe('El campo email es obligatorio'); // solo el primer mensaje
    expect(component.fieldErrors()['name']).toBe('El nombre es obligatorio');
    expect(component.isSubmitting()).toBe(false);
  });

  // ---------------------------------------------------------------
  // handler de error — Formato 3: mensaje genérico de fallback
  // ---------------------------------------------------------------

  it('should set generic generalError as fallback for unrecognised error format', () => {
    usersServiceMock.create.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.onSubmit();

    expect(component.generalError()).toBe('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    expect(component.isSubmitting()).toBe(false);
  });

  // ---------------------------------------------------------------
  // Ciclo de vida de isSubmitting
  // ---------------------------------------------------------------

  it('should set isSubmitting=true while waiting for response', () => {
    // Usar un Subject para poder pausar el observable a mitad de vuelo
    const subject = new Subject<any>();
    usersServiceMock.create.mockReturnValue(subject.asObservable());

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
  });

  // ---------------------------------------------------------------
  // Helper getFieldError
  // ---------------------------------------------------------------

  it('getFieldError should return field message when present', () => {
    component.fieldErrors.set({ email: 'Formato inválido' });
    expect(component.getFieldError('email')).toBe('Formato inválido');
  });

  it('getFieldError should return null for fields with no error', () => {
    component.fieldErrors.set({});
    expect(component.getFieldError('email')).toBeNull();
  });

  // ---------------------------------------------------------------
  // El estado se limpia al intentar un nuevo envío
  // ---------------------------------------------------------------

  it('should clear previous errors when a new submission starts', () => {
    usersServiceMock.create.mockReturnValue(of({ errors: false }));

    component.generalError.set('Error previo');
    component.fieldErrors.set({ email: 'Error previo' });

    component.form.setValue({
      name: 'Alice',
      username: 'alice',
      email: 'alice@test.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    });
    component.onSubmit();

    // Tras un éxito limpio, el estado queda limpio
    expect(component.generalError()).toBeNull();
    expect(component.fieldErrors()).toEqual({});
  });
});
