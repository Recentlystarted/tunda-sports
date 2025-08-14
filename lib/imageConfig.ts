// Image Management Configuration for Tunda Sports Club
// Update these URLs to use your own images

export const imageConfig = {
  // Hero Section Images (Homepage slideshow)
  hero: [
    {
      url: 'https://lh3.googleusercontent.com/p/AF1QipOL2oEJhUIF4cBEcB6r8Lw1WayUSE7CqzNsJEIm=w2000-h1200-k-no',
      alt: 'Real Tunda Cricket Ground - Aerial View',
      caption: 'Welcome to Tunda Cricket Ground'
    },
    {
      url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=2000&h=1200&fit=crop&crop=center',
      alt: 'Cricket Ground Facilities',
      caption: 'Modern Cricket Facilities in Village Setting'
    },
    {
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=2000&h=1200&fit=crop&crop=center',
      alt: 'Cricket Pitch View',
      caption: 'Professional Quality Pitch'
    },
    {
      url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=2000&h=1200&fit=crop&crop=center',
      alt: 'Cricket Stadium View',
      caption: 'Home of Village Cricket Champions'
    }
  ],

  // Gallery Images by Category
  gallery: {
    facilities: [
      {
        url: 'https://lh3.googleusercontent.com/p/AF1QipOL2oEJhUIF4cBEcB6r8Lw1WayUSE7CqzNsJEIm=w800-h600-k-no',
        title: 'Tunda Cricket Ground - Main View',
        description: 'Real aerial view of our village cricket ground'
      },
      {
        url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=600&fit=crop&crop=center',
        title: 'Ground Facilities',
        description: 'Modern cricket facilities and infrastructure'
      },
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
        title: 'Cricket Pitch',
        description: 'Well-maintained cricket pitch for all formats'
      },
      {
        url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=600&fit=crop&crop=center',
        title: 'Stadium View',
        description: 'Complete view of the playing area and seating'
      }
    ],
    tournaments: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
        title: 'Championship 2024',
        description: 'Annual Tunda Cricket Championship action'
      },
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&crop=center',
        title: 'Victory Celebration',
        description: 'Champions celebrating their victory'
      },
      {
        url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=600&fit=crop&crop=center',
        title: 'Trophy Presentation',
        description: 'Award ceremony at the ground'
      }
    ],
    events: [
      {
        url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=600&fit=crop&crop=center',
        title: 'Village Cricket Festival',
        description: 'Annual community cricket celebration'
      },
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
        title: 'Community Cricket Day',
        description: 'Local cricket day for all ages'
      }
    ],
    training: [
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&crop=center',
        title: 'Youth Training',
        description: 'Young cricketers learning the game'
      },
      {
        url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=600&fit=crop&crop=center',
        title: 'Skills Development',
        description: 'Cricket skills training sessions'
      }
    ]
  }
}

// How to add your own images:

// METHOD 1: Google Drive (Recommended)
// 1. Upload your photos to Google Drive
// 2. Right-click → Share → "Anyone with the link can view"
// 3. Copy the sharing link (looks like: https://drive.google.com/file/d/FILE_ID/view?usp=sharing)
// 4. Convert to direct link: https://drive.google.com/uc?export=view&id=FILE_ID
// 5. Replace the URLs above with your Google Drive direct links

// METHOD 2: Local Images
// 1. Put your images in public/images/ folder
// 2. Reference them as: '/images/your-photo.jpg'
// 3. Example: '/images/ground/tunda-cricket-ground.jpg'

// METHOD 3: Image Hosting Services
// 1. Upload to Imgur, ImageBB, or Cloudinary
// 2. Get the direct image URL
// 3. Replace the URLs above

// METHOD 4: Your Own Domain
// 1. Upload images to your website's image folder
// 2. Use full URLs: 'https://yourwebsite.com/images/photo.jpg'

export default imageConfig
