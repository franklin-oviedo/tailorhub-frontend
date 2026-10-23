import { Order } from '../../../core/models/domain.models';

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let normalized = trimmed.replace(/\s+/g, '').replace(/[^\d,.\-]/g, '');
  if (!normalized || normalized === '-' || normalized === '.' || normalized === ',') {
    return null;
  }

  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/,/g, '');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const hasFiniteOrderValues = (order: Order): boolean => {
  const totalAmount = toFiniteNumber(order.totalAmount);
  if (totalAmount === null) {
    return false;
  }

  return order.items.every((item) => {
    const quantity = toFiniteNumber(item.quantity);
    if (quantity === null || quantity < 1) {
      return false;
    }

    if (item.unitPrice != null && toFiniteNumber(item.unitPrice) === null) {
      return false;
    }

    return true;
  });
};
