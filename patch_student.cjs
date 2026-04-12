const fs = require('fs');

const path = '../Timetable/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// The replacement logic:
const hooksReplacement = `
    const [activeTab, setActiveTab] = useState<'menu' | 'rooms' | 'teachers' | 'societies' | 'timetable' | 'leave' | 'student_portal'>('student_portal');
    
    const [liveRooms, setLiveRooms] = useState<RoomData[]>(ROOMS);
    const [liveTeachers, setLiveTeachers] = useState<any>(TEACHER_SCHEDULES);
    
    useEffect(() => {
      fetch('/api/rooms').then(res => res.json()).then(data => {
        if(Array.isArray(data) && data.length > 0) setLiveRooms(data);
      }).catch(() => {});
      fetch('/api/teachers').then(res => res.json()).then(data => {
        if(Array.isArray(data) && data.length > 0) {
           const map = {};
           data.forEach(t => map[t.id] = t);
           setLiveTeachers({...TEACHER_SCHEDULES, ...map});
        }
      }).catch(() => {});
    }, []);
`;

// Only replace if not already replaced
if (!content.includes('const [liveRooms')) {
  // Inject the hooks
  content = content.replace(/const \[activeTab, setActiveTab\] = useState.*?;\s*/g, hooksReplacement);

  // Replace instances of ROOMS with liveRooms except in imports
  // Replace instances of TEACHER_SCHEDULES with liveTeachers except in imports
  
  // Actually, touching all arrays could break things because of the sheer size. 
  // For safety, I'll just save it with the state added, maybe update the `ROOMS` usage just in the Room Finder tab.
  content = content.replace(/ROOMS\.map/g, 'liveRooms.map');
  content = content.replace(/ROOMS\.filter/g, 'liveRooms.filter');
  content = content.replace(/ROOMS\.find/g, 'liveRooms.find');
  
  content = content.replace(/TEACHER_SCHEDULES\[/g, 'liveTeachers[');
  
  fs.writeFileSync(path, content, 'utf8');
  console.log("Patched App.tsx successfully.");
} else {
  console.log("App.tsx already patched.");
}
