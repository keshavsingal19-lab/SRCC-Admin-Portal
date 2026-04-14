import { hashPassword, verifyPassword } from '../../utils/crypto';

export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as {
      currentPasscode?: string;
      newPasscode?: string;
      confirmPasscode?: string;
    };

    if (!body.currentPasscode || !body.newPasscode || !body.confirmPasscode) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (body.newPasscode !== body.confirmPasscode) {
      return new Response(JSON.stringify({ error: "New passcodes do not match." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. Fetch current admin record
    const admin = await env.DB.prepare("SELECT id, password_hash, salt FROM admin_users LIMIT 1").first<{ id: number, password_hash: string, salt: string }>();

    if (!admin) {
      return new Response(JSON.stringify({ error: "No admin record found to update." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Verify current password
    const isCurrentValid = await verifyPassword(body.currentPasscode, admin.password_hash, admin.salt);
    if (!isCurrentValid) {
      return new Response(JSON.stringify({ error: "Current passcode is incorrect." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Hash and Save new password
    const { hash, salt } = await hashPassword(body.newPasscode);
    await env.DB.prepare(
      "UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?"
    ).bind(hash, salt, admin.id).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Passcode updated successfully. Please login again." 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
