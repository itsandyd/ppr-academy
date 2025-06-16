const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingInstructorIds() {
  try {
    console.log('🔄 Fixing missing instructorId values...');
    
    // Find all courses where instructorId is null
    const coursesWithoutInstructor = await prisma.course.findMany({
      where: {
        instructorId: null
      },
      select: {
        id: true,
        userId: true,
        title: true
      }
    });
    
    console.log(`📊 Found ${coursesWithoutInstructor.length} courses without instructorId`);
    
    if (coursesWithoutInstructor.length === 0) {
      console.log('✅ No courses need fixing');
      return;
    }
    
    // Update each course to set instructorId = userId
    for (const course of coursesWithoutInstructor) {
      await prisma.course.update({
        where: { id: course.id },
        data: { instructorId: course.userId }
      });
      console.log(`✅ Fixed course: ${course.title} (${course.id})`);
    }
    
    console.log(`🎉 Successfully fixed ${coursesWithoutInstructor.length} courses`);
    
  } catch (error) {
    console.error('❌ Error fixing instructor IDs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  fixMissingInstructorIds()
    .then(() => {
      console.log('✨ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixMissingInstructorIds }; 