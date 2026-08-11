import {  Component, computed, inject, signal, Signal, untracked, viewChildren, WritableSignal, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

const DAYS_PER_WEEK = 7;
interface CalendarCell<D = any> {
  displayName: string;
  ariaLabel: string;
  date: D;
  selected: WritableSignal<boolean>;
  day: number;
  disabled?: boolean; // <-- agregar esta línea
}



@Component({
  selector: 'app-calendar',
  imports: [MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    FormsModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  exportAs: 'app-calendar',
})
export class Calendar {
  @Input() month!: number;   // o Date, según tu lógica
  @Input() year!: number;    // idem

  @Output() dateSelected = new EventEmitter<Date>();

  @Input() disabled: boolean = false;
  // cuando el usuario selecciona un día:
  selectDate(date: Date) {
    if (!this.disabled) {
      this.dateSelected.emit(date);
    }
  }
  private readonly _dayButtons = viewChildren('dayButton', {read: HTMLButtonElement});
  private readonly _dateAdapter = inject<DateAdapter<Calendar>>(DateAdapter, {optional: true})!;
  private readonly _dateFormats = inject<MatDateFormats>(MAT_DATE_FORMATS, {optional: true})!;
  private readonly _firstWeekOffset = computed(() => {
    const firstDayOfMonth = this._dateAdapter.createDate(
      this._dateAdapter.getYear(this.viewMonth()),
      this._dateAdapter.getMonth(this.viewMonth()),
      1,
    );
    return (
      (DAYS_PER_WEEK +
        this._dateAdapter.getDayOfWeek(firstDayOfMonth) -
        this._dateAdapter.getFirstDayOfWeek()) %
      DAYS_PER_WEEK
    );
  });
  protected readonly monthYearLabel = computed(() =>
    this._dateAdapter
      .format(this.viewMonth(), this._dateFormats.display.monthYearLabel)
      .toLocaleUpperCase(),
  );
  protected readonly daysFromPrevMonth: Signal<number[]> = computed(() => {
    const prevMonthNumDays = this._dateAdapter.getNumDaysInMonth(
      this._dateAdapter.addCalendarMonths(this.viewMonth(), -1),
    );
    const days: number[] = [];
    for (let i = this._firstWeekOffset() - 1; i >= 0; i--) {
      days.push(prevMonthNumDays - i);
    }
    return days;
  });
  readonly weekdays: Signal<{long: string; narrow: string}[]> = computed(() => {
    const firstDayOfWeek = this._dateAdapter.getFirstDayOfWeek();
    const narrowWeekdays = this._dateAdapter.getDayOfWeekNames('narrow');
    const longWeekdays = this._dateAdapter.getDayOfWeekNames('long');
    const weekdays = longWeekdays.map((long, i) => {
      return {long, narrow: narrowWeekdays[i]};
    });
    return weekdays.slice(firstDayOfWeek).concat(weekdays.slice(0, firstDayOfWeek));
  });
  /** The current selected date. */
  readonly selectedDate: WritableSignal<Calendar> = signal(this._dateAdapter.today());
  /** The current display month. */
  readonly viewMonth: WritableSignal<Calendar> = signal(this.selectedDate());
  /** Calendar day cells. */
  readonly calendar = computed(() => {
    const month = this.viewMonth();
    const daysInMonth = this._dateAdapter.getNumDaysInMonth(month);
    const dateNames = this._dateAdapter.getDateNames();
    const calendar: CalendarCell[][] = [[]];
    for (let i = 0, cell = this._firstWeekOffset(); i < daysInMonth; i++, cell++) {
      if (cell == DAYS_PER_WEEK) {
        calendar.push([]);
        cell = 0;
      }
      const date = this._dateAdapter.createDate(
        this._dateAdapter.getYear(month),
        this._dateAdapter.getMonth(month),
        i + 1,
      );
      const ariaLabel = this._dateAdapter.format(date, this._dateFormats.display.dateA11yLabel);
      calendar[calendar.length - 1].push({
        displayName: dateNames[i],
        ariaLabel,
        date,
        selected: signal(
          this._dateAdapter.compareDate(
            date,
            untracked(() => this.selectedDate()),
          ) === 0,
        ),
        day: i + 1,
        disabled: false
      });
    }
    return calendar;
  });

  onDayClick(day: CalendarCell) {
  // Desmarca todos los demás días
  this.calendar().forEach(week =>
    week.forEach(cell => cell.selected.set(false))
  );

  // Marca el día actual
  day.selected.set(true);

  // Actualiza la fecha seleccionada global
  this.selectedDate.set(day.date);

  // Emitir evento si lo necesitas
  this.dateSelected.emit(day.date);
}

  nextMonth(): void {
    this.viewMonth.set(this._dateAdapter.addCalendarMonths(this.viewMonth(), 1));
  }
  prevMonth(): void {
    this.viewMonth.set(this._dateAdapter.addCalendarMonths(this.viewMonth(), -1));
  }
  scrollDown(): void {
  this.nextMonth();
  setTimeout(() => this._dayButtons()[0]?.focus());
}

scrollUp(): void {
  this.prevMonth();
  setTimeout(() => this._dayButtons()[this._dayButtons().length - 1]?.focus());
}
  onKeyDown(event: KeyboardEvent): void {
    const day = Number((event.target as Element).getAttribute('data-day'));
    if (!day) return;
    const viewMonthNumDays = this._dateAdapter.getNumDaysInMonth(this.viewMonth());
    if (day > 7 && day <= viewMonthNumDays - 7) return;
    const arrowLeft = event.key === 'ArrowLeft';
    const arrowRight = event.key === 'ArrowRight';
    const arrowUp = event.key === 'ArrowUp';
    const arrowDown = event.key === 'ArrowDown';
    if ((day === 1 && arrowLeft) || (day <= 7 && arrowUp)) {
      this.scrollUp();
    }
    if ((day === viewMonthNumDays && arrowRight) || (day > viewMonthNumDays - 7 && arrowDown)) {
      this.scrollDown();
    }
  }
}