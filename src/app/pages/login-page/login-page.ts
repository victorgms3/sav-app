import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {

  // ── Champs du formulaire ─────────────────────────────────────
  email: string = '';
  password: string = '';

  // ── États ────────────────────────────────────────────────────
  isLoading: boolean = false;
  errorMsg: string = '';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ── Soumission ───────────────────────────────────────────────
  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.isLoading = true;
    this.errorMsg  = '';

    const credentials = {
      identifier:    this.email,
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/recipe-manager']); // Redirige après connexion
      },
      error: (err :any) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMsg = 'Email ou mot de passe incorrect.';
        } else if (err.status === 0) {
          this.errorMsg = 'Impossible de contacter le serveur. Vérifiez que l\'API est lancée.';
        } else {
          this.errorMsg = `Erreur ${err.status} : connexion impossible.`;
        }
      },
    });
  }
}