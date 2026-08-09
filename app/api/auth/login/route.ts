import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const validUsername = process.env.ADMIN_USERNAME;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!validUsername || !passwordHash) {
      return NextResponse.json(
        { error: "ایڈمن اکاؤنٹ ترتیب نہیں دیا گیا۔ (ADMIN_USERNAME / ADMIN_PASSWORD_HASH not set)" },
        { status: 500 }
      );
    }

    if (username !== validUsername) {
      return NextResponse.json({ error: "غلط یوزر نیم یا پاسورڈ۔" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password ?? "", passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "غلط یوزر نیم یا پاسورڈ۔" }, { status: 401 });
    }

    const token = signAdminToken(username);
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_COOKIE_MAX_AGE,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "لاگ ان ناکام ہوا۔" }, { status: 400 });
  }
}
