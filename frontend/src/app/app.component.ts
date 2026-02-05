import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent } from './components/board/board.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BoardComponent],
  template: `
    <div class="app-container" [class.dark-mode]="themeService.isDarkMode()">
      <button class="theme-toggle" (click)="toggleTheme()" title="Toggle dark mode">
        <span *ngIf="!themeService.isDarkMode()">🌙</span>
        <span *ngIf="themeService.isDarkMode()">☀️</span>
      </button>
      <app-board></app-board>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      position: relative;
    }
    
    .theme-toggle {
      position: fixed;
      top: 26px;
      left: 20px;
      z-index: 10000;
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
  `]
})
export class AppComponent {
  title = 'Notes Management';
  
  constructor(public themeService: ThemeService) {}
  
  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }
}
