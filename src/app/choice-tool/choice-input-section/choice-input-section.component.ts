import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoiceInputTextInputComponent } from './choice-input-text-input/choice-input-text-input.component';
import { ChoiceToolStore } from '../store/choice-tool.store';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'arena-of-choices-choice-input-section',
  standalone: true,
  imports: [CommonModule, ChoiceInputTextInputComponent],
  templateUrl: './choice-input-section.component.html',
  styleUrls: ['./choice-input-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceInputSectionComponent {
  public choices$: Observable<string[]>;
  constructor(private choiceToolStore: ChoiceToolStore) {
    this.choices$ = this.choiceToolStore.choices$;
  }
}