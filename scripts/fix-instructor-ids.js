const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixInstructorIds() {
  console.log('🔧 Fixing instructor IDs...');
  
  try {
    // Update all courses to set instructorId = userId where instructorId is null
    const result = await prisma.course.updateMany({
      where: {
        instructorId: null,
      },
      data: {
        instructorId: prisma.raw('userId'),
      },
    });

    console.log(`✅ Updated ${result.count} courses`);
    
    // Alternative approach using raw SQL if the above doesn't work
    await prisma.$executeRaw`UPDATE Course SET instructorId = userId WHERE instructorId IS NULL`;
    
    console.log('✅ All courses now have instructorId set');
    
    // Verify the fix
    const coursesWithoutInstructor = await prisma.course.count({
      where: {
        instructorId: null,
      },
    });
    
    console.log(`📊 Courses without instructor: ${coursesWithoutInstructor}`);
    
  } catch (error) {
    console.error('❌ Error fixing instructor IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInstructorIds(); 