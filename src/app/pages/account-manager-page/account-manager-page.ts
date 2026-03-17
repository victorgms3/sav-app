import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-account-manager-page',
  imports: [],
  templateUrl: './account-manager-page.html',
  styleUrl: './account-manager-page.css',
})
export class AccountManagerPage {
  
    public authService = inject(AuthService);

}
