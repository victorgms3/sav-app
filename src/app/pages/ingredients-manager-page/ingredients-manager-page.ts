import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Ingredient } from '../../models/ingredient.model';
import { IngredientService } from '../../services/ingredient.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-ingredients-manager-page',
  templateUrl: './ingredients-manager-page.html',
  styleUrl: './ingredients-manager-page.css',
  imports: [CommonModule, FormsModule],
})
export class IngredientsManagerPage implements OnInit {
  public ingredients: Ingredient[] = [];

  // Objet temporaire pour l'ajout ou la modification
  public ingredientSelectionne: Ingredient | null = null;
  constructor(private ingredientService: IngredientService) {}
  ngOnInit(): void {
    this.getIngredients();
  }
  getIngredients(): void {
    this.ingredientService.getIngredients().subscribe({
      next: (data) => (this.ingredients = data),
      error: (err) => console.error('Erreur API : ', err),
    });
  }
  /** Méthode de test pour ajouter un ingrédient prédéfini (à supprimer ou adapter) 
  testIngredient(): void {
    const test: Ingredient = {
      id: 0,
      nom: 'Test Huile',
      sapo: 135,
      ins: 150,
      iode: 50,
      volMousse: 3,
      tenueMousse: 4,
      douceur: 5,
      lavant: 2,
      durete: 3,
      solubilite: 1,
      sechage: 2,
      estCorpsGras: true,
    };
    this.ingredientService.addIngredient(test).subscribe({
      next: (data) => {
        console.log('Ingrédient ajouté : ', data);
        this.getIngredients(); // Rafraîchir la liste après ajout
      },
      error: (err) => console.error('Erreur API : ', err),
    });
  }*/
  /** Préparer l'ajout d'un nouvel ingrédient (ligne vide) */
  creerNouvelIngredient(): void {
    this.ingredientSelectionne = {
      id: 0,
      nom: '',
      sapo: 0,
      ins: 0,
      iode: 0,
      volMousse: 0,
      tenueMousse: 0,
      douceur: 0,
      lavant: 0,
      durete: 0,
      solubilite: 0,
      sechage: 0,
      estCorpsGras: true,
    };
  }
  /** Lancer l'édition d'une ligne existante */
  editerIngredient(item: Ingredient): void {
    // On crée une copie pour éviter de modifier le tableau original avant validation;
    this.ingredientSelectionne = { ...item };
  }
  /** Enregistrer (Ajout ou Update) */
  saveIngredient(): void {
    if (!this.ingredientSelectionne) return;
    const action =
      this.ingredientSelectionne.id === 0
        ? this.ingredientService.addIngredient(this.ingredientSelectionne)
        : this.ingredientService.updateIngredient(this.ingredientSelectionne);
    action.subscribe({
      next: () => {
        this.ingredientSelectionne = null;
        this.getIngredients(); // Rafraîchir la liste
      },
    });
  }
  /** Supprimer un ingrédient */
  deleteIngredient(id: number): void {
    if (confirm('Supprimer cet ingrédient ?')) {
      this.ingredientService.deleteIngredient(id).subscribe(() => this.getIngredients());
    }
  }
}
