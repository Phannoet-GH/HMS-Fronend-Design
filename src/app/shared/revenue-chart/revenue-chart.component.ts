import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './revenue-chart.component.html',
  styleUrl: './revenue-chart.component.css'
})
export class RevenueChartComponent implements OnChanges {
  @Input() revenueData: number[] = [];
  @Input() labels: string[] = [];

  chartConfig: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Daily Revenue',
          data: [],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 3,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
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
          mode: 'index',
          intersect: false,
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
              return `$${Number(context.parsed.y).toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
              drawOnChartArea: true,
          },
          ticks: {
            callback: (value) => {
              return '$' + Number(value).toLocaleString();
            },
            font: {
              size: 11
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['revenueData'] || changes['labels']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (this.chartConfig.data?.datasets && this.chartConfig.data?.labels) {
      this.chartConfig.data.labels = this.labels.length > 0 ? this.labels : this.generateDefaultLabels();
      this.chartConfig.data.datasets[0].data = this.revenueData.length > 0 ? this.revenueData : this.generateSampleData();
    }
  }

  private generateDefaultLabels(): string[] {
    const labels = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (7 - i));
      labels.push(`Day ${i}`);
    }
    return labels;
  }

  private generateSampleData(): number[] {
    return [0, 0, 0, 0, 0, 0, 0];
  }
}
