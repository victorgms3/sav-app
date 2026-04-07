import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Ingredient } from '../../models/ingredient.model';
import { Recette } from '../../models/recette.model';
import { AuthService } from '../../services/auth.service';
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
  get isEdit(): boolean  { return this.editId !== null; }
  get isGuest(): boolean { return !this.authService.isAuthenticated(); }

  // ── Formulaire ───────────────────────────────────────────────
  titre:                string  = '';
  description:          string  = '';
  surgraissage:         number  = 5;
  avecSoude:            boolean = true;
  concentrationAlcalin: number  = 30;
  lignes:               LigneForm[] = [];

  // ── Données ──────────────────────────────────────────────────
  allIngredients:  Ingredient[] = [];
  recetteCalculee: Recette | null = null;

  /** Statistiques sur les ingrédients */
  ingredientStats: { nom: string; occurrences: number }[] = [];

  // ── États ────────────────────────────────────────────────────
  isLoadingIngredients: boolean = false;
  isLoadingRecette:     boolean = false;
  isSaving:             boolean = false;
  errorMsg:             string  = '';
  successMsg:           string  = '';

  constructor(
    private ingredientService: IngredientService,
    private recetteService:    RecetteService,
    public  authService:       AuthService,
    private route:             ActivatedRoute,
    private router:            Router
  ) {}

  ngOnInit(): void {
    this.loadIngredients();
    /** Charge les statistiques des ingrédients si l'utilisateur n'est pas invité */
    // if (!this.isGuest) { this.loadIngredientStats(); }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.loadRecetteToEdit(this.editId);
    } else {
      this.addLigne();
    }
  }

  // ── Chargement ───────────────────────────────────────────────
