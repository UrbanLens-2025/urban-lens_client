import type { AdminPost } from "@/api/admin";
import type { PaginatedData } from "@/types";

// Mock posts data
const mockPosts: AdminPost[] = [
  {
    postId: "1",
    content: "Amazing experience at this location! The atmosphere was perfect and the staff was very friendly. Highly recommend visiting here!",
    imageUrls: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    ],
    type: "REVIEW",
    isVerified: true,
    visibility: "PUBLIC",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    author: {
      id: "user1",
      firstName: "John",
      lastName: "Doe",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    },
    rating: 5,
    eventId: null,
    location: {
      id: "loc1",
      name: "Downtown Coffee Shop",
      addressLine: "123 Main Street, City",
    },
    analytics: {
      totalUpvotes: 45,
      totalDownvotes: 2,
      totalComments: 12,
    },
  },
  {
    postId: "2",
    content: "Just checked in! Great place to hang out with friends.",
    imageUrls: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800"],
    type: "CHECK_IN",
    isVerified: false,
    visibility: "PUBLIC",
    createdAt: "2024-01-14T15:20:00Z",
    updatedAt: "2024-01-14T15:20:00Z",
    author: {
      id: "user2",
      firstName: "Jane",
      lastName: "Smith",
      avatarUrl: null,
    },
    rating: null,
    eventId: null,
    location: {
      id: "loc2",
      name: "Central Park",
      addressLine: "456 Park Avenue, City",
    },
    analytics: {
      totalUpvotes: 23,
      totalDownvotes: 1,
      totalComments: 5,
    },
  },
  {
    postId: "3",
    content: "The food here is absolutely delicious! Five stars for sure. The service was excellent and the ambiance was perfect for a date night.",
    imageUrls: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    ],
    type: "REVIEW",
    isVerified: true,
    visibility: "PUBLIC",
    createdAt: "2024-01-13T18:45:00Z",
    updatedAt: "2024-01-13T18:45:00Z",
    author: {
      id: "user3",
      firstName: "Michael",
      lastName: "Johnson",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    },
    rating: 5,
    eventId: null,
    location: {
      id: "loc3",
      name: "Fine Dining Restaurant",
      addressLine: "789 Restaurant Row, City",
    },
    analytics: {
      totalUpvotes: 67,
      totalDownvotes: 3,
      totalComments: 18,
    },
  },
  {
    postId: "4",
    content: "Checked in at the event! Having a great time.",
    imageUrls: [],
    type: "CHECK_IN",
    isVerified: false,
    visibility: "PRIVATE",
    createdAt: "2024-01-12T20:10:00Z",
    updatedAt: "2024-01-12T20:10:00Z",
    author: {
      id: "user4",
      firstName: "Sarah",
      lastName: "Williams",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    },
    rating: null,
    eventId: "event1",
    location: {
      id: "loc4",
      name: "Convention Center",
      addressLine: "321 Event Boulevard, City",
    },
    analytics: {
      totalUpvotes: 8,
      totalDownvotes: 0,
      totalComments: 2,
    },
  },
  {
    postId: "5",
    content: "Not impressed with the service. The wait time was too long and the food was cold when it arrived.",
    imageUrls: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800"],
    type: "REVIEW",
    isVerified: false,
    visibility: "PUBLIC",
    createdAt: "2024-01-11T12:30:00Z",
    updatedAt: "2024-01-11T12:30:00Z",
    author: {
      id: "user5",
      firstName: "David",
      lastName: "Brown",
      avatarUrl: null,
    },
    rating: 2,
    eventId: null,
    location: {
      id: "loc5",
      name: "Fast Food Chain",
      addressLine: "555 Fast Lane, City",
    },
    analytics: {
      totalUpvotes: 5,
      totalDownvotes: 15,
      totalComments: 8,
    },
  },
  {
    postId: "6",
    content: "Beautiful sunset view from here! Perfect spot for photography.",
    imageUrls: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
    ],
    type: "CHECK_IN",
    isVerified: true,
    visibility: "PUBLIC",
    createdAt: "2024-01-10T19:00:00Z",
    updatedAt: "2024-01-10T19:00:00Z",
    author: {
      id: "user6",
      firstName: "Emily",
      lastName: "Davis",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    },
    rating: null,
    eventId: null,
    location: {
      id: "loc6",
      name: "Sunset Point",
      addressLine: "999 Scenic Drive, City",
    },
    analytics: {
      totalUpvotes: 34,
      totalDownvotes: 1,
      totalComments: 9,
    },
  },
  {
    postId: "7",
    content: "Great place! The ambiance is cozy and the staff is very attentive. Will definitely come back!",
    imageUrls: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"],
    type: "REVIEW",
    isVerified: true,
    visibility: "PUBLIC",
    createdAt: "2024-01-09T14:15:00Z",
    updatedAt: "2024-01-09T14:15:00Z",
    author: {
      id: "user7",
      firstName: "Robert",
      lastName: "Taylor",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    },
    rating: 4,
    eventId: null,
    location: {
      id: "loc7",
      name: "Cozy Cafe",
      addressLine: "111 Coffee Street, City",
    },
    analytics: {
      totalUpvotes: 28,
      totalDownvotes: 2,
      totalComments: 7,
    },
  },
  {
    postId: "8",
    content: "Just arrived! Excited to explore this place.",
    imageUrls: [],
    type: "CHECK_IN",
    isVerified: false,
    visibility: "PUBLIC",
    createdAt: "2024-01-08T09:45:00Z",
    updatedAt: "2024-01-08T09:45:00Z",
    author: {
      id: "user8",
      firstName: "Lisa",
      lastName: "Anderson",
      avatarUrl: null,
    },
    rating: null,
    eventId: null,
    location: {
      id: "loc8",
      name: "Shopping Mall",
      addressLine: "222 Mall Road, City",
    },
    analytics: {
      totalUpvotes: 12,
      totalDownvotes: 0,
      totalComments: 3,
    },
  },
  {
    postId: "9",
    content: "The best experience I've had in a long time! Everything was perfect from start to finish.",
    imageUrls: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    ],
    type: "REVIEW",
    isVerified: true,
    visibility: "PUBLIC",
    createdAt: "2024-01-07T16:30:00Z",
    updatedAt: "2024-01-07T16:30:00Z",
    author: {
      id: "user9",
      firstName: "James",
      lastName: "Wilson",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100",
    },
    rating: 5,
    eventId: null,
    location: {
      id: "loc9",
      name: "Luxury Hotel",
      addressLine: "333 Hotel Avenue, City",
    },
    analytics: {
      totalUpvotes: 89,
      totalDownvotes: 1,
      totalComments: 24,
    },
  },
  {
    postId: "10",
    content: "Checked in! Great vibes here.",
    imageUrls: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"],
    type: "CHECK_IN",
    isVerified: false,
    visibility: "PRIVATE",
    createdAt: "2024-01-06T21:20:00Z",
    updatedAt: "2024-01-06T21:20:00Z",
    author: {
      id: "user10",
      firstName: "Maria",
      lastName: "Garcia",
      avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100",
    },
    rating: null,
    eventId: "event2",
    location: {
      id: "loc10",
      name: "Night Club",
      addressLine: "444 Party Street, City",
    },
    analytics: {
      totalUpvotes: 15,
      totalDownvotes: 1,
      totalComments: 4,
    },
  },
  {
    postId: "11",
    content: "Decent place but could be better. The service was okay but nothing special.",
    imageUrls: [],
    type: "REVIEW",
    isVerified: false,
    visibility: "PUBLIC",
    createdAt: "2024-01-05T11:00:00Z",
    updatedAt: "2024-01-05T11:00:00Z",
    author: {
      id: "user11",
      firstName: "Thomas",
      lastName: "Martinez",
      avatarUrl: null,
    },
    rating: 3,
    eventId: null,
    location: {
      id: "loc11",
      name: "Average Restaurant",
      addressLine: "555 Normal Road, City",
    },
    analytics: {
      totalUpvotes: 7,
      totalDownvotes: 5,
      totalComments: 6,
    },
  },
  {
    postId: "12",
    content: "Amazing view! Perfect for a morning walk.",
    imageUrls: [
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    ],
    type: "CHECK_IN",
    isVerified: true,
    visibility: "PUBLIC",
    createdAt: "2024-01-04T07:30:00Z",
    updatedAt: "2024-01-04T07:30:00Z",
    author: {
      id: "user12",
      firstName: "Jennifer",
      lastName: "Lee",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    },
    rating: null,
    eventId: null,
    location: {
      id: "loc12",
      name: "Riverside Park",
      addressLine: "666 River Road, City",
    },
    analytics: {
      totalUpvotes: 41,
      totalDownvotes: 0,
      totalComments: 11,
    },
  },
];

