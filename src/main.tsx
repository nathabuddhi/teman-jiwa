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
import AdminPage from "./pages/AdminPage.tsx";

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
                            <RouteMiddleware access="public">
                                <ModuleDetailPage />
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
                <Route
                    path="/admin"
                    element={
                        <RouteMiddleware access="admin">
                            <AdminPage />
                        </RouteMiddleware>
                    }
                />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);

