import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../../models/note.model';
import { ThemeService } from '../../services/theme.service';
import { ReminderService } from '../../services/reminder.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="note"
      [class.reminder-triggered]="isReminderTriggered"
      [style.backgroundColor]="note.color"
      [style.left.px]="note.positionX"
      [style.top.px]="note.positionY"
      [style.width.px]="note.width || 300"
      [style.height.px]="note.height || 300"
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
        <button 
          class="reminder-btn" 
          [class.active]="hasReminder"
          [class.triggered]="isReminderTriggered"
          (click)="toggleReminder()" 
          [title]="hasReminder ? 'Remove reminder' : 'Set reminder'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
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
      <div class="resize-handle" (mousedown)="startResize($event)" title="Resize"></div>
    </div>

    <!-- Reminder Modal -->
    <div class="reminder-modal-overlay" *ngIf="showReminderModal" (click)="closeReminderModal()">
      <div class="reminder-modal" (click)="$event.stopPropagation()">
        <h3>Set Reminder</h3>
        <p class="reminder-note-title">{{note.title || 'Untitled Note'}}</p>
        <div class="reminder-input-group">
          <label for="reminder-date">Date and Time:</label>
          <input 
            type="datetime-local" 
            id="reminder-date"
            [(ngModel)]="reminderDateTime"
            [min]="minDateTime"
            class="reminder-datetime-input">
        </div>
        <div class="reminder-modal-actions">
          <button class="reminder-cancel-btn" (click)="closeReminderModal()">Cancel</button>
          <button class="reminder-save-btn" (click)="saveReminder()" [disabled]="!reminderDateTime">Set Reminder</button>
        </div>
      </div>
    </div>
  `,

  styles: [`
    .note {
      position: absolute;
      min-width: 220px;
      min-height: 300px;
      max-width: 500px;
      max-height: 600px;
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
      margin-left: 4px;
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
      flex: 1;
      border: none;
      background: transparent;
      resize: none;
      font-size: 14px;
      line-height: 1.5;
      color: #4b5563;
      outline: none;
      min-height: 105px;
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

    .resize-handle {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.3) 50%);
      border-radius: 0 0 4px 0;
      opacity: 0.6;
      transition: opacity 0.2s ease;
    }

    .resize-handle:hover {
      opacity: 1;
    }

    .note.resizing {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }

    .reminder-btn {
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

    .reminder-btn:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: #4f46e5;
      transform: scale(1.1);
    }

    .reminder-btn.active {
      background-color: #ef4444;
      color: white;
    }

    .reminder-btn.active:hover {
      background-color: #dc2626;
    }

    .reminder-btn.triggered {
      animation: bellShake 0.5s ease-in-out infinite;
    }

    @keyframes bellShake {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-10deg); }
      75% { transform: rotate(10deg); }
    }

    :host-context(.dark-mode) .reminder-btn {
      color: #9ca3af;
    }

    :host-context(.dark-mode) .reminder-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #818cf8;
    }

    :host-context(.dark-mode) .reminder-btn.active {
      background-color: #ef4444;
      color: white;
    }

    /* Reminder triggered border - static red, outside note without affecting content */
    .note.reminder-triggered {
      outline: 3px solid #ef4444;
      outline-offset: 3px;
    }

    /* Reminder Modal Styles */
    .reminder-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    }

    .reminder-modal {
      background: white;
      border-radius: 12px;
      padding: 24px;
      min-width: 320px;
      max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: modalAppear 0.3s ease;
    }

    @keyframes modalAppear {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    :host-context(.dark-mode) .reminder-modal {
      background: #1f2937;
      color: #f9fafb;
    }

    .reminder-modal h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    :host-context(.dark-mode) .reminder-modal h3 {
      color: #f9fafb;
    }

    .reminder-note-title {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host-context(.dark-mode) .reminder-note-title {
      color: #9ca3af;
    }

    .reminder-input-group {
      margin-bottom: 20px;
    }

    .reminder-input-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    :host-context(.dark-mode) .reminder-input-group label {
      color: #d1d5db;
    }

    .reminder-datetime-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      color: #374151;
      background: white;
      outline: none;
      transition: all 0.2s ease;
    }

    .reminder-datetime-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    :host-context(.dark-mode) .reminder-datetime-input {
      background: #374151;
      border-color: #4b5563;
      color: #f9fafb;
    }

    :host-context(.dark-mode) .reminder-datetime-input:focus {
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
    }

    .reminder-modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .reminder-cancel-btn {
      padding: 10px 16px;
      border: 1px solid #e5e7eb;
      background: white;
      color: #6b7280;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .reminder-cancel-btn:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    :host-context(.dark-mode) .reminder-cancel-btn {
      background: #374151;
      border-color: #4b5563;
      color: #d1d5db;
    }

    :host-context(.dark-mode) .reminder-cancel-btn:hover {
      background: #4b5563;
    }

    .reminder-save-btn {
      padding: 10px 16px;
      border: none;
      background: #4f46e5;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .reminder-save-btn:hover:not(:disabled) {
      background: #4338ca;
      transform: translateY(-1px);
    }

    .reminder-save-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `]
})
export class NoteComponent implements OnInit, OnDestroy {
  @Input() note!: Note;
  @Output() update = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<number>();
  @Output() move = new EventEmitter<{id: number, x: number, y: number}>();
  @Output() resize = new EventEmitter<{id: number, width: number, height: number}>();
  
  @ViewChild('noteElement') noteElement!: ElementRef;
  
  lightColors = ['#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5', '#f3e8ff', '#ffedd5'];
  darkColors = ['#92400e', '#1e40af', '#9d174d', '#065f46', '#6b21a8', '#9a3412'];
  
  get colors(): string[] {
    return document.body.classList.contains('dark-mode') ? this.darkColors : this.lightColors;
  }

  newTag = '';
  showReminderModal = false;
  reminderDateTime: string = '';
  minDateTime: string = '';
  hasReminder = false;
  isReminderTriggered = false;
  
  private isDragging = false;
  private isResizing = false;
  private themeSubscription: Subscription | null = null;
  private reminderSubscription: Subscription | null = null;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;
  private initialWidth = 0;
  private initialHeight = 0;

  constructor(private themeService: ThemeService, private reminderService: ReminderService) {}

  ngOnInit() {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe((isDark: boolean) => {
      this.updateNoteColorForTheme(isDark);
    });
    this.loadReminderState();
    
    // Subscribe to reminder triggered events to show effect immediately
    this.reminderSubscription = this.reminderService.reminderTriggered$.subscribe((noteId: number) => {
      if (noteId === this.note.id) {
        this.isReminderTriggered = true;
        this.note.reminderTriggered = true;
      }
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.reminderSubscription) {
      this.reminderSubscription.unsubscribe();
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
    
    const noteWidth = this.note.width || 300;
    const noteHeight = this.note.height || 300;
      
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

  startResize(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    
    this.isResizing = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.initialWidth = this.note.width || 300;
    this.initialHeight = this.note.height || 300;
    
    this.noteElement.nativeElement.classList.add('resizing');
    
    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  onResize = (event: MouseEvent) => {
    if (!this.isResizing) return;
    
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    
    const newWidth = Math.max(200, this.initialWidth + deltaX);
    const newHeight = Math.max(200, this.initialHeight + deltaY);
    
    this.note.width = newWidth;
    this.note.height = newHeight;
  }

  stopResize = () => {
    if (this.isResizing) {
      this.isResizing = false;
      this.noteElement.nativeElement.classList.remove('resizing');
      
      if (this.note.id) {
        this.resize.emit({
          id: this.note.id,
          width: this.note.width || 300,
          height: this.note.height || 300
        });
      }
      
      document.removeEventListener('mousemove', this.onResize);
      document.removeEventListener('mouseup', this.stopResize);
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

  toggleReminder(): void {
    if (this.hasReminder) {
      // Remove reminder
      if (this.note.id) {
        this.reminderService.removeReminder(this.note.id);
      }
      this.note.reminderAt = null;
      this.note.reminderTriggered = false;
      this.hasReminder = false;
      this.isReminderTriggered = false;
      this.onUpdate();
    } else {
      // Open modal to set reminder
      this.openReminderModal();
    }
  }

  openReminderModal(): void {
    // Set minimum datetime to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    this.minDateTime = now.toISOString().slice(0, 16);
    
    // Default to 1 hour from now
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    this.reminderDateTime = oneHourLater.toISOString().slice(0, 16);
    
    this.showReminderModal = true;
  }

  closeReminderModal(): void {
    this.showReminderModal = false;
    this.reminderDateTime = '';
  }

  saveReminder(): void {
    if (this.reminderDateTime && this.note.id) {
      const reminderDate = new Date(this.reminderDateTime);
      this.reminderService.setReminder(this.note.id, reminderDate);
      this.note.reminderAt = reminderDate;
      this.note.reminderTriggered = false;
      this.hasReminder = true;
      this.isReminderTriggered = false;
      this.onUpdate();
      this.closeReminderModal();
    }
  }

  private loadReminderState(): void {
    if (this.note.id) {
      const reminderState = this.reminderService.getReminderForNote(this.note.id);
      this.hasReminder = reminderState.reminderAt !== null;
      this.isReminderTriggered = reminderState.reminderTriggered;
      
      // Sync with note object
      this.note.reminderAt = reminderState.reminderAt;
      this.note.reminderTriggered = reminderState.reminderTriggered;
    }
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