/**  Charge les statistiques d'utilisation des ingrédients dans les recettes (pour affichage dans la sidebar) 
  loadIngredientStats(): void {
    this.recetteService.getRecettes().subscribe({
      next: (recettes) => {
        const counts = new Map<string, number>();
        for (const recette of recettes) {
          for (const ligne of recette.ligneIngredients) {
            const nom = ligne.ingredient.nom;
            counts.set(nom, (counts.get(nom) ?? 0) + 1);
          }
        }
        this.ingredientStats = Array.from(counts.entries())
          .map(([nom, occurrences]) => ({ nom, occurrences }))
          .sort((a, b) => b.occurrences - a.occurrences);
      },
      error: () => {},
    });
  }
    */

  loadIngredients(): void {
    this.isLoadingIngredients = true;
    this.ingredientService.getIngredients().subscribe({
      next: (data) => {
        this.allIngredients       = data.filter(i => i.estCorpsGras);
        this.isLoadingIngredients = false;
      },
      error: () => {
        this.errorMsg             = 'Impossible de charger les ingrédients.';
        this.isLoadingIngredients = false;
      },
    });
  }

  loadRecetteToEdit(id: number): void {
    this.isLoadingRecette = true;
    this.recetteService.getRecetteById(id).subscribe({
      next: (recette) => {
        this.titre                = recette.titre;
        this.description          = recette.description ?? '';
        this.surgraissage         = recette.surgraissage;
        this.avecSoude            = recette.avecSoude;
        this.concentrationAlcalin = (recette as any).concentrationAlcalin
                                    ?? recette.concentrationAlcali ?? 30;
        this.lignes = recette.ligneIngredients.map(l => ({
          ingredient:   l.ingredient,
          ingredientId: l.ingredient.id,
          quantite:     l.quantite,
        }));
        this.recetteCalculee  = recette;
        this.isLoadingRecette = false;
      },
      error: () => {
        this.errorMsg         = 'Impossible de charger la recette à modifier.';
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
    this.lignes[index].ingredient =
      this.allIngredients.find(i => i.id === +id!) ?? null;
    this.recetteCalculee = null;
  }

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
    return this.masseTotal > 0
      ? Math.round((quantite / this.masseTotal) * 100)
      : 0;
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

  // ── Calcul CLIENT-SIDE ───────────────────────────────────────

  /**
   * Calcule la recette entièrement dans le navigateur, sans appel API.
   * - Invité : seule option disponible
   * - Connecté : prévisualisation instantanée avant enregistrement
   *
   * Formules :
   *   qteAlcali = Σ(quantite × sapo) × (1 − surgraissage%) × facteurAlcali
   *   Caractéristiques = moyennes pondérées par le % de chaque corps gras
   */
  calculerLocal(): void {
    const total = this.masseTotal;
    if (total === 0) return;

    // Quantité alcali
    const sapTotal       = this.lignes.reduce(
      (acc, l) => acc + l.quantite * (l.ingredient?.sapo ?? 0), 0
    );
    const facteurAlcali  = this.avecSoude ? 1 : 1.403; // KOH ≈ NaOH × 1.403
    const qteAlcali      = sapTotal * (1 - this.surgraissage / 100) * facteurAlcali;

    // Moyenne pondérée d'une propriété
    const moy = (getter: (i: Ingredient) => number) =>
      this.lignes.reduce(
        (acc, l) => acc + (l.quantite / total) * getter(l.ingredient!), 0
      );

    // Construction de l'objet Recette local
    // (imite la structure de l'API pour réutiliser les mêmes templates)
    this.recetteCalculee = {
      id:                  this.editId ?? 0,
      titre:               this.titre,
      description:         this.description,
      surgraissage:        this.surgraissage,
      avecSoude:           this.avecSoude,
      concentrationAlcali: this.concentrationAlcalin,
      qteAlcali:           Math.round(qteAlcali * 10) / 10,
      ligneIngredients:    this.lignes.map(l => ({
        ingredient:  l.ingredient!,
        quantite:    l.quantite,
        pourcentage: Math.round((l.quantite / total) * 100 * 10) / 10,
      })),
      resultats: [
        { score: Math.round(moy(i => i.ins)         * 100) / 100, mention: null, caracteristique: { id: 1, nom: 'Indice INS'       } },
        { score: Math.round(moy(i => i.iode)        * 100) / 100, mention: null, caracteristique: { id: 2, nom: 'Iode'             } },
        { score: Math.round(moy(i => i.douceur)     * 100) / 100, mention: null, caracteristique: { id: 3, nom: 'Douceur'          } },
        { score: Math.round(moy(i => i.lavant)      * 100) / 100, mention: null, caracteristique: { id: 4, nom: 'Lavant'           } },
        { score: Math.round(moy(i => i.volMousse)   * 100) / 100, mention: null, caracteristique: { id: 5, nom: 'Volume de Mousse' } },
        { score: Math.round(moy(i => i.tenueMousse) * 100) / 100, mention: null, caracteristique: { id: 6, nom: 'Tenue de Mousse'  } },
        { score: Math.round(moy(i => i.durete)      * 100) / 100, mention: null, caracteristique: { id: 7, nom: 'Dureté'           } },
        { score: Math.round(moy(i => i.solubilite)  * 100) / 100, mention: null, caracteristique: { id: 8, nom: 'Solubilité'       } },
        { score: Math.round(moy(i => i.sechage)     * 100) / 100, mention: null, caracteristique: { id: 9, nom: 'Séchage'          } },
      ],
    } as any;
  }

  // ── DTO pour l'API ───────────────────────────────────────────

  buildDTO(): RecetteFormDTO {
    const total = this.masseTotal;
    return {
      titre:                this.titre.trim(),
      description:          this.description.trim(),
      surgraissage:         this.surgraissage,
      avecSoude:            this.avecSoude,
      concentrationAlcalin: this.concentrationAlcalin,
      ligneIngredients:     this.lignes.map(l => ({
        ingredientId: l.ingredientId!,
        recetteId:    this.editId,
        quantite:     l.quantite,
        pourcentage:  total > 0
          ? Math.round((l.quantite / total) * 10000) / 100
          : 0,
      } as LigneIngredientFormDTO)),
    };
  }

  // ── Actions ──────────────────────────────────────────────────

  /**
   * Calcul immédiat côté client — accessible à tous (invité + connecté).
   */
  simuler(): void {
    if (!this.isFormValid) return;
    this.errorMsg   = '';
    this.successMsg = '';
    this.calculerLocal();
  }

  /**
   * Enregistre via l'API — réservé aux utilisateurs connectés.
   */
  enregistrer(): void {
    if (!this.isFormValid || this.isGuest) return;
    this.isSaving   = true;
    this.errorMsg   = '';
    this.successMsg = '';

    const dto   = this.buildDTO();
    const call$ = this.isEdit
      ? this.recetteService.updateRecette(this.editId!, dto)
      : this.recetteService.addRecette(dto);

    call$.subscribe({
      next: (recette) => {
        this.recetteCalculee = recette; // remplace calcul local par réponse API
        this.isSaving        = false;
        if (!this.isEdit) this.editId = recette.id;
        this.successMsg = this.isEdit
          ? 'Recette mise à jour avec succès !'
          : 'Recette enregistrée avec succès !';
      },
      error: (err) => {
        console.error('Erreur API :', err);
        this.errorMsg = `Erreur ${err.status ?? ''} : ${
          err.error?.message ?? 'Vérifiez que l\'API est disponible.'
        }`;
        this.isSaving = false;
      },
    });
  }

  // ── Utilitaires résultats ────────────────────────────────────

  getInsScore(): number {
    return this.recetteCalculee?.resultats?.find(
      r => r.caracteristique?.nom?.toLowerCase().includes('ins')
    )?.score ?? 0;
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