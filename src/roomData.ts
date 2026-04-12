import { RoomData, DayOfWeek } from './types';

// Helper to understand slots:
// 0: 08:30-09:30, 1: 09:30-10:30, 2: 10:30-11:30, 3: 11:30-12:30, 4: 12:30-01:30
// 5: 02:00-03:00, 6: 03:00-04:00, 7: 04:00-05:00, 8: 05:00-06:00

const EXISTING_ROOMS: RoomData[] = [
  {
    id: "CL1",
    name: "CL1",
    type: "Lab",
    emptySlots: {
      [DayOfWeek.Monday]: [],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [7, 8],
      [DayOfWeek.Saturday]: [0, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "CL2", // Sourced from "Cl-1" in your file
    name: "CL2",
    type: "Lab",
    emptySlots: {
      [DayOfWeek.Monday]: [],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [7, 8],
      [DayOfWeek.Saturday]: [0, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "CLIB",
    name: "CLIB",
    type: "Lab",
    emptySlots: {
      [DayOfWeek.Monday]: [],
      [DayOfWeek.Tuesday]: [6, 7],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [4],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "PB2",
    name: "PB2",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [1, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 3],
      [DayOfWeek.Wednesday]: [0, 3, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "PB3",
    name: "PB3",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [8],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "PB4",
    name: "PB4",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [4],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [8],
      [DayOfWeek.Friday]: [7, 8],
      [DayOfWeek.Saturday]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "R1",
    name: "R1",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [8],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [5, 6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R2",
    name: "R2",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 4],
      [DayOfWeek.Tuesday]: [6, 7, 8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [5, 6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "R3",
    name: "R3",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [8],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [8],
      [DayOfWeek.Saturday]: [3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R4",
    name: "R4",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [],
      [DayOfWeek.Saturday]: [7, 8]
    }
  },
  {
    id: "R5",
    name: "R5",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [4, 7, 8],
      [DayOfWeek.Tuesday]: [7, 8],
      [DayOfWeek.Wednesday]: [],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [5, 6, 7, 8]
    }
  },
  {
    id: "R6",
    name: "R6",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 8],
      [DayOfWeek.Tuesday]: [7, 8],
      [DayOfWeek.Wednesday]: [6, 7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 5, 6, 7, 8]
    }
  },
  {
    id: "R7",
    name: "R7",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 4],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 5, 6, 7, 8]
    }
  },
  {
    id: "R8",
    name: "R8",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 4],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [5, 6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R10",
    name: "R10",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 4],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [5, 6, 7, 8]
    }
  },
  {
    id: "R13",
    name: "R13",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R14",
    name: "R14",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R15",
    name: "R15",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R16",
    name: "R16",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 8],
      [DayOfWeek.Tuesday]: [7, 8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R17",
    name: "R17",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [],
      [DayOfWeek.Tuesday]: [7, 8],
      [DayOfWeek.Wednesday]: [7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R18",
    name: "R18",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 4],
      [DayOfWeek.Tuesday]: [7, 8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [6, 7, 8],
      [DayOfWeek.Saturday]: [5, 6, 7, 8]
    }
  },
  {
    id: "R19",
    name: "R19",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R20",
    name: "R20",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 8],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [8],
      [DayOfWeek.Friday]: [6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R21",
    name: "R21",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 4, 8],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [8],
      [DayOfWeek.Friday]: [7, 8],
      [DayOfWeek.Saturday]: [3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R22",
    name: "R22",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 4],
      [DayOfWeek.Tuesday]: [4],
      [DayOfWeek.Wednesday]: [7, 8],
      [DayOfWeek.Thursday]: [6, 7, 8],
      [DayOfWeek.Friday]: [6, 7, 8],
      [DayOfWeek.Saturday]: [5, 6, 7, 8]
    }
  },
  {
    id: "R23",
    name: "R23",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [4],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [5, 8],
      [DayOfWeek.Thursday]: [8],
      [DayOfWeek.Friday]: [8],
      [DayOfWeek.Saturday]: [5, 6, 7, 8]
    }
  },
  {
    id: "R24",
    name: "R24",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [7, 8],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [6, 7, 8],
      [DayOfWeek.Saturday]: [5, 6, 7, 8]
    }
  },
  {
    id: "R25",
    name: "R25",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 4, 7, 8],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "R26",
    name: "R26",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "R27",
    name: "R27",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R28",
    name: "R28",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [5, 6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R29",
    name: "R29",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [0],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [4, 7, 8],
      [DayOfWeek.Saturday]: [3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R30",
    name: "R30",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R31",
    name: "R31",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [2, 3],
      [DayOfWeek.Tuesday]: [6, 7, 8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [],
      [DayOfWeek.Friday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R32",
    name: "R32",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [4, 6, 7, 8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R33",
    name: "R33",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [4, 6, 7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R34",
    name: "R34",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R35",
    name: "R35",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [8],
      [DayOfWeek.Saturday]: [0, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R37",
    name: "R37",
    type: "Lecture Hall",
    emptySlots: {
      [DayOfWeek.Monday]: [5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [7, 8],
      [DayOfWeek.Wednesday]: [7, 8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [7, 8],
      [DayOfWeek.Saturday]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "SCR1",
    name: "SCR1",
    type: "Seminar Room",
    emptySlots: {
      [DayOfWeek.Monday]: [3, 7, 8],
      [DayOfWeek.Tuesday]: [8],
      [DayOfWeek.Wednesday]: [6, 7, 8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "SCR2",
    name: "SCR2",
    type: "Seminar Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [7, 8],
      [DayOfWeek.Wednesday]: [6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 7, 8],
      [DayOfWeek.Friday]: [1, 2, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "SCR3",
    name: "SCR3",
    type: "Seminar Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 5, 8],
      [DayOfWeek.Tuesday]: [7, 8],
      [DayOfWeek.Wednesday]: [6, 7, 8],
      [DayOfWeek.Thursday]: [1],
      [DayOfWeek.Friday]: [1, 2, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "SCR4",
    name: "SCR4",
    type: "Seminar Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 7, 8],
      [DayOfWeek.Tuesday]: [],
      [DayOfWeek.Wednesday]: [7, 8],
      [DayOfWeek.Thursday]: [1, 3],
      [DayOfWeek.Friday]: [0, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  }
];

const TUTORIAL_ROOMS: RoomData[] = [
  {
    id: "T1",
    name: "T1",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [4, 5, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T2",
    name: "T2",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [5, 6, 7, 8],
      [DayOfWeek.Thursday]: [5, 6, 7, 8],
      [DayOfWeek.Friday]: [3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T3",
    name: "T3",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T4",
    name: "T4",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 2, 3, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [7, 8],
      [DayOfWeek.Friday]: [5, 6],
      [DayOfWeek.Saturday]: [0, 1, 2, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T5",
    name: "T5",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T6",
    name: "T6",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T7",
    name: "T7",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T8",
    name: "T8",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T9",
    name: "T9",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T11",
    name: "T11",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T12",
    name: "T12",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T13",
    name: "T13",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T14",
    name: "T14",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 5, 6, 7, 8]
    }
  },
  {
    id: "T15",
    name: "T15",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T16",
    name: "T16",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T17",
    name: "T17",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T18",
    name: "T18",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T23",
    name: "T23",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T24",
    name: "T24",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T25",
    name: "T25",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T26",
    name: "T26",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 2, 3, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T27",
    name: "T27",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T29",
    name: "T29",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T31",
    name: "T31",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T32",
    name: "T32",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 3, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T33",
    name: "T33",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 2, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T34",
    name: "T34",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T35",
    name: "T35",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 3, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T36",
    name: "T36",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T37",
    name: "T37",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T38",
    name: "T38",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T39",
    name: "T39",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T40",
    name: "T40",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T41",
    name: "T41",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T42",
    name: "T42",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T43",
    name: "T43",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T44",
    name: "T44",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T45",
    name: "T45",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T46",
    name: "T46",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T48",
    name: "T48",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T49",
    name: "T49",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T50",
    name: "T50",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T51",
    name: "T51",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 2, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T53",
    name: "T53",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 3, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T54",
    name: "T54",
    type: "Tutorial Room",
    emptySlots: {
      [DayOfWeek.Monday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Tuesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Wednesday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Thursday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Friday]: [0, 1, 4, 5, 6, 7, 8],
      [DayOfWeek.Saturday]: [0, 1, 3, 4, 5, 6, 7, 8]
    }
  }
];

// Combine with your existing TUTORIAL_ROOMS
export const ROOMS = [...EXISTING_ROOMS, ...TUTORIAL_ROOMS];