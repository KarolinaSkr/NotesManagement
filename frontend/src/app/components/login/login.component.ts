import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LoginRequest } from '../../models/user.model';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container" [class.dark-mode]="themeService.isDarkMode()">
      <div class="login-card">
        <div class="login-header">
          <h1>📝 Notes Management</h1>
          <p>Sign in to access your notes</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="credentials.email"
              required
              email
              #emailInput="ngModel"
              placeholder="Enter your email"
              [class.error]="emailInput.invalid && emailInput.touched"
            />
            <div class="error-message" *ngIf="emailInput.invalid && emailInput.touched">
              <span *ngIf="emailInput.errors?.['required']">Email is required</span>
              <span *ngIf="emailInput.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="credentials.password"
              required
              #passwordInput="ngModel"
              placeholder="Enter your password"
              [class.error]="passwordInput.invalid && passwordInput.touched"
            />
            <div class="error-message" *ngIf="passwordInput.invalid && passwordInput.touched">
              <span *ngIf="passwordInput.errors?.['required']">Password is required</span>
            </div>

          </div>
          
          <div class="error-alert" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
          
          <button 
            type="submit" 
            class="login-button" 
            [disabled]="loginForm.invalid || isLoading"
          >
            <span *ngIf="!isLoading">Sign In</span>
            <span *ngIf="isLoading">Signing in...</span>
          </button>
        </form>
        
        <div class="demo-info">
          <h3>Demo Credentials</h3>
          <p><strong>Email:</strong> demo&#64;example.com</p>
          <p><strong>Password:</strong> password123</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      transition: background 0.3s ease;
    }

    .login-container.dark-mode {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    }

    
    .login-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      transition: background 0.3s ease, box-shadow 0.3s ease;
    }

    .dark-mode .login-card {
      background: #2d2d44;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    
    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .login-header h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
      transition: color 0.3s ease;
    }

    .dark-mode .login-header h1 {
      color: #f0f0f0;
    }
    
    .login-header p {
      margin: 0;
      color: #666;
      font-size: 16px;
      transition: color 0.3s ease;
    }

    .dark-mode .login-header p {
      color: #aaa;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 10px;
      margin-bottom: 20px;
      background: transparent;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #666;
      transition: all 0.3s ease;
    }

    .theme-toggle:hover {
      border-color: #667eea;
      color: #667eea;
    }

    .dark-mode .theme-toggle {
      border-color: #4a4a6a;
      color: #aaa;
    }

    .dark-mode .theme-toggle:hover {
      border-color: #888;
      color: #f0f0f0;
    }

    .theme-icon {
      font-size: 16px;
    }

    .theme-text {
      font-weight: 500;
    }

    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .form-group label {
      font-weight: 500;
      color: #333;
      font-size: 14px;
      transition: color 0.3s ease;
    }

    .dark-mode .form-group label {
      color: #ddd;
    }

    
    .form-group input {
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease;
      background: white;
      color: #333;
    }

    .dark-mode .form-group input {
      background: #3a3a55;
      border-color: #4a4a6a;
      color: #f0f0f0;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .dark-mode .form-group input:focus {
      border-color: #888;
    }
    
    .form-group input.error {
      border-color: #e74c3c;
    }

    
    .error-message {
      color: #e74c3c;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .error-alert {
      background: #fee;
      color: #c33;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #c33;
      font-size: 14px;
    }
    
    .login-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .login-button.dark-mode {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    }
    
    .login-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
    
    .dark-mode .login-button {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    }
    
    .dark-mode .login-button:hover:not(:disabled) {
      box-shadow: 0 8px 20px rgba(30, 27, 75, 0.4);
    }
    
    .login-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    
    .demo-info {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e1e5e9;
      text-align: center;
    }
    
    .demo-info h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: color 0.3s ease;
    }

    .dark-mode .demo-info h3 {
      color: #ddd;
    }
    
    .demo-info p {
      margin: 4px 0;
      color: #666;
      font-size: 13px;
      transition: color 0.3s ease;
    }

    .dark-mode .demo-info p {
      color: #aaa;
    }

    .dark-mode .demo-info {
      border-top-color: #4a4a6a;
    }

  `]
})
export class LoginComponent {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };
  
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}


  onSubmit(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password. Please try again.';
        } else {
          this.errorMessage = 'An error occurred. Please try again later.';
        }
      }
    });
  }
}
