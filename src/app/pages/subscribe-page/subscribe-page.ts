import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-subscribe-page',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './subscribe-page.html',
  styleUrl: './subscribe-page.css',
})
export class SubscribePage {

  // ── Champs du formulaire ─────────────────────────────────────
  identifier: string = '';   // email / identifiant
  password:   string = '';
  confirm:    string = '';

  // ── États ────────────────────────────────────────────────────
  isLoading:    boolean = false;
  errorMsg:     string  = '';
  successMsg:   string  = '';
  showPassword: boolean = false;

  private readonly API_URL = 'http://localhost:8080/auth/register';

  constructor(
    private http:   HttpClient,
    private router: Router
  ) {}

  // ── Validation locale ────────────────────────────────────────
  get passwordMismatch(): boolean {
    return this.confirm.length > 0 && this.password !== this.confirm;
  }

  get isFormValid(): boolean {
    return (
      this.identifier.trim().length > 0 &&
      this.password.length >= 6 &&
      this.password === this.confirm
    );
  }

  // ── Soumission ───────────────────────────────────────────────
  onSubmit(): void {
    if (!this.isFormValid) return;

    this.isLoading  = true;
    this.errorMsg   = '';
    this.successMsg = '';

    const payload = {
      identifier: this.identifier.trim(),
      password:   this.password,
    };

    this.http.post(this.API_URL, payload).subscribe({
      next: () => {
        this.isLoading  = false;
        this.successMsg = 'Compte créé ! Vous pouvez vous connecter.';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 409) {
          this.errorMsg = 'Cet identifiant est déjà utilisé.';
        } else if (err.status === 0) {
          this.errorMsg = 'Impossible de contacter le serveur.';
        } else {
          this.errorMsg = `Erreur ${err.status} : inscription impossible.`;
        }
      },
    });
  }
}