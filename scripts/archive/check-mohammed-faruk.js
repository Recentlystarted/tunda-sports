const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMohammedFaruk() {
  try {
    const person = await prisma.person.findFirst({
      where: {
        name: {
          contains: 'Mohammed',
          mode: 'insensitive'
        }
      }
    });
    
    if (person) {
      console.log('Found Mohammed Faruk:');
      console.log('ID:', person.id);
      console.log('Name:', person.name);
      console.log('Role:', person.role);
      console.log('Profile Image:', person.profileImage);
      console.log('Show on Landing:', person.showOnLanding);
      console.log('Is Active:', person.isActive);
      console.log('Sort Order:', person.sortOrder);
    } else {
      console.log('Mohammed Faruk not found');
      
      // Let's check all people
      const allPeople = await prisma.person.findMany({
        select: {
          id: true,
          name: true,
          role: true,
          profileImage: true,
          showOnLanding: true,
          isActive: true
        }
      });
      
      console.log('All people in database:');
      allPeople.forEach(p => {
        console.log('- ' + p.name + ' (' + p.role + ') - Image: ' + (p.profileImage ? 'Yes' : 'No') + ' - Show: ' + p.showOnLanding + ' - Active: ' + p.isActive);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkMohammedFaruk();
