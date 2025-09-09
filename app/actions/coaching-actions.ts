'use server'

// Prisma removed - using Convex instead
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

    // Create a map for quick lookup using clerkId
    const userMap = new Map(users.map(user => [user.clerkId, user]))

    // Transform the data to match the expected Coach interface
    const coaches: Coach[] = coachProfiles.map(profile => {
      const user = userMap.get(profile.userId)
      
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

export async function createCoachingSession(sessionData: {
  coachId: string
  scheduledDate: Date
  startTime: string
  duration: number
  notes?: string
  sessionType?: string
}) {
  try {
    const { userId: studentId } = await auth()
    
    if (!studentId) {
      throw new Error('User not authenticated')
    }

    // Get coach profile to calculate cost
    const coach = await getCoachById(sessionData.coachId)
    if (!coach) {
      return { success: false, error: 'Coach not found' }
    }

    // Check if user has Discord verification
    const user = await prisma.user.findUnique({
      where: { clerkId: studentId },
      select: { discordVerified: true, discordId: true }
    })

    if (!user?.discordVerified || !user?.discordId) {
      return { 
        success: false, 
        error: 'Discord verification required',
        requiresDiscordAuth: true 
      }
    }

    // Check availability
    const isAvailable = await checkCoachAvailability(
      sessionData.coachId,
      sessionData.scheduledDate,
      sessionData.startTime,
      sessionData.duration
    )

    if (!isAvailable) {
      return { success: false, error: 'Time slot not available' }
    }

    // Calculate end time and total cost
    const startHour = parseInt(sessionData.startTime.split(':')[0])
    const startMinute = parseInt(sessionData.startTime.split(':')[1])
    const endTime = `${String(startHour + Math.floor((startMinute + sessionData.duration) / 60)).padStart(2, '0')}:${String((startMinute + sessionData.duration) % 60).padStart(2, '0')}`
    const totalCost = (coach.hourlyRate * sessionData.duration) / 60

    // Create coaching session
    const session = await prisma.coachingSession.create({
      data: {
        coachId: sessionData.coachId,
        studentId,
        scheduledDate: sessionData.scheduledDate,
        startTime: sessionData.startTime,
        endTime,
        duration: sessionData.duration,
        notes: sessionData.notes,
        sessionType: sessionData.sessionType || 'video',
        totalCost,
        status: 'SCHEDULED'
      }
    })

    // Mark availability as booked
    await markTimeSlotAsBooked(
      sessionData.coachId,
      sessionData.scheduledDate,
      sessionData.startTime,
      sessionData.duration
    )

    return { 
      success: true, 
      message: 'Session booked successfully',
      sessionId: session.id,
      session
    }
  } catch (error) {
    console.error('Error creating coaching session:', error)
    return { success: false, error: 'Failed to book session' }
  }
}

export async function getCoachAvailability(coachIdOrDate: string | Date, date?: Date) {
  try {
    let actualCoachId: string;
    let actualDate: Date;

    // Handle overloaded parameters
    if (typeof coachIdOrDate === 'string') {
      // Called with coachId and date
      actualCoachId = coachIdOrDate;
      actualDate = date!;
    } else {
      // Called with just date (for current user)
      const { userId } = await auth();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      actualCoachId = userId;
      actualDate = coachIdOrDate;
    }

    const availability = await prisma.coachAvailability.findMany({
      where: {
        userId: actualCoachId,
        date: {
          gte: new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()),
          lt: new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() + 1)
        },
        isAvailable: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Get existing sessions for this date
    const existingSessions = await prisma.coachingSession.findMany({
      where: {
        coachId: actualCoachId,
        scheduledDate: {
          gte: new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()),
          lt: new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() + 1)
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    })

    // Filter out booked time slots
    const availableSlots = availability.filter(slot => {
      return !existingSessions.some(session => 
        timeSlotOverlaps(slot.startTime, slot.endTime, session.startTime, session.endTime)
      )
    })

    return { success: true, availability: availableSlots }
  } catch (error) {
    console.error('Error fetching coach availability:', error)
    return { success: false, error: 'Failed to fetch availability' }
  }
}

export async function setCoachAvailability(availabilityData: {
  date: Date
  timeSlots: Array<{ startTime: string; endTime: string }>
}) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Check if user is a coach
    const coachProfile = await prisma.coachProfile.findFirst({
      where: { userId, isActive: true }
    })

    if (!coachProfile) {
      return { success: false, error: 'Coach profile not found' }
    }

    // Remove existing availability for this date
    await prisma.coachAvailability.deleteMany({
      where: {
        userId,
        date: {
          gte: new Date(availabilityData.date.getFullYear(), availabilityData.date.getMonth(), availabilityData.date.getDate()),
          lt: new Date(availabilityData.date.getFullYear(), availabilityData.date.getMonth(), availabilityData.date.getDate() + 1)
        }
      }
    })

    // Create new availability slots
    const now = new Date()
    const availabilitySlots = availabilityData.timeSlots.map(slot => ({
      id: `availability_${userId}_${availabilityData.date.toISOString().split('T')[0]}_${slot.startTime.replace(':', '')}`,
      userId,
      date: availabilityData.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: true,
      createdAt: now,
      updatedAt: now
    }))

    await prisma.coachAvailability.createMany({
      data: availabilitySlots
    })

    return { 
      success: true, 
      message: 'Availability updated successfully',
      slots: availabilitySlots.length
    }
  } catch (error) {
    console.error('Error setting coach availability:', error)
    return { success: false, error: 'Failed to update availability' }
  }
}

async function checkCoachAvailability(
  coachId: string,
  date: Date,
  startTime: string,
  duration: number
): Promise<boolean> {
  const endTime = calculateEndTime(startTime, duration)
  
  // Check if there's an availability slot that covers this time
  const availabilitySlot = await prisma.coachAvailability.findFirst({
    where: {
      userId: coachId,
      date: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      },
      isAvailable: true,
      startTime: {
        lte: startTime
      },
      endTime: {
        gte: endTime
      }
    }
  })

  if (!availabilitySlot) return false

  // Check if there's already a session booked at this time
  const existingSession = await prisma.coachingSession.findFirst({
    where: {
      coachId,
      scheduledDate: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      },
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS']
      },
      OR: [
        {
          startTime: {
            lt: endTime
          },
          endTime: {
            gt: startTime
          }
        }
      ]
    }
  })

  return !existingSession
}

