import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { RecetteService } from './Recette.service';
import { Recette } from '../models/recette.model';

describe('RecetteService', () => {
  let service: RecetteService;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:8080/api-savon/v1/recette';

  const mockRecette: Recette = { id: 1, nom: 'Savon Lavande' }as unknown  as Recette;
  const mockRecettes: Recette[] = [
    { id: 1, nom: 'Savon Lavande' } as unknown as Recette,
    { id: 2, nom: 'Savon Rose' } as unknown as Recette,
  ];

  const mockRecetteFormDTO = {
    nom: 'Savon Lavande',
    titre: 'Savon Lavande',
    description: 'Description du savon',
    surgraissage: 5,
    avecSoude: true,
    concentrationAlcali: 0.25,
    concentrationAlcalin: 0.25,
    ligneIngredients: [
      { ingredientId: 1, quantite: 100, recetteId: 1, pourcentage: 10 }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(RecetteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Vérifie qu'il n'y a pas de requêtes HTTP non traitées
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all recettes (GET)', () => {
    service.getRecettes().subscribe((recettes : any) => {
      expect(recettes.length).toBe(2);
      expect(recettes).toEqual(mockRecettes);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockRecettes);
  });

  it('should fetch a recette by id (GET)', () => {
    service.getRecetteById(1).subscribe((recette : any) => {
      expect(recette).toEqual(mockRecette);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRecette);
  });

  it('should add a new recette (POST)', () => {
    service.addRecette(mockRecetteFormDTO).subscribe((recette : any) => {
      expect(recette).toEqual(mockRecette);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRecetteFormDTO);
    req.flush(mockRecette);
  });

  it('should update an existing recette (PUT)', () => {
    service.updateRecette(mockRecette.id, mockRecetteFormDTO).subscribe((recette : any) => {
      expect(recette).toEqual(mockRecette);
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockRecetteFormDTO);
    req.flush(mockRecette);
  });

  it('should delete a recette by id (DELETE)', () => {
    service.deleteRecette(1).subscribe((res: any) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${API_URL}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should delete all recettes (DELETE)', () => {
    service.deleteAllRecettes().subscribe((res: any) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${API_URL}/all`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});