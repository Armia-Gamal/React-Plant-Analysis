function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 17H5l1.4-1.4A2 2 0 0 0 7 14.2V10a5 5 0 1 1 10 0v4.2a2 2 0 0 0 .6 1.4L19 17h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DashboardNavbar({
  activePage,
  dashboardLabel,
  title,
  description,
  language,
  changeLanguage,
  displayName,
  displayRole,
  displayAvatar,
  onSidebarToggle,
  onNewChat,
  progressLabels,
  step,
  progress,
  text
}) {
  const getConnectorProgress = (index) => {
    if (index === 0) {
      if (step === 0) {
        return progress;
      }

      return step > 0 ? 100 : 0;
    }

    return step > index ? 100 : 0;
  };

  return (
    <header className="dashboard-navbar">
      <div className="dashboard-navbar__row">
        <div className="dashboard-navbar__title-wrap">
          <button
            type="button"
            className="dashboard-navbar__menu-button"
            onClick={onSidebarToggle}
            aria-label={text.toggleSidebar}
          >
            <MenuIcon />
          </button>

          <div className="dashboard-navbar__title-group">
            <span className="dashboard-navbar__eyebrow">{dashboardLabel}</span>
            <div className="dashboard-navbar__heading-line">
              <h1>{title}</h1>
              {activePage === "custom-data" && (
                <span className="dashboard-navbar__badge">{text.proLabel}</span>
              )}
            </div>
            <p>{description}</p>
          </div>
        </div>

        <div className="dashboard-navbar__actions">
          {activePage === "ai" && (
            <button type="button" className="dashboard-navbar__primary-action" onClick={onNewChat}>
              <PlusIcon />
              <span>{text.newChat}</span>
            </button>
          )}

          <div className="dashboard-language-switcher" role="group" aria-label={text.languageLabel}>
            <button
              type="button"
              className={`lang-btn${language === "en" ? " is-active" : ""}`}
              onClick={() => changeLanguage("en")}
            >
              <span className="lang-flag">🇬🇧</span>
              <span className="lang-name">English</span>
            </button>
            <button
              type="button"
              className={`lang-btn${language === "ar" ? " is-active" : ""}`}
              onClick={() => changeLanguage("ar")}
            >
              <span className="lang-flag">🇪🇬</span>
              <span className="lang-name">العربية</span>
            </button>
          </div>

          <button type="button" className="dashboard-navbar__icon-button" aria-label={text.notifications}>
            <BellIcon />
          </button>

          <div className="dashboard-navbar__profile-card">
            <img src={displayAvatar} alt={displayName} className="dashboard-navbar__avatar" />
            <span className="dashboard-navbar__profile-copy">
              <strong>{displayName}</strong>
              <span>{displayRole}</span>
            </span>
          </div>
        </div>
      </div>

      {activePage === "plant" && (
        <div className="dashboard-progress">
          {progressLabels.map((label, index) => {
            const isCompleted = step > index;
            const isCurrent = step === index;
            const connectorProgress = index < progressLabels.length - 1
              ? getConnectorProgress(index)
              : 0;

            return (
              <div
                key={label}
                className={`dashboard-progress__step ${
                  isCompleted ? "is-completed" : isCurrent ? "is-current" : ""
                }`}
              >
                <div className="dashboard-progress__marker">
                  <span className="dashboard-progress__dot">
                    {isCompleted ? "✓" : index + 1}
                  </span>
                  {index < progressLabels.length - 1 && (
                    <span className="dashboard-progress__line" aria-hidden="true">
                      <span style={{ width: `${connectorProgress}%` }} />
                    </span>
                  )}
                </div>
                <span className="dashboard-progress__label">{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
