export interface User {
  id: string
  email: string
  name: string
  password: string
}

const users: User[] = [];


export class UserService {
  static async findById(id: string): Promise<User | null> {
    const user = users.find(u => u.id === id)
    return user || null
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = users.find(u => u.email === email)
    return user || null
  }

  static async create(user: Omit<User, 'id'>): Promise<User> {
    const newUser = {
      ...user,
      id: crypto.randomUUID()
    }
    users.push(newUser)
    return newUser
  }

  static async exists(id: string): Promise<boolean> {
    return users.some(user => user.id === id)
  }

  static sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    void password; // Explicitly mark it as intentionally unused
    return sanitizedUser;
}



  static async updatePassword(userId: string, hashedPassword: string) {
    const user = users.find(u => u.id === userId)
    if (!user) {
      throw new Error('User not found')
    }
    user.password = hashedPassword
  }
} 