"use client";

import { useState, useEffect, useMemo, Fragment, useRef } from "react";
import axios from "axios";
import Fuse from "fuse.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Inter } from "next/font/google";
import Script from "next/script";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

// Add transition duration constant
const TRANSITION_DURATION = "duration-300";

// Add API URLs
const BACKEND_URL = "https://blink-back-end.onrender.com";

// Google Calendar API Configuration
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

// Define the Course interface
interface Course {
  courseReferenceNumber: string;
  courseTitle: string;
  courseMajor: string;
  subjectCourse: string;
  courseDescription: string;
  faculty?: { displayName: string }[];
  meetingsFaculty?: {
    meetingTime: {
      beginTime: string;
      endTime: string;
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      buildingDescription?: string;
      room?: string;
    };
  }[];
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const COURSES_PER_PAGE = 20;
  const observerTarget = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("dark");
  const [universityTheme, setUniversityTheme] = useState("default");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState("courseTitle");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    major: "",
    timeSlot: "",
    days: [] as string[],
  });
  const [showScrollTop, setShowScrollTop] = useState(false);

  // University theme configurations
  const universityThemes = {
    default: {
      primary: "from-blue-600 to-purple-600",
      primaryDark: "from-blue-400 to-purple-400",
      accent: "blue",
      courseColors: ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444", "#6366F1"],
    },
    richmond: {
      primary: "from-[#003057] to-[#C41E3A]",
      primaryDark: "from-[#003057] to-[#C41E3A]",
      accent: "blue",
      courseColors: ["#003057", "#C41E3A", "#4A90E2", "#E74C3C", "#2C3E50", "#E67E22", "#27AE60"],
    },
    georgiatech: {
      primary: "from-[#B3A369] to-[#003057]",
      primaryDark: "from-[#B3A369] to-[#003057]",
      accent: "yellow",
      courseColors: ["#B3A369", "#003057", "#FFD700", "#2C3E50", "#E67E22", "#27AE60", "#8E44AD"],
    },
    virginia: {
      primary: "from-[#232D4B] to-[#E57200]",
      primaryDark: "from-[#232D4B] to-[#E57200]",
      accent: "orange",
      courseColors: ["#232D4B", "#E57200", "#FFA726", "#2C3E50", "#66BB6A", "#42A5F5", "#EC407A"],
    },
    duke: {
      primary: "from-[#012169] to-[#CC0000]",
      primaryDark: "from-[#012169] to-[#CC0000]",
      accent: "blue",
      courseColors: ["#012169", "#CC0000", "#4A90E2", "#E74C3C", "#2C3E50", "#E67E22", "#27AE60"],
    },
  };

  // Initialize the Google API
  useEffect(() => {
    // console.log('Environment Variables Check:');
    // console.log('- BACKEND_URL:', BACKEND_URL);
    // console.log('- GOOGLE_API_KEY:', GOOGLE_API_KEY);
    // console.log('- GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = gapiLoaded;
    document.body.appendChild(script);

    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.onload = gisLoaded;
    document.body.appendChild(scriptGis);

    return () => {
      document.body.removeChild(script);
      document.body.removeChild(scriptGis);
    };
  }, []);

  function gapiLoaded() {
    window.gapi.load('client', initializeGapiClient);
  }

  async function initializeGapiClient() {
    // console.log('Google API Key:', GOOGLE_API_KEY);
    // console.log('Google Client ID:', GOOGLE_CLIENT_ID);
    await window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    setGapiInited(true);
  }

  function gisLoaded() {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });
    setGisInited(true);
  }

  async function handleAuthClick() {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        setIsAuthorized(true);
        exportToGoogleCalendar();
      },
    });

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  async function exportToGoogleCalendar() {
    try {
      for (const course of selectedCourses) {
        for (const meeting of course.meetingsFaculty || []) {
          if (!meeting.meetingTime) continue;

          const { beginTime, endTime, monday, tuesday, wednesday, thursday, friday } = meeting.meetingTime;
          const days = [monday, tuesday, wednesday, thursday, friday];
          const location = meeting.meetingTime.buildingDescription && meeting.meetingTime.room
            ? `${meeting.meetingTime.buildingDescription} - ${meeting.meetingTime.room}`
            : "TBA";

          // Calculate the semester dates
          const now = new Date();
          const year = now.getFullYear();
          const isFallSemester = now.getMonth() >= 6;
          const semesterStart = new Date(year, isFallSemester ? 7 : 0, 15); // Approximate semester start
          const semesterEnd = new Date(year, isFallSemester ? 11 : 4, 15); // Approximate semester end

          for (let i = 0; i < days.length; i++) {
            if (!days[i]) continue;

            const event = {
              summary: course.courseTitle,
              location: location,
              description: `CRN: ${course.courseReferenceNumber}\nFaculty: ${course.faculty?.map(f => f.displayName).join(", ") || "TBA"}`,
              start: {
                dateTime: `${semesterStart.toISOString().split('T')[0]}T${beginTime.substring(0, 2)}:${beginTime.substring(2)}:00`,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: `${semesterStart.toISOString().split('T')[0]}T${endTime.substring(0, 2)}:${endTime.substring(2)}:00`,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              recurrence: [
                `RRULE:FREQ=WEEKLY;UNTIL=${semesterEnd.toISOString().replace(/[-:]/g, '').split('.')[0]}Z;BYDAY=${['MO', 'TU', 'WE', 'TH', 'FR'][i]}`
              ],
            };

            await window.gapi.client.calendar.events.insert({
              calendarId: 'primary',
              resource: event,
            });
          }
        }
      }
      alert('Successfully exported to Google Calendar!');
    } catch (err) {
      console.error('Error exporting to Google Calendar:', err);
      alert('Error exporting to Google Calendar. Please try again.');
    }
  }

  // Load initial courses
  useEffect(() => {
    const loadInitialCourses = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/courses`);
        setCourses(response.data);
        setDisplayedCourses(response.data.slice(0, COURSES_PER_PAGE));
        setHasMore(response.data.length > COURSES_PER_PAGE);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialCourses();
  }, []);

  // Create a Fuse.js instance for fuzzy search on multiple keys
  const fuse = new Fuse(courses, {
    keys: [
      "courseTitle",
      "courseMajor",
      "subjectCourse",
      "courseReferenceNumber",
      {
        name: "faculty",
        getFn: (course: Course) =>
          course.faculty?.map((f) => {
            const parts = f.displayName.split(", ");
            return parts.length === 2 ? `${parts[1]} ${parts[0]}` : f.displayName;
          }) || [],
      },
    ],
    threshold: 0.25,
  });

  // Use Fuse.js for fuzzy filtering of courses
  const filteredCourses = search.trim()
    ? fuse.search(search).map((result) => result.item)
    : courses;

  // Get unique majors for filter
  const uniqueMajors = useMemo(() => {
    const majors = new Set(courses.map(course => course.courseMajor));
    return Array.from(majors).sort();
  }, [courses]);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...filteredCourses];

    // Apply filters
    if (filters.major) {
      result = result.filter(course => course.courseMajor === filters.major);
    }

    if (filters.timeSlot) {
      result = result.filter(course => {
        const meeting = course.meetingsFaculty?.[0]?.meetingTime;
        if (!meeting) return false;
        const time = parseInt(meeting.beginTime);
        const slotStart = parseInt(filters.timeSlot);
        const slotEnd = slotStart + 400; // 4 hours in minutes

        // Check if the course time falls within the selected time slot
        return time >= slotStart && time < slotEnd;
      });
    }

    if (filters.days.length > 0) {
      result = result.filter(course => {
        const meeting = course.meetingsFaculty?.[0]?.meetingTime;
        if (!meeting) return false;

        // Get the days this course meets
        const courseDays = [
          meeting.monday && "Monday",
          meeting.tuesday && "Tuesday",
          meeting.wednesday && "Wednesday",
          meeting.thursday && "Thursday",
          meeting.friday && "Friday"
        ].filter(Boolean);

        // Check if ALL selected days are included in the course days
        return filters.days.every(day => courseDays.includes(day));
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortBy as keyof Course];
      const bValue = b[sortBy as keyof Course];
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [filteredCourses, filters, sortBy, sortOrder]);

  // Reset displayed courses when filters or search change
  useEffect(() => {
    const initialCourses = filteredAndSortedCourses.slice(0, COURSES_PER_PAGE);
    setDisplayedCourses(initialCourses);
    setCurrentPage(1);
    setHasMore(filteredAndSortedCourses.length > COURSES_PER_PAGE);
  }, [search, filters.major, filters.timeSlot, filters.days, sortBy, sortOrder]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const loadMoreCourses = (entries: IntersectionObserverEntry[]) => {
      const firstEntry = entries[0];
      if (firstEntry.isIntersecting) {
        const startIndex = currentPage * COURSES_PER_PAGE;
        const endIndex = startIndex + COURSES_PER_PAGE;
        const nextCourses = filteredAndSortedCourses.slice(startIndex, endIndex);

        if (nextCourses.length > 0) {
          setDisplayedCourses(prev => [...prev, ...nextCourses]);
          setCurrentPage(prev => prev + 1);
          setHasMore(endIndex < filteredAndSortedCourses.length);
        } else {
          setHasMore(false);
        }
      }
    };

    const observer = new IntersectionObserver(loadMoreCourses, { threshold: 0.1 });

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, currentPage, COURSES_PER_PAGE]);

  // Add scroll event listener
  useEffect(() => {
    const container = document.querySelector('.overflow-y-auto');
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle dark/light theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Function to add or remove courses from the selected list
  const toggleCourse = (course: Course) => {
    setSelectedCourses((prev) =>
      prev.find((c) => c.courseReferenceNumber === course.courseReferenceNumber)
        ? prev.filter((c) => c.courseReferenceNumber !== course.courseReferenceNumber)
        : [...prev, course]
    );
  };

  // Helper function to get a color from the current theme
  function getThemeColor(index: number) {
    return universityThemes[universityTheme as keyof typeof universityThemes].courseColors[
      index % universityThemes[universityTheme as keyof typeof universityThemes].courseColors.length
    ];
  }

  // ------------------ Color Mapping ------------------
  // Using useMemo to create a mapping of courseReferenceNumber to a theme color
  const courseColors = useMemo(() => {
    const mapping: Record<string, string> = {};
    courses.forEach((course, index) => {
      mapping[course.courseReferenceNumber] = getThemeColor(index);
    });
    return mapping;
  }, [courses, universityTheme]);
  // ---------------------------------------------------

  // Convert selected courses into FullCalendar events, using consistent colors from courseColors
  const events = selectedCourses.flatMap((course) =>
    course.meetingsFaculty?.map((meeting) => {
      if (!meeting.meetingTime) return null;

      // Get the consistent random color for this course
      const randomColor = courseColors[course.courseReferenceNumber];

      const { beginTime, endTime, monday, tuesday, wednesday, thursday, friday } = meeting.meetingTime;
      const days = [monday, tuesday, wednesday, thursday, friday];

      return days
        .map((day, index) =>
          day
            ? {
                title: course.courseTitle,
                startTime: beginTime ? `${beginTime.substring(0, 2)}:${beginTime.substring(2)}` : "00:00",
                endTime: endTime ? `${endTime.substring(0, 2)}:${endTime.substring(2)}` : "00:00",
                daysOfWeek: [index + 1], // 1 = Monday, 2 = Tuesday, etc.
                backgroundColor: randomColor,  // Use the pre-assigned random color
                borderColor: randomColor,
                textColor: "#fff",
              }
            : null
        )
        .filter(Boolean);
    })
  ).flat();

  // Function to convert time string to ICS format
  const formatTimeForICS = (time: string) => {
    const hours = time.substring(0, 2);
    const minutes = time.substring(2);
    return `${hours}${minutes}00`;  // Return HHMMSS format without colons
  };

  // Function to generate ICS content
  const generateICSContent = () => {
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? "Spring" : "Fall";
    const semesterStart = new Date(year, now.getMonth() < 6 ? 0 : 7, 15); // Jan 15 for Spring, Aug 15 for Fall
    const semesterEnd = new Date(year, now.getMonth() < 6 ? 4 : 11, 15);  // May 15 for Spring, Dec 15 for Fall

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Blink Schedule Maker//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${semester} ${year} Schedule
X-WR-TIMEZONE:${Intl.DateTimeFormat().resolvedOptions().timeZone}

`;

    selectedCourses.forEach((course) => {
      course.meetingsFaculty?.forEach((meeting) => {
        if (!meeting.meetingTime) return;

        const { beginTime, endTime, monday, tuesday, wednesday, thursday, friday } = meeting.meetingTime;
        const days = [monday, tuesday, wednesday, thursday, friday];
        const location = meeting.meetingTime.buildingDescription && meeting.meetingTime.room
          ? `${meeting.meetingTime.buildingDescription} - ${meeting.meetingTime.room}`
          : "TBA";

        days.forEach((day, index) => {
          if (!day) return;

          // Calculate the first occurrence of this weekday
          const firstOccurrence = new Date(semesterStart);
          const targetDay = index + 1; // 1 = Monday, 2 = Tuesday, etc.
          const startDay = firstOccurrence.getDay();
          const daysUntilTarget = (targetDay - startDay + 7) % 7;
          firstOccurrence.setDate(firstOccurrence.getDate() + daysUntilTarget);

          // Format the date and times for ICS
          const dateStr = firstOccurrence.toISOString().split('T')[0].replace(/-/g, '');
          const startDateTime = `${dateStr}T${formatTimeForICS(beginTime)}`;
          const endDateTime = `${dateStr}T${formatTimeForICS(endTime)}`;
          const untilDate = semesterEnd.toISOString().split('T')[0].replace(/-/g, '');
          const daysOfWeek = ['MO', 'TU', 'WE', 'TH', 'FR'][index];

          // Create event entry with proper RRULE
          icsContent += `BEGIN:VEVENT
UID:${course.courseReferenceNumber}-${index}@blink.com
DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;TZID=${Intl.DateTimeFormat().resolvedOptions().timeZone}:${startDateTime}
DTEND;TZID=${Intl.DateTimeFormat().resolvedOptions().timeZone}:${endDateTime}
RRULE:FREQ=WEEKLY;UNTIL=${untilDate}T235959Z;BYDAY=${daysOfWeek}
SUMMARY:${course.courseTitle}
LOCATION:${location}
DESCRIPTION:CRN: ${course.courseReferenceNumber}\\nFaculty: ${course.faculty?.map(f => f.displayName).join(", ") || "TBA"}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
        });
      });
    });

    icsContent += `END:VCALENDAR`;
    return icsContent;
  };

  // Function to handle export
  const handleExport = () => {
    try {
      const icsContent = generateICSContent();
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const semester = new Date().getMonth() < 6 ? "Spring" : "Fall";
      const year = new Date().getFullYear();
      link.setAttribute("download", `${semester}_${year}_Schedule.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating ICS file:', error);
      alert('Error generating calendar file. Please try again.');
    }
  };

  // Function to clear all selected courses
  const clearAllCourses = () => {
    setSelectedCourses([]);
  };

  return (
    <>
      <Script src="https://apis.google.com/js/api.js" />
      <Script src="https://accounts.google.com/gsi/client" />
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all ${TRANSITION_DURATION} ${inter.variable} font-sans`}>
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
      <div>
                <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${universityThemes[universityTheme as keyof typeof universityThemes].primary} dark:${universityThemes[universityTheme as keyof typeof universityThemes].primaryDark} flex items-center gap-2 select-none`}>
                  Blink
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-base sm:text-lg font-medium transition-colors ${TRANSITION_DURATION} select-none">Simplify Your Semester with Smart Scheduling & Seamless Planning</p>
              </div>
      </div>
            <div className="flex items-center space-x-4">
              <select
                value={universityTheme}
                onChange={(e) => setUniversityTheme(e.target.value)}
                className="hidden sm:block px-4 py-2.5 pl-10 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all ${TRANSITION_DURATION} text-sm font-medium appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[position:left_0.5rem_center] bg-no-repeat"
              >
                <option value="default">Default Theme</option>
                <option value="richmond">University of Richmond</option>
                <option value="georgiatech">Georgia Tech</option>
                <option value="virginia">University of Virginia</option>
                <option value="duke">Duke University</option>
              </select>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all ${TRANSITION_DURATION} hover:scale-105 cursor-pointer"
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Left Sidebar - Course Selection */}
            <div className={`lg:col-span-1 fixed inset-y-0 left-0 w-full max-w-sm z-50 lg:relative lg:inset-auto lg:w-auto transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              } lg:translate-x-0`}>
              <div className="h-screen lg:h-[calc(100vh+1rem)] bg-white dark:bg-gray-800 shadow-xl flex flex-col rounded-2xl">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white select-none">Course Selection</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 select-none">Browse and select your courses</p>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600 dark:text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
          </button>
        </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full p-4">
                    <div className="mb-6 space-y-4">
                      <div className="relative">
        <input
          type="text"
          placeholder="Search courses..."
                          className="w-full p-4 pl-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all ${TRANSITION_DURATION} text-sm font-medium placeholder-gray-400"
          onChange={(e) => setSearch(e.target.value)}
        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="space-y-3">
                        <select
                          value={filters.major}
                          onChange={(e) => setFilters(prev => ({ ...prev, major: e.target.value }))}
                          className="w-full p-3 pl-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all ${TRANSITION_DURATION} text-sm font-medium appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[position:left_0.5rem_center] bg-no-repeat"
                        >
                          <option value="">All Majors</option>
                          {uniqueMajors.map(major => (
                            <option key={major} value={major}>{major}</option>
                          ))}
                        </select>

                        <select
                          value={filters.timeSlot}
                          onChange={(e) => setFilters(prev => ({ ...prev, timeSlot: e.target.value }))}
                          className="w-full p-3 pl-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all ${TRANSITION_DURATION} text-sm font-medium appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[position:left_0.5rem_center] bg-no-repeat"
                        >
                          <option value="">All Times</option>
                          <option value="0700">7:00 AM - 11:00 AM</option>
                          <option value="1100">11:00 AM - 3:00 PM</option>
                          <option value="1500">3:00 PM - 7:00 PM</option>
                          <option value="1900">7:00 PM - 11:00 PM</option>
                        </select>

                        <div className="flex flex-wrap gap-2">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                            <button
                              key={day}
                              onClick={() => {
                                setFilters(prev => ({
                                  ...prev,
                                  days: prev.days.includes(day)
                                    ? prev.days.filter(d => d !== day)
                                    : [...prev.days, day]
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${TRANSITION_DURATION} ${filters.days.includes(day)
                                ? universityTheme === 'default' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                  : universityTheme === 'richmond' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                    : universityTheme === 'georgiatech' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                                      : universityTheme === 'virginia' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
                                }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sort Options */}
                      <div className="flex items-center space-x-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="flex-1 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all ${TRANSITION_DURATION} text-sm font-medium"
                        >
                          <option value="courseTitle">Course Title</option>
                          <option value="courseReferenceNumber">CRN</option>
                          <option value="courseMajor">Major</option>
                          <option value="subjectCourse">Subject</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                          className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${TRANSITION_DURATION}"
                        >
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div
                        className="overflow-y-auto overflow-x-hidden h-[calc(100vh-24rem)] lg:h-[calc(100vh-27rem)] pr-2 space-y-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500"
                      >
                        {displayedCourses.map((course, index) => {
            const facultyNames =
              course.faculty
                ?.map((f) => {
                  const parts = f.displayName.split(", ");
                  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : f.displayName;
                })
                .join(", ") || "TBA";
            const location =
              course.meetingsFaculty?.[0]?.meetingTime?.buildingDescription
                ? `${course.meetingsFaculty[0].meetingTime.buildingDescription} - ${course.meetingsFaculty[0].meetingTime.room}`
                : "TBA";

                          // Create a unique key by combining multiple identifiers
                          const uniqueKey = `${course.courseReferenceNumber}-${course.subjectCourse}-${index}`;

            return (
                            <motion.div
                              key={uniqueKey}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 0.98 }}
                              whileTap={{ scale: 1.01 }}
                            >
                <Card
                  onClick={() => toggleCourse(course)}
                                className={`cursor-pointer transition-all ${TRANSITION_DURATION} break-words ${selectedCourses.find((c) => c.courseReferenceNumber === course.courseReferenceNumber)
                                    ? universityTheme === 'default' || universityTheme === 'richmond'
                                      ? 'border-2 border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20'
                                      : universityTheme === 'georgiatech'
                                        ? 'border-2 border-yellow-500 shadow-lg bg-yellow-50 dark:bg-yellow-900/20'
                                        : universityTheme === 'virginia'
                                          ? 'border-2 border-orange-500 shadow-lg bg-orange-50 dark:bg-orange-900/20'
                                          : 'border-2 border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20'
                                    : 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
                                  }`}
                              >
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg font-bold tracking-tight break-words">{course.courseTitle}</CardTitle>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{course.subjectCourse}</p>
                  </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      {course.courseMajor}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      <span className="break-all">CRN: {course.courseReferenceNumber}</span>
                                    </div>
                                    <div className="flex items-start space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                      <svg className="w-4 h-4 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="break-words">Faculty: {facultyNames === "TBA" ? <span className="italic">{facultyNames}</span> : facultyNames}</span>
                                    </div>
                                    <div className="flex items-start space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                      <svg className="w-4 h-4 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span className="break-words">Location: {location === "TBA" ? <span className="italic">{location}</span> : location}</span>
                                    </div>
                                    <div className="flex items-start space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                      <svg className="w-4 h-4 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className="break-words line-clamp-3 text-xs italic">
                                        {course.courseDescription || "No description available"}
                                      </span>
                                    </div>
                                  </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

                        {/* Loading indicator */}
                        {isLoading && (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                          </div>
                        )}

                        {/* Intersection Observer Target */}
                        {hasMore && !isLoading && (
                          <div
                            ref={observerTarget}
                            className="h-10 w-full"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-5 h-20 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
                    </div>

                    {/* Course Selection Scroll to Top Button */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: showScrollTop ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        const container = document.querySelector('.overflow-y-auto');
                        if (container) {
                          container.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className={`absolute bottom-20 right-4 p-3 ${universityTheme === 'default' ? 'bg-blue-500 hover:bg-blue-600'
                          : universityTheme === 'richmond' ? 'bg-blue-500 hover:bg-blue-600'
                            : universityTheme === 'georgiatech' ? 'bg-yellow-500 hover:bg-yellow-600'
                              : universityTheme === 'virginia' ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                        } text-white rounded-full shadow-lg hover:shadow-xl transition-all ${TRANSITION_DURATION} hover:scale-105 z-50 cursor-pointer active:scale-95 ${showScrollTop ? 'pointer-events-auto' : 'pointer-events-none'}`}
                    >
                      <motion.svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                      </motion.svg>
                    </motion.button>
                  </div>
                </div>

                {/* Sidebar Footer */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: selectedCourses.length > 0 ? 1 : 0,
                    height: selectedCourses.length > 0 ? "auto" : 0
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {selectedCourses.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl">
                      <button
                        onClick={clearAllCourses}
                        className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all ${TRANSITION_DURATION} flex items-center justify-center space-x-2 hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="font-semibold">Clear All Courses</span>
                      </button>
                    </div>
                  )}
                </motion.div>
        </div>
      </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}

            {/* Right Content - Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-800 dark:text-white select-none">Weekly Schedule</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 select-none">View and manage your class schedule</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={universityTheme}
                      onChange={(e) => setUniversityTheme(e.target.value)}
                      className="sm:hidden px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all ${TRANSITION_DURATION} text-sm font-medium"
                    >
                      <option value="default">Default</option>
                      <option value="richmond">UR</option>
                      <option value="georgiatech">GT</option>
                      <option value="virginia">UVA</option>
                      <option value="duke">Duke</option>
                    </select>
                    <div className="relative">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button
                          className={`px-3 sm:px-4 py-2 sm:py-2.5 ${universityTheme === 'default' ? 'bg-blue-500 hover:bg-blue-600'
                              : universityTheme === 'richmond' ? 'bg-blue-500 hover:bg-blue-600'
                                : universityTheme === 'georgiatech' ? 'bg-yellow-500 hover:bg-yellow-600'
                                  : universityTheme === 'virginia' ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-blue-500 hover:bg-blue-600'
                            } text-white rounded-xl transition-all ${TRANSITION_DURATION} flex items-center space-x-2 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transform hover:-translate-y-0.5 active:translate-y-0`}
                          disabled={selectedCourses.length === 0}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="hidden sm:inline font-semibold">Export</span>
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </Menu.Button>

                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="p-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={handleExport}
                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                      } group flex w-full items-center rounded-lg px-4 py-3 text-sm text-gray-700 dark:text-gray-300`}
                                  >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="font-semibold">Export as ICS</span>
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={handleAuthClick}
                                    disabled={!gapiInited || !gisInited}
                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                      } group flex w-full items-center rounded-lg px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${(!gapiInited || !gisInited) ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                  >
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm0 22c-5.514 0-10-4.486-10-10S6.486 2 12 2s10 4.486 10 10zm-1-14h2v6h-2V8zm0 8h2v2h-2v-2z" />
                                    </svg>
                                    <span className="font-semibold">Export to Google Calendar</span>
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="w-full">
                    <div className="w-full">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="timeGridWeek"
            events={events}
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
                        headerToolbar={{
                          left: 'prev,next today',
                          center: 'title',
                          right: 'timeGridWeek,timeGridDay'
                        }}
                        height="auto"
                        className="rounded-xl overflow-hidden"
                        slotLabelClassNames="text-xs sm:text-base"
                        eventClassNames="text-xs sm:text-base"
                        headerToolbarClassNames="text-xs sm:text-base"
                        buttonText={{
                          today: 'Today',
                          month: 'Month',
                          week: 'Week',
                          day: 'Day',
                          list: 'List'
                        }}
                        slotLabelFormat={{
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }}
                        expandRows={true}
                        stickyHeaderDates={true}
                        dayHeaderClassNames="myDayHeader"//dayHeaderClassNames="text-xs sm:text-base font-medium"
                        slotLaneClassNames="min-h-[2.5rem] sm:min-h-[4rem]"
                        eventTimeFormat={{
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }}
                        buttonClassNames="text-xs sm:text-base px-2 sm:px-3 py-1 sm:py-2"
                        titleFormat={{
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }}
                        views={{
                          timeGridWeek: {
                            titleFormat: {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }
                          },
                          timeGridDay: {
                            titleFormat: {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }
                          }
                        }}
          />
        </div>
      </div>
    </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-12 mb-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <a
                href="https://www.buymeacoffee.com/davematnat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
                </svg>
                <span className="font-semibold select-none">Buy me a coffee</span>
              </a>
              <p className="text-gray-600 dark:text-gray-400 text-sm select-none">
                Made with <span className="text-red-500">❤️</span> by David
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}