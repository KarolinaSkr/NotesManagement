import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../../models/note.model';


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
      
      <div class="note-header">
        <input 
          type="text" 
          [(ngModel)]="note.title" 
          (blur)="onUpdate()"
          placeholder="Title"
          class="note-title">
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
        
        <div class="tags-section">
          <div class="tags-display" *ngIf="note.tags && note.tags.length > 0">
            <span 
              *ngFor="let tag of note.tags; let i = index" 
              class="tag-badge"
              (click)="removeTag($event, i)">
              {{tag}} ×
            </span>
          </div>
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
      </div>

    </div>
  `,
  styles: [`
    .note {
      position: absolute;
      width: 300px;
      min-height: 250px;
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
    }
    
    .note-title::placeholder {

      color: #9ca3af;
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
      margin-left: 8px;
      padding: 0;
      line-height: 1;
    }
    
    .delete-btn:hover {

      background-color: rgba(0, 0, 0, 0.1);
      color: #ef4444;
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
      min-height: 100px;
    }
    
    .note-content::placeholder {
      color: #9ca3af;
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
    
    .color-btn:hover {
      transform: scale(1.1);
    }
    
    .color-btn.active {
      transform: scale(1.3);
      box-shadow: 0 4px 10px rgba(0,0,0,.2);
      background-image: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>\
<path d='M20 6L9 17l-5-5' \
stroke='white' stroke-width='3.5' fill='none' \
stroke-linecap='round' stroke-linejoin='round'/>\
<path d='M20 6L9 17l-5-5' \
stroke='black' stroke-width='1.2' fill='none' \
stroke-linecap='round' stroke-linejoin='round'/>\
</svg>");
  background-repeat: no-repeat;
  background-position: center;
    }
    
    .tags-section {
      margin-top: 12px;
    }
    
    .tags-display {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
      min-height: 24px;
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
    }
    
    .tag-input:focus {
      border-color: #4f46e5;
      background: white;
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
  `]
})

export class NoteComponent {
  @Input() note!: Note;
  @Output() update = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<number>();
  @Output() move = new EventEmitter<{id: number, x: number, y: number}>();
  
  @ViewChild('noteElement') noteElement!: ElementRef;
  
  colors = ['#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5', '#f3e8ff', '#ffedd5'];
  newTag = '';
  
  private isDragging = false;

  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;

  startDrag(event: MouseEvent) {
    // Don't drag if clicking on input, textarea, or button
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
    
    this.note.positionX = Math.max(0, this.initialLeft + deltaX);
    this.note.positionY = Math.max(0, this.initialTop + deltaY);
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

}
