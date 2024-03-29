import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarButtonComponent } from './navbar-button/navbar-button.component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectIsAuthenticated } from '../core/store/selectors/auth.selectors';
import { AuthFacade } from '../core/store/facades/auth.facade';

@Component({
    selector: 'arena-of-choices-navbar',
    standalone: true,
    imports: [CommonModule, NavbarButtonComponent],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
    public isAuthenticated$: Observable<boolean>;

    constructor(private store: Store, private authFacade: AuthFacade) {
        this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    }

    public onLogoutClick() {
        console.log('logout');
        this.authFacade.logout();
    }
}
