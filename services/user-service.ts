import { User } from "@/lib/db/schema"
import { userRepository } from "@/repositories/user-repository"


export class UserService {
  static async findById(id: number): Promise<User | null> {
    const user = await userRepository.findById(id)
    return user || null
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = await userRepository.findByEmail(email)
    return user || null
  }

  static async create(user: Omit<User, 'id'>): Promise<User> {
    return await userRepository.create(user)
  }

  static async exists(id: number): Promise<boolean> {
    return await userRepository.exists(id)
  }

  static sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitizedUser } = user;
    void passwordHash; // Explicitly mark it as intentionally unused
    return sanitizedUser;
}

  static async updatePassword(userId: number, hashedPassword: string) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    user.passwordHash = hashedPassword
    return await userRepository.update(user)
  }
} 

export const userService = new UserService()