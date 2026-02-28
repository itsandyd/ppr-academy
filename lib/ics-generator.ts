/**
 * Generate RFC 5545 compliant .ics calendar file content.
 * Used as a fallback when Google Calendar isn't connected.
 */

interface ICSEventParams {
  title: string;
  description: string;
  startTime: Date;
  durationMinutes: number;
  location?: string; // Meeting URL or physical location
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
}

function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateICSContent(params: ICSEventParams): string {
  const {
    title,
    description,
    startTime,
    durationMinutes,
    location,
    organizerName,
    organizerEmail,
    attendeeName,
    attendeeEmail,
  } = params;

  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();
  const uid = `coaching-${Date.now()}-${Math.random().toString(36).slice(2)}@ppracademy.com`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PPR Academy//Coaching Sessions//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${escapeICSText(title)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeICSText(location)}`);
    lines.push(`URL:${location}`);
  }

  if (organizerEmail) {
    const cn = organizerName ? `;CN=${escapeICSText(organizerName)}` : "";
    lines.push(`ORGANIZER${cn}:mailto:${organizerEmail}`);
  }

  if (attendeeEmail) {
    const cn = attendeeName ? `;CN=${escapeICSText(attendeeName)}` : "";
    lines.push(
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION${cn}:mailto:${attendeeEmail}`
    );
  }

  // Reminders: 1 hour and 15 minutes before
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICSText(title)} starts in 1 hour`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICSText(title)} starts in 15 minutes`,
    "END:VALARM"
  );

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Generate a data URI for an .ics file that can be used as an href.
 */
export function generateICSDataUri(params: ICSEventParams): string {
  const content = generateICSContent(params);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}
