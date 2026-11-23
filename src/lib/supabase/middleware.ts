import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  const isAuthPublic =
    isLogin ||
    path === "/olvidaste" ||
    path === "/restablecer" ||
    path.startsWith("/auth/");
  const isPrimerIngreso = path === "/primer-ingreso";
  const isDevPreview = path.startsWith("/dev/fase");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/brand") ||
    path.includes(".");

  if (isPublicAsset || isDevPreview) {
    return supabaseResponse;
  }

  if (!user && !isAuthPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("id, enabled")
      .eq("id", user.id)
      .maybeSingle();

    const enabled = Boolean(member?.enabled);

    if (!enabled && !isLogin) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "disabled");
      return NextResponse.redirect(url);
    }

    if (enabled && isLogin) {
      const { data: full } = await supabase
        .from("members")
        .select("must_change_password")
        .eq("id", user.id)
        .maybeSingle();
      const url = request.nextUrl.clone();
      url.pathname = full?.must_change_password ? "/primer-ingreso" : "/";
      return NextResponse.redirect(url);
    }

    if (
      enabled &&
      !isPrimerIngreso &&
      !isAuthPublic
    ) {
      const { data: full } = await supabase
        .from("members")
        .select("must_change_password")
        .eq("id", user.id)
        .maybeSingle();
      if (full?.must_change_password) {
        const url = request.nextUrl.clone();
        url.pathname = "/primer-ingreso";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