async function markTimeSlotAsBooked(
  coachId: string,
  date: Date,
  startTime: string,
  duration: number
) {
  // This is handled by the coaching session creation
  // The availability check will exclude booked slots
}

function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(totalMinutes / 60)
  const endMins = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`
}

function timeSlotOverlaps(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2
}

// Discord Integration Functions
export async function initializeDiscordAuth() {
  // This should redirect to Discord OAuth
  const discordClientId = process.env.DISCORD_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`
  
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds.join`
  
  return { success: true, authUrl: discordAuthUrl }
}

export async function verifyDiscordAuth(code: string) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Exchange code for Discord access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange Discord code')
    }

    const tokenData = await tokenResponse.json()

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get Discord user info')
    }

    const discordUser = await userResponse.json()

    // Update user with Discord info
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordVerified: true
      }
    })

    return { 
      success: true, 
      message: 'Discord account linked successfully',
      discordUser: {
        id: discordUser.id,
        username: discordUser.username
      }
    }
  } catch (error) {
    console.error('Error verifying Discord auth:', error)
    return { success: false, error: 'Failed to link Discord account' }
  }
}

export async function setupDiscordSessionChannel(sessionId: string) {
  try {
    const session = await prisma.coachingSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    // Get Discord bot token and guild ID from environment
    const botToken = process.env.DISCORD_BOT_TOKEN
    const guildId = process.env.DISCORD_GUILD_ID

    if (!botToken || !guildId) {
      return { success: false, error: 'Discord configuration missing' }
    }

    // Create private voice channel for the session
    const channelResponse = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `coaching-session-${sessionId.slice(-8)}`,
        type: 2, // Voice channel
        permission_overwrites: [
          {
            id: guildId,
            type: 0, // Role
            deny: '1024' // VIEW_CHANNEL permission
          }
        ]
      }),
    })

    if (!channelResponse.ok) {
      throw new Error('Failed to create Discord channel')
    }

    const channel = await channelResponse.json()

    // Update session with Discord channel info
    await prisma.coachingSession.update({
      where: { id: sessionId },
      data: {
        discordChannelId: channel.id,
        discordSetupComplete: true
      }
    })

    return { 
      success: true, 
      message: 'Discord channel created',
      channelId: channel.id,
      channelName: channel.name
    }
  } catch (error) {
    console.error('Error setting up Discord session channel:', error)
    return { success: false, error: 'Failed to create Discord channel' }
  }
}

export async function grantSessionAccess(sessionId: string) {
  try {
    const session = await prisma.coachingSession.findUnique({
      where: { id: sessionId }
    })

    if (!session || !session.discordChannelId) {
      return { success: false, error: 'Session or channel not found' }
    }

    // Get both coach and student Discord IDs
    const [coach, student] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkId: session.coachId },
        select: { discordId: true }
      }),
      prisma.user.findUnique({
        where: { clerkId: session.studentId },
        select: { discordId: true }
      })
    ])

    if (!coach?.discordId || !student?.discordId) {
      return { success: false, error: 'Discord IDs not found for participants' }
    }

    const botToken = process.env.DISCORD_BOT_TOKEN
    const guildId = process.env.DISCORD_GUILD_ID

    // Grant channel access to both participants
    const participants = [coach.discordId, student.discordId]
    
    for (const discordId of participants) {
      await fetch(`https://discord.com/api/channels/${session.discordChannelId}/permissions/${discordId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 1, // Member
          allow: '1049600' // VIEW_CHANNEL + CONNECT + SPEAK
        }),
      })
    }

    return { success: true, message: 'Session access granted' }
  } catch (error) {
    console.error('Error granting session access:', error)
    return { success: false, error: 'Failed to grant session access' }
  }
}

