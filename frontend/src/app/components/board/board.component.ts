import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NoteComponent } from '../note/note.component';
import { Note } from '../../models/note.model';
import { NoteService } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ReminderService } from '../../services/reminder.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, NoteComponent],
  animations: [
    trigger('noteList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.8) translateY(-20px)' }),
          stagger(100, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
          ])
        ], { optional: true }),
        query(':leave', [
          animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', 
            style({ opacity: 0, transform: 'scale(0.8) translateY(-10px)' }))
        ], { optional: true })
      ])
    ])
  ],

  template: `
    <div class="board-container">
      <header class="board-header">
        <h1>My Notes Board</h1>
        <div class="header-controls">
          <div class="search-section">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (input)="searchNotes()"
              placeholder="Search notes..." 
              class="search-input">
            <button *ngIf="searchQuery" class="clear-search-btn" (click)="clearSearch()">×</button>
          </div>
          <div class="filter-section">
            <select [(ngModel)]="selectedTag" (change)="filterByTag()" class="tag-filter">
              <option value="">All Tags</option>
              <option *ngFor="let tag of allTags" [value]="tag">{{tag}}</option>
            </select>
            <button *ngIf="selectedTag" class="clear-filter-btn" (click)="clearFilter()">×</button>
          </div>

          <button class="add-btn" (click)="addNote()">
            <span>+</span>
            Add Note
          </button>
          
          <div class="user-actions" *ngIf="isAuthenticated$ | async">
            <span class="user-email">{{ currentUser?.email }}</span>
            <button class="logout-button" (click)="logout()" title="Logout">
              Logout
              <svg class="logout-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="3" y1="12" x2="21" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <div class="board-area" #boardArea>
        <div [@noteList]="filteredNotes.length" class="notes-container">
          <app-note 
            *ngFor="let note of filteredNotes; trackBy: trackByNoteId"
            [note]="note"
            (update)="updateNote($event)"
            (delete)="deleteNote($event)"
            (move)="moveNote($event)"
            (resize)="resizeNote($event)">
          </app-note>
        </div>
        
        <div *ngIf="notes.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <p>No notes yet. Click "Add Note" to create your first sticky note!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .board-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Inter', sans-serif;
      transition: background 0.3s ease;
    }
    
    :host-context(.dark-mode) .board-container {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    }

    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 48px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      transition: background 0.3s ease;
    }
    
    :host-context(.dark-mode) .board-header {
      background: rgba(31, 41, 55, 0.95);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
    }

    .board-header h1 {
      margin: 0;
      margin-left: 60px;
      font-size: 28px;
      font-weight: 600;
      color: #1f2937;
      transition: color 0.3s ease;
    }
    
    :host-context(.dark-mode) .board-header h1 {
      color: #f9fafb;
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .add-btn:hover {
      background: #4338ca;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }
    
    .add-btn span {
      font-size: 20px;
      font-weight: 300;
    }
    
    .board-area {
      position: relative;
      min-height: calc(100vh - 100px);
      padding: 5px;
    }
    
    .notes-container {
      position: relative;
    }
    
    .empty-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
    }
    
    :host-context(.dark-mode) .empty-state {
      color: rgba(255, 255, 255, 0.6);
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    
    .empty-state p {
      font-size: 18px;
      font-weight: 300;
    }
    
    .header-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .search-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .search-input {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      background: white;
      font-size: 14px;
      color: #374151;
      outline: none;
      transition: all 0.3s ease;
      width: 200px;
    }
    
    .search-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    
    :host-context(.dark-mode) .search-input {
      background: #374151;
      border-color: #4b5563;
      color: #f9fafb;
    }
    
    :host-context(.dark-mode) .search-input::placeholder {
      color: #9ca3af;
    }
    
    :host-context(.dark-mode) .search-input:focus {
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
    }
    
    .clear-search-btn {
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .clear-search-btn:hover {
      background: #4b5563;
    }
    
    .filter-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .tag-filter {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      background: white;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      outline: none;
      transition: all 0.3s ease;
    }
    
    .tag-filter:focus {
      border-color: #4f46e5;
    }
    
    :host-context(.dark-mode) .tag-filter {
      background: #374151;
      border-color: #4b5563;
      color: #f9fafb;
    }
    
    :host-context(.dark-mode) .tag-filter:focus {
      border-color: #818cf8;
    }

    .clear-filter-btn {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .clear-filter-btn:hover {
      background: #dc2626;
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
      display: flex;
      align-items: center;
    }

    .logout-button:hover {
      background: #dc2626;
      transform: translateY(-1px);
    }

    .logout-icon {
      width: 16px;
      height: 16px;
      margin-left: 6px;
    }
  `]
})
export class BoardComponent implements OnInit, OnDestroy {
  notes: Note[] = [];
  filteredNotes: Note[] = [];
  allTags: string[] = [];
  selectedTag: string = '';
  searchQuery: string = '';
  isAuthenticated$: Observable<boolean>;
  currentUser: { email: string } | null = null;
  
