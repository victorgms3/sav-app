import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API_URL   = 'http://localhost:8080/auth';
  private readonly TOKEN_KEY = 'savapp_jwt_token';

  // Signal : toute l'app est informée en temps réel si tu es connecté ou non
  public isAuthenticated = signal<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  /**
   * Envoie les identifiants à l'API et stocke le token JWT reçu.
   */
  login(credential: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credential).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  /**
   * Supprime le token et déconnecte l'utilisateur.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
  }

  /**
   * Retourne le token JWT stocké, ou null si absent.
   * Utilisé par l'AuthInterceptor pour injecter le header Authorization.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Vérifie si un token est présent dans le localStorage.
   * Appelé au démarrage pour initialiser le signal isAuthenticated.
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}