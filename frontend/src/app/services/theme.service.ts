import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.darkModeSubject.asObservable();

  constructor() {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      this.darkModeSubject.next(savedTheme === 'true');
      this.applyTheme(savedTheme === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkModeSubject.next(prefersDark);
      this.applyTheme(prefersDark);
    }
  }

  toggleDarkMode(): void {
    const newValue = !this.darkModeSubject.value;
    this.darkModeSubject.next(newValue);
    localStorage.setItem('darkMode', String(newValue));
    this.applyTheme(newValue);
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
