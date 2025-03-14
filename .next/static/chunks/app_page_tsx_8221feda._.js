(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/app_page_tsx_8221feda._.js", {

"[project]/app/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Home)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"); // ✅ Import React hooks
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)"); // ✅ Import Axios for API requests
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$fuse$2e$js$2f$dist$2f$fuse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/fuse.js/dist/fuse.mjs [app-client] (ecmascript)"); // ✅ Import Fuse.js for fuzzy searching
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fullcalendar$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@fullcalendar/react/dist/index.js [app-client] (ecmascript)"); // ✅ Import FullCalendar.js for scheduling
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fullcalendar$2f$daygrid$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@fullcalendar/daygrid/index.js [app-client] (ecmascript)"); // ✅ Import FullCalendar grid view
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fullcalendar$2f$timegrid$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@fullcalendar/timegrid/index.js [app-client] (ecmascript)"); // ✅ Import FullCalendar time grid view
;
var _s = __turbopack_context__.k.signature();
"use client"; // ✅ Enables client-side rendering in Next.js
;
;
;
;
;
;
// ✅ Function to generate a random hex color
const getRandomColor = ()=>{
    const letters = "0123456789ABCDEF";
    let color = "#";
    for(let i = 0; i < 6; i++){
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};
// ✅ Store assigned colors to keep consistency across renders
const courseColors = {};
function Home() {
    _s();
    // ✅ State to store course data, selected courses, search input, and theme
    const [courses, setCourses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedCourses, setSelectedCourses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("light");
    // ✅ Fetch courses from backend API on component mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get("http://127.0.0.1:5001/api/courses") // ✅ Make GET request to backend
            .then({
                "Home.useEffect": (res)=>setCourses(res.data)
            }["Home.useEffect"]) // ✅ Store fetched data in state
            .catch({
                "Home.useEffect": (err)=>console.error(err)
            }["Home.useEffect"]); // ✅ Log errors if API request fails
        }
    }["Home.useEffect"], []);
    // ✅ Update dark/light theme based on user selection
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            document.documentElement.classList.toggle("dark", theme === "dark");
        }
    }["Home.useEffect"], [
        theme
    ]);
    // ✅ Function to add/remove courses from selectedCourses list
    const toggleCourse = (course)=>{
        setSelectedCourses((prev)=>prev.find((c)=>c.courseReferenceNumber === course.courseReferenceNumber) ? prev.filter((c)=>c.courseReferenceNumber !== course.courseReferenceNumber) // ✅ Remove course if already selected
             : [
                ...prev,
                course
            ] // ✅ Add course if not already selected
        );
    };
    // ✅ 1️⃣ Create Fuse.js instance for fuzzy search
    const fuse = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$fuse$2e$js$2f$dist$2f$fuse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](courses, {
        keys: [
            "courseTitle",
            "courseMajor",
            "subjectCourse",
            {
                name: "faculty",
                getFn: (course)=>course.faculty?.map((f)=>{
                        const parts = f.displayName.split(", "); // ✅ Split "Last, First"
                        return parts.length === 2 ? `${parts[1]} ${parts[0]}` : f.displayName; // ✅ Swap to "First Last"
                    }) || []
            }
        ],
        threshold: 0.1
    });
    // ✅ 2️⃣ Use Fuse.js to get search results
    const filteredCourses = search.trim() ? fuse.search(search).map((result)=>result.item) // ✅ Extract matched courses from Fuse results
     : courses; // ✅ Show all courses if search is empty
    // ✅ Convert selected courses into FullCalendar events with random colors
    const events = selectedCourses.flatMap((course)=>{
        if (!courseColors[course.courseReferenceNumber]) {
            courseColors[course.courseReferenceNumber] = getRandomColor(); // ✅ Assign a color once per course
        }
        return course.meetingsFaculty?.map((meeting)=>{
            if (!meeting.meetingTime) return null; // ✅ Skip if no meeting time exists
            const { beginTime, endTime, monday, tuesday, wednesday, thursday, friday } = meeting.meetingTime;
            const days = [
                monday,
                tuesday,
                wednesday,
                thursday,
                friday
            ];
            return days.map((day, index)=>day ? {
                    title: course.courseTitle,
                    startTime: beginTime ? `${beginTime.substring(0, 2)}:${beginTime.substring(2)}` : "00:00",
                    endTime: endTime ? `${endTime.substring(0, 2)}:${endTime.substring(2)}` : "00:00",
                    daysOfWeek: [
                        index + 1
                    ],
                    backgroundColor: courseColors[course.courseReferenceNumber],
                    borderColor: courseColors[course.courseReferenceNumber]
                } : null).filter(Boolean); // ✅ Remove null values
        });
    }).flat();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-100 dark:bg-gray-900 p-6 transition-all flex",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-2/3 p-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fullcalendar$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    plugins: [
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fullcalendar$2f$daygrid$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fullcalendar$2f$timegrid$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
                    ],
                    initialView: "timeGridWeek",
                    events: events,
                    allDaySlot: false,
                    slotMinTime: "07:00:00",
                    slotMaxTime: "22:00:00"
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 132,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 131,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 130,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 128,
        columnNumber: 5
    }, this);
}
_s(Home, "o+HOr0v4kRPuLJWx/x3hmpptO8I=");
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=app_page_tsx_8221feda._.js.map