import type { createClient, createAdminClient } from "@/lib/supabase/server";
import type {
  AvailableSlot,
  BookClassParams,
  BookClassResult,
  BookingProvider,
  ScheduleEntry,
} from "./types";

type SupabaseLike =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

/**
 * Generates availability from `studio_configs.schedule` (a list of
 * weekly-recurring slots) and books by inserting directly into the
 * `bookings` table. Takes whichever Supabase client the caller already
 * has — the authenticated one from internal screens, or the admin one
 * from the public chat-widget API route (same pattern as /unsubscribe).
 */
export class MockBookingProvider implements BookingProvider {
  readonly name = "mock";

  constructor(private supabase: SupabaseLike) {}

  async getAvailableSlots(
    studioConfigId: string,
    withinDays = 7,
  ): Promise<AvailableSlot[]> {
    const { data: config } = await this.supabase
      .from("studio_configs")
      .select("schedule")
      .eq("id", studioConfigId)
      .single();

    const schedule = (config?.schedule ?? []) as unknown as ScheduleEntry[];
    if (schedule.length === 0) return [];

    const now = new Date();
    const slots: AvailableSlot[] = [];

    for (let dayOffset = 0; dayOffset <= withinDays; dayOffset++) {
      const day = new Date(now);
      day.setDate(day.getDate() + dayOffset);

      for (const entry of schedule) {
        if (entry.dayOfWeek !== day.getDay()) continue;
        const [hours, minutes] = entry.time.split(":").map(Number);
        const slotDate = new Date(day);
        slotDate.setHours(hours, minutes, 0, 0);
        if (slotDate <= now) continue; // don't offer slots already passed

        slots.push({
          className: entry.className,
          datetime: slotDate.toISOString(),
          capacity: entry.capacity,
          spotsLeft: entry.capacity, // booked count subtracted below
        });
      }
    }

    if (slots.length === 0) return [];

    const { data: existingBookings } = await this.supabase
      .from("bookings")
      .select("class_name, class_datetime")
      .eq("studio_config_id", studioConfigId)
      .neq("status", "cancelled")
      .gte("class_datetime", now.toISOString());

    const bookedCounts = new Map<string, number>();
    for (const b of existingBookings ?? []) {
      const key = `${b.class_name}|${b.class_datetime}`;
      bookedCounts.set(key, (bookedCounts.get(key) ?? 0) + 1);
    }

    return slots
      .map((slot) => ({
        ...slot,
        spotsLeft:
          slot.capacity -
          (bookedCounts.get(`${slot.className}|${slot.datetime}`) ?? 0),
      }))
      .filter((slot) => slot.spotsLeft > 0)
      .sort((a, b) => a.datetime.localeCompare(b.datetime));
  }

  async bookClass(params: BookClassParams): Promise<BookClassResult> {
    const { data, error } = await this.supabase
      .from("bookings")
      .insert({
        owner_id: params.ownerId,
        studio_config_id: params.studioConfigId,
        conversation_id: params.conversationId,
        lead_name: params.leadName,
        lead_contact: params.leadContact,
        class_name: params.className,
        class_datetime: params.datetime,
        status: "booked",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Booking failed");
    }
    return { bookingId: data.id };
  }

  async cancelBooking(bookingId: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    return { error: error?.message ?? null };
  }
}
