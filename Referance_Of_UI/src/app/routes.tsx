import { createBrowserRouter, Outlet } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { BottomNav } from "./components/BottomNav";
import { HomePage } from "./pages/HomePage";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { PropertyDetailsPage } from "./pages/PropertyDetailsPage";

function Root() {
  return (
    <div
      style={{
        fontFamily: "'Poppins', 'Inter', sans-serif",
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      {/* Top padding for fixed navbar */}
      <div style={{ paddingTop: "64px", flex: 1 }}>
        <Outlet />
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "search", Component: SearchResultsPage },
      { path: "property/:id", Component: PropertyDetailsPage },
    ],
  },
]);
