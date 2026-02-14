export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string; // HTML or Markdown content
    image: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
}

export const BLOG_CATEGORIES = ["All", "Pet Care", "Health", "Nutrition", "Grooming", "Training", "Adoption Stories"];

export const BLOG_POSTS: BlogPost[] = [
    {
        id: "1",
        slug: "essential-pet-care-tips-summer",
        title: "Essential Pet Care Tips for the Hot Summer",
        excerpt: "As temperatures rise, our furry friends need extra care to stay safe and cool. Here are the top tips for summer pet safety.",
        content: `
            <h2>Keep Them Hydrated</h2>
            <p>Just like humans, pets can get dehydrated quickly in the heat. Ensure they always have access to fresh, cool water. Consider adding ice cubes to their water bowl for an extra treat.</p>
            
            <h2>Watch the Paws</h2>
            <p>Hot pavement can burn your pet's sensitive paw pads. If it's too hot for your hand, it's too hot for their paws. Walk them early in the morning or late in the evening.</p>
            
            <h2>Never Leave Them in the Car</h2>
            <blockquote style="border-left: 4px solid var(--primary-color); padding-left: 1rem; margin: 1.5rem 0; font-style: italic;">
                "Even with windows cracked, a car can become a furnace in minutes. Never leave your pet behind in a vehicle."
            </blockquote>
            
            <h2>Signs of Heatstroke</h2>
            <ul>
                <li>Excessive panting</li>
                <li>Drooling</li>
                <li>Reddened gums</li>
                <li>Vomiting</li>
            </ul>
        `,
        image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800",
        category: "Pet Care",
        author: "Dr. Ayesha Khan",
        date: "May 15, 2024",
        readTime: "5 min read"
    },
    {
        id: "2",
        slug: "best-nutrition-for-growing-puppies",
        title: "The Ultimate Guide to Nutrition for Growing Puppies",
        excerpt: "Puppies have specific dietary needs to support their rapid growth and endless energy. Learn what to feed your new best friend.",
        content: `
            <h2>Protein is Key</h2>
            <p>Growing muscles need high-quality protein. Look for puppy food where the first ingredient is real meat like chicken, beef, or lamb.</p>
            
            <h2>Balanced Fats</h2>
            <p>Fats provide energy and help absorb vitamins. Omega-3 and Omega-6 fatty acids are crucial for healthy skin and a shiny coat.</p>
            
            <h2>Feeding Schedule</h2>
            <p>Puppies should eat 3-4 times a day until they are about 6 months old. Consistent feeding times help with potty training too!</p>
        `,
        image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800",
        category: "Nutrition",
        author: "Sarah Ahmed",
        date: "April 20, 2024",
        readTime: "4 min read"
    },
    {
        id: "3",
        slug: "why-adopt-dont-shop",
        title: "Why Adopt Don't Shop? The Benefits of Rescuing",
        excerpt: "Adopting a pet saves a life and fights against puppy mills. Discover the heartwarming reasons to choose adoption.",
        content: `
            <h2>Saving a Life</h2>
            <p>When you adopt, you're giving a second chance to an animal that might have been abandoned or mistreated.</p>
            
            <h2>Unconditional Love</h2>
            <p>Rescue pets often seem to know they've been saved and bond deeply with their new families.</p>
            
            <h2>Fighting Overpopulation</h2>
            <p>Adoption helps reduce the number of stray animals on the streets and supports ethical treatment of animals.</p>
        `,
        image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=800",
        category: "Adoption Stories",
        author: "Paltuu Team",
        date: "June 1, 2024",
        readTime: "3 min read"
    },
    {
        id: "4",
        slug: "cat-grooming-basics",
        title: "Cat Grooming 101: Keeping Your Feline Fancy",
        excerpt: "Cats are clean creatures, but they still need help. From brushing to nail trimming, here is how to groom your cat.",
        content: `
            <h2>Brushing is Bonding</h2>
            <p>Regular brushing reduces shedding and hairballs. It's also a great way to bond with your cat.</p>
            
            <h2>Nail Trimming</h2>
            <p>Trim your cat's nails every 2-3 weeks to prevent them from getting too sharp or growing into the paw pads.</p>
        `,
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800",
        category: "Grooming",
        author: "Hamza Ali",
        date: "March 10, 2024",
        readTime: "6 min read"
    },
     {
        id: "5",
        slug: "dog-training-commands",
        title: "5 Essential Dog Training Commands Every Owner Should Know",
        excerpt: "Master the basics of sit, stay, come, and more to ensure a well-behaved and happy dog.",
        content: `
            <h2>1. Sit</h2>
            <p>The most basic command. Hold a treat close to your dog's nose and move your hand up, allowing their head to follow the treat and causing their bottom to lower.</p>
            
            <h2>2. Stay</h2>
            <p>Ask your dog to 'Sit'. Open the palm of your hand in front of you, and say 'Stay'. Take a few steps back. Reward them if they stay. Gradually increase the distance.</p>
        `,
        image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=800",
        category: "Training",
        author: "Kiran Malik",
        date: "February 28, 2024",
        readTime: "7 min read"
    },
    {
        id: "6",
        slug: "understanding-vet-visits",
        title: "Demystifying the Vet Visit: What to Expect",
        excerpt: "Regular check-ups are vital. Here is a guide on what happens during a standard veterinary examination.",
        content: `
            <h2>Physical Exam</h2>
            <p>The vet will check your pet's eyes, ears, teeth, and listen to their heart and lungs.</p>
            
            <h2>Vaccinations</h2>
            <p>Keeping vaccinations up to date protects your pet from common and deadly diseases.</p>
        `,
        image: "https://images.unsplash.com/photo-1628009368231-760335272a28?auto=format&fit=crop&q=80&w=800",
        category: "Health",
        author: "Dr. Bilal",
        date: "January 15, 2024",
        readTime: "4 min read"
    }

];
