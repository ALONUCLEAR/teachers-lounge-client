import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
let fixture: ComponentFixture<AppComponent>;
let component: AppComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({
        declarations: [AppComponent]
      });
      fixture = TestBed.createComponent(AppComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
  } );

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
