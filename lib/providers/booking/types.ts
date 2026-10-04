/**
 * Provider-agnostic booking interface. Phase 2 ships only the mock
 * implementation (a studio's `studio_configs.schedule`, no real
 * calendar) — Phase 3 swaps in real Mindbody/Momence/etc. adapters
 * behind this same interface without touching the AI agent or chat
 * widget code that calls it.
 */

export interface AvailableSlot {
  className: string;
  /** ISO timestamp of the class start time. */
  datetime: string;
  capacity: number;
  spotsLeft: number;
}

export interface BookClassParams {
  studioConfigId: string;
  className: string;
  /** ISO timestamp — must match an AvailableSlot exactly. */
  datetime: string;
  leadName: string;
  leadContact?: string;
  conversationId?: string;
}

export interface BookClassResult {
  bookingId: string;
}

export interface BookingProvider {
  readonly name: string;
  /** Slots in the next `withinDays` days with room left. */
  getAvailableSlots(
    studioConfigId: string,
    withinDays?: number,
  ): Promise<AvailableSlot[]>;
  bookClass(params: BookClassParams): Promise<BookClassResult>;
  cancelBooking(bookingId: string): Promise<{ error: string | null }>;
}

/** Shape of one entry in `studio_configs.schedule` (jsonb). Kept simple —
 * a weekly-recurring slot — since Phase 2 only needs "when are the next
 * few intro classes," not a full calendar system. */
export interface ScheduleEntry {
  /** 0 = Sunday ... 6 = Saturday. */
  dayOfWeek: number;
  /** 24-hour "HH:MM", studio's local time. */
  time: string;
  className: string;
  capacity: number;
}
