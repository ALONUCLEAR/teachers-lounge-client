import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MunicipaitiesStore } from './stores/gov/municipalities/municipalities.store';
import { StreetsStore } from './stores/gov/streets/streets.store';
import { UserService } from './stores/user/user.service';
import { AuthStore } from './stores/auth/auth.store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  providers: [MunicipaitiesStore, StreetsStore],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  private intervals: number[] = [];

  private readonly LOGGED_UESR_REFETCH_INTERVAL_MS = 30 * 1000;
  readonly ENVIRONMENT = environment.env;

  constructor(
    private readonly municipalitiesStore: MunicipaitiesStore,
    private readonly streetsStore: StreetsStore,
    private readonly userService: UserService,
    private readonly authStore: AuthStore,
  ) {}

  ngOnInit(): void {
    this.initializeStores();
  }

  ngAfterViewInit(): void {
    this.intervals.push(window.setInterval(() => {
      this.authStore.refetchLoggedUser();
    }, this.LOGGED_UESR_REFETCH_INTERVAL_MS));
  }

  async initializeStores(): Promise<void> {
    const results = await Promise.allSettled([
      this.municipalitiesStore.initiaize(),
      this.streetsStore.initiaize(),
    ]);

    results.forEach((res, index) => {
      if (res.status === 'rejected') {
        console.error(
          `Error - the ${index + 1}th initialization promise failed`
        );
      }
    });

    await this.userService.poll$();
  }

  private removeAllIntervals(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  ngOnDestroy(): void {
    this.userService.stopPolling();
    this.removeAllIntervals();
  }
}
