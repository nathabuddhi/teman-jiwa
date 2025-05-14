import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./components/Layout.tsx";
import HomePage from "./pages/HomePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import RouteMiddleware from "./middleware/RouteMiddleware.tsx";

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
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>
);