  constructor(
    private noteService: NoteService,
    private authService: AuthService,
    private router: Router,
    private reminderService: ReminderService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.loadNotes();
  }

  ngOnDestroy() {
    this.reminderService.stopReminderCheck();
  }
  
  loadNotes() {
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.filteredNotes = notes;
        this.updateAllTags();
        // Save notes to localStorage for reminder service
        this.saveNotesToLocalStorage();
      },
      error: (error) => {
        console.error('Error loading notes:', error);
      }
    });
  }

  private saveNotesToLocalStorage(): void {
    localStorage.setItem('notes', JSON.stringify(this.notes));
  }

  updateAllTags() {
    const tagsSet = new Set<string>();
    this.notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    this.allTags = Array.from(tagsSet).sort();
  }
  
  filterByTag() {
    this.applyFilters();
  }

  clearFilter() {
    this.selectedTag = '';
    this.applyFilters();
  }

  searchNotes() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  private applyFilters() {
    let result = this.notes;
    
    // Apply tag filter
    if (this.selectedTag) {
      result = result.filter(note => note.tags && note.tags.includes(this.selectedTag));
    }
    
    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(note => 
        (note.title && note.title.toLowerCase().includes(query)) ||
        (note.content && note.content.toLowerCase().includes(query))
      );
    }
    
    this.filteredNotes = result;
  }

  addNote() {
    const newNote: Note = {
      title: '',
      content: '',
      positionX: 50 + (this.notes.length * 30) % 200,
      positionY: 50 + (this.notes.length * 30) % 200,
      color: '#fef3c7',
      tags: []
    };
    
    this.noteService.createNote(newNote).subscribe({
      next: (note) => {
        this.notes.push(note);
        this.filteredNotes = [...this.notes];
      },
      error: (error) => {
        console.error('Error creating note:', error);
      }
    });
  }

  updateNote(note: Note) {
    if (note.id) {
      this.noteService.updateNote(note.id, note).subscribe({
        next: (updatedNote) => {
          const index = this.notes.findIndex(n => n.id === updatedNote.id);
          if (index !== -1) {
            this.notes[index] = updatedNote;
          }
          this.updateAllTags();
          this.applyFilters();
          // Update localStorage after note update
          this.saveNotesToLocalStorage();
        },
        error: (error) => {
          console.error('Error updating note:', error);
        }
      });
    }
  }

  deleteNote(id: number) {
    this.noteService.deleteNote(id).subscribe({
      next: () => {
        this.notes = this.notes.filter(note => note.id !== id);
        this.filteredNotes = this.filteredNotes.filter(note => note.id !== id);
        this.updateAllTags();
        // Update localStorage after note deletion
        this.saveNotesToLocalStorage();
        // Remove any reminder for this note
        this.reminderService.removeReminder(id);
      },
      error: (error) => {
        console.error('Error deleting note:', error);
      }
    });
  }

  moveNote(event: {id: number, x: number, y: number}) {
    const note = this.notes.find(n => n.id === event.id);
    if (note) {
      note.positionX = event.x;
      note.positionY = event.y;
      this.updateNote(note);
    }
  }

  resizeNote(event: {id: number, width: number, height: number}) {
    const note = this.notes.find(n => n.id === event.id);
    if (note) {
      note.width = event.width;
      note.height = event.height;
      this.updateNote(note);
    }
  }

  trackByNoteId(index: number, note: Note): number {
    return note.id || index;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
