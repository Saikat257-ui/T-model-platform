import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define enums manually until Prisma client is regenerated
export enum BadgeCategory {
  MILESTONE = 'MILESTONE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  COMPLETION = 'COMPLETION',
  REVENUE = 'REVENUE',
  SPECIAL = 'SPECIAL'
}

export enum AchievementType {
  FIRST_ACTION = 'FIRST_ACTION',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  STREAK_ACHIEVED = 'STREAK_ACHIEVED',
  TARGET_MET = 'TARGET_MET',
  SPECIAL_EVENT = 'SPECIAL_EVENT'
}

export enum LeaderboardPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

interface ProgressUpdate {
  userId: string;
  industry: string;
  actionType: string;
  metadata?: any;
}

interface BadgeEligibility {
  badgeId: string;
  isEligible: boolean;
  currentProgress?: number;
  requiredProgress?: number;
}

class GamificationService {
  // Calculate user's overall progress based on industry
  async calculateProgress(userId: string, industry: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          tourPackages: true,
          travelBookings: true,
          shipments: true,
        }
      });

      if (!user) return 0;

      let progressPercentage = 0;

      switch (industry.toLowerCase()) {
        case 'tour management':
          progressPercentage = await this.calculateTourProgress(user);
          break;
        case 'travel services':
          progressPercentage = await this.calculateTravelProgress(user);
          break;
        case 'logistics & shipping':
          progressPercentage = await this.calculateLogisticsProgress(user);
          break;
        default:
          progressPercentage = 10; // Basic profile completion
      }

      return progressPercentage;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  }

  private async calculateTourProgress(user: any): Promise<number> {
    let progress = 0;
    
    // Profile completion (15%)
    if (user.firstName && user.lastName && user.phone) progress += 15;
    
    // First package created (30%)
    if (user.tourPackages.length > 0) progress += 30;
    
    // Multiple packages (20%)
    if (user.tourPackages.length >= 3) progress += 20;
    
    // Advanced features unlocked (35%)
    if (user.tourPackages.length >= 5) progress += 35;
    
    return Math.min(progress, 100);
  }

  private async calculateTravelProgress(user: any): Promise<number> {
    let progress = 0;
    
    // Profile completion (20%)
    if (user.firstName && user.lastName && user.phone) progress += 20;
    
    // First booking (35%)
    if (user.travelBookings.length > 0) progress += 35;
    
    // Multiple bookings (45%)
    if (user.travelBookings.length >= 3) progress += 45;
    
    return Math.min(progress, 100);
  }

  private async calculateLogisticsProgress(user: any): Promise<number> {
    let progress = 0;
    
    // Profile completion (20%)
    if (user.firstName && user.lastName && user.phone) progress += 20;
    
    // First shipment (40%)
    if (user.shipments.length > 0) progress += 40;
    
    // Multiple shipments (40%)
    if (user.shipments.length >= 5) progress += 40;
    
    return Math.min(progress, 100);
  }

  // Get user progress
  async getUserProgress(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          industry: true
        }
      });

      if (!user) return null;

      const progress = await this.calculateProgress(userId, user.industry?.name || '');
      
      return {
        userId,
        totalPoints: 0, // Will be implemented after migration
        currentLevel: 1,
        experiencePoints: 0,
        completionRate: progress,
        tourProgress: user.industry?.name === 'Tour Management' ? progress : 0,
        travelProgress: user.industry?.name === 'Travel Services' ? progress : 0,
        logisticsProgress: user.industry?.name === 'Logistics & Shipping' ? progress : 0,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          industry: user.industry
        }
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  // Get user's earned badges from database
  async getUserBadges(userId: string) {
    try {
      const userBadges = await prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: true
        },
        orderBy: { earnedAt: 'desc' }
      });

      return userBadges;
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  // Get available badges for user's industry from database
  async getAvailableBadges(industry: string) {
    try {
      const badges = await prisma.badge.findMany({
        where: {
          isActive: true,
          OR: [
            { industry: null }, // Universal badges
            { industry: industry } // Industry-specific badges
          ]
        },
        orderBy: [
          { points: 'asc' },
          { name: 'asc' }
        ]
      });

      return badges;
    } catch (error) {
      console.error('Error getting available badges:', error);
      return [];
    }
  }

  // Mock leaderboard data
  async getLeaderboard(industry: string, period: LeaderboardPeriod, limit: number = 10) {
    const mockData = [
      {
        id: '1',
        userId: 'user1',
        rank: 1,
        score: 950.5,
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        metadata: {
          completionRate: 95,
          totalPoints: 850
        }
      },
      {
        id: '2',
        userId: 'user2',
        rank: 2,
        score: 880.0,
        user: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        },
        metadata: {
          completionRate: 88,
          totalPoints: 750
        }
      },
      {
        id: '3',
        userId: 'user3',
        rank: 3,
        score: 720.5,
        user: {
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike@example.com'
        },
        metadata: {
          completionRate: 72,
          totalPoints: 600
        }
      }
    ];

    return mockData.slice(0, limit);
  }

  // Process gamification update (main entry point)
  async processProgressUpdate(update: ProgressUpdate): Promise<void> {
    try {
      // For now, just calculate progress
      // Full implementation will come after database migration
      const progress = await this.calculateProgress(update.userId, update.industry);
      console.log(`Progress updated for user ${update.userId}: ${progress}%`);
      
      // TODO: Implement badge checking, achievement recording, leaderboard updates
      // after database migration is complete
    } catch (error) {
      console.error('Error processing progress update:', error);
    }
  }
}

export default new GamificationService();