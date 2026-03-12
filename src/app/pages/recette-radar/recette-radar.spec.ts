import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecetteRadar } from './recette-radar';

describe('RecetteRadar', () => {
  let component: RecetteRadar;
  let fixture: ComponentFixture<RecetteRadar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecetteRadar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecetteRadar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
