import { Component, OnDestroy, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MunicipaitiesStore } from './stores/gov/municipalities/municipalities.store';
import { StreetsStore } from './stores/gov/streets/streets.store';
import { UserService } from './stores/user/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  providers: [MunicipaitiesStore, StreetsStore],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly environment = environment.env;
  readonly url = environment.serverUrl;

  constructor(
    private readonly municipalitiesStore: MunicipaitiesStore,
    private readonly streetsStore: StreetsStore,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    this.initializeStores();
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

  ngOnDestroy(): void {
    this.userService.stopPolling();
  }
}
