import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account-manager-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-manager-page.html',
  styleUrl: './account-manager-page.css',
})
export class AccountManagerPage implements OnInit {
  public authService = inject(AuthService);
  
  // Stockage des infos utilisateur pour le template
  public userInfo: { username: string; roles: string[]; expiration: Date } | null = null;

  ngOnInit(): void {
    // Récupération des informations au chargement de la page
    this.userInfo = this.authService.getUserFullInfo();
  }

  /**
   * Retire le préfixe "ROLE_" pour un affichage plus propre
   */
  formatRole(role: string): string {
    return role.replace('ROLE_', '');
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    this.authService.logout();
  }
}