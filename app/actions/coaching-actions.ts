'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export interface Coach {
  id: string
  userId: string
  firstName: string
  lastName: string
  imageUrl?: string
  specialties: string[]
  hourlyRate: number
  rating: number
  totalSessions: number
  availability: string
  bio: string
  experience: string
  location?: string
  isActive: boolean
}

export async function getCoaches(): Promise<Coach[]> {
  try {
    const coachProfiles = await prisma.coachProfile.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`🔍 Found ${coachProfiles.length} active coach profiles`)
    console.log(`📋 Coach user IDs:`, coachProfiles.map(p => p.userId))

    // Fetch user data separately - match by clerkId since userId stores Clerk ID
    const clerkIds = coachProfiles.map(profile => profile.userId)
    const users = await prisma.user.findMany({
      where: {
        clerkId: {
          in: clerkIds
        }
      },
      select: {
        clerkId: true,
        firstName: true,
        lastName: true,
        imageUrl: true
      }
    })

    console.log(`👥 Found ${users.length} matching users`)
    console.log(`📋 User data:`, users.map(u => ({ clerkId: u.clerkId, name: `${u.firstName} ${u.lastName}` })))

    // Create a map for quick lookup using clerkId
    const userMap = new Map(users.map(user => [user.clerkId, user]))

    // Transform the data to match the expected Coach interface
    const coaches: Coach[] = coachProfiles.map(profile => {
      const user = userMap.get(profile.userId)
      console.log(`🔄 Processing profile ${profile.id}, userId: ${profile.userId}, found user:`, user ? `${user.firstName} ${user.lastName}` : 'NOT FOUND')
      
      return {
        id: profile.id,
        userId: profile.userId,
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || 'Coach',
        imageUrl: user?.imageUrl || profile.imageSrc,
        specialties: profile.category ? [profile.category] : [],
        hourlyRate: profile.basePrice || 50,
        rating: 4.5, // TODO: Calculate from actual reviews
        totalSessions: 0, // TODO: Calculate from actual sessions
        availability: profile.availableHours || 'Available',
        bio: profile.description || '',
        experience: profile.professionalBackground || '',
        location: profile.location || '',
        isActive: profile.isActive
      }
    })

    console.log(`✅ Returning ${coaches.length} coaches with names:`, coaches.map(c => `${c.firstName} ${c.lastName}`))
    return coaches
  } catch (error) {
    console.error('Error fetching coaches:', error)
    return []
  }
}

export async function getCoachById(id: string): Promise<Coach | null> {
  try {
    const coachProfile = await prisma.coachProfile.findUnique({
      where: {
        id: id,
        isActive: true
      }
    })

    if (!coachProfile) {
      return null
    }

    // Fetch user data separately - match by clerkId since userId stores Clerk ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId: coachProfile.userId
      },
      select: {
        clerkId: true,
        firstName: true,
        lastName: true,
        imageUrl: true
      }
    })

    return {
      id: coachProfile.id,
      userId: coachProfile.userId,
      firstName: user?.firstName || 'Unknown',
      lastName: user?.lastName || 'Coach',
      imageUrl: user?.imageUrl || coachProfile.imageSrc,
      specialties: coachProfile.category ? [coachProfile.category] : [],
      hourlyRate: coachProfile.basePrice || 50,
      rating: 4.5, // TODO: Calculate from actual reviews
      totalSessions: 0, // TODO: Calculate from actual sessions
      availability: coachProfile.availableHours || 'Available',
      bio: coachProfile.description || '',
      experience: coachProfile.professionalBackground || '',
      location: coachProfile.location || '',
      isActive: coachProfile.isActive
    }
  } catch (error) {
    console.error('Error fetching coach:', error)
    return null
  }
}

export async function getUserCoachProfile() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Get the user's coach profile if it exists (userId stores clerkId)
    const coachProfile = await prisma.coachProfile.findFirst({
      where: { userId },
      select: {
        id: true,
        category: true,
        location: true,
        title: true,
        description: true,
        basePrice: true,
        timezone: true,
        availableDays: true,
        availableHours: true,
        isActive: true,
        createdAt: true
      }
    })

    return { success: true, profile: coachProfile }
  } catch (error) {
    console.error('Error fetching user coach profile:', error)
    return { success: false, error: 'Failed to fetch coach profile' }
  }
}

export async function updateCoachApplication(applicationData: {
  category: string
  location: string
  title: string
  description: string
  basePrice: number
  timezone?: string
  availableDays?: string
  availableHours?: string
}) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Find existing coach profile
    const existingProfile = await prisma.coachProfile.findFirst({
      where: { userId }
    })

    if (!existingProfile) {
      return { success: false, error: 'No existing coach profile found' }
    }

    // Update the coach profile
    const updatedProfile = await prisma.coachProfile.update({
      where: { id: existingProfile.id },
      data: {
        category: applicationData.category,
        location: applicationData.location || '',
        title: applicationData.title,
        description: applicationData.description,
        basePrice: applicationData.basePrice,
        timezone: applicationData.timezone || 'UTC+00:00',
        availableDays: applicationData.availableDays || '',
        availableHours: applicationData.availableHours,
        updatedAt: new Date(),
        // Note: We don't reset isActive - only admin can change that
      }
    })

    return { 
      success: true, 
      message: 'Coach profile updated successfully',
      profile: updatedProfile
    }
  } catch (error) {
    console.error('Error updating coach application:', error)
    return { success: false, error: 'Failed to update coach profile' }
  }
}

export async function createCoachingSession(coachId: string, sessionData: {
  date: Date
  duration: number
  notes?: string
}) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // TODO: Implement coaching session creation
    // This would involve creating a new session record and handling payment
    
    return { success: true, message: 'Session booked successfully' }
  } catch (error) {
    console.error('Error creating coaching session:', error)
    return { success: false, error: 'Failed to book session' }
  }
}

export async function createCoachApplication(applicationData: {
  category: string
  location: string
  title: string
  description: string
  basePrice: number
  professionalBackground?: string
  certifications?: string
  notableProjects?: string
  discordUsername?: string
  alternativeContact?: string
  timezone?: string
  availableDays?: string
  availableHours?: string
  portfolioUrl?: string
  socialLinks?: string
}) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Check if user already has a coach profile
    const existingProfile = await prisma.coachProfile.findFirst({
      where: { userId }
    })

    if (existingProfile) {
      return { success: false, error: 'You already have a coach application on file' }
    }

    // Generate a unique ID for the coach profile
    const profileId = `coach_${userId}_${Date.now()}`

    // Create coach profile
    const coachProfile = await prisma.coachProfile.create({
      data: {
        id: profileId,
        userId,
        category: applicationData.category,
        location: applicationData.location || '',
        imageSrc: '', // Will be updated later with user's profile image
        basePrice: applicationData.basePrice,
        title: applicationData.title,
        description: applicationData.description,
        discordUsername: applicationData.discordUsername || '',
        alternativeContact: applicationData.alternativeContact,
        professionalBackground: applicationData.professionalBackground,
        certifications: applicationData.certifications,
        notableProjects: applicationData.notableProjects,
        timezone: applicationData.timezone || 'UTC+00:00',
        availableDays: applicationData.availableDays || '',
        availableHours: applicationData.availableHours,
        isActive: false, // Requires admin approval
        updatedAt: new Date(),
      }
    })

    return { 
      success: true, 
      message: 'Coach application submitted successfully',
      profileId: coachProfile.id
    }
  } catch (error) {
    console.error('Error creating coach application:', error)
    return { success: false, error: 'Failed to submit application' }
  }
} 