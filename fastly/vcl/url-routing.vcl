# ─── Fastly VCL — URL Routing (Device-Based) ────────────────────────────────
#
# Handles three URL-pattern strategies for device-aware content delivery.
# This VCL should be merged with (or included after) device-detection.vcl so
# that req.http.X-Device-Type is already set when these rules execute.
#
# Pattern A — Dynamic Serving (www.domain.com)
#   Origin reads X-Device-Type and returns the appropriate HTML.
#   No URL rewriting needed; the header is forwarded to the origin.
#
# Pattern B — Subdomain redirect (m.domain.com)
#   When a mobile device hits www.domain.com, redirect to m.domain.com.
#   When a non-mobile device hits m.domain.com, redirect to www.domain.com.
#
# Pattern C — Subdirectory rewrite (domain.com/mobile/…)
#   Rewrites the backend path for mobile devices so that the origin can
#   serve from a different content tree without a visible URL change.
#
# ─────────────────────────────────────────────────────────────────────────────

sub vcl_recv {
  #FASTLY recv

  # ── Pattern B: Subdomain redirect ────────────────────────────────────────
  # Mobile users on www → redirect to m.
  if (req.http.X-Device-Type == "mobile"
      && req.http.Host ~ "^www\.") {
    declare local var.mobile_host STRING;
    set var.mobile_host = regsuball(req.http.Host, "^www\.", "m.");
    error 301 "https://" + var.mobile_host + req.url;
  }

  # Non-mobile users on m. → redirect to www.
  if (req.http.X-Device-Type != "mobile"
      && req.http.Host ~ "^m\.") {
    declare local var.www_host STRING;
    set var.www_host = regsuball(req.http.Host, "^m\.", "www.");
    error 301 "https://" + var.www_host + req.url;
  }

  # ── Pattern C: Subdirectory rewrite ──────────────────────────────────────
  # Rewrite the backend URL to include a device-type prefix so the origin
  # can serve content from a separate content tree.
  # Only applied when the path does not already start with a device prefix.

  if (req.url !~ "^/(mobile|tablet|kiosk|digital-menu-board)/") {
    if (req.http.X-Device-Type == "mobile") {
      set req.url = "/mobile" + req.url;
    } else if (req.http.X-Device-Type == "tablet") {
      set req.url = "/tablet" + req.url;
    } else if (req.http.X-Device-Type == "kiosk") {
      set req.url = "/kiosk" + req.url;
    } else if (req.http.X-Device-Type == "digital-menu-board") {
      set req.url = "/digital-menu-board" + req.url;
    }
    # desktop: no URL rewrite — default content tree serves desktop
  }

  return(pass);
}

sub vcl_error {
  #FASTLY error

  # Emit the 301 redirect responses generated in vcl_recv above.
  if (obj.status == 301) {
    set obj.http.Location = obj.response;
    set obj.response = "Moved Permanently";
    synthetic "";
    return(deliver);
  }
}
