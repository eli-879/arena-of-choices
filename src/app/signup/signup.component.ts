import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthFacade } from '../core/store/facades/auth.facade';
import { Observable } from 'rxjs';
import { selectErrorMessage } from '../core/store/selectors/auth.selectors';

@Component({
    selector: 'arena-of-choices-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent implements OnInit {
    public form!: FormGroup;
    public loading = false;
    public submitted = false;

    public errorMessage$: Observable<string | null>;

    constructor(
        private formBuilder: FormBuilder,
        private store: Store,
        private authFacade: AuthFacade
    ) {
        this.errorMessage$ = this.store.select(selectErrorMessage);
    }
    // convenience getter for easy access to form fields
    get f() {
        return this.form.controls;
    }

    public ngOnInit(): void {
        this.form = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    public onSubmit() {
        const payload = {
            email: this.f['username'].value,
            password: this.f['password'].value,
        };
        this.authFacade.signup(payload);
    }
}
