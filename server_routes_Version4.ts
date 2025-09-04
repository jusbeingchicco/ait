import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import {
  insertProductSchema,
  insertOrderSchema,
  insertUserProfileSchema,
  insertMessageSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getUserProfile(userId);
      res.json({ ...user, profile });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertUserProfileSchema.parse({ ...req.body, userId });
      
      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      const profile = await storage.updateUserProfile(userId, updates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user role
  app.put('/api/user/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!["farmer", "buyer"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.upsertUser({ id: userId, role });
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { category, farmerId, search } = req.query;
      const products = await storage.getProducts({
        category: category as string,
        farmerId: farmerId as string,
        search: search as string,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const farmerId = req.user.claims.sub;
      const productData = insertProductSchema.parse({ ...req.body, farmerId });
      
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const farmerId = req.user.claims.sub;
      
      // Verify ownership
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct || existingProduct.farmerId !== farmerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const product = await storage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const farmerId = req.user.claims.sub;
      
      // Verify ownership
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct || existingProduct.farmerId !== farmerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Product categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role, status } = req.query;
      
      const filters: any = { status: status as string };
      
      if (role === 'buyer') {
        filters.buyerId = userId;
      } else if (role === 'farmer') {
        filters.farmerId = userId;
      }
      
      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify access
      if (order.buyerId !== userId && order.farmerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const items = await storage.getOrderItems(id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const buyerId = req.user.claims.sub;
      const { farmerId, items, totalAmount, deliveryFee, deliveryAddress, notes } = req.body;
      
      const orderData = {
        buyerId,
        farmerId,
        totalAmount,
        deliveryFee: deliveryFee || "0.00",
        deliveryAddress,
        notes,
      };
      
      const order = await storage.createOrder(orderData, items);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify ownership (farmer can update status)
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder || existingOrder.farmerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherId, orderId } = req.query;

      // If otherId is provided, return the conversation between the two users (both directions)
      if (otherId) {
        let messages;
        if (typeof storage.getMessagesBetween === 'function') {
          messages = await storage.getMessagesBetween(userId, otherId as string);
        } else {
          // Fallback: ask storage.getMessages for a two-way query; implement getMessagesBetween in storage for better performance.
          messages = await storage.getMessages({
            $or: [
              { senderId: userId, receiverId: otherId as string },
              { senderId: otherId as string, receiverId: userId },
            ],
            orderBy: { createdAt: "asc" },
          });
        }
        return res.json(messages);
      }

      // Otherwise, filter by orderId or return messages involving the user
      const filters: any = {};
      if (orderId) filters.orderId = orderId as string;
      // Some storage implementations support participantId to fetch all messages for a user
      filters.participantId = userId;

      const messages = await storage.getMessages(filters);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.put('/api/messages/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      const receiverId = req.user.claims.sub;
      const { senderId } = req.body;
      
      await storage.markMessagesAsRead(receiverId, senderId);
      res.json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // ---- Verification endpoints ----
  const verificationRequestSchema = z.object({
    fullName: z.string().min(2),
    idNumber: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    farmName: z.string().optional(),
    coordinates: z.string().optional(), // "lat,lng"
    idImageUrl: z.string().optional(),
  });

  app.post('/api/profile/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payload = verificationRequestSchema.parse(req.body);
      const insertData = { ...payload, userId };
      const verification = await storage.createVerificationRequest(insertData);
      res.json(verification);
    } catch (error) {
      console.error("Error submitting verification request:", error);
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Invalid payload", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit verification request" });
    }
  });

  app.get('/api/profile/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const verification = await storage.getVerificationForUser(userId);
      res.json(verification || null);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ message: "Failed to fetch verification status" });
    }
  });

  app.put('/api/profile/verify/:id/review', isAuthenticated, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims.sub;
      const adminUsers = (process.env.ADMIN_USERS || "").split(",").map(s => s.trim()).filter(Boolean);
      if (!adminUsers.includes(reviewerId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { status, notes } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await storage.approveVerification(id, {
        status,
        notes,
        reviewerId,
        reviewedAt: new Date().toISOString(),
      });

      // If approved, mark user as verified
      if (updated && status === "approved") {
        await storage.upsertUser({ id: updated.userId, isVerified: true });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error reviewing verification:", error);
      res.status(500).json({ message: "Failed to review verification request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}