import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Utilisateur } from '../../models/utilisateur.model';
import { UtilisateurService } from '../../services/utilisateur.service';
import { RecetteService } from '../../services/Recette.service';

export interface RecetteAdmin {
  id:                   number;
  titre:                string;
  description:          string;
  surgraissage:         number;
  avecSoude:            boolean;
  concentrationAlcalin: number;
  qteAlcalin:           number;
  ligneIngredients:     any[];
  resultats:            any[];
  proprietaire:         { id: number; username: string; email: string };
}

@Component({
  selector: 'app-admin-recipes-page',
  templateUrl: './admin-recipes-page.html',
  styleUrl: './admin-recipes-page.css',
  imports: [CommonModule, FormsModule, RouterModule],
})
export class AdminRecipesPage implements OnInit {

  recettes:         RecetteAdmin[] = [];
  filteredRecettes: RecetteAdmin[] = [];

  searchTerm:  string = '';
  filterUser:  string = '';
  sortField:   'titre' | 'proprietaire' | 'surgraissage' | 'ins' = 'proprietaire';
  sortAsc:     boolean = true;

  recetteDetail:   RecetteAdmin | null = null;
  confirmDeleteId: number | null = null;

  isLoading: boolean = false;
  errorMsg:  string  = '';

  get utilisateurs(): string[] {
    return [...new Set(this.recettes.map(r => r.proprietaire.username))].sort();
  }

  constructor(
    private utilisateurService: UtilisateurService,
    private recetteService:     RecetteService,
  ) {}

  ngOnInit(): void {
    this.loadRecettes();
  }

  loadRecettes(): void {
    this.isLoading = true;
    this.errorMsg  = '';

    // On appelle directement l'endpoint des recettes globales
    this.recetteService.getAllRecettesAdmin().subscribe({
      next: (recettesBrutes: any[]) => {
        
        // On formate les données reçues pour correspondre à l'interface RecetteAdmin
        this.recettes = recettesBrutes.map(r => ({
          ...r,
          proprietaire: {
            // Le backend Spring renvoie l'objet sous le nom "utilisateur"
            id: r.utilisateur?.id ?? 0,
            username: r.utilisateur?.username ?? 'Utilisateur inconnu',
            email: r.utilisateur?.email ?? ''
          }
        } as RecetteAdmin));

        this.isLoading = false;
        this.applyFilter();
      },
      error: (err) => {
        this.errorMsg  = 'Impossible de charger les recettes.';
        this.isLoading = false;
        console.error('Erreur API Recettes All :', err);
      },
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let result = [...this.recettes];

    if (term) {
      result = result.filter(r =>
        r.titre.toLowerCase().includes(term) ||
        (r.description ?? '').toLowerCase().includes(term)
      );
    }

    if (this.filterUser) {
      result = result.filter(r => r.proprietaire.username === this.filterUser);
    }

    result.sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (this.sortField) {
        case 'proprietaire': va = a.proprietaire.username; vb = b.proprietaire.username; break;
        case 'ins':          va = this.getInsScore(a);     vb = this.getInsScore(b);     break;
        case 'surgraissage': va = a.surgraissage;          vb = b.surgraissage;          break;
        default:             va = a.titre;                 vb = b.titre;
      }
      return this.sortAsc
        ? va < vb ? -1 : va > vb ? 1 : 0
        : va > vb ? -1 : va < vb ? 1 : 0;
    });

    this.filteredRecettes = result;
  }

  setSort(field: typeof this.sortField): void {
    this.sortField === field
      ? (this.sortAsc = !this.sortAsc)
      : (this.sortField = field, this.sortAsc = true);
    this.applyFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterUser = '';
    this.applyFilter();
  }

  voirDetail(r: RecetteAdmin): void {
    this.recetteDetail   = r;
    this.confirmDeleteId = null;
  }

  fermerDetail(): void {
    this.recetteDetail   = null;
    this.confirmDeleteId = null;
  }

  demanderConfirmation(id: number, event: Event): void {
    event.stopPropagation();
    this.confirmDeleteId = id;
  }

  annulerSuppression(): void {
    this.confirmDeleteId = null;
  }

  confirmerSuppression(id: number, event: Event): void {
    event.stopPropagation();
    this.recetteService.deleteRecette(id).subscribe({
      next: () => {
        this.recettes        = this.recettes.filter(r => r.id !== id);
        this.confirmDeleteId = null;
        this.recetteDetail   = null;
        this.applyFilter();
      },
      error: (err) => {
        this.errorMsg        = 'Erreur lors de la suppression.';
        this.confirmDeleteId = null;
        console.error(err);
      },
    });
  }

  getInsScore(r: RecetteAdmin): number {
    return r.resultats?.find(
      (res: any) => res.caracteristique?.nom?.toLowerCase().includes('ins')
    )?.score ?? 0;
  }

  getMasseTotal(r: RecetteAdmin): number {
    return r.ligneIngredients?.reduce(
      (acc: number, l: any) => acc + (l.quantite ?? 0), 0
    ) ?? 0;
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

  nomAlcali(r: RecetteAdmin): string {
    return r.avecSoude ? 'NaOH' : 'KOH';
  }
}