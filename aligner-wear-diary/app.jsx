const { useState } = React;

/* ---- minimal inline icon set (stand-ins for lucide-react) ---- */
const Icon = ({ children, size = 16, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </svg>
);

const CalendarDays = (props) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </Icon>
);

const Download = (props) => (
  <Icon {...props}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </Icon>
);

const Info = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-5M12 8h.01" />
  </Icon>
);

const Bell = (props) => (
  <Icon {...props}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
  </Icon>
);

/* ---- schedule / ICS logic ---- */
const pad = (n) => String(n).padStart(2, "0");

const toICSDate = (d) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

const formatLong = (d) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

function buildSchedule(startDateStr, startAligner, totalAligners) {
  if (!startDateStr || !totalAligners || !startAligner || startAligner > totalAligners) return [];
  const schedule = [];
  let cursor = new Date(startDateStr + "T00:00:00");

  for (let n = startAligner; n <= totalAligners; n++) {
    const days = n % 2 === 1 ? 14 : 7;
    const start = new Date(cursor);
    const end = addDays(start, days - 1);
    schedule.push({ number: n, days, start, end });
    cursor = addDays(end, 1);
  }
  return schedule;
}

function buildICS(schedule, includeAlarm) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aligner Wear Diary//EN",
    "CALSCALE:GREGORIAN",
  ];

  schedule.forEach(({ number, start, end }) => {
    const dtStart = toICSDate(start);
    const dtEndExclusive = toICSDate(addDays(end, 1));
    const stamp = toICSDate(new Date()) + "T000000Z";

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:aligner-${number}-${dtStart}@wear-diary`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEndExclusive}`);
    lines.push(`SUMMARY:Wear Aligner ${number}`);
    lines.push(`DESCRIPTION:Wear aligner ${number} for the full period shown.`);
    if (includeAlarm) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:Wear Aligner ${number}`);
      lines.push("TRIGGER;RELATED=START:PT9H0M0S");
      lines.push("END:VALARM");
    }
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function AlignerWearDiary() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [startAligner, setStartAligner] = useState(1);
  const [totalAligners, setTotalAligners] = useState(20);
  const [includeAlarm, setIncludeAlarm] = useState(true);
  const [schedule, setSchedule] = useState([]);
  const [built, setBuilt] = useState(false);

  const invalidRange = Number(startAligner) > Number(totalAligners);

  const handleBuild = () => {
    const s = buildSchedule(startDate, Number(startAligner), Number(totalAligners));
    setSchedule(s);
    setBuilt(true);
  };

  const handleDownload = () => {
    if (schedule.length === 0) return;
    const ics = buildICS(schedule, includeAlarm);
    const dataUri = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = "aligner-wear-diary.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const finalDate = schedule.length > 0 ? schedule[schedule.length - 1].end : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EEEDE6",
        fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        padding: "40px 20px",
        color: "#1E2A28",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#0F4C4C",
              color: "#EEEDE6",
              padding: "4px 12px",
              borderRadius: 3,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            <CalendarDays size={13} />
            Wear Diary
          </div>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              fontSize: 30,
              margin: 0,
              color: "#0F4C4C",
              letterSpacing: "-0.01em",
            }}
          >
            Aligner Wear Diary
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#5B6664", lineHeight: 1.5 }}>
            Build a full aligner-by-aligner schedule from the fit date and export it
            straight to the patient's calendar.
          </p>
        </div>

        {/* Inputs card */}
        <div
          style={{
            background: "#F7F6F1",
            border: "1px solid #D9D7CC",
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px" }}>
              <label style={labelStyle}>Starting aligner #</label>
              <input
                type="number"
                min={1}
                max={totalAligners || 60}
                value={startAligner}
                onChange={(e) => setStartAligner(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle}>Start date for aligner {startAligner || 1}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={labelStyle}>Total aligners (full treatment)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={totalAligners}
                onChange={(e) => setTotalAligners(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              marginTop: 16,
              padding: "10px 12px",
              background: "#EDEAE0",
              borderRadius: 6,
              fontSize: 12,
              color: "#5B6664",
              lineHeight: 1.5,
            }}
          >
            <Info size={14} style={{ marginTop: 2, flexShrink: 0, color: "#0F4C4C" }} />
            <span>
              Odd aligners (1, 3, 5&hellip;) are worn for <strong>14 days</strong>. Even
              aligners (2, 4, 6&hellip;) are worn for <strong>7 days</strong>. The schedule
              alternates automatically from the start date you set. Already partway through
              treatment? Set <strong>Starting aligner #</strong> to the one you're currently
              wearing &mdash; the schedule will pick up from there with the correct pattern.
            </span>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              fontSize: 12.5,
              color: "#3A4442",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={includeAlarm}
              onChange={(e) => setIncludeAlarm(e.target.checked)}
              style={{ accentColor: "#0F4C4C", width: 15, height: 15 }}
            />
            <Bell size={13} style={{ color: "#5B6664" }} />
            Include a same-day reminder alarm on each calendar event
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleBuild}
              disabled={invalidRange}
              style={{
                ...primaryButton,
                opacity: invalidRange ? 0.45 : 1,
                cursor: invalidRange ? "not-allowed" : "pointer",
              }}
            >
              Build diary
            </button>
            <button
              onClick={handleDownload}
              disabled={schedule.length === 0}
              style={{
                ...secondaryButton,
                opacity: schedule.length === 0 ? 0.45 : 1,
                cursor: schedule.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              <Download size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Download calendar (.ics)
            </button>
            {invalidRange && (
              <span style={{ fontSize: 11.5, color: "#B5652F" }}>
                Starting aligner # can't be greater than total aligners.
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        {built && schedule.length > 0 && (
          <div
            style={{
              background: "#F7F6F1",
              border: "1px solid #D9D7CC",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #D9D7CC",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F4C4C" }}>
                {schedule.length} aligners scheduled
                {Number(startAligner) > 1 ? ` (starting at #${startAligner})` : ""}
              </span>
              {finalDate && (
                <span style={{ fontSize: 11.5, color: "#5B6664" }}>
                  Treatment complete: {formatLong(finalDate)}
                </span>
              )}
            </div>

            <div style={{ maxHeight: 460, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: "#EDEAE0" }}>
                    <th style={thStyle}>Aligner</th>
                    <th style={thStyle}>Duration</th>
                    <th style={thStyle}>Start</th>
                    <th style={thStyle}>End</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map(({ number, days, start, end }) => (
                    <tr key={number} style={{ borderTop: "1px solid #E4E2D8" }}>
                      <td style={{ ...tdStyle, width: 90 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "#0F4C4C",
                            color: "#F7F6F1",
                            fontSize: 11.5,
                            fontWeight: 600,
                          }}
                        >
                          {number}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 9px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                            background: days === 14 ? "#0F4C4C1A" : "#B5652F1A",
                            color: days === 14 ? "#0F4C4C" : "#B5652F",
                          }}
                        >
                          {days} days
                        </span>
                      </td>
                      <td style={tdStyle}>{formatLong(start)}</td>
                      <td style={tdStyle}>{formatLong(end)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  color: "#5B6664",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 10px",
  border: "1px solid #C9C7BB",
  borderRadius: 5,
  fontFamily: "inherit",
  fontSize: 13.5,
  background: "#FFFFFF",
  color: "#1E2A28",
};

const primaryButton = {
  background: "#0F4C4C",
  color: "#F7F6F1",
  border: "none",
  borderRadius: 6,
  padding: "10px 18px",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButton = {
  background: "transparent",
  color: "#0F4C4C",
  border: "1px solid #0F4C4C",
  borderRadius: 6,
  padding: "10px 18px",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
};

const thStyle = {
  textAlign: "left",
  padding: "9px 20px",
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#5B6664",
  fontWeight: 600,
};

const tdStyle = {
  padding: "8px 20px",
  color: "#1E2A28",
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AlignerWearDiary />);
