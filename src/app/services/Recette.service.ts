import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Recette } from '../models/recette.model';

/** DTO envoyé à l'API pour créer ou modifier une recette */
export interface LigneIngredientFormDTO {
  ingredientId: number;
  quantite: number;
}

export interface RecetteFormDTO {
  id?: number;
  titre: string;
  description?: string;
  surgraissage: number;
  avecSoude: boolean;
  concentrationAlcali: number;
  ligneIngredients: LigneIngredientFormDTO[];
}

@Injectable({
  providedIn: 'root',
})
export class RecetteService {
  private readonly API_URL_RECETTE = 'http://localhost:8080/api-savon/v1/recette';

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste de toutes les recettes.
   */
  getRecettes(): Observable<Recette[]> {
    return this.http.get<Recette[]>(this.API_URL_RECETTE);
  }

  /**
   * Récupère une recette par son identifiant.
   */
  getRecetteById(id: number): Observable<Recette> {
    return this.http.get<Recette>(`${this.API_URL_RECETTE}/${id}`);
  }

  /**
   * Crée une nouvelle recette via le simulateur.
   * L'API attend un RecetteFormDTO et retourne la Recette calculée.
   */
  addRecette(dto: RecetteFormDTO): Observable<Recette> {
    return this.http.post<Recette>(this.API_URL_RECETTE, dto);
  }

  /**
   * Met à jour une recette existante via le simulateur.
   * L'API attend un RecetteFormDTO avec l'id dans l'URL.
   */
  updateRecette(id: number, dto: RecetteFormDTO): Observable<Recette> {
    return this.http.put<Recette>(`${this.API_URL_RECETTE}/${id}`, dto);
  }

  /**
   * Supprime une recette par son ID.
   */
  deleteRecette(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_RECETTE}/${id}`);
  }

  /**
   * Supprime toutes les recettes de la base.
   */
  deleteAllRecettes(): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_RECETTE}/all`);
  }
}