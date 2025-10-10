import {
  Button,
  Heading,
  Hr,
  Img,
  Section,
  Text,
} from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CourseProgress {
  courseName: string;
  progress: number;
  courseUrl: string;
}

interface NewCourse {
  courseName: string;
  instructor: string;
  thumbnail: string;
  courseUrl: string;
}

interface Certificate {
  courseName: string;
  issueDate: string;
  certificateUrl: string;
}

interface WeeklyDigestEmailProps {
  name: string;
  courseProgress?: CourseProgress[];
  newCourses?: NewCourse[];
  certificates?: Certificate[];
  weekOf?: string;
}

export default function WeeklyDigestEmail({
  name = "Student",
  courseProgress = [],
  newCourses = [],
  certificates = [],
  weekOf = new Date().toLocaleDateString(),
}: WeeklyDigestEmailProps) {
  const hasContent = courseProgress.length > 0 || newCourses.length > 0 || certificates.length > 0;

  return (
    <EmailLayout preview={`Your weekly learning digest - ${weekOf}`}>
      <Heading style={h1}>📚 Your Weekly Digest</Heading>
      
      <Text style={subheading}>
        Week of {weekOf}
      </Text>

      <Text style={text}>
        Hi {name},
      </Text>

      <Text style={text}>
        Here's a quick recap of your learning journey this week. Let's keep the momentum going!
      </Text>

      {/* Course Progress Section */}
      {courseProgress.length > 0 && (
        <>
          <Hr style={hr} />
          <Heading style={h2}>🎯 Your Progress</Heading>
          
          {courseProgress.map((course, index) => (
            <Section key={index} style={courseCard}>
              <Heading style={h3}>{course.courseName}</Heading>
              <Section style={progressBar}>
                <Section style={{...progressFill, width: `${course.progress}%`}} />
              </Section>
              <Text style={progressText}>{course.progress}% Complete</Text>
              <Button style={smallButton} href={course.courseUrl}>
                Continue
              </Button>
            </Section>
          ))}
        </>
      )}

      {/* New Certificates Section */}
      {certificates.length > 0 && (
        <>
          <Hr style={hr} />
          <Heading style={h2}>🏆 New Achievements</Heading>
          
          {certificates.map((cert, index) => (
            <Section key={index} style={achievementCard}>
              <Text style={achievementEmoji}>🎉</Text>
              <Text style={achievementText}>
                You earned a certificate for <strong>{cert.courseName}</strong>!
              </Text>
              <Button style={smallButton} href={cert.certificateUrl}>
                View Certificate
              </Button>
            </Section>
          ))}
        </>
      )}

      {/* New Courses Section */}
      {newCourses.length > 0 && (
        <>
          <Hr style={hr} />
          <Heading style={h2}>✨ New Courses You Might Like</Heading>
          
          {newCourses.map((course, index) => (
            <Section key={index} style={newCourseCard}>
              <Img
                src={course.thumbnail}
                alt={course.courseName}
                style={courseThumbnail}
              />
              <Section style={courseInfo}>
                <Heading style={h4}>{course.courseName}</Heading>
                <Text style={instructorText}>by {course.instructor}</Text>
                <Button style={smallButton} href={course.courseUrl}>
                  Learn More
                </Button>
              </Section>
            </Section>
          ))}
        </>
      )}

      {!hasContent && (
        <Section style={emptyState}>
          <Text style={emptyEmoji}>📖</Text>
          <Text style={emptyText}>
            No activity this week. Ready to start learning?
          </Text>
        </Section>
      )}

      <Hr style={hr} />

      {/* CTA Section */}
      <Section style={ctaSection}>
        <Heading style={h3}>Keep Learning!</Heading>
        <Text style={text}>
          Your next lesson is waiting. Just 15 minutes today can make a big difference
          in your learning journey.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href="#">
            Browse All Courses
          </Button>
        </Section>
      </Section>

      <Text style={text}>
        Have a great week!
        <br />
        The PPR Academy Team
      </Text>

      <Section style={preferencesSection}>
        <Text style={smallText}>
          You're receiving this weekly digest because you're enrolled in courses.
          You can adjust your email preferences anytime.
        </Text>
      </Section>
    </EmailLayout>
  );
}

// Styles
const h1 = {
  color: "#1f2937",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "32px 0 8px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "32px 0 16px",
};

const h3 = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const h4 = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 4px",
};

const subheading = {
  color: "#6b7280",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0 0 32px",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const courseCard = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
};

const progressBar = {
  backgroundColor: "#e5e7eb",
  borderRadius: "9999px",
  height: "8px",
  overflow: "hidden",
  margin: "12px 0",
};

const progressFill = {
  backgroundColor: "#2563eb",
  height: "8px",
  borderRadius: "9999px",
};

const progressText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "8px 0 12px",
};

const achievementCard = {
  backgroundColor: "#dcfce7",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const achievementEmoji = {
  fontSize: "32px",
  margin: "0 0 8px",
};

const achievementText = {
  color: "#4b5563",
  fontSize: "16px",
  margin: "8px 0 16px",
};

const newCourseCard = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
  margin: "16px 0",
};

const courseThumbnail = {
  width: "100%",
  height: "200px",
  objectFit: "cover" as const,
};

const courseInfo = {
  padding: "20px",
};

const instructorText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "4px 0 16px",
};

const emptyState = {
  textAlign: "center" as const,
  padding: "48px 24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  margin: "32px 0",
};

const emptyEmoji = {
  fontSize: "48px",
  margin: "0 0 16px",
};

const emptyText = {
  color: "#6b7280",
  fontSize: "16px",
  margin: "0",
};

const ctaSection = {
  backgroundColor: "#eff6ff",
  borderRadius: "12px",
  padding: "32px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const smallButton = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "8px 20px",
  marginTop: "8px",
};

const preferencesSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  margin: "32px 0 0",
  textAlign: "center" as const,
};

const smallText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
};

