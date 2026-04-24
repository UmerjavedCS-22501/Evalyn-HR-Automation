import { NextRequest, NextResponse } from "next/server";

/**
 * Google OAuth callback handler.
 * Google redirects here after the admin grants calendar access.
 * We forward the `code` to the FastAPI backend which saves the credentials.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?cal_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations?cal_error=No+authorization+code+received", request.url)
    );
  }

  try {
    // Forward code to FastAPI which exchanges it and stores credentials
    const backendRes = await fetch(
      `http://localhost:8000/google/callback?code=${encodeURIComponent(code)}`
    );

    if (!backendRes.ok) {
      const body = await backendRes.json().catch(() => ({}));
      const msg = body.detail || "Backend exchange failed";
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?cal_error=${encodeURIComponent(msg)}`, request.url)
      );
    }

    // Success — redirect back to the integrations page
    return NextResponse.redirect(
      new URL("/dashboard/integrations?cal_linked=1", request.url)
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?cal_error=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}
