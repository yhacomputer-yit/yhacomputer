import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { DataProvider } from "./data.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import Events from "./pages/Events.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import Reviews from "./pages/Reviews.jsx";
import Contact from "./pages/Contact.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import Teachers from "./pages/Teachers.jsx";
import Exam from "./pages/Exam.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import Notifications from "./pages/Notifications.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DataProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/exam" element={<Exam />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DataProvider>
  </React.StrictMode>
);
