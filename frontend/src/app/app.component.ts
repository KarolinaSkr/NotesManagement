import { Component } from '@angular/core';
import { BoardComponent } from './components/board/board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BoardComponent],
  template: `<app-board></app-board>`
})
export class AppComponent {
  title = 'Notes Management';
}
