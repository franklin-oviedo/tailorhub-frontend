import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

interface LandingMetric {
	readonly label: string;
	readonly value: string;
}

interface LandingCard {
	readonly title: string;
	readonly description: string;
}

interface LandingStep {
	readonly title: string;
	readonly description: string;
}

interface LandingTestimonial {
	readonly quote: string;
	readonly name: string;
	readonly role: string;
	readonly company: string;
}

interface LandingFaq {
	readonly question: string;
	readonly answer: string;
}

interface LandingScreenshot {
	readonly title: string;
	readonly description: string;
	readonly src: string;
	readonly alt: string;
}

@Component({
	selector: 'app-landing-page',
	imports: [NgOptimizedImage, RouterLink],
	templateUrl: './landing-page.html',
	styleUrl: './landing-page.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent {
	readonly heroMetrics: readonly LandingMetric[] = [
		{ value: '+35%', label: 'más productividad operativa' },
		{ value: '-42%', label: 'menos errores en pedidos y medidas' },
		{ value: '+3h/día', label: 'de tiempo recuperado por equipo' }
	];

	readonly problems: readonly LandingCard[] = [
		{
			title: 'Pérdida de medidas',
			description:
				'Las medidas quedan en papeles, chats o múltiples archivos sin control de versiones.'
		},
		{
			title: 'Descontrol de pedidos',
			description:
				'No existe trazabilidad por etapa, responsable o fecha de entrega comprometida.'
		},
		{
			title: 'Retrasos en entregas',
			description:
				'Los cuellos de botella se detectan tarde y generan reprocesos costosos.'
		},
		{
			title: 'Falta de seguimiento',
			description:
				'Cliente y equipo no tienen visibilidad del estado real de cada confección.'
		},
		{
			title: 'Inventario desorganizado',
			description:
				'Insumos críticos se agotan sin alertas y afectan la continuidad de producción.'
		}
	];

	readonly features: readonly LandingCard[] = [
		{
			title: 'Gestión de clientes',
			description: 'Ficha completa, historial de compras y comunicación centralizada por cliente.'
		},
		{
			title: 'Gestión de medidas',
			description: 'Medidas por prenda, actualizaciones seguras y consulta inmediata desde cualquier área.'
		},
		{
			title: 'Control de pedidos',
			description: 'Pedidos con estados, prioridades, fechas y responsables para evitar retrasos.'
		},
		{
			title: 'Seguimiento de confección',
			description: 'Flujo por etapas para visualizar avances, bloqueos y tiempos de ejecución.'
		},
		{
			title: 'Inventario',
			description: 'Control de telas e insumos con movimientos, alertas y disponibilidad en tiempo real.'
		},
		{
			title: 'Reportes',
			description: 'Indicadores clave para ventas, productividad, entregas y rentabilidad.'
		},
		{
			title: 'Gestión de producción',
			description: 'Asignación de carga por equipo y planificación para sostener la operación.'
		},
		{
			title: 'Panel administrativo',
			description: 'Vista ejecutiva para tomar decisiones con información confiable y actualizada.'
		}
	];

	readonly benefits: readonly LandingCard[] = [
		{
			title: 'Menos errores',
			description: 'Estandariza procesos y reduce fallos por información dispersa.'
		},
		{
			title: 'Mayor control',
			description: 'Conoce en segundos qué pasa con cada cliente, pedido y etapa.'
		},
		{
			title: 'Ahorro de tiempo',
			description: 'Automatiza tareas operativas repetitivas y acelera la gestión diaria.'
		},
		{
			title: 'Mayor productividad',
			description: 'Coordina equipos con prioridades claras y trazabilidad completa.'
		},
		{
			title: 'Mejor experiencia del cliente',
			description: 'Entregas más puntuales y comunicación más profesional en todo el proceso.'
		}
	];

	readonly steps: readonly LandingStep[] = [
		{
			title: 'Paso 1: Registrar cliente',
			description: 'Crea la ficha del cliente y centraliza toda su información desde el inicio.'
		},
		{
			title: 'Paso 2: Capturar medidas',
			description: 'Guarda medidas detalladas por tipo de prenda para futuras confecciones.'
		},
		{
			title: 'Paso 3: Crear pedido',
			description: 'Define producto, fechas, responsable y prioridades con control total.'
		},
		{
			title: 'Paso 4: Seguimiento de confección',
			description: 'Monitorea cada etapa y detecta bloqueos antes de que impacten la entrega.'
		},
		{
			title: 'Paso 5: Entrega final',
			description: 'Confirma entrega, cierra el flujo y conserva el historial para próximas ventas.'
		}
	];

	readonly screenshots: readonly LandingScreenshot[] = [
		{
			title: 'Dashboard operativo',
			description: 'Indicadores para decisiones rápidas y control diario del negocio.',
			src: 'manage-orders.png',
			alt: 'Vista de gestión de pedidos en Tailor Hub'
		},
		{
			title: 'Gestión de clientes',
			description: 'Historial completo para personalizar atención y acelerar el servicio.',
			src: 'manage-clients.png',
			alt: 'Panel de clientes en Tailor Hub'
		},
		{
			title: 'Planificación de equipo',
			description: 'Distribución de trabajo y control de desempeño por colaborador.',
			src: 'manage-employees.png',
			alt: 'Módulo de empleados en Tailor Hub'
		},
		{
			title: 'Agenda y seguimiento',
			description: 'Agenda de citas y recordatorios para evitar pérdidas de oportunidad.',
			src: 'manage-appointments.png',
			alt: 'Módulo de citas de Tailor Hub'
		}
	];

	readonly testimonials: readonly LandingTestimonial[] = [
		{
			quote:
				'Antes llevábamos pedidos en WhatsApp y hojas sueltas. Con Tailor Hub tenemos control total y entregamos con más precisión.',
			name: 'Laura Mendoza',
			role: 'Propietaria',
			company: 'Sastrería Elegance'
		},
		{
			quote:
				'La trazabilidad por etapas redujo retrasos y mejoró la coordinación del taller. Hoy trabajamos con más orden y menos estrés.',
			name: 'Andrés Cárdenas',
			role: 'Jefe de producción',
			company: 'Uniformes Protex'
		},
		{
			quote:
				'El historial de medidas y clientes nos ayudó a vender más rápido en repetición. Es una herramienta clave para escalar.',
			name: 'Sofía Ríos',
			role: 'Directora comercial',
			company: 'Atelier Línea Fina'
		}
	];

	readonly faqs: readonly LandingFaq[] = [
		{
			question: '¿Tailor Hub sirve para talleres pequeños y negocios en crecimiento?',
			answer:
				'Sí. Tailor Hub se adapta tanto a sastrerías pequeñas como a operaciones con varios equipos y sucursales.'
		},
		{
			question: '¿Cuánto tiempo toma comenzar a usar la plataforma?',
			answer:
				'La puesta en marcha es rápida. En la demo definimos tu flujo y te guiamos para operar en pocos días.'
		},
		{
			question: '¿Puedo gestionar clientes, medidas y pedidos en un solo lugar?',
			answer:
				'Sí. Todo se centraliza en una sola plataforma para eliminar duplicidad y mejorar la trazabilidad.'
		},
		{
			question: '¿Tailor Hub incluye reportes para tomar decisiones?',
			answer:
				'Sí. Incluye paneles y reportes de operación, productividad, entregas e indicadores comerciales.'
		},
		{
			question: '¿Ofrecen acompañamiento para implementar el sistema?',
			answer:
				'Sí. Nuestro equipo te acompaña en la configuración inicial y en la adopción por parte del personal.'
		}
	];
}
