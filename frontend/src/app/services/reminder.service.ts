import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Note } from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private readonly REMINDER_KEY = 'note_reminders';
  private checkInterval: any;

  // Subject to notify components when a reminder is triggered
  public reminderTriggered$ = new Subject<number>();

  constructor() {
    this.loadRemindersFromStorage();
    this.startReminderCheck();
  }
  /**
   * Start the global timer to check for due reminders
   */
  private startReminderCheck(): void {
    // Check every 10 seconds for responsive notifications
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 10000);

    // Initial check after a short delay
    setTimeout(() => this.checkReminders(), 2000);
  }

  /**
   * Stop the reminder check interval
   */
  stopReminderCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Check all notes for due reminders and show notifications
   */
  private checkReminders(): void {
    const notes = this.getAllNotesWithReminders();
    const now = new Date();

    notes.forEach(note => {
      if (note.reminderAt && !note.reminderTriggered) {
        const reminderDate = new Date(note.reminderAt);
        
        if (reminderDate <= now) {
          this.showStyledAlert(note);
          this.markReminderAsTriggered(note.id!);
        }
      }
    });
  }

  /**
   * Show styled alert for a note reminder
   */
  private showStyledAlert(note: Note): void {
    // Create styled alert overlay
    const overlay = document.createElement('div');
    overlay.id = 'reminder-alert-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      animation: fadeIn 0.3s ease;
    `;
    
    // Create alert box
    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px 40px;
      max-width: 420px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: slideUp 0.4s ease;
      border: 3px solid #ef4444;
    `;
    
    // Check if dark mode
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
      alertBox.style.background = '#1f2937';
      alertBox.style.color = '#f9fafb';
    }
    
    alertBox.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
      <div style="font-size: 24px; font-weight: 700; color: #ef4444; margin-bottom: 12px;">Note Reminder</div>
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: ${isDarkMode ? '#f9fafb' : '#1f2937'};">
        "${note.title || 'Untitled Note'}"
      </div>
      <div style="font-size: 14px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'}; margin-bottom: 24px;">
        Your reminder went off!
      </div>
      <button id="reminder-alert-btn" style="
        background: #ef4444;
        color: white;
        border: none;
        padding: 12px 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      ">OK</button>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #reminder-alert-btn:hover {
        background: #dc2626 !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      }
    `;
    
    overlay.appendChild(alertBox);
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    
    // Handle button click
    const btn = alertBox.querySelector('#reminder-alert-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        overlay.style.animation = 'fadeIn 0.2s ease reverse';
        setTimeout(() => {
          overlay.remove();
          style.remove();
        }, 200);
      });
    }
    
    // Also close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.animation = 'fadeIn 0.2s ease reverse';
        setTimeout(() => {
          overlay.remove();
          style.remove();
        }, 200);
      }
    });
  }

  /**
   * Mark a reminder as triggered and save to storage
   */
  private markReminderAsTriggered(noteId: number): void {
    const reminders = this.getRemindersFromStorage();
    reminders[noteId] = {
      ...reminders[noteId],
      reminderTriggered: true,
      triggeredAt: new Date().toISOString()
    };
    this.saveRemindersToStorage(reminders);
    
    // Notify all subscribers that this note's reminder was triggered
    this.reminderTriggered$.next(noteId);
  }

  /**
   * Set a reminder for a note
   */
  setReminder(noteId: number, reminderAt: Date): void {
    const reminders = this.getRemindersFromStorage();
    reminders[noteId] = {
      reminderAt: reminderAt.toISOString(),
      reminderTriggered: false,
      triggeredAt: null
    };
    this.saveRemindersToStorage(reminders);
    
    // Immediate check in case reminder is already due
    setTimeout(() => this.checkReminders(), 100);
  }

  /**
   * Remove a reminder for a note
   */
  removeReminder(noteId: number): void {
    const reminders = this.getRemindersFromStorage();
    delete reminders[noteId];
    this.saveRemindersToStorage(reminders);
  }

  /**
   * Get reminder data for a specific note
   */
  getReminderForNote(noteId: number): { reminderAt: Date | null; reminderTriggered: boolean } {
    const reminders = this.getRemindersFromStorage();
    const reminder = reminders[noteId];
    
    if (!reminder) {
      return { reminderAt: null, reminderTriggered: false };
    }

    return {
      reminderAt: reminder.reminderAt ? new Date(reminder.reminderAt) : null,
      reminderTriggered: reminder.reminderTriggered || false
    };
  }

  /**
   * Get all notes with their reminder data merged
   */
  private getAllNotesWithReminders(): Note[] {
    // Get notes from localStorage (stored by board component)
    const notesJson = localStorage.getItem('notes');
    if (!notesJson) {
      console.log('No notes found in localStorage');
      return [];
    }

    try {
      const notes: Note[] = JSON.parse(notesJson);
      const reminders = this.getRemindersFromStorage();

      return notes.map(note => {
        const reminder = reminders[note.id!];
        if (reminder) {
          return {
            ...note,
            reminderAt: reminder.reminderAt ? new Date(reminder.reminderAt) : null,
            reminderTriggered: reminder.reminderTriggered || false
          };
        }
        return note;
      });
    } catch (error) {
      console.error('Error parsing notes from localStorage:', error);
      return [];
    }
  }

  /**
   * Load reminders from localStorage
   */
  private getRemindersFromStorage(): { [noteId: number]: any } {
    const remindersJson = localStorage.getItem(this.REMINDER_KEY);
    return remindersJson ? JSON.parse(remindersJson) : {};
  }

  /**
   * Save reminders to localStorage
   */
  private saveRemindersToStorage(reminders: { [noteId: number]: any }): void {
    localStorage.setItem(this.REMINDER_KEY, JSON.stringify(reminders));
  }

  /**
   * Load and sync reminders from storage on init
   */
  private loadRemindersFromStorage(): void {
    // Ensure storage is initialized
    if (!localStorage.getItem(this.REMINDER_KEY)) {
      localStorage.setItem(this.REMINDER_KEY, JSON.stringify({}));
    }
  }

  /**
   * Reset reminder triggered state (when user removes a triggered reminder)
   */
  resetReminder(noteId: number): void {
    const reminders = this.getRemindersFromStorage();
    if (reminders[noteId]) {
      reminders[noteId].reminderTriggered = false;
      reminders[noteId].triggeredAt = null;
      this.saveRemindersToStorage(reminders);
    }
  }

  /**
   * Clean up old triggered reminders (optional maintenance)
   */
  cleanupOldReminders(daysOld: number = 7): void {
    const reminders = this.getRemindersFromStorage();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysOld * 24 * 60 * 60 * 1000);

    Object.keys(reminders).forEach(noteId => {
      const reminder = reminders[parseInt(noteId)];
      if (reminder.reminderTriggered && reminder.triggeredAt) {
        const triggeredDate = new Date(reminder.triggeredAt);
        if (triggeredDate < cutoffDate) {
          delete reminders[parseInt(noteId)];
        }
      }
    });

    this.saveRemindersToStorage(reminders);
  }
}
