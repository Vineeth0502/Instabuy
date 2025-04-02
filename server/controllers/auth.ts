import { Router, Request, Response } from "express";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import bcrypt from "bcryptjs";
import { IStorage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { generateToken, authenticateToken, AuthRequest } from "../middleware/auth";

export function registerAuthRoutes(router: Router, storage: IStorage) {
  // Register user
  router.post("/auth/register", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = insertUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { username, email, password, role } = validationResult.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      
      // Create user with validated data
      const newUser = await storage.createUser({
        username,
        email,
        password,
        role: role === "admin" ? "admin" : "user", // Ensure role is valid
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Generate JWT token
      const token = generateToken(newUser);
      
      // Return user data and token
      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  // Login user
  router.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Return user data and token
      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  // Get current user
  router.get("/auth/me", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get fresh user data from storage
      if (req.user.id === undefined) {
        return res.status(400).json({ message: "User ID is missing" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error fetching user data" });
    }
  });
}
