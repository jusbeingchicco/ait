import fs from "fs";
import path from "path";
import { pool } from "./db";
import { v4 as uuidv4 } from "uuid";

/**
 * Simple storage helper using the existing Pool from server/db.ts
 * - Uses parameterized queries to interact with Postgres
 * - Returns plain JS objects (rows)
 *
 * Note: This file keeps implementations minimal and synchronous where appropriate.
 * If you want more advanced query helpers, we can replace these with Drizzle queries later.
 */

function rowOrNull(result: any) {
  return result && result.rows && result.rows.length ? result.rows[0] : null;
}

export const storage = {
  // Users
  async getUser(id: string) {
    const res = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
    return rowOrNull(res);
  },

  async upsertUser(user: any) {
    // Upsert user by id -> update fields provided
    // Keep it simple: insert on conflict do update
    const q = `
      INSERT INTO users (id, email, first_name, last_name, profile_image_url, role, is_verified, phone, location, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,false),$8,$9,now(),now())
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, users.email),
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        profile_image_url = COALESCE(EXCLUDED.profile_image_url, users.profile_image_url),
        role = COALESCE(EXCLUDED.role, users.role),
        is_verified = COALESCE(EXCLUDED.is_verified, users.is_verified),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        location = COALESCE(EXCLUDED.location, users.location),
        updated_at = now()
      RETURNING *;
    `;
    const params = [
      user.id,
      user.email ?? null,
      user.firstName ?? null,
      user.lastName ?? null,
      user.profileImageUrl ?? null,
      user.role ?? null,
      user.isVerified ?? null,
      user.phone ?? null,
      user.location ?? null,
    ];
    const res = await pool.query(q, params);
    return rowOrNull(res);
  },

  // Profiles
  async getUserProfile(userId: string) {
    const res = await pool.query("SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1", [userId]);
    return rowOrNull(res);
  },

  async createUserProfile(profile: any) {
    const q = `
      INSERT INTO user_profiles (id, user_id, bio, farm_name, farm_size, farm_location, coordinates, specialization, years_experience, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now())
      RETURNING *;
    `;
    const params = [
      profile.id ?? uuidv4(),
      profile.userId,
      profile.bio ?? null,
      profile.farmName ?? null,
      profile.farmSize ?? null,
      profile.farmLocation ?? null,
      profile.coordinates ?? null,
      profile.specialization ?? null,
      profile.yearsExperience ?? null,
    ];
    const res = await pool.query(q, params);
    return rowOrNull(res);
  },

  async updateUserProfile(userId: string, updates: any) {
    // Build SET dynamically
    const allowed = ["bio","farm_name","farmName","farmSize","farm_location","coordinates","specialization","years_experience"];
    const setParts: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        const col = key.includes("farmName") ? "farm_name" : key.includes("farmSize") ? "farm_size" : key;
        setParts.push(`${col} = $${idx}`);
        values.push((updates as any)[key]);
        idx++;
      }
    }
    if (!setParts.length) {
      // Nothing to update — return current profile
      return this.getUserProfile(userId);
    }
    values.push(userId);
    const q = `UPDATE user_profiles SET ${setParts.join(", ")}, updated_at = now() WHERE user_id = $${idx} RETURNING *;`;
    const res = await pool.query(q, values);
    return rowOrNull(res);
  },

  // Product helpers (basic)
  async getProducts(filters: any = {}) {
    const where: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.category) {
      where.push(`category_id = $${idx++}`);
      params.push(filters.category);
    }
    if (filters.farmerId) {
      where.push(`farmer_id = $${idx++}`);
      params.push(filters.farmerId);
    }
    if (filters.search) {
      where.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const q = `SELECT * FROM products ${whereSql} ORDER BY created_at DESC LIMIT 500;`;
    const res = await pool.query(q, params);
    return res.rows;
  },

  async getProduct(id: string) {
    const res = await pool.query("SELECT * FROM products WHERE id = $1 LIMIT 1", [id]);
    return rowOrNull(res);
  },

  async createProduct(product: any) {
    const q = `
      INSERT INTO products (id, farmer_id, category_id, name, description, price_per_kg, available_stock, unit, is_organic, allow_pre_order, harvest_date, expiry_date, quality_grade, status, images, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,false),COALESCE($10,false),$11,$12,$13,COALESCE($14,'active'),$15, now(), now())
      RETURNING *;
    `;
    const params = [
      product.id ?? uuidv4(),
      product.farmerId,
      product.categoryId,
      product.name,
      product.description ?? null,
      product.pricePerKg,
      product.availableStock,
      product.unit ?? "kg",
      product.isOrganic ?? null,
      product.allowPreOrder ?? null,
      product.harvestDate ?? null,
      product.expiryDate ?? null,
      product.qualityGrade ?? null,
      product.status ?? null,
      product.images ?? null,
    ];
    const res = await pool.query(q, params);
    return rowOrNull(res);
  },

  async updateProduct(id: string, updates: any) {
    const allowed = ["name","description","pricePerKg","availableStock","unit","isOrganic","allowPreOrder","harvestDate","expiryDate","qualityGrade","status","images","categoryId"];
    const setParts: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        const col = key === "pricePerKg" ? "price_per_kg" : key === "availableStock" ? "available_stock" : key === "categoryId" ? "category_id" : key;
        setParts.push(`${col} = $${idx}`);
        values.push((updates as any)[key]);
        idx++;
      }
    }
    if (!setParts.length) return this.getProduct(id);
    values.push(id);
    const q = `UPDATE products SET ${setParts.join(", ")}, updated_at = now() WHERE id = $${idx} RETURNING *;`;
    const res = await pool.query(q, values);
    return rowOrNull(res);
  },

  async deleteProduct(id: string) {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    return true;
  },

  async getProductCategories() {
    const res = await pool.query("SELECT * FROM product_categories ORDER BY name ASC");
    return res.rows;
  },

  // Orders (basic)
  async getOrders(filters: any = {}) {
    const where: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (filters.buyerId) {
      where.push(`buyer_id = $${idx++}`);
      params.push(filters.buyerId);
    }
    if (filters.farmerId) {
      where.push(`farmer_id = $${idx++}`);
      params.push(filters.farmerId);
    }
    if (filters.status) {
      where.push(`status = $${idx++}`);
      params.push(filters.status);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const q = `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT 500;`;
    const res = await pool.query(q, params);
    return res.rows;
  },

  async getOrder(id: string) {
    const res = await pool.query("SELECT * FROM orders WHERE id = $1 LIMIT 1", [id]);
    return rowOrNull(res);
  },

  async getOrderItems(orderId: string) {
    const res = await pool.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC", [orderId]);
    return res.rows;
  },

  async createOrder(orderData: any, items: any[]) {
    // Simple transactional insert
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const orderId = orderData.id ?? uuidv4();
      const insertOrderQ = `
        INSERT INTO orders (id, buyer_id, farmer_id, status, total_amount, delivery_fee, delivery_address, notes, created_at, updated_at)
        VALUES ($1,$2,$3,COALESCE($4,'pending'),$5,$6,$7,$8, now(), now())
        RETURNING *;
      `;
      const orderRes = await client.query(insertOrderQ, [
        orderId,
        orderData.buyerId,
        orderData.farmerId,
        orderData.status ?? "pending",
        orderData.totalAmount,
        orderData.deliveryFee ?? "0.00",
        orderData.deliveryAddress ?? null,
        orderData.notes ?? null,
      ]);
      // Insert items
      for (const it of items || []) {
        const itemQ = `
          INSERT INTO order_items (id, order_id, product_id, quantity, price_per_unit, total_price, created_at)
          VALUES ($1,$2,$3,$4,$5,$6, now());
        `;
        await client.query(itemQ, [
          it.id ?? uuidv4(),
          orderId,
          it.productId,
          it.quantity,
          it.pricePerUnit,
          it.totalPrice,
        ]);
      }
      await client.query("COMMIT");
      return rowOrNull(orderRes);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async updateOrderStatus(id: string, status: string) {
    const res = await pool.query("UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *", [status, id]);
    return rowOrNull(res);
  },

  // Messages
  async getMessages(filters: any = {}) {
    // If participantId provided return messages where sender OR receiver = participantId
    if (filters.participantId) {
      const res = await pool.query(
        "SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at ASC",
        [filters.participantId]
      );
      return res.rows;
    }
    // If orderId only
    if (filters.orderId) {
      const res = await pool.query(
        "SELECT * FROM messages WHERE order_id = $1 ORDER BY created_at ASC",
        [filters.orderId]
      );
      return res.rows;
    }
    // Fallback: return recent messages
    const res = await pool.query("SELECT * FROM messages ORDER BY created_at DESC LIMIT 200");
    return res.rows;
  },

  async getMessagesBetween(userId: string, otherId: string) {
    const res = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, otherId]
    );
    return res.rows;
  },

  async createMessage(msg: any) {
    const q = `
      INSERT INTO messages (id, sender_id, receiver_id, order_id, content, is_read, created_at)
      VALUES ($1,$2,$3,$4,$5,COALESCE($6,false), now())
      RETURNING *;
    `;
    const params = [
      msg.id ?? uuidv4(),
      msg.senderId,
      msg.receiverId,
      msg.orderId ?? null,
      msg.content,
      msg.isRead ?? null,
    ];
    const res = await pool.query(q, params);
    return rowOrNull(res);
  },

  async markMessagesAsRead(receiverId: string, senderId: string) {
    await pool.query(
      "UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false",
      [receiverId, senderId]
    );
    return true;
  },

  // Verifications
  async createVerificationRequest(data: any) {
    const q = `
      INSERT INTO verifications (id, user_id, full_name, id_number, phone, address, farm_name, coordinates, id_image_url, status, notes, submitted_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, 'pending', $10, now())
      RETURNING *;
    `;
    const params = [
      data.id ?? uuidv4(),
      data.userId,
      data.fullName,
      data.idNumber ?? null,
      data.phone ?? null,
      data.address ?? null,
      data.farmName ?? null,
      data.coordinates ?? null,
      data.idImageUrl ?? null,
      data.notes ?? null,
    ];
    const res = await pool.query(q, params);
    return rowOrNull(res);
  },

  async getVerificationForUser(userId: string) {
    const res = await pool.query("SELECT * FROM verifications WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1", [userId]);
    return rowOrNull(res);
  },

  async approveVerification(id: string, updates: any) {
    const q = `
      UPDATE verifications
      SET status = $1, notes = $2, reviewer_id = $3, reviewed_at = $4
      WHERE id = $5
      RETURNING *;
    `;
    const params = [
      updates.status,
      updates.notes ?? null,
      updates.reviewerId ?? null,
      updates.reviewedAt ?? null,
      id,
    ];
    const res = await pool.query(q, params);
    return rowOrNull(res);
  },

  // Utility: save uploaded file path (not strictly needed since uploads are saved to public/uploads)
  async saveUploadedFile(fileBuffer: Buffer, filename: string) {
    const publicDir = path.join(process.cwd(), "client", "public", "uploads");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    const safeName = `${uuidv4()}-${filename.replace(/[^\w.-]/g, "_")}`;
    const fullPath = path.join(publicDir, safeName);
    fs.writeFileSync(fullPath, fileBuffer);
    // Return public path relative to server root
    return `/uploads/${safeName}`;
  },
};