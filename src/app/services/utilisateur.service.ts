import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Utilisateur } from '../models/utilisateur.model';


@Injectable({
  providedIn: 'root',
})
export class UtilisateurService {

  private readonly API_URL = 'http://localhost:8080/api-savon/v1/utilisateur';

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste de tous les utilisateurs (Admin uniquement).
   */
  getUtilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.API_URL);
  }

  /**
   * Récupère un utilisateur par son ID.
   */
  getUtilisateurById(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.API_URL}/${id}`);
  }
}

// Pas dispo, attente de mise a jour de l'API :
// - GET /api-savon/v1/utilisateurs → liste de tous les utilisateurs (Admin uniquement)
// - GET /api-savon/v1/utilisateurs/{id} → détails d'un utilisateur par son ID (Admin uniquement)