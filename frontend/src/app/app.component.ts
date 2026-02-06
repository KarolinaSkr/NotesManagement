import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="app-container" [class.dark-mode]="themeService.isDarkMode()">
      <div class="header-actions">
        <button class="theme-toggle" (click)="toggleTheme()" title="Toggle dark mode">
          <span *ngIf="!themeService.isDarkMode()">🌙</span>
          <span *ngIf="themeService.isDarkMode()">☀️</span>
        </button>
        <div class="user-actions" *ngIf="isAuthenticated$ | async">
          <span class="user-email">{{ currentUser?.email }}</span>
          <button class="logout-button" (click)="logout()" title="Logout">
            🚪 Logout
          </button>
        </div>
      </div>
      <router-outlet></router-outlet>
    </div>
  `,

  styles: [`
    .app-container {
      min-height: 100vh;
      position: relative;
    }
    
    .header-actions {
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
    }

    .header-actions > * {
      pointer-events: auto;
    }

    .theme-toggle {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    
    .theme-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    
    :host-context(.dark-mode) .theme-toggle {
      background: rgba(55, 65, 81, 0.9);
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.9);
      padding: 8px 16px;
      border-radius: 22px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    :host-context(.dark-mode) .user-actions {
      background: rgba(55, 65, 81, 0.9);
    }

    .user-email {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    :host-context(.dark-mode) .user-email {
      color: #e5e7eb;
    }

    .logout-button {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 16px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .logout-button:hover {
      background: #dc2626;
      transform: translateY(-1px);
    }
  `]
})
export class AppComponent {
  title = 'Notes Management';
  isAuthenticated$: Observable<boolean>;
  currentUser: { email: string } | null = null;

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
