import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../../models/note.model';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="note"
      [style.backgroundColor]="note.color"
      [style.left.px]="note.positionX"
      [style.top.px]="note.positionY"
      (mousedown)="startDrag($event)"
      #noteElement>
      
      <div class="tags-display top-tags-display" *ngIf="note.tags && note.tags.length > 0">
        <span 
          *ngFor="let tag of note.tags; let i = index" 
          class="tag-badge"
          (click)="removeTag($event, i)">
          {{tag}} ×
        </span>
      </div>
      
      <div class="note-header">

        <input 
          type="text" 
          [(ngModel)]="note.title" 
          (blur)="onUpdate()"
          placeholder="Title"
          class="note-title">
        <button class="pdf-btn" (click)="exportToPdf()" title="Export to PDF">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        <button class="delete-btn" (click)="onDelete()" title="Delete note">×</button>
      </div>
      
      <textarea 

        [(ngModel)]="note.content" 
        (blur)="onUpdate()"
        placeholder="Write your note here..."
        class="note-content"></textarea>
      
      <div class="note-footer">
        <div class="color-picker">
          <button 
            *ngFor="let color of colors" 
            [style.backgroundColor]="color"
            [class.active]="note.color === color"
            (click)="changeColor(color)"
            class="color-btn">
          </button>
        </div>
        
        <div class="tags-input-section">
          <div class="tag-input-container">
            <input 
              type="text" 
              [(ngModel)]="newTag" 
              (keydown.enter)="addTag()"
              placeholder="Add tag..."
              class="tag-input">
            <button class="add-tag-btn" (click)="addTag()">+</button>
          </div>
        </div>
        
        <div class="note-date" *ngIf="note.createdAt">
          {{formatDate(note.createdAt)}}
        </div>
      </div>
    </div>


  `,
  styles: [`
    .note {
      position: absolute;
      width: 300px;
      min-height: 300px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      cursor: move;
      transition: box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    
    .note:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
    
    .note.dragging {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      position: relative;
      padding-right: 4px;
    }
    
    .note-title {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      outline: none;
      min-width: 0;
      transition: color 0.3s ease;
    }
    
    .note-title::placeholder {
      color: #9ca3af;
    }
    
    :host-context(.dark-mode) .note-title {
      color: #e5e7eb;
    }
    
    :host-context(.dark-mode) .note-title::placeholder {
      color: #9aa0aa;
    }
    
    .delete-btn {
      background: none;
      border: none;
      font-size: 20px;
      color: #6b7280;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      flex-shrink: 0;
      margin-left: 4px;
      padding: 0;
      line-height: 1;
    }
    
    .pdf-btn {
      background: none;
      border: none;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      flex-shrink: 0;
      margin-left: 8px;
      padding: 0;
      color: #6b7280;
    }
    
    .pdf-btn:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: #4f46e5;
      transform: scale(1.1);
    }
    
    :host-context(.dark-mode) .pdf-btn {
      color: #9ca3af;
    }
    
    :host-context(.dark-mode) .pdf-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #818cf8;
    }
    
    .delete-btn:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: #ef4444;
    }
    
    :host-context(.dark-mode) .delete-btn {
      color: #9ca3af;
    }
    
    :host-context(.dark-mode) .delete-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #f87171;
    }
    
    .note-content {
      flex: 0 0 auto;
      border: none;
      background: transparent;
      resize: none;
      font-size: 14px;
      line-height: 1.5;
      color: #4b5563;
      outline: none;
      height: 190px;
      transition: color 0.3s ease;
    }
    
    .note-content::placeholder {
      color: #9ca3af;
    }
    
    :host-context(.dark-mode) .note-content {
      color: #d1d5db;
    }
    
    :host-context(.dark-mode) .note-content::placeholder {
      color: #9aa0aa;
    }
    
    .note-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .color-picker {
      display: flex;
      gap: 8px;
    }
    
    .color-btn {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    :host-context(.dark-mode) .color-btn {
      border-color: rgba(31, 41, 55, 0.95);
    }
    
    .color-btn:hover {
      transform: scale(1.1);
    }

    .color-btn.active {
      transform: scale(1.3);
      box-shadow: 0 2px 5px rgba(0,0,0,.2);
      background-image: url("data:image/svg+xml;utf8,\
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>\
      <path d='M20 6L9 17l-5-5' \
      stroke='black' stroke-width='1.2' fill='none' \
      stroke-linecap='round' stroke-linejoin='round'/>\
      </svg>");
      background-repeat: no-repeat;
      background-position: center;
    }
    
    .tags-display {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
      min-height: 24px;
    }
    
    .tags-display.top-tags-display {
      margin-bottom: 6px;
    }
    
    .tags-input-section {
      margin-top: 12px;
    }
    
    .tag-badge {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    
    .tag-badge:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    
    :host-context(.dark-mode) .tag-badge {
      background: rgba(255, 255, 255, 0.15);
      color: #e5e7eb;
    }
    
    :host-context(.dark-mode) .tag-badge:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    
    .tag-input-container {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    
    .tag-input {
      flex: 1;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.5);
      outline: none;
      transition: all 0.3s ease;
    }
    
    .tag-input:focus {
      border-color: #4f46e5;
      background: white;
    }
    
    :host-context(.dark-mode) .tag-input {
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(0, 0, 0, 0.3);
      color: #e5e7eb;
    }
    
    :host-context(.dark-mode) .tag-input:focus {
      border-color: #818cf8;
      background: rgba(0, 0, 0, 0.5);
    }
    
    :host-context(.dark-mode) .tag-input::placeholder {
      color: #6b7280;
    }
    
    .add-tag-btn {
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .add-tag-btn:hover {
      background: #4338ca;
    }
    
    .note-date {
      margin-top: 8px;
      font-size: 11px;
      color: #6b7280;
      text-align: right;
      font-style: italic;
    }
    
    :host-context(.dark-mode) .note-date {
      color: #9aa0aa;
    }
  `]
})
export class NoteComponent implements OnInit, OnDestroy {

  @Input() note!: Note;
  @Output() update = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<number>();
  @Output() move = new EventEmitter<{id: number, x: number, y: number}>();
  
  @ViewChild('noteElement') noteElement!: ElementRef;
  
  lightColors = ['#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5', '#f3e8ff', '#ffedd5'];
  darkColors = ['#92400e', '#1e40af', '#9d174d', '#065f46', '#6b21a8', '#9a3412'];
  
  get colors(): string[] {
    return document.body.classList.contains('dark-mode') ? this.darkColors : this.lightColors;
  }

  newTag = '';
  
  private isDragging = false;
  private themeSubscription: Subscription | null = null;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe((isDark: boolean) => {
      this.updateNoteColorForTheme(isDark);
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private updateNoteColorForTheme(isDark: boolean) {
    const currentColor = this.note.color;
    const lightIndex = this.lightColors.indexOf(currentColor);
    const darkIndex = this.darkColors.indexOf(currentColor);
    
    if (isDark && lightIndex !== -1) {
      this.note.color = this.darkColors[lightIndex];
      this.onUpdate();
    } else if (!isDark && darkIndex !== -1) {
      this.note.color = this.lightColors[darkIndex];
      this.onUpdate();
    }
  }

  startDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName === 'INPUT' || 
        (event.target as HTMLElement).tagName === 'TEXTAREA' ||
        (event.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.initialLeft = this.note.positionX;
    this.initialTop = this.note.positionY;
    
    this.noteElement.nativeElement.classList.add('dragging');
    
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
  }

  onDrag = (event: MouseEvent) => {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    
    const noteWidth = 300;
    const noteHeight = this.noteElement.nativeElement.getBoundingClientRect().height;
    
    // Get the board container for proper boundary constraints
    const boardArea = this.noteElement.nativeElement.closest('.board-area');
    
    if (boardArea) {
      // Get the actual visible dimensions of the board area
      const boardRect = boardArea.getBoundingClientRect();
      
      // Constrain to the board area's visible bounds with small safety margin
      // 5px margin ensures note doesn't slightly overflow due to rounding/subpixels
      const maxX = boardRect.width - noteWidth - 10;
      const maxY = boardRect.height - noteHeight - 5;
      
      this.note.positionX = Math.max(0, Math.min(maxX, this.initialLeft + deltaX));
      this.note.positionY = Math.max(0, Math.min(maxY, this.initialTop + deltaY));
    } else {
      // Fallback to viewport constraints
      const maxX = window.innerWidth - noteWidth - 10;
      const maxY = window.innerHeight - noteHeight - 10;
      
      this.note.positionX = Math.max(0, Math.min(maxX, this.initialLeft + deltaX));
      this.note.positionY = Math.max(0, Math.min(maxY, this.initialTop + deltaY));
    }
  }

  stopDrag = () => {
    if (this.isDragging) {
      this.isDragging = false;
      this.noteElement.nativeElement.classList.remove('dragging');
      
      if (this.note.id) {
        this.move.emit({
          id: this.note.id,
          x: this.note.positionX,
          y: this.note.positionY
        });
      }
      
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
    }
  }

  onUpdate() {
    this.update.emit(this.note);
  }

  onDelete() {
    if (this.note.id) {
      this.delete.emit(this.note.id);
    }
  }

  changeColor(color: string) {
    this.note.color = color;
    this.onUpdate();
  }

  addTag() {
    if (this.newTag.trim()) {
      if (!this.note.tags) {
        this.note.tags = [];
      }
      if (!this.note.tags.includes(this.newTag.trim())) {
        this.note.tags.push(this.newTag.trim());
        this.onUpdate();
      }
      this.newTag = '';
    }
  }

  removeTag(event: Event, index: number) {
    event.stopPropagation();
    if (this.note.tags) {
      this.note.tags.splice(index, 1);
      this.onUpdate();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  exportToPdf() {

    const title = this.note.title || 'Untitled Note';
    const content = this.note.content || '';
    const date = this.note.createdAt ? new Date(this.note.createdAt).toLocaleString() : '';
    
    // Use global pdfMake loaded from CDN
    const pdfMake = (window as any).pdfMake;
    
    if (!pdfMake) {
      console.error('pdfMake not loaded');
      alert('PDF export is not available. Please try again later.');
      return;
    }
    
    // Build document definition
    const docDefinition: any = {
      content: [],
      defaultStyle: {
        font: 'Roboto'
      }
    };
    
    // Title
    docDefinition.content.push({
      text: title,
      style: 'header'
    });
    
    // Date
    if (date) {
      docDefinition.content.push({
        text: date,
        style: 'date'
      });
    }
    
    // Tags
    if (this.note.tags && this.note.tags.length > 0) {
      docDefinition.content.push({
        text: 'Tags: ' + this.note.tags.join(', '),
        style: 'tags'
      });
    }
    
    // Content - preserve line breaks
    const paragraphs = content.split('\n').map(p => ({
      text: p || ' ',
      style: 'content'
    }));
    
    docDefinition.content.push(...paragraphs);
    
    // Styles
    docDefinition.styles = {
      header: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      date: {
        fontSize: 10,
        italics: true,
        margin: [0, 0, 0, 10],
        color: '#666666'
      },
      tags: {
        fontSize: 11,
        margin: [0, 0, 0, 15],
        color: '#444444'
      },
      content: {
        fontSize: 12,
        margin: [0, 0, 0, 6],
        lineHeight: 1.4
      }
    };
    
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_note.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
  }
}
