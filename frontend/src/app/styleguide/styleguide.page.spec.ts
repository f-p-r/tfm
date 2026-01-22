import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StyleguidePage } from './styleguide.page';

describe('StyleguidePage', () => {
  let component: StyleguidePage;
  let fixture: ComponentFixture<StyleguidePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StyleguidePage],
    }).compileComponents();

    fixture = TestBed.createComponent(StyleguidePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
