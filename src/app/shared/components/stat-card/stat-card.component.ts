import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type StatTone = 'accent' | 'gold' | 'green' | 'red' | 'purple' | 'teal' | 'amber';

@Component({
  selector: 'app-stat-card',
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = '';
  @Input() hint = '';
  @Input() tone: StatTone = 'accent';
}
