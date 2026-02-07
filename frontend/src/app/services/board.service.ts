import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Board } from '../models/board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private apiUrl = 'http://localhost:8080/api/boards';



  constructor(private http: HttpClient) { }

  getAllBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(this.apiUrl);
  }

  getBoardById(id: number): Observable<Board> {
    return this.http.get<Board>(`${this.apiUrl}/${id}`);
  }

  createBoard(name: string): Observable<Board> {
    return this.http.post<Board>(this.apiUrl, { name });
  }

  updateBoard(id: number, name: string): Observable<Board> {
    return this.http.put<Board>(`${this.apiUrl}/${id}`, { name });
  }

  deleteBoard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBoardCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }
}
