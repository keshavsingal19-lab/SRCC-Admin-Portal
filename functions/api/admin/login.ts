import { hashPassword, verifyPassword } from '../../utils/crypto';

export interface Env {
  DB: D1Database;
}

const DEFAULT_PASSCODE = 'SRCC1926';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as {
      username?: string;
      passcode?: string;
    };

    if (!body.username || !body.passcode) {
      return new Response(JSON.stringify({ error: "Missing username or passcode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. Check if ANY admin user exists
    const adminCount = await env.DB.prepare("SELECT COUNT(*) as count FROM admin_users").first<{ count: number }>();

    if (adminCount?.count === 0) {
      // Setup phase: accept SRCC1926 then initialize the DB
      if (body.passcode === DEFAULT_PASSCODE) {
        const { hash, salt } = await hashPassword(DEFAULT_PASSCODE);
        // We capture the username provided at first setup too
        await env.DB.prepare(
          "INSERT INTO admin_users (username, password_hash, salt) VALUES (?, ?, ?)"
        ).bind(body.username, hash, salt).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          token: "session_" + Date.now(), // Minimal token for now
          message: "Secure setup completed and logged in."
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ error: "Unauthorized. Setup required with default passcode." }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 2. Normal login flow
    // Since "any USERNAME can login", we just grab the first admin's credentials to verify the passcode
    const admin = await env.DB.prepare("SELECT password_hash, salt FROM admin_users LIMIT 1").first<{ password_hash: string, salt: string }>();

    if (!admin) {
        return new Response(JSON.stringify({ error: "Unexpected system error: Admin record lost." }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    const isValid = await verifyPassword(body.passcode, admin.password_hash, admin.salt);

    if (isValid) {
      return new Response(JSON.stringify({ 
        success: true, 
        token: "session_" + Date.now(), // Secure session implementation would use JWT/Signed Cookie
        username: body.username 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid passcode." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
