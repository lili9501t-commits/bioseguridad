import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly verPassword = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cargando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.error.set(null));
  }

  protected invalido(campo: 'correo' | 'password'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    const { correo, password } = this.form.getRawValue();
    const resultado = this.auth.login(correo, password);
    this.cargando.set(false);

    if (resultado.ok) {
      this.router.navigateByUrl(this.auth.rutaInicio(resultado.usuario.rol));
    } else {
      this.error.set(resultado.error);
    }
  }
}
