import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Recette } from '../../models/recette.model';

// Enregistrement des modules Chart.js nécessaires au radar
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/** Bornes idéales par caractéristique (selon standards savonnerie) */
const RANGES: Record<string, { min: number; max: number; cap: number }> = {
  'iode'            : { min: 41,  max: 70,  cap: 200 },
  'indice ins'      : { min: 136, max: 165, cap: 250 },
  'douceur'         : { min: 5,   max: 20,  cap: 30  },
  'lavant'          : { min: 12,  max: 22,  cap: 30  },
  'volume de mousse': { min: 14,  max: 22,  cap: 30  },
  'tenue de mousse' : { min: 16,  max: 48,  cap: 60  },
  'dureté'          : { min: 29,  max: 54,  cap: 80  },
  'solubilité'      : { min: 0,   max: 20,  cap: 30  },
};

/** Noms affichés sur les axes du radar */
const LABELS: Record<string, string> = {
  'iode'            : 'Iode',
  'indice ins'      : 'INS',
  'douceur'         : 'Douceur',
  'lavant'          : 'Lavant',
  'volume de mousse': 'Vol. Mousse',
  'tenue de mousse' : 'Tenue Mousse',
  'dureté'          : 'Dureté',
  'solubilité'      : 'Solubilité',
};

interface RadarPoint {
  label: string;
  key: string;
  value: number;       // valeur normalisée 0-100
  rawValue: number;    // valeur réelle
  status: 'in' | 'below' | 'above';
  min: number;
  max: number;
}

@Component({
  selector: 'app-recette-radar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recette-radar.html',
  styleUrl: './recette-radar.css',
})
export class RecetteRadarComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() recette!: Recette;
  @ViewChild('radarCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  points: RadarPoint[] = [];

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recette'] && !changes['recette'].firstChange) {
      this.buildChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  // ── Normalise une valeur brute en 0-100 selon le cap ────────
  private normalize(value: number, cap: number): number {
    return Math.min(100, Math.round((value / cap) * 100));
  }

  // ── Statut dans/hors des bornes ──────────────────────────────
  private status(value: number, min: number, max: number): 'in' | 'below' | 'above' {
    if (value < min) return 'below';
    if (value > max) return 'above';
    return 'in';
  }

  // ── Construction / mise à jour du graphique ──────────────────
  buildChart(): void {
    if (!this.canvasRef || !this.recette?.resultats?.length) return;

    // Construit les points à partir des resultats de l'API
    this.points = [];
    const dataValues: number[] = [];
    const minValues: number[] = [];
    const maxValues: number[] = [];
    const labels: string[] = [];
    const pointColors: string[] = [];

    for (const [key, range] of Object.entries(RANGES)) {
      const resultat = this.recette.resultats.find(
        r => r.caracteristique?.nom?.toLowerCase().includes(key) ||
             key.includes(r.caracteristique?.nom?.toLowerCase() ?? '')
      );
      if (!resultat) continue;

      const raw  = resultat.score;
      const norm = this.normalize(raw, range.cap);
      const st   = this.status(raw, range.min, range.max);

      this.points.push({
        label:    LABELS[key] ?? key,
        key,
        value:    norm,
        rawValue: raw,
        status:   st,
        min:      range.min,
        max:      range.max,
      });

      dataValues.push(norm);
      minValues.push(this.normalize(range.min, range.cap));
      maxValues.push(this.normalize(range.max, range.cap));
      labels.push(LABELS[key] ?? key);
      pointColors.push(
        st === 'in'    ? '#4a7c59' :
        st === 'above' ? '#e8a020' : '#3a7ca5'
      );
    }

    // Détruit l'ancien chart avant d'en créer un nouveau
    this.chart?.destroy();

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            // Zone idéale (fond)
            label: 'Zone idéale',
            data: maxValues,
            backgroundColor: 'rgba(74, 124, 89, 0.08)',
            borderColor: 'rgba(74, 124, 89, 0.25)',
            borderWidth: 1,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: true,
          },
          {
            // Valeurs réelles de la recette
            label: 'Recette',
            data: dataValues,
            backgroundColor: 'rgba(58, 124, 165, 0.18)',
            borderColor: '#3a7ca5',
            borderWidth: 2.5,
            pointBackgroundColor: pointColors,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pt = this.points[ctx.dataIndex];
                if (!pt || ctx.datasetIndex === 0) return '';
                const icon = pt.status === 'in' ? '✓' : pt.status === 'above' ? '↑' : '↓';
                return ` ${icon} ${pt.rawValue.toFixed(2)} (idéal : ${pt.min}–${pt.max})`;
              },
            },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              display: false,
              stepSize: 25,
            },
            grid: {
              color: 'rgba(0,0,0,0.07)',
            },
            angleLines: {
              color: 'rgba(0,0,0,0.1)',
            },
            pointLabels: {
              font: { size: 12, family: "'DM Sans', sans-serif" },
              color: '#3b2a1a',
            },
          },
        },
      },
    });
  }
}