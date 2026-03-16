import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Utilisateur, UtilisateurService } from '../../services/utilisateur.service';

@Component({
  selector: 'app-users-manager-page',
  imports: [CommonModule],
  templateUrl: './users-manager-page.html',
  styleUrl: './users-manager-page.css',
})
export class UsersManagerPage implements OnInit {

  utilisateurs: Utilisateur[] = [];
  isLoading: boolean = false;
  errorMsg:  string  = '';

  constructor(private utilisateurService: UtilisateurService) {}

  ngOnInit(): void {
    this.loadUtilisateurs();
  }

  loadUtilisateurs(): void {
    this.isLoading = true;
    this.errorMsg  = '';

    this.utilisateurService.getUtilisateurs().subscribe({
      next: (data) => {
        this.utilisateurs = data;
        this.isLoading    = false;
      },
      error: (err) => {
        this.errorMsg  = 'Impossible de charger les utilisateurs.';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  /** Formate les rôles pour l'affichage (retire le préfixe ROLE_) */
  formatRole(role: string): string {
    return role.replace('ROLE_', '');
  }

  isAdmin(utilisateur: Utilisateur): boolean {
    return utilisateur.roles.includes('ROLE_ADMIN');
  }
}