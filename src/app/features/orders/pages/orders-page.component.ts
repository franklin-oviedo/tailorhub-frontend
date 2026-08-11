import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
    CreateOrder,
    Order,
    Product,
    User
} from '../../../core/models/domain.models';

import { OrdersService } from '../data-access/orders.service';
import { ProductsService } from '../../products/data-access/products.service';
import { SessionService } from '../../../core/services/session.service';
import { UsersService } from '../../users/data-access/users.service';

@Component({
    selector: 'app-orders-page',
    imports: [
        DatePipe,
        ReactiveFormsModule
    ],
    templateUrl: './orders-page.html',
    styleUrl: './orders-page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent {

    private readonly fb = inject(FormBuilder);
    private readonly ordersService = inject(OrdersService);
    private readonly productsService = inject(ProductsService);
    private readonly userService = inject(UsersService);
    private readonly session = inject(SessionService);

    // =========================================================
    // State
    // =========================================================

    readonly orders = signal<Order[]>([]);
    readonly products = signal<Product[]>([]);
    readonly customers = signal<User[]>([]);

    readonly loading = signal(false);
    readonly successMessage = signal('');
    readonly errorMessage = signal('');

    // =========================================================
    // Pagination
    // =========================================================

    /**
     * Número de pedidos visibles por página.
     *
     * La paginación es client-side:
     * los pedidos cargados se dividen mediante slice().
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
        const totalOrders = this.orders().length;
        const pageSize = this.pageSize();

        return Math.max(
            1,
            Math.ceil(totalOrders / pageSize)
        );
    });

    /**
     * Pedidos que deben mostrarse en la página actual.
     */
    readonly paginatedOrders = computed(() => {
        const orders = this.orders();
        const currentPage = this.currentPage();
        const pageSize = this.pageSize();

        const startIndex = (currentPage - 1) * pageSize;

        return orders.slice(
            startIndex,
            startIndex + pageSize
        );
    });

    /**
     * Números de página disponibles.
     *
     * Ejemplo:
     * 20 pedidos → [1, 2, 3]
     */
    readonly pages = computed(() =>
        Array.from(
            { length: this.totalPages() },
            (_, index) => index + 1
        )
    );

    /**
     * Primer registro visible.
     */
    readonly paginationStart = computed(() => {
        const totalOrders = this.orders().length;

        if (totalOrders === 0) {
            return 0;
        }

        return (
            (this.currentPage() - 1) * this.pageSize()
        ) + 1;
    });

    /**
     * Último registro visible.
     */
    readonly paginationEnd = computed(() =>
        Math.min(
            this.currentPage() * this.pageSize(),
            this.orders().length
        )
    );

    // =========================================================
    // Form
    // =========================================================

    readonly form = this.fb.nonNullable.group({
        customerId: ['', Validators.required],
        items: ['', Validators.required],
        notes: ['', Validators.maxLength(500)]
    });

    // =========================================================
    // Lifecycle
    // =========================================================

    constructor() {
        this.loadOrders();

        this.userService
            .list({ role: 'client' })
            .subscribe((response) => {
                this.customers.set(response.data);
            });
    }

    // =========================================================
    // Form validation
    // =========================================================

    isInvalid(
        field: 'customerId' | 'items' | 'notes'
    ): boolean {
        const control = this.form.controls[field];

        return control.invalid && (
            control.touched ||
            control.dirty
        );
    }

    isValid(
        field: 'customerId' | 'items' | 'notes'
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
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(page => page + 1);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(page => page - 1);
        }
    }

    // =========================================================
    // Create order
    // =========================================================

    createOrder(): void {
        if (this.form.invalid || this.loading()) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const raw = this.form.getRawValue();

        const payload: CreateOrder = {
            customerId: raw.customerId.trim(),
            items: raw.items
                .split(',')
                .map((itemId) => {
                    const product = this.products()
                        .find((product) => product.id === itemId);

                    return product
                        ? {
                            productId: product.id,
                            quantity: 1
                        }
                        : null;
                })
                .filter(
                    (item): item is {
                        productId: string;
                        quantity: number;
                    } => item !== null
                ),

            notes: raw.notes.trim()
        };

        this.ordersService.create(payload).subscribe({
            next: () => {
                this.loading.set(false);

                this.successMessage.set(
                    'Orden creada correctamente.'
                );

                this.form.reset({
                    customerId: '',
                    items: '',
                    notes: ''
                });

                // Mostramos la primera página después de crear.
                this.currentPage.set(1);

                this.loadOrders();
            },

            error: () => {
                this.loading.set(false);

                this.errorMessage.set(
                    'No fue posible crear la orden.'
                );
            }
        });
    }

    // =========================================================
    // Data
    // =========================================================

    private loadOrders(): void {
        this.ordersService
            .list({
                page: 1,
                limit: 20
            })
            .subscribe((response) => {
                this.orders.set(response.data);

                // Evita quedar en una página inexistente
                // cuando cambia la cantidad de pedidos.
                if (this.currentPage() > this.totalPages()) {
                    this.currentPage.set(this.totalPages());
                }
            });

        this.productsService
            .list({
                page: 1,
                limit: 20
            })
            .subscribe((response) => {
                this.products.set(response.data);
            });
    }

    // =========================================================
    // Order status
    // =========================================================

    orderStatusClass(
        status: Order['status']
    ): string {
        switch (status) {
            case 'completed':
                return 'bg-success-subtle text-success-emphasis border border-success-subtle';

            case 'cancelled':
                return 'bg-danger-subtle text-danger-emphasis border border-danger-subtle';

            case 'in_progress':
                return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';

            case 'confirmed':
                return 'bg-info-subtle text-info-emphasis border border-info-subtle';

            default:
                return 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
        }
    }
}