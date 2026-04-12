export enum DayOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday"
}

export const TIME_SLOTS = [
  "08:30 AM - 09:30 AM",
  "09:30 AM - 10:30 AM",
  "10:30 AM - 11:30 AM",
  "11:30 AM - 12:30 PM",
  "12:30 PM - 01:30 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM"
] as const;

export type TimeSlot = typeof TIME_SLOTS[number];

// Key is Day, Value is array of empty TimeSlot indices (0-8)
// 0=8:30, 1=9:30, 2=10:30, 3=11:30, 4=12:30, 5=2:00, 6=3:00, 7=4:00, 8=5:00
export interface RoomSchedule {
  [DayOfWeek.Monday]: number[];
  [DayOfWeek.Tuesday]: number[];
  [DayOfWeek.Wednesday]: number[];
  [DayOfWeek.Thursday]: number[];
  [DayOfWeek.Friday]: number[];
  [DayOfWeek.Saturday]: number[];
}

export interface RoomData {
  id: string;
  name: string;
  type: 'Lab' | 'Lecture Hall' | 'Seminar Room' | 'Tutorial Room';
  emptySlots: RoomSchedule;
}