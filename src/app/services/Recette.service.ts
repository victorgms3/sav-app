import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Recette } from '../models/recette.model';

/** Correspond exactement à LigneIngredientDTO.kt */
export interface LigneIngredientFormDTO {
  ingredientId: number;
  recetteId: number | null;  // null à la création, renseigné par le backend
  quantite: number;
  pourcentage: number;       // calculé côté front avant envoi
}

/** Correspond exactement à RecetteFormDTO.kt */
export interface RecetteFormDTO {
  id?: number;
  titre: string;
  description: string;
  surgraissage: number;
  avecSoude: boolean;
  concentrationAlcalin: number;  // ⚠️ avec 'n' final — pas "concentrationAlcali"
  ligneIngredients: LigneIngredientFormDTO[];
}

@Injectable({
  providedIn: 'root',
})
export class RecetteService {
  private readonly API_URL_RECETTE = 'http://localhost:8080/api-savon/v1/recette';

  constructor(private http: HttpClient) {}

  getRecettes(): Observable<Recette[]> {
    return this.http.get<Recette[]>(this.API_URL_RECETTE);
  }

  getRecetteById(id: number): Observable<Recette> {
    return this.http.get<Recette>(`${this.API_URL_RECETTE}/${id}`);
  }

  /** Crée une nouvelle recette — POST avec RecetteFormDTO */
  addRecette(dto: RecetteFormDTO): Observable<Recette> {
    return this.http.post<Recette>(this.API_URL_RECETTE, dto);
  }

  /** Met à jour une recette — PUT /:id avec RecetteFormDTO */
  updateRecette(id: number, dto: RecetteFormDTO): Observable<Recette> {
    return this.http.put<Recette>(`${this.API_URL_RECETTE}/${id}`, dto);
  }

  deleteRecette(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_RECETTE}/${id}`);
  }

  deleteAllRecettes(): Observable<void> {
    return this.http.delete<void>(`${this.API_URL_RECETTE}/all`);
  }
}