// Cron job function to manage session automation
export async function processScheduledSessions() {
  try {
    const now = new Date()
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000)
    const in5Minutes = new Date(now.getTime() + 5 * 60 * 1000)

    // Find sessions starting in 15 minutes (for setup)
    const sessionsToSetup = await prisma.coachingSession.findMany({
      where: {
        scheduledDate: {
          gte: new Date(in15Minutes.getFullYear(), in15Minutes.getMonth(), in15Minutes.getDate()),
          lt: new Date(in15Minutes.getFullYear(), in15Minutes.getMonth(), in15Minutes.getDate() + 1)
        },
        startTime: {
          gte: `${String(in15Minutes.getHours()).padStart(2, '0')}:${String(in15Minutes.getMinutes()).padStart(2, '0')}`,
          lt: `${String(in15Minutes.getHours()).padStart(2, '0')}:${String(in15Minutes.getMinutes() + 5).padStart(2, '0')}`
        },
        status: 'SCHEDULED',
        discordSetupComplete: false
      }
    })

    // Find sessions starting in 5 minutes (for access)
    const sessionsToActivate = await prisma.coachingSession.findMany({
      where: {
        scheduledDate: {
          gte: new Date(in5Minutes.getFullYear(), in5Minutes.getMonth(), in5Minutes.getDate()),
          lt: new Date(in5Minutes.getFullYear(), in5Minutes.getMonth(), in5Minutes.getDate() + 1)
        },
        startTime: {
          gte: `${String(in5Minutes.getHours()).padStart(2, '0')}:${String(in5Minutes.getMinutes()).padStart(2, '0')}`,
          lt: `${String(in5Minutes.getHours()).padStart(2, '0')}:${String(in5Minutes.getMinutes() + 5).padStart(2, '0')}`
        },
        status: 'SCHEDULED',
        discordSetupComplete: true
      }
    })

    // Setup Discord channels for sessions starting in 15 minutes
    for (const session of sessionsToSetup) {
      await setupDiscordSessionChannel(session.id)
    }

    // Grant access for sessions starting in 5 minutes
    for (const session of sessionsToActivate) {
      await grantSessionAccess(session.id)
    }

    return { 
      success: true, 
      message: `Processed ${sessionsToSetup.length} setups and ${sessionsToActivate.length} activations` 
    }
  } catch (error) {
    console.error('Error processing scheduled sessions:', error)
    return { success: false, error: 'Failed to process sessions' }
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