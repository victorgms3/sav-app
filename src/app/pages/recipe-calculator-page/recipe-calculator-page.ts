import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Ingredient } from '../../models/ingredient.model';
import { Recette, Resultat } from '../../models/recette.model';
import { IngredientService } from '../../services/ingredient.service';
import { RecetteFormDTO, RecetteService } from '../../services/Recette.service';

interface LigneForm {
  ingredient: Ingredient | null;
  ingredientId: number | null;
  quantite: number;
}

@Component({
  selector: 'app-recipe-calculator-page',
  templateUrl: './recipe-calculator-page.html',
  styleUrl: './recipe-calculator-page.css',
  imports: [CommonModule, FormsModule, RouterModule],
})
export class RecipeCalculatorPage implements OnInit {

  // ── Mode ────────────────────────────────────────────────────
  editId: number | null = null;
  get isEdit(): boolean { return this.editId !== null; }

  // ── Formulaire ──────────────────────────────────────────────
  titre: string = '';
  description: string = '';
  surgraissage: number = 5;
  avecSoude: boolean = true;
  concentrationAlcali: number = 30;
  lignes: LigneForm[] = [];

  // ── Données ─────────────────────────────────────────────────
  allIngredients: Ingredient[] = [];
  recetteCalculee: Recette | null = null;

  // ── États ────────────────────────────────────────────────────
  isLoadingIngredients: boolean = false;
  isLoadingRecette: boolean = false;
  isSaving: boolean = false;
  errorMsg: string = '';
  successMsg: string = '';

  constructor(
    private ingredientService: IngredientService,
    private recetteService: RecetteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadIngredients();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.loadRecetteToEdit(this.editId);
    } else {
      this.addLigne();
    }
  }

  // ── Chargement des données ───────────────────────────────────

  loadIngredients(): void {
    this.isLoadingIngredients = true;
    this.ingredientService.getIngredients().subscribe({
      next: (data) => {
        this.allIngredients = data.filter(i => i.estCorpsGras);
        this.isLoadingIngredients = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les ingrédients.';
        this.isLoadingIngredients = false;
      },
    });
  }

  loadRecetteToEdit(id: number): void {
    this.isLoadingRecette = true;
    this.recetteService.getRecetteById(id).subscribe({
      next: (recette) => {
        this.titre = recette.titre;
        this.description = recette.description ?? '';
        this.surgraissage = recette.surgraissage;
        this.avecSoude = recette.avecSoude;
        this.concentrationAlcali = recette.concentrationAlcali;
        this.lignes = recette.ligneIngredients.map(l => ({
          ingredient: l.ingredient,
          ingredientId: l.ingredient.id,
          quantite: l.quantite,
        }));
        this.recetteCalculee = recette;
        this.isLoadingRecette = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger la recette à modifier.';
        this.isLoadingRecette = false;
      },
    });
  }

  // ── Gestion des lignes ───────────────────────────────────────

  addLigne(): void {
    this.lignes.push({ ingredient: null, ingredientId: null, quantite: 100 });
  }

  removeLigne(index: number): void {
    this.lignes.splice(index, 1);
    this.recetteCalculee = null;
  }

  onIngredientChange(index: number): void {
    const id = this.lignes[index].ingredientId;
    this.lignes[index].ingredient = this.allIngredients.find(i => i.id === +id!) ?? null;
    this.recetteCalculee = null;
  }

  /** Ingrédients déjà sélectionnés (pour éviter les doublons) */
  isIngredientUsed(ingredientId: number, currentIndex: number): boolean {
    return this.lignes.some(
      (l, i) => i !== currentIndex && l.ingredientId === ingredientId
    );
  }

  // ── Calculs locaux ───────────────────────────────────────────

  get masseTotal(): number {
    return this.lignes.reduce((acc, l) => acc + (l.quantite || 0), 0);
  }

  pourcentage(quantite: number): number {
    return this.masseTotal > 0 ? Math.round((quantite / this.masseTotal) * 100) : 0;
  }

  // ── Validation ───────────────────────────────────────────────

  get isFormValid(): boolean {
    return (
      this.titre.trim().length > 0 &&
      this.lignes.length > 0 &&
      this.lignes.every(l => l.ingredientId !== null && l.quantite > 0) &&
      this.surgraissage >= 0 && this.surgraissage <= 30 &&
      this.concentrationAlcali >= 20 && this.concentrationAlcali <= 50
    );
  }

  // ── Soumission ───────────────────────────────────────────────

  buildDTO(): RecetteFormDTO {
    return {
      titre: this.titre.trim(),
      description: this.description.trim() || undefined,
      surgraissage: this.surgraissage,
      avecSoude: this.avecSoude,
      concentrationAlcali: this.concentrationAlcali,
      ligneIngredients: this.lignes.map(l => ({
        ingredientId: l.ingredientId!,
        quantite: l.quantite,
      })),
    };
  }

  simuler(): void {
    if (!this.isFormValid) return;
    this.isSaving = true;
    this.errorMsg = '';
    this.successMsg = '';
    const dto = this.buildDTO();

    const call$ = this.isEdit
      ? this.recetteService.updateRecette(this.editId!, dto)
      : this.recetteService.addRecette(dto);

    call$.subscribe({
      next: (recette) => {
        this.recetteCalculee = recette;
        this.isSaving = false;
        if (!this.isEdit) {
          // Passe en mode édition après la première création
          this.editId = recette.id;
        }
        this.successMsg = this.isEdit
          ? 'Recette mise à jour avec succès !'
          : 'Recette créée et calculée !';
      },
      error: (err) => {
        this.errorMsg = 'Erreur lors du calcul. Vérifiez que l\'API est disponible.';
        this.isSaving = false;
      },
    });
  }

  sauvegarderEtQuitter(): void {
    this.simuler();
    if (!this.errorMsg) {
      this.router.navigate(['/recipe-manager']);
    }
  }

  // ── Utilitaires résultats ────────────────────────────────────

  getInsScore(): number {
    const r = this.recetteCalculee?.resultats?.find(
      res => res.caracteristique?.nom?.toLowerCase() === 'ins'
    );
    return r?.score ?? 0;
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

  barWidth(score: number): number {
    return Math.min(100, Math.max(0, score));
  }

  nomAlcali(): string {
    return this.avecSoude ? 'NaOH (Soude caustique)' : 'KOH (Potasse)';
  }
}