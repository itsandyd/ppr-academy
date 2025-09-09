"use server";

// Prisma removed - using Convex instead
import { revalidatePath } from "next/cache";

interface CoachApplicationData {
  userId: string;
  experience: string;
  portfolio: string;
  specialties: string;
  teachingPhilosophy: string;
  availability: string;
  timezone: string;
  preferredRate: string;
  socialLinks: string;
}

export async function submitCoachApplication(data: CoachApplicationData) {
  try {
    // In a real app, you might store this in a separate CoachApplication table
    // For now, we'll store it as JSON in a field or send an email
    // You could also add a status field to the User model to track coach status
    
    // For demonstration, we'll log the application
    console.log("Coach application received:", data);
    
    // You could send an email to admins here
    // Or create a record in a CoachApplications table
    
    // For now, we'll just return success
    revalidatePath("/admin");
    
    return { success: true };
  } catch (error) {
    console.error("Error submitting coach application:", error);
    return { 
      success: false, 
      error: "Failed to submit application. Please try again." 
    };
  }
} 