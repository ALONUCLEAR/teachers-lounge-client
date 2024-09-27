import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MunicipaitiesStore } from './stores/gov/municipalities/municipalities.store';
import { StreetsStore } from './stores/gov/streets/streets.store';
import { Toast, ToastService } from './services/toast.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  providers: [MunicipaitiesStore, StreetsStore],
})
export class AppComponent implements OnInit {
  title = 'teachers-lounge-client';
  readonly environment = environment.env;
  readonly url = environment.serverUrl;

  allToasts$ = new BehaviorSubject<Toast[]>([]);

  constructor(
    private readonly municipalitiesStore: MunicipaitiesStore,
    private readonly streetsStore: StreetsStore,
    public readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.allToasts$ = this.toastService.selectAllToasts$();
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
  }
}
