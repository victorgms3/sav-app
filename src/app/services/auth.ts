import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API_URL   = 'http://localhost:8080/auth';
  private readonly TOKEN_KEY = 'savapp_jwt_token';

  private router = inject(Router);

  constructor(private http: HttpClient) {}

  // ── Connexion ────────────────────────────────────────────────

  login(credential: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credential).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
        }
      })
    );
  }

  // ── Déconnexion ──────────────────────────────────────────────

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  // ── Token brut ───────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ── État de la session ───────────────────────────────────────

  /** Vérifie si un token est présent (utilisé par AuthGuard) */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ── Décodage du payload JWT ──────────────────────────────────

  /** Décode la partie payload du JWT (Base64 → JSON) */
  private getDecodedToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  // ── Informations utilisateur ─────────────────────────────────

  /** Retourne l'identifiant (sub) contenu dans le JWT */
  getUserIdentifier(): string {
    const decoded = this.getDecodedToken();
    return decoded ? decoded.sub : 'Invité';
  }

  /** Vérifie si l'utilisateur possède un rôle donné (ex: 'ROLE_ADMIN') */
  hasRole(role: string): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded || !decoded.roles) return false;
    return decoded.roles.includes(role);
  }

  /** Retourne toutes les infos utiles du token décodé */
  getUserFullInfo(): { username: string; roles: string[]; expiration: Date } | null {
    const decoded = this.getDecodedToken();
    if (!decoded) return null;
    return {
      username:   decoded.sub,
      roles:      decoded.roles || [],
      expiration: new Date(decoded.exp * 1000),  // exp est en secondes Unix
    };
  }
}