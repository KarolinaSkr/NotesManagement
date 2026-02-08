import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note } from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = 'http://localhost:8080/api/notes';



  constructor(private http: HttpClient) { }

  getAllNotes(boardId?: number): Observable<Note[]> {
    const url = boardId ? `${this.apiUrl}?boardId=${boardId}` : this.apiUrl;
    return this.http.get<Note[]>(url);
  }

  getAllNotesForUser(): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUrl}/all`);
  }

  getNoteById(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.apiUrl}/${id}`);
  }

  createNote(note: Note, boardId: number): Observable<Note> {
    const noteWithBoardId = { ...note, boardId };
    return this.http.post<Note>(this.apiUrl, noteWithBoardId);
  }


  updateNote(id: number, note: Note): Observable<Note> {
    return this.http.put<Note>(`${this.apiUrl}/${id}`, note);
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getNotesByTag(tag: string): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUrl}/filter?tag=${encodeURIComponent(tag)}`);
  }
}
