import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { ChoiceCard } from 'src/app/core/models/choice-card.interface';
import { ChoiceStats } from 'src/app/core/models/choice-stats.interface';
import { ChoiceToolState } from './choice-tool.state';
import { View } from './types/view.type';

@Injectable()
export class ChoiceToolStore extends ComponentStore<ChoiceToolState> {
    constructor() {
        super({
            choices: [],
            choiceStats: [],
            view: 'choice',
        });
    }

    // ** SELECTORS ** //

    public readonly choices$: Observable<ChoiceCard[]> = this.select(
        (state) => state.choices
    );

    public readonly choiceStats$: Observable<ChoiceStats[]> = this.select(
        (state) => state.choiceStats
    );

    public readonly view$: Observable<View> = this.select(
        (state) => state.view
    );

    // ** CHOICES ** //

    public readonly addChoice = this.updater(
        (state, choice: ChoiceCard): ChoiceToolState => {
            return { ...state, choices: [choice, ...state.choices] };
        }
    );

    public readonly updateChoiceStats = this.updater(
        (state, choiceStats: ChoiceStats[]): ChoiceToolState => {
            return { ...state, choiceStats: [...choiceStats] };
        }
    );

    // ** VIEW ** //
    public readonly updateView = this.updater(
        (state, view: View): ChoiceToolState => {
            return { ...state, view: view };
        }
    );
}
