import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Ingredient } from '../../models/ingredient.model';
import { Recette } from '../../models/recette.model';
import { IngredientService } from '../../services/ingredient.service';
import { LigneIngredientFormDTO, RecetteFormDTO, RecetteService } from '../../services/Recette.service';

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

  // ── Mode ─────────────────────────────────────────────────────
  editId: number | null = null;
  get isEdit(): boolean { return this.editId !== null; }

  // ── Formulaire ───────────────────────────────────────────────
  titre: string = '';
  description: string = '';
  surgraissage: number = 5;
  avecSoude: boolean = true;
  concentrationAlcalin: number = 30;   // ⚠️ nom identique au DTO Kotlin
  lignes: LigneForm[] = [];

  // ── Données ──────────────────────────────────────────────────
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

  // ── Chargement ───────────────────────────────────────────────

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
        this.titre              = recette.titre;
        this.description        = recette.description ?? '';
        this.surgraissage       = recette.surgraissage;
        this.avecSoude          = recette.avecSoude;
        // Le champ retourné par l'API peut s'appeler concentrationAlcali ou concentrationAlcalin
        this.concentrationAlcalin = (recette as any).concentrationAlcalin ?? recette.concentrationAlcali ?? 30;
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

  // ── Lignes corps gras ────────────────────────────────────────

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

  isIngredientUsed(ingredientId: number, currentIndex: number): boolean {
    return this.lignes.some((l, i) => i !== currentIndex && l.ingredientId === ingredientId);
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
      this.concentrationAlcalin >= 20 && this.concentrationAlcalin <= 50
    );
  }

  // ── Construction du DTO ──────────────────────────────────────

  buildDTO(): RecetteFormDTO {
    const total = this.masseTotal;
    return {
      titre:               this.titre.trim(),
      description:         this.description.trim(),   // string vide ok, pas undefined
      surgraissage:        this.surgraissage,
      avecSoude:           this.avecSoude,
      concentrationAlcalin: this.concentrationAlcalin, // ⚠️ champ Kotlin exact
      ligneIngredients:    this.lignes.map(l => ({
        ingredientId: l.ingredientId!,
        recetteId:    this.editId,                     // null en création, id en édition
        quantite:     l.quantite,
        pourcentage:  total > 0
                        ? Math.round((l.quantite / total) * 100 * 100) / 100
                        : 0,
      } as LigneIngredientFormDTO)),
    };
  }

  // ── Soumission ───────────────────────────────────────────────

  simuler(): void {
    if (!this.isFormValid) return;
    this.isSaving   = true;
    this.errorMsg   = '';
    this.successMsg = '';

    const dto = this.buildDTO();

    const call$ = this.isEdit
      ? this.recetteService.updateRecette(this.editId!, dto)
      : this.recetteService.addRecette(dto);

    call$.subscribe({
      next: (recette) => {
        this.recetteCalculee = recette;
        this.isSaving        = false;
        if (!this.isEdit) {
          this.editId = recette.id;   // passe en mode édition après la première création
        }
        this.successMsg = this.isEdit
          ? 'Recette mise à jour avec succès !'
          : 'Recette créée et calculée !';
      },
      error: (err) => {
        console.error('Erreur API :', err);
        this.errorMsg = `Erreur ${err.status ?? ''} : ${err.error?.message ?? 'Vérifiez que l\'API est disponible.'}`;
        this.isSaving = false;
      },
    });
  }

  // ── Utilitaires résultats ────────────────────────────────────

  getInsScore(): number {
    const r = this.recetteCalculee?.resultats?.find(
      res => res.caracteristique?.nom?.toLowerCase().includes('ins') ||
             res.caracteristique?.nom?.toLowerCase() === 'indice ins'
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