import "./Dashboard.css";

export default function DashboardLayout({
  children,
  sidebar,
  navbar,
  language = "en",
  isSidebarOpen = false,
  onOverlayClick
}) {
  return (
    <div
      className={`dashboard-shell ${isSidebarOpen ? "dashboard-shell--sidebar-open" : ""}`}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div
        className={`dashboard-shell__overlay ${isSidebarOpen ? "is-visible" : ""}`}
        aria-hidden={!isSidebarOpen}
        onClick={onOverlayClick}
      />

      {sidebar}

      <div className="dashboard-shell__main">
        {navbar}
        <main className="dashboard-shell__content">{children}</main>
      </div>
    </div>
  );
}
