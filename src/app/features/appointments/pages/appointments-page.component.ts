import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import {
    Appointment,
    CreateAppointment,
    User
} from '../../../core/models/domain.models';

import { AppointmentsService } from '../data-access/appointments.service';
import { UsersService } from '../../users/data-access/users.service';
import { SessionService } from '../../../core/services/session.service';
import { Calendar } from '../../calendar/calendar';

@Component({
    selector: 'app-appointments-page',
    imports: [
        ReactiveFormsModule,
        DatePipe,
        Calendar
    ],
    templateUrl: './appointments-page.html',
    styleUrl: './appointments-page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsPageComponent {

    month: number = new Date().getMonth();
    year: number = new Date().getFullYear();

    appointmentsScheduled: number = 0;
    appointmentsCancelled: number = 0;

    readonly today = new Date();

    private readonly fb = inject(FormBuilder);
    private readonly appointmentsService = inject(AppointmentsService);
    private readonly userService = inject(UsersService);
    private readonly session = inject(SessionService);

    // =========================================================
    // State
    // =========================================================

    readonly appointments = signal<Appointment[]>([]);
    readonly customers = signal<User[]>([]);

    // =========================================================
    // Pagination
    // =========================================================

    /**
     * Número máximo de citas mostradas por página.
     */
    readonly pageSize = signal(8);

    /**
     * Página actualmente seleccionada.
     */
    readonly currentPage = signal(1);

    /**
     * Cantidad total de páginas.
     */
    readonly totalPages = computed(() => {
        const totalAppointments = this.appointments().length;
        const pageSize = this.pageSize();

        return Math.max(
            1,
            Math.ceil(totalAppointments / pageSize)
        );
    });

    /**
     * Citas que se muestran en la página actual.
     */
    readonly paginatedAppointments = computed(() => {
        const appointments = this.appointments();
        const currentPage = this.currentPage();
        const pageSize = this.pageSize();

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return appointments.slice(startIndex, endIndex);
    });

    /**
     * Números de página.
     */
    readonly pages = computed(() => {
        return Array.from(
            { length: this.totalPages() },
            (_, index) => index + 1
        );
    });

    /**
     * Primer registro visible.
     */
    readonly paginationStart = computed(() => {
        const totalAppointments = this.appointments().length;

        if (totalAppointments === 0) {
            return 0;
        }

        return (
            (this.currentPage() - 1) * this.pageSize()
        ) + 1;
    });

    /**
     * Último registro visible.
     */
    readonly paginationEnd = computed(() => {
        return Math.min(
            this.currentPage() * this.pageSize(),
            this.appointments().length
        );
    });

    // =========================================================
    // Form
    // =========================================================

    readonly form = this.fb.nonNullable.group({
        clientId: ['', Validators.required],

        employeeId: [
            this.session.user()?.id || '',
            Validators.required
        ],

        startsAt: ['', Validators.required],

        notes: [
            '',
            Validators.maxLength(500)
        ]
    });

    // =========================================================
    // Lifecycle
    // =========================================================

    constructor() {
        this.load();
    }

    // =========================================================
    // Calendar
    // =========================================================

    onDateSelected(date: Date): void {
        console.log('Fecha seleccionada:', date);
    }

    // =========================================================
    // Validation
    // =========================================================

    isInvalid(
        field: 'clientId' | 'employeeId' | 'startsAt' | 'notes'
    ): boolean {
        const control = this.form.controls[field];

        return control.invalid && (
            control.touched ||
            control.dirty
        );
    }

    isValid(
        field: 'clientId' | 'employeeId' | 'startsAt' | 'notes'
    ): boolean {
        const control = this.form.controls[field];

        return control.valid && (
            control.touched ||
            control.dirty
        );
    }

    // =========================================================
    // Pagination actions
    // =========================================================

    goToPage(page: number): void {
        if (
            page < 1 ||
            page > this.totalPages() ||
            page === this.currentPage()
        ) {
            return;
        }

        this.currentPage.set(page);
    }

    nextPage(): void {
        const nextPage = this.currentPage() + 1;

        if (nextPage <= this.totalPages()) {
            this.currentPage.set(nextPage);
        }
    }

    previousPage(): void {
        const previousPage = this.currentPage() - 1;

        if (previousPage >= 1) {
            this.currentPage.set(previousPage);
        }
    }

    // =========================================================
    // Create appointment
    // =========================================================

    book(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();

        const payload: CreateAppointment = {
            clientId: raw.clientId,

            employeeId:
                this.session.user()?.id || '',

            startsAt:
                new Date(raw.startsAt),

            endsAt:
                new Date(
                    new Date(raw.startsAt).getTime() +
                    30 * 60 * 1000
                ),

            status: 'scheduled',

            notes:
                raw.notes.trim()
        };

        this.appointmentsService
            .create(payload)
            .subscribe(() => {

                this.form.reset({
                    clientId: '',

                    employeeId:
                        this.session.user()?.id || '',

                    startsAt: '',

                    notes: ''
                });

                // Después de crear volvemos
                // a la primera página.
                this.currentPage.set(1);

                this.load();
            });
    }

    // =========================================================
    // Remove
    // =========================================================

    remove(id: string): void {
        this.appointmentsService
            .remove(id)
            .subscribe(() => {

                this.load();
            });
    }

    // =========================================================
    // Appointment status
    // =========================================================

    appointmentStatusClass(
        status: Appointment['status']
    ): string {

        switch (status) {

            case 'scheduled':
                return 'bg-success-subtle text-success-emphasis border border-success-subtle';

            case 'cancelled':
                return 'bg-danger-subtle text-danger-emphasis border border-danger-subtle';

            default:
                return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
        }
    }

    // =========================================================
    // Data
    // =========================================================

    private load(): void {

        this.appointmentsService
            .list({
                page: 1,
                limit: 20
            })
            .subscribe((response) => {

                this.appointments.set(response.data);

                this.appointmentsScheduled =
                    response.data.filter(
                        appointment =>
                            appointment.status === 'scheduled'
                    ).length;

                this.appointmentsCancelled =
                    response.data.filter(
                        appointment =>
                            appointment.status === 'cancelled'
                    ).length;

                /*
                 * Si después de eliminar registros
                 * la página actual deja de existir,
                 * regresamos automáticamente a
                 * la última página válida.
                 */
                if (
                    this.currentPage() >
                    this.totalPages()
                ) {
                    this.currentPage.set(
                        this.totalPages()
                    );
                }
            });

        this.userService
            .list({
                role: 'client'
            })
            .subscribe((response) => {
                this.customers.set(response.data);
            });
    }
}

