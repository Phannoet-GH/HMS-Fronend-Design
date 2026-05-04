import { Component, Input, OnChanges, SimpleChanges, NgModule } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-occupancy-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './occupancy-chart.component.html',
  styleUrl: './occupancy-chart.component.css'
})
export class OccupancyChartComponent implements OnChanges {
  @Input() occupied: number = 0;
  @Input() available: number = 0;
  @Input() maintenance: number = 0;
  @Input() reserved: number = 0;

  chartConfig: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels: ['Occupied', 'Available', 'Maintenance', 'Reserved'],
      datasets: [
        {
          data: [0, 0, 0, 0],
          backgroundColor: [
            '#f59e0b',
            '#10b981',
            '#ef4444',
            '#06b6d4'
          ],
          borderColor: [
            'rgba(245, 158, 11, 0.2)',
            'rgba(16, 185, 129, 0.2)',
            'rgba(239, 68, 68, 0.2)',
            'rgba(6, 182, 212, 0.2)'
          ],
          borderWidth: 2,
          hoverOffset: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: {
              size: 12,
              weight: 600
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          padding: 12,
          titleFont: {
            size: 13,
            weight: 700
          },
          bodyFont: {
            size: 12
          },
          callbacks: {
            label: (context) => {
              const total = this.occupied + this.available + this.maintenance + this.reserved;
              const value = context.parsed;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['occupied'] || changes['available'] || changes['maintenance'] || changes['reserved']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (this.chartConfig.data?.datasets) {
      this.chartConfig.data.datasets[0].data = [
        this.occupied,
        this.available,
        this.maintenance,
        this.reserved
      ];
    }
  }
}