// Helper function to filter and sort posts
export function getMockPosts(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  type?: string;
  visibility?: string;
}): PaginatedData<AdminPost> {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy,
    type,
    visibility,
  } = params;

  let filtered = [...mockPosts];

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (post) =>
        post.content.toLowerCase().includes(searchLower) ||
        post.author.firstName.toLowerCase().includes(searchLower) ||
        post.author.lastName.toLowerCase().includes(searchLower) ||
        post.location?.name.toLowerCase().includes(searchLower)
    );
  }

  // Filter by type
  if (type) {
    filtered = filtered.filter((post) => post.type === type);
  }

  // Filter by visibility
  if (visibility) {
    filtered = filtered.filter((post) => post.visibility === visibility);
  }

  // Sort
  if (sortBy) {
    const [column, direction] = sortBy.split(":");
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (column === "content") {
        aVal = a.content;
        bVal = b.content;
      } else if (column === "author.firstName") {
        aVal = a.author.firstName;
        bVal = b.author.firstName;
      } else if (column === "type") {
        aVal = a.type;
        bVal = b.type;
      } else if (column === "visibility") {
        aVal = a.visibility;
        bVal = b.visibility;
      } else if (column === "rating") {
        aVal = a.rating ?? 0;
        bVal = b.rating ?? 0;
      } else if (column === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        return 0;
      }

      if (aVal < bVal) return direction === "ASC" ? -1 : 1;
      if (aVal > bVal) return direction === "ASC" ? 1 : -1;
      return 0;
    });
  } else {
    // Default sort by createdAt DESC
    filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = filtered.slice(startIndex, endIndex);

  return {
    data: paginated,
    meta: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
}

// Export mock data for stats
export const mockPostStats = {
  total: mockPosts.length,
  reviews: mockPosts.filter((p) => p.type === "REVIEW").length,
  checkIns: mockPosts.filter((p) => p.type === "CHECK_IN").length,
  public: mockPosts.filter((p) => p.visibility === "PUBLIC").length,
};

