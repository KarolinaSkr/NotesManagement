import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteComponent } from '../note/note.component';
import { Note } from '../../models/note.model';
import { NoteService } from '../../services/note.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, NoteComponent],
  template: `
    <div class="board-container">
      <header class="board-header">
        <h1>My Notes Board</h1>
        <div class="header-controls">
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
        </div>
      </header>

      
      <div class="board-area" #boardArea>
        <app-note 
          *ngFor="let note of filteredNotes"
          [note]="note"
          (update)="updateNote($event)"
          (delete)="deleteNote($event)"
          (move)="moveNote($event)">
        </app-note>

        
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
    }
    
    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 48px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }
    
    .board-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #1f2937;
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
      padding: 48px;
    }
    
    .empty-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
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
    }
    
    .tag-filter:focus {
      border-color: #4f46e5;
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
  `]
})

export class BoardComponent implements OnInit {
  notes: Note[] = [];
  filteredNotes: Note[] = [];
  allTags: string[] = [];
  selectedTag: string = '';
  
  constructor(private noteService: NoteService) {}

  
  ngOnInit() {
    this.loadNotes();
  }
  
  loadNotes() {
    this.noteService.getAllNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.filteredNotes = notes;
        this.updateAllTags();
      },
      error: (error) => {
        console.error('Error loading notes:', error);
      }
    });
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
    if (this.selectedTag) {
      this.noteService.getNotesByTag(this.selectedTag).subscribe({
        next: (notes) => {
          this.filteredNotes = notes;
        },
        error: (error) => {
          console.error('Error filtering notes:', error);
        }
      });
    } else {
      this.filteredNotes = this.notes;
    }
  }
  
  clearFilter() {
    this.selectedTag = '';
    this.filteredNotes = this.notes;
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
          if (this.selectedTag) {
            this.filterByTag();
          } else {
            this.filteredNotes = [...this.notes];
          }
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
}
