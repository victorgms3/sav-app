import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Recette, Resultat } from '../../models/recette.model';
import { RecetteService } from '../../services/Recette.service';
import { RecetteRadarComponent } from '../recette-radar/recette-radar';

@Component({
  selector: 'app-recipe-manager-page',
  templateUrl: './recipe-manager-page.html',
  styleUrl: './recipe-manager-page.css',
  imports: [CommonModule, FormsModule, RouterModule, RecetteRadarComponent],
})
export class RecipeManagerPage implements OnInit {
  public recettes: Recette[] = [];
  public filteredRecettes: Recette[] = [];
  public searchTerm: string = '';
  public sortField: 'titre' | 'ins' | 'surgraissage' = 'titre';
  public sortAsc: boolean = true;

  public viewMode: 'grid' | 'list' = 'grid';
  public recetteDetail: Recette | null = null;
  public isLoading: boolean = false;
  public errorMsg: string = '';

  constructor(private recetteService: RecetteService) {}

  ngOnInit(): void {
    this.getRecettes();
  }

  // ── Chargement ───────────────────────────────────────────────
  getRecettes(): void {
    this.isLoading = true;
    this.errorMsg = '';
    this.recetteService.getRecettes().subscribe({
      next: (data) => {
        this.recettes = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur API : ', err);
        this.errorMsg =
          'Impossible de charger les recettes. Vérifiez que votre API est lancée sur le port 8080.';
        this.isLoading = false;
      },
    });
  }

  // ── Recherche & tri ──────────────────────────────────────────
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let result = term
      ? this.recettes.filter(
          (r) =>
            r.titre.toLowerCase().includes(term) ||
            (r.description ?? '').toLowerCase().includes(term)
        )
      : [...this.recettes];

    result.sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      if (this.sortField === 'ins') {
        va = this.getInsScore(a);
        vb = this.getInsScore(b);
      } else {
        va = a[this.sortField] as string | number;
        vb = b[this.sortField] as string | number;
      }
      return this.sortAsc
        ? va < vb ? -1 : va > vb ? 1 : 0
        : va > vb ? -1 : va < vb ? 1 : 0;
    });

    this.filteredRecettes = result;
  }

  setSort(field: 'titre' | 'ins' | 'surgraissage'): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  // ── Actions ──────────────────────────────────────────────────
  voirDetail(recette: Recette): void {
    this.recetteDetail = recette;
  }

  fermerDetail(): void {
    this.recetteDetail = null;
  }

  deleteRecette(id: number): void {
    if (confirm('Supprimer définitivement cette recette ?')) {
      this.recetteService.deleteRecette(id).subscribe({
        next: () => this.getRecettes(),
        error: (err: any) => console.error('Erreur suppression : ', err),
      });
    }
  }

  // ── Utilitaires ──────────────────────────────────────────────

  /** Score INS depuis resultats[] */
  getInsScore(recette: Recette): number {
    const r = recette.resultats?.find(
      (res) => res.caracteristique?.nom?.toLowerCase().includes('ins')
    );
    return r?.score ?? 0;
  }

  /** Masse totale corps gras */
  getMasseTotal(recette: Recette): number {
    return recette.ligneIngredients?.reduce((acc, l) => acc + l.quantite, 0) ?? 0;
  }

  /** Résultat par nom de caractéristique */
  getResultat(recette: Recette, nom: string): Resultat | undefined {
    return recette.resultats?.find(
      (r) => r.caracteristique?.nom?.toLowerCase() === nom.toLowerCase()
    );
  }

  qualiteLabel(ins: number): string {
    if (ins >= 160) return 'Excellente';
    if (ins >= 140) return 'Bonne';
    if (ins >= 120) return 'Correcte';
    return 'À revoir';
  }

  qualiteClass(ins: number): string {
    if (ins >= 160) return 'badge-qualite excellent';
    if (ins >= 140) return 'badge-qualite bon';
    if (ins >= 120) return 'badge-qualite correct';
    return 'badge-qualite faible';
  }

  nomAlcali(recette: Recette): string {
    return recette.avecSoude ? 'NaOH' : 'KOH';
  }
}