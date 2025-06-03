import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./components/Layout.tsx";
import HomePage from "./pages/HomePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import RouteMiddleware from "./middleware/RouteMiddleware.tsx";
import ModulesPage from "./pages/ModulesPage.tsx";
import ModuleDetailPage from "./pages/ModuleDetail.tsx";
import FaqPage from "./pages/FaqPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import AppointmentPage from "./pages/AppointmentPage.tsx";
import ForumPage from "./pages/ForumPage.tsx";
import ForumDetailPage from "./pages/ForumDetail.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route
                        index
                        element={
                            <RouteMiddleware access="public">
                                <HomePage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/modules"
                        element={
                            <RouteMiddleware access="public">
                                <ModulesPage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/module/:id"
                        element={
                            <RouteMiddleware access="auth">
                                <ModuleDetailPage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/faq"
                        element={
                            <RouteMiddleware access="public">
                                <FaqPage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/contact"
                        element={
                            <RouteMiddleware access="public">
                                <ContactPage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/appointments"
                        element={
                            <RouteMiddleware access="auth">
                                <AppointmentPage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/appointment/:appointmentId"
                        element={
                            <RouteMiddleware access="auth">
                                <ChatPage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/forum"
                        element={
                            <RouteMiddleware access="auth">
                                <ForumPage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/forum/:id"
                        element={
                            <RouteMiddleware access="auth">
                                <ForumDetailPage />
                            </RouteMiddleware>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <RouteMiddleware access="auth">
                                <ProfilePage />
                            </RouteMiddleware>
                        }
                    />
                </Route>
                <Route
                    path="/login"
                    element={
                        <RouteMiddleware access="guest">
                            <LoginPage />
                        </RouteMiddleware>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <RouteMiddleware access="guest">
                            <RegisterPage />
                        </RouteMiddleware>
                    }
                />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);

