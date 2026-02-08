import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NoteComponent } from '../note/note.component';
import { Note } from '../../models/note.model';
import { Board } from '../../models/board.model';
import { NoteService } from '../../services/note.service';
import { BoardService } from '../../services/board.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ReminderService } from '../../services/reminder.service';
import { trigger, transition, style, animate, query, stagger, group } from '@angular/animations';



@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, NoteComponent],
  animations: [
    trigger('noteList', [
      transition(':enter, :leave', []),
      transition('* => *', [
        group([
          query(':enter', [
            style({ opacity: 0, transform: 'scale(0.8) translateY(-20px)' }),
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
          ], { optional: true }),
          query(':leave', [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 0, transform: 'scale(0.8) translateY(-10px)' }))
          ], { optional: true })
        ])
      ])
    ])
  ],




  template: `
    <div class="board-container">
      <!-- Sidebar -->
      <div class="sidebar" [class.collapsed]="!sidebarExpanded">
        <div class="sidebar-toggle" (click)="toggleSidebar()">
          <span class="toggle-arrow" [class.collapsed]="!sidebarExpanded">◀</span>
        </div>
        
        <div class="sidebar-content" *ngIf="sidebarExpanded">
          <div class="boards-list">
            <div 
              *ngFor="let board of boards" 
              class="board-item"
              [class.active]="selectedBoard?.id === board.id"
              (click)="selectBoard(board)">
              
              <div class="board-item-content">
                <span class="board-name">{{ board.name }}</span>
                <button
                  class="edit-board-btn"
                  (click)="startEditBoard(board, $event)"
                  title="Edit board">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <span class="board-match-count" *ngIf="getBoardMatchCount(board.id!) > 0">
                  {{getBoardMatchCount(board.id!)}}
                </span>
                <span class="board-reminder-bell" *ngIf="hasTriggeredReminders(board.id!)" title="Reminder triggered!">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bell-shaking">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </span>

              </div>



            </div>

          </div>
          
          <button 
            class="add-board-btn" 
            (click)="addBoard()"
            [disabled]="boards.length >= 20"
            title="Add new board (max 20)">
            <span>+</span>
            Add new board
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <header class="board-header">
          <h1>{{ selectedBoard ? selectedBoard.name : 'My Notes Board' }}</h1>
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

            <button class="add-btn" (click)="addNote()" [disabled]="!selectedBoard">
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
          <div [@noteList]="getAnimationTrigger()" class="notes-container">

            <app-note 
              *ngFor="let note of filteredNotes; trackBy: trackByNoteId"
              [note]="note"
              (update)="updateNote($event)"
              (delete)="deleteNote($event)"
              (move)="moveNote($event)"
              (resize)="resizeNote($event)">
            </app-note>
          </div>
          
          <!-- Empty state for no boards -->
          <div *ngIf="boards.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>No boards yet. Create your first board to start working!</p>
          </div>
          
          <!-- Empty state for no notes (when board exists) -->
          <div *ngIf="boards.length > 0 && notes.length === 0 && selectedBoard" class="empty-state">
            <div class="empty-icon">📝</div>
            <p>No notes yet. Click "Add Note" to create your first sticky note!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Board Modal -->
    <div class="modal-overlay" *ngIf="editingBoard" (click)="cancelEditBoard()">


      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>Edit Board</h3>
        <input 
          type="text" 
          [(ngModel)]="editingBoardName" 
          placeholder="Board name"
          class="modal-input"
          (keyup.enter)="saveEditBoard()">
        <div class="modal-actions">
          <button class="btn-secondary" (click)="cancelEditBoard()">Cancel</button>
          <button class="btn-danger" (click)="showDeleteConfirmation()">Delete</button>
          <button class="btn-primary" (click)="saveEditBoard()">Save</button>

        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="cancelDelete()">
      <div class="modal-content delete-confirm-content" (click)="$event.stopPropagation()">
        <div class="delete-warning-icon">⚠️</div>
        <h3>Delete Board</h3>
        <p class="delete-message">Are you sure you want to delete this board and all notes in it? This process is irreversible!</p>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="cancelDelete()">Cancel</button>
          <button class="btn-danger" (click)="confirmDelete()">Delete</button>
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
      display: flex;
    }
    
    /* Sidebar Styles */
    .sidebar {
      position: fixed;
      top: 95px;
      left: 0;
      bottom: 0;
      width: 250px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(10px);
      box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
      z-index: 100;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    :host-context(.dark-mode) .sidebar {
      background: rgba(31, 41, 55, 0.85);
      box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
    }
    
    .sidebar.collapsed {
      width: 40px;
    }
    
    .sidebar-toggle {
      position: absolute;
      right: -20px;
      top: 20px;
      width: 20px;
      height: 40px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 0 8px 8px 0;
      box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 101;
      transition: all 0.3s ease;
    }
    
    :host-context(.dark-mode) .sidebar-toggle {
      background: rgba(31, 41, 55, 0.95);
      box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .toggle-arrow {
      font-size: 12px;
      color: #4f46e5;
      transition: transform 0.3s ease;
    }
    
    :host-context(.dark-mode) .toggle-arrow {
      color: #818cf8;
    }
    
    .toggle-arrow.collapsed {
      transform: rotate(180deg);
    }
    
    .sidebar-content {
      flex: 1;
      padding: 20px 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    
    .boards-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .board-item {
      padding: 12px 15px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }
    
    :host-context(.dark-mode) .board-item {
      background: #374151;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .board-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
    
    :host-context(.dark-mode) .board-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .board-item.active {
      border-color: #4f46e5;
      background: #dddcf7;
    }
    
    :host-context(.dark-mode) .board-item.active {
      border-color: #818cf8;
      background: #312e81;
    }
    
    .board-item-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .board-name {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    
    :host-context(.dark-mode) .board-name {
      color: #f9fafb;
    }
    
    .board-match-count {
      background: #ef4444;
      color: white;
      border-radius: 50%;
      min-width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      margin-left: 4px;
      padding: 0 6px;
    }

    
    :host-context(.dark-mode) .board-match-count {
      background: #ef4444;
    }
    
    .board-reminder-bell {
      color: #ef4444;
      margin-left: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: bellShake 0.5s ease-in-out infinite;
    }
    
    @keyframes bellShake {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-10deg); }
      75% { transform: rotate(10deg); }
    }
    
    :host-context(.dark-mode) .board-reminder-bell {
      color: #f87171;
    }


    
    .edit-board-btn {

      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      opacity: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host-context(.dark-mode) .edit-board-btn {
      color: #9ca3af;
    }
    
    .board-item:hover .edit-board-btn {
      opacity: 1;
    }
    
    .edit-board-btn:hover {
      background: #e5e7eb;
      color: #4f46e5;
    }
    
    :host-context(.dark-mode) .edit-board-btn:hover {
      background: #4b5563;
      color: #818cf8;
    }
    
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal-content {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      min-width: 320px;
      max-width: 90vw;
      animation: slideIn 0.2s ease;
    }
    
    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    :host-context(.dark-mode) .modal-content {
      background: #1f2937;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    }
    
    .modal-content h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    
    :host-context(.dark-mode) .modal-content h3 {
      color: #f9fafb;
    }
    
    .modal-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      background: white;
      color: #1f2937;
      margin-bottom: 16px;
      box-sizing: border-box;
      transition: all 0.2s ease;
    }
    
    .modal-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    
    :host-context(.dark-mode) .modal-input {
      background: #374151;
      border-color: #4b5563;
      color: #f9fafb;
    }
    
    :host-context(.dark-mode) .modal-input::placeholder {
      color: #9ca3af;
    }
    
    :host-context(.dark-mode) .modal-input:focus {
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
    }
    
    .modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    
    .modal-actions button {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-secondary {
      background: #e5e7eb;
      color: #374151;
    }
    
    .btn-secondary:hover {
      background: #d1d5db;
    }
    
    :host-context(.dark-mode) .btn-secondary {
      background: #4b5563;
      color: #f9fafb;
    }
    
    :host-context(.dark-mode) .btn-secondary:hover {
      background: #6b7280;
    }
    
    .btn-danger {
      background: #ef4444;
      color: white;
    }
    
    .btn-danger:hover {
      background: #dc2626;
    }
    
    .btn-primary {
      background: #4f46e5;
      color: white;
    }
    
    .btn-primary:hover {
      background: #4338ca;
    }
    
    .delete-confirm-content {
      text-align: center;
      max-width: 400px;
    }
    
    .delete-warning-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .delete-message {
      color: #6b7280;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
    
    :host-context(.dark-mode) .delete-message {
      color: #9ca3af;
    }
    
    .add-board-btn {

      margin-top: 15px;
      padding: 12px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
    }
    
    .add-board-btn:hover:not(:disabled) {
      background: #4338ca;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }
    
    .add-board-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      box-shadow: none;
    }
    
    .add-board-btn span {
      font-size: 18px;
      font-weight: 300;
    }
    
    /* Main Content */
    .main-content {
      flex: 1;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    
    :host-context(.dark-mode) .board-container {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    }

    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 85px;
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
      font-size: 28px;
      font-weight: 600;
      color: #1f2937;
      transition: color 0.3s ease;
      max-width: 700px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    
    .add-btn:hover:not(:disabled) {
      background: #4338ca;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }
    
    .add-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
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
  
  // Board-related properties
  boards: Board[] = [];
  selectedBoard: Board | null = null;
  sidebarExpanded: boolean = false;
  editingBoard: Board | null = null;
  editingBoardName: string = '';
  showDeleteConfirm: boolean = false;
  
  // Properties for cross-board filtering
  allUserNotes: Note[] = [];
  boardMatchCounts: Map<number, number> = new Map();

  
  constructor(
    private noteService: NoteService,
    private boardService: BoardService,
    private authService: AuthService,
    private router: Router,
    private reminderService: ReminderService,
    private cdr: ChangeDetectorRef
  ) {

    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.loadBoards();
    // Load all notes for global reminder checking
    this.reminderService.loadAllNotesForReminders();
    
    // Subscribe to reminder state changes to update bell icons
    this.reminderService.reminderStateChanged$.subscribe(() => {
      // Force refresh of board list to update bell icons
      this.cdr.detectChanges();
    });
  }


  ngOnDestroy() {
    this.reminderService.stopReminderCheck();
  }
  
  /**
   * Check if a board has any triggered reminders
   */
  hasTriggeredReminders(boardId: number): boolean {
    return this.reminderService.hasTriggeredRemindersForBoard(boardId);
  }



  
  loadBoards() {
    this.boardService.getAllBoards().subscribe({
      next: (boards) => {
        this.boards = boards;
        // Select first board by default if available
        if (boards.length > 0 && !this.selectedBoard) {
          this.selectBoard(boards[0]);
        } else if (boards.length === 0) {
          this.selectedBoard = null;
          this.notes = [];
          this.filteredNotes = [];
        }
      },
      error: (error) => {
        console.error('Error loading boards:', error);
      }
    });
  }
  
  selectBoard(board: Board) {
    this.selectedBoard = board;
    this.loadNotes();
  }
  
  toggleSidebar() {
    this.sidebarExpanded = !this.sidebarExpanded;
  }
  
  addBoard() {
    if (this.boards.length >= 20) {
      return;
    }
    
    this.boardService.createBoard('New Board').subscribe({
      next: (board) => {
        this.boards.push(board);
        this.selectBoard(board);
      },
      error: (error) => {
        console.error('Error creating board:', error);
      }
    });
  }
  
  startEditBoard(board: Board, event: Event) {
    event.stopPropagation();
    this.editingBoard = board;
    this.editingBoardName = board.name;
  }
  
  saveEditBoard() {
    if (!this.editingBoard || !this.editingBoardName.trim()) {
      return;
    }
    
    this.boardService.updateBoard(this.editingBoard.id!, this.editingBoardName.trim()).subscribe({
      next: (updatedBoard) => {
        const index = this.boards.findIndex(b => b.id === updatedBoard.id);
        if (index !== -1) {
          this.boards[index] = updatedBoard;
          if (this.selectedBoard?.id === updatedBoard.id) {
            this.selectedBoard = updatedBoard;
          }
        }
        this.editingBoard = null;
        this.editingBoardName = '';
      },
      error: (error) => {
        console.error('Error updating board:', error);
      }
    });
  }
  
  cancelEditBoard() {
    this.editingBoard = null;
    this.editingBoardName = '';
  }

  
  showDeleteConfirmation() {
    this.showDeleteConfirm = true;
  }
  
  cancelDelete() {
    this.showDeleteConfirm = false;
  }
  
  confirmDelete() {
    if (!this.editingBoard) {
      return;
    }
    
    const boardId = this.editingBoard.id!;
    this.boardService.deleteBoard(boardId).subscribe({
      next: () => {
        this.boards = this.boards.filter(b => b.id !== boardId);
        // If deleted board was selected, select another one
        if (this.selectedBoard?.id === boardId) {
          if (this.boards.length > 0) {
            this.selectBoard(this.boards[0]);
          } else {
            this.selectedBoard = null;
            this.notes = [];
            this.filteredNotes = [];
          }
        }
        this.editingBoard = null;
        this.editingBoardName = '';
        this.showDeleteConfirm = false;
      },
      error: (error) => {
        console.error('Error deleting board:', error);
      }
    });
  }


  
  loadNotes() {
    if (!this.selectedBoard) {
      this.notes = [];
      this.filteredNotes = [];
      return;
    }
    
    this.noteService.getAllNotes(this.selectedBoard.id).subscribe({
      next: (notes) => {
        this.notes = notes;
        // Apply current filters to the newly loaded notes
        this.applyFilters();
        this.updateAllTags();
        // Save notes to localStorage for reminder service
        this.saveNotesToLocalStorage();
        // Check for missed reminders that passed while user was logged out
        setTimeout(() => {
          this.reminderService.checkMissedReminders();
        }, 1000);
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
    
    // Update board match counts based on current filters
    this.calculateBoardMatchCounts();
  }

  private calculateBoardMatchCounts() {
    // Only calculate if there's an active filter
    if (!this.selectedTag && !this.searchQuery.trim()) {
      this.boardMatchCounts.clear();
      return;
    }
    
    // Load all user notes if not already loaded
    this.noteService.getAllNotesForUser().subscribe({
      next: (allNotes) => {
        this.allUserNotes = allNotes;
        
        // Calculate match counts for each board
        const counts = new Map<number, number>();
        
        this.boards.forEach(board => {
          const boardNotes = allNotes.filter(note => note.boardId === board.id);
          
          let matchingNotes = boardNotes;
          
          // Apply tag filter
          if (this.selectedTag) {
            matchingNotes = matchingNotes.filter(note => 
              note.tags && note.tags.includes(this.selectedTag)
            );
          }
          
          // Apply search filter
          if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase().trim();
            matchingNotes = matchingNotes.filter(note => 
              (note.title && note.title.toLowerCase().includes(query)) ||
              (note.content && note.content.toLowerCase().includes(query))
            );
          }
          
          // Store count if there are matching notes
          if (matchingNotes.length > 0) {
            counts.set(board.id!, matchingNotes.length);
          }
        });
        
        this.boardMatchCounts = counts;
      },
      error: (error) => {
        console.error('Error loading all notes for match counts:', error);
      }
    });
  }

  getBoardMatchCount(boardId: number): number {
    return this.boardMatchCounts.get(boardId) || 0;
  }

  addNote() {
    if (!this.selectedBoard) {
      return;
    }
    
    // Clear tag filter if active so new note is visible
    if (this.selectedTag) {
      this.selectedTag = '';
      this.applyFilters();
    }
    
    const newNote: Note = {
      title: '',
      content: '',
      positionX: 50 + (this.notes.length * 30) % 200,
      positionY: 50 + (this.notes.length * 30) % 200,
      color: '#fef3c7',
      tags: []
    };
    
    this.noteService.createNote(newNote, this.selectedBoard.id!).subscribe({
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

  getAnimationTrigger(): string {
    // Create a unique trigger that changes whenever filter or search changes
    // This ensures animations run when switching between different filters
    return `${this.selectedTag}-${this.searchQuery}-${this.filteredNotes.length}`;
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
