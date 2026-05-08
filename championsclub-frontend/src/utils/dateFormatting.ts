function parseDateInput(value: string): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.length === 10 ? `${value}T00:00:00` : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

const fullDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export function formatFriendlyDate(value: string): string {
  const date = parseDateInput(value);

  if (!date) {
    return value;
  }

  return fullDateFormatter.format(date);
}

export function formatFriendlyDateShort(value: string): string {
  const date = parseDateInput(value);

  if (!date) {
    return value;
  }

  return shortDateFormatter.format(date);
}

export function formatFriendlyCustomRangeLabel(startDate?: string, endDate?: string): string {
  if (startDate && endDate) {
    return `${formatFriendlyDate(startDate)} to ${formatFriendlyDate(endDate)}`;
  }

  if (startDate) {
    return `From ${formatFriendlyDate(startDate)}`;
  }

  if (endDate) {
    return `Until ${formatFriendlyDate(endDate)}`;
  }

  return "Custom Date";
}